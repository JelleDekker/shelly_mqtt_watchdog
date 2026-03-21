# Project hints for Claude
We're building a small script for Shelly 1PM Gen4 devices. We want to know if the central controller (Homey) is available, otherwise we'll revert back to shelly for switching.

## Stack
- Node.js 20, Express, PostgreSQL
- Shelly Gen4 devices (use Shelly scripting API, not Gen2 syntax)
- MQTT broker runs on Homey Pro at 192.168.68.128:1883

## Conventions
- Use snake_case for variables, PascalCase for classes
- All async functions use async/await, no raw .then() chains

## Things to avoid
- Don't use `var`, always `const` or `let`
- Don't install new dependencies without asking first