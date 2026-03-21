let timeout_factor = 2.5 // flag as offline if no message after 2.5x the interval
let timeout_ms = 90000; // 90 seconds — adjust to taste
let online_status = 0; // 0 = offline, 1 = online
let timer_handle = null;

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
            if (online_status === 0) {
                print("Homey offline switching shelly for → " + ev);
                Shelly.call("Switch.toggle", { id: 0 });
            } else {
                print("Homey will handle event → " + ev);
            }
        }
    }
});