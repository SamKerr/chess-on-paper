#!/bin/bash
# Started by "Chess on Paper.app" (see scripts/install-mac-app.sh).
# Rebuilds the app if the source changed since the last build, serves dist/ on
# http://localhost:4317 (reusing a server that is already up) and opens it in the
# default browser. Log: ~/Library/Logs/chess-on-paper.log
set -u

repo="$(cd "$(dirname "$0")/../.." && pwd)"
port=4317
url="http://localhost:$port/"
log="$HOME/Library/Logs/chess-on-paper.log"
exec >>"$log" 2>&1
echo "--- $(date '+%Y-%m-%d %H:%M:%S') launch from $repo"

notify() {
  /usr/bin/osascript -e "display notification \"$1\" with title \"Chess on Paper\"" || true
}

# Apps started from the Dock get a bare PATH, so find node ourselves.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
fi
if ! command -v node >/dev/null 2>&1; then
  notify "Could not find Node.js. See $log"
  echo "node not found on PATH: $PATH"
  exit 1
fi

cd "$repo" || { notify "Project folder not found: $repo"; exit 1; }

if [ ! -d node_modules ]; then
  notify "Installing dependencies (first run)..."
  npm install || { notify "npm install failed. See $log"; exit 1; }
fi

# Rebuild when dist/ is missing or anything that goes into it is newer.
rebuilt=0
if [ ! -f dist/index.html ] || [ -n "$(find src public index.html vite.config.ts package.json -newer dist/index.html -print -quit)" ]; then
  echo "building"
  if npm run build; then
    rebuilt=1
  elif [ -f dist/index.html ]; then
    notify "Build failed; opening the last good build. See $log"
  else
    notify "Build failed. See $log"
    exit 1
  fi
fi

server_pid() {
  # Only ever touch a server this script started: vite preview on our port.
  local pid
  for pid in $(/usr/sbin/lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null); do
    if ps -o command= -p "$pid" | grep -q "vite.*preview"; then echo "$pid"; return; fi
  done
}

pid="$(server_pid)"
if [ -n "$pid" ] && [ "$rebuilt" = 1 ]; then
  echo "restarting server $pid after rebuild"
  kill "$pid"
  sleep 0.5
  pid=""
fi

if [ -z "$pid" ]; then
  if /usr/sbin/lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    notify "Port $port is used by another program."
    exit 1
  fi
  echo "starting server on $port"
  nohup node node_modules/vite/bin/vite.js preview --port "$port" --strictPort >>"$log" 2>&1 &
  for _ in $(seq 1 50); do
    curl -fsS -o /dev/null "$url" && break
    sleep 0.2
  done
fi

/usr/bin/open "$url"
