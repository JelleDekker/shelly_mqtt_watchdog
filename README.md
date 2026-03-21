# shelly_mqtt_watchdog
A Shelly script that monitors whether your central controller (Homey, Home Assistant, etc.) is reachable via MQTT. If the controller goes offline, the Shelly device falls back to local control — handling wall switch events directly.

## How it works

1. The controller publishes a periodic heartbeat to the MQTT topic `homey/status`.
2. The Shelly script listens for these heartbeats and resets a countdown timer on each message received.
3. If the timer expires (no heartbeat within the timeout window), the Shelly marks the controller as offline.
4. While offline, wall switch events are handled locally by the Shelly itself (toggling the switch). When the controller is back online and heartbeats resume, it takes over again automatically.

## Requirements

- Shelly Gen4 device with scripting enabled
- MQTT broker accessible to both the Shelly and your controller
- Controller publishing heartbeats to `homey/status`

## Heartbeat message format

The controller should publish to `homey/status`. The message can be plain text or a JSON object. If JSON, the `interval` field (in seconds) is used to dynamically adjust the timeout:

```json
{ "interval": 30 }
```

If the message is not valid JSON or `interval` is absent, the script falls back to the default `timeout_ms`.

## Configuration

At the top of `script.js`:

| Variable | Default | Description |
|---|---|---|
| `timeout_factor` | `2.5` | Marks offline after `interval × timeout_factor` with no heartbeat |
| `timeout_ms` | `90000` | Fallback timeout (ms) if no dynamic interval is received |

## Deploying the script

1. Open the Shelly web UI and navigate to **Scripts**.
2. Create a new script and paste the contents of `script.js`.
3. Save and enable the script.
4. Ensure MQTT is configured in the Shelly network settings pointing to your broker.

## Customising the fallback action

When the controller is offline and a wall switch event is received, the script calls `Switch.Toggle`. Replace or extend this in the event handler if you need different behaviour:

```javascript
Shelly.call("Switch.Toggle", { id: 0 });
```
