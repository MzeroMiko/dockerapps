#!/bin/bash

PASSWORD=$PASSWORD code-server --bind-addr 127.0.0.1:8080 --auth password --config /config/config.yaml --user-data-dir /config/data --extensions-dir /config/extensions --disable-telemetry --disable-update-check /workspace