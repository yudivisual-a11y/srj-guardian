#!/bin/bash
PLIST_FILE="$HOME/Library/LaunchAgents/com.srj.guardian.plist"
if [ -f "$PLIST_FILE" ]; then
    launchctl unload "$PLIST_FILE" 2>/dev/null
    rm -f "$PLIST_FILE"
    echo "✅ Auto-start SRJ Guardian berhasil dinonaktifkan."
else
    echo "ℹ️ Auto-start belum terpasang."
fi
