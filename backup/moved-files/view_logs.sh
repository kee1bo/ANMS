#!/bin/bash
echo "=== ANMS Server Logs ==="
if [ -f "server.log" ]; then
    tail -f server.log
else
    echo "No server logs found"
fi
