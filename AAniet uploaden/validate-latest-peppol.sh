#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
XML_FILE="$(find "$ROOT_DIR/facturen" -type f \( -name '*.xml' -o -name '*.XML' \) -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -n 1 || true)"

if [ ! -f "$XML_FILE" ]; then
  echo "Geen business UBL gevonden in facturen/. Private orders genereren geen Peppol-UBL." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/peppol-validator.xsl" ]; then
  echo "peppol-validator.xsl ontbreekt in de projectmap." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/Saxon-HE-13.0.jar" ]; then
  echo "Saxon-HE-13.0.jar ontbreekt in de projectmap." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/xmlresolver-6.0.21.jar" ] || [ ! -f "$ROOT_DIR/xmlresolver-6.0.21-data.jar" ]; then
  echo "xmlresolver jars ontbreken in de projectmap." >&2
  exit 1
fi

OUT_FILE="$ROOT_DIR/svrl.xml"

java -cp "$ROOT_DIR/Saxon-HE-13.0.jar:$ROOT_DIR/xmlresolver-6.0.21.jar:$ROOT_DIR/xmlresolver-6.0.21-data.jar" net.sf.saxon.Transform \
  -s:"$XML_FILE" \
  -xsl:"$ROOT_DIR/peppol-validator.xsl" \
  -o:"$OUT_FILE"

if grep -n "failed-assert" "$OUT_FILE"; then
  exit 1
fi

echo "Geen failed-asserts gevonden in: $XML_FILE"
