// How we decide whether Homey is online:
// "mqtt"     - rely solely on the MQTT heartbeat/timeout
// "power"    - ignore MQTT; on every button press, wait for a power change before falling back
// "combined" - trust MQTT status, but double-check with a power change when MQTT says offline
let DETECTION_MODE = "combined";

let timeout_factor = 2.5 // flag as offline if no message after 2.5x the interval
let timeout_ms = 90000; // 90 seconds — adjust to taste
let online_status = 0; // 0 = offline, 1 = online
let timer_handle = null;
let offline_check_ms = 2000; // grace period to let Homey handle the event before we fall back — the button→Homey→power round trip takes ~1000-2000ms

function start_timer() {
    if (timer_handle !== null) {
        Timer.clear(timer_handle);
    }
    timer_handle = Timer.set(timeout_ms, false, function () {
        print("Homey timeout expired, marking offline");
        online_status = 0;
    });
}

MQTT.subscribe("homey/status", function (topic, message) {
    if (DETECTION_MODE === "power") {
        return; // this mode ignores MQTT status entirely
    }
    let was_offline = online_status === 0;
    online_status = 1;
    try {
        let data = JSON.parse(message);
        if (data.interval) {
            timeout_ms = data.interval * 1000 * timeout_factor;
        }
    } catch (e) {
        print("Could not parse heartbeat JSON, using existing timeout_ms");
    }
    print("Homey online, next timeout in " + timeout_ms + "ms");
    start_timer();
});

// --- Universal wall switch event handler ---
Shelly.addEventHandler(function (e) {
    if (e.component === "input:0") {
        const ev = e.info.event;
        if (ev === "btn_up" || ev === "btn_down" || ev === "toggle") {
            let trust_mqtt_online = DETECTION_MODE !== "power" && online_status === 1;
            if (trust_mqtt_online) {
                print("Homey will handle event → " + ev);
                return;
            }
            if (DETECTION_MODE === "mqtt") {
                print("Homey offline, switching shelly for → " + ev);
                Shelly.call("Switch.toggle", { id: 0 });
                return;
            }
            // "power" or "combined" (with MQTT reporting offline): verify via power change
            print("Waiting " + offline_check_ms + "ms to see if Homey handles → " + ev + " anyway");
            let before = Shelly.getComponentStatus("switch:0");
            Timer.set(offline_check_ms, false, function () {
                let after = Shelly.getComponentStatus("switch:0");
                let changed = before && after && (after.output !== before.output || after.apower !== before.apower);
                if (changed) {
                    print("Switch state changed on its own, Homey must be online after all");
                    if (DETECTION_MODE === "combined") {
                        online_status = 1;
                        start_timer();
                    }
                } else {
                    print("No change after " + offline_check_ms + "ms, switching shelly locally for → " + ev);
                    Shelly.call("Switch.toggle", { id: 0 });
                }
            });
        }
    }
});