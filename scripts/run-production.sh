#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
DIR="/Users/bud_istoreicloud.com/.gemini/antigravity/scratch/srj-guardian"
cd "$DIR" || exit 1

# Menjaga sistem Mac & WiFi tetap hidup saat layar padam/terkunci
if [ -x "/usr/bin/caffeinate" ]; then
  exec /usr/bin/caffeinate -i -s -m /usr/local/bin/node scripts/start-all.js
else
  exec /usr/local/bin/node scripts/start-all.js
fi
