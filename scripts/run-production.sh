#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
DIR="/Users/bud_istoreicloud.com/.gemini/antigravity/scratch/srj-guardian"
cd "$DIR" || exit 1
exec /usr/local/bin/node scripts/start-all.js
