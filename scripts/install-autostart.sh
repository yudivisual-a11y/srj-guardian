#!/bin/bash
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.srj.guardian.plist"
mkdir -p "$PLIST_DIR"

cat << 'EOF' > "$PLIST_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.srj.guardian</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/bud_istoreicloud.com/.gemini/antigravity/scratch/srj-guardian/scripts/run-production.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/bud_istoreicloud.com/.gemini/antigravity/scratch/srj-guardian/.data/autostart.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/bud_istoreicloud.com/.gemini/antigravity/scratch/srj-guardian/.data/autostart.err</string>
    <key>WorkingDirectory</key>
    <string>/Users/bud_istoreicloud.com/.gemini/antigravity/scratch/srj-guardian</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST_FILE" 2>/dev/null
launchctl load "$PLIST_FILE"
echo "✅ Auto-start berhasil dipasang! SRJ Guardian akan otomatis aktif setiap kali laptop dinyalakan/login."
