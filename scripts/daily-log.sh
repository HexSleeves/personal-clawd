#!/bin/bash
set -euo pipefail

TZ_LOCAL="America/Chicago"
DATE_YMD="$(TZ="$TZ_LOCAL" date +%F)"
DOW="$(TZ="$TZ_LOCAL" date +%a)"

MEMORY_DIR="/Users/jacob.lecoq.ext/clawd/memory"
OUT_FILE="$MEMORY_DIR/$DATE_YMD.md"

mkdir -p "$MEMORY_DIR"

if [[ -f "$OUT_FILE" ]]; then
  exit 0
fi

cat >"$OUT_FILE" <<EOF
# Daily Log — $DATE_YMD ($DOW)

## Top 3
-
-
-

## Schedule
- 09:30 Standup

## Notes
-

## Wins
-

## Blockers
-

## Tomorrow
-
EOF
