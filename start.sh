#!/bin/bash
cd /home/chenyi/.openclaw/workspace/projects/openclaw-manager
while true; do
    node server.js >> server.log 2>&1
    echo "Server crashed, restarting in 3 seconds..." >> server.log
    sleep 3
done
