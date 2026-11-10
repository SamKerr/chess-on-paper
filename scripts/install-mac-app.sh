#!/bin/bash
# Builds "Chess on Paper.app" in ~/Applications and adds it to the Dock.
# The app runs scripts/mac-app/launch.sh from this checkout, so it stays current
# as the code changes. Re-run this script after moving the project folder.
# Usage: npm run mac-app   (or scripts/install-mac-app.sh [--no-dock])
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
name="Chess on Paper"
app="$HOME/Applications/$name.app"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "Building $app"
rm -rf "$app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"

cat >"$app/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>$name</string>
  <key>CFBundleDisplayName</key><string>$name</string>
  <key>CFBundleIdentifier</key><string>local.chess-on-paper</string>
  <key>CFBundleExecutable</key><string>launch</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
</dict>
</plist>
PLIST

cat >"$app/Contents/MacOS/launch" <<STUB
#!/bin/bash
exec "$repo/scripts/mac-app/launch.sh"
STUB
chmod +x "$app/Contents/MacOS/launch" "$repo/scripts/mac-app/launch.sh"

# Icon: render the SVG with Playwright's Chromium, then build an .icns.
png="$work/icon-1024.png"
if (cd "$repo" && node --input-type=module -e '
  import { chromium } from "@playwright/test";
  import { readFileSync } from "node:fs";
  const [svg, out] = process.argv.slice(1);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await page.setContent(`<style>body{margin:0}</style>${readFileSync(svg, "utf8")}`);
  await page.screenshot({ path: out, omitBackground: true });
  await browser.close();
' "$repo/scripts/mac-app/icon.svg" "$png"); then
  set="$work/AppIcon.iconset"
  mkdir -p "$set"
  for s in 16 32 128 256 512; do
    sips -z $s $s "$png" --out "$set/icon_${s}x${s}.png" >/dev/null
    sips -z $((s * 2)) $((s * 2)) "$png" --out "$set/icon_${s}x${s}@2x.png" >/dev/null
  done
  iconutil -c icns "$set" -o "$app/Contents/Resources/AppIcon.icns"
else
  echo "Could not render the icon (run: npx playwright install chromium). Using the default icon."
fi
touch "$app"

if [ "${1:-}" != "--no-dock" ]; then
  if defaults read com.apple.dock persistent-apps 2>/dev/null | grep -qF "${app// /%20}/"; then
    echo "Already in the Dock."
  else
    defaults write com.apple.dock persistent-apps -array-add \
      "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>file://${app// /%20}/</string><key>_CFURLStringType</key><integer>15</integer></dict></dict></dict>"
    killall Dock
    echo "Added to the Dock."
  fi
fi

echo "Done. Click \"$name\" in the Dock (or open $app)."
