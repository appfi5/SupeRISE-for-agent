#!/bin/bash
# Sustain Score Review Script - Sends score review results to OpenClaw channel

# Run score command and capture output
SCORE=$(rise sustain score 2>/dev/null)

if echo "$SCORE" | grep -q "No scores recorded yet"; then
  MESSAGE="📈 **Sustain Score Review**

No decision scores recorded yet."
else
  SCORE_ID=$(echo "$SCORE" | grep "ID:" | head -1 | awk '{print $2}')
  AVAILABILITY=$(echo "$SCORE" | grep "Availability:" | awk '{print $2}')
  COST=$(echo "$SCORE" | grep "Cost:" | awk '{print $2}')
  STABILITY=$(echo "$SCORE" | grep "Stability:" | awk '{print $2}')
  OVERALL=$(echo "$SCORE" | grep "Overall:" | awk '{print $2}')
  
  MESSAGE="📈 **Sustain Score Review**

**Latest Score ID**: ${SCORE_ID:0:8}...
**Availability**: $AVAILABILITY
**Cost**: $COST
**Stability**: $STABILITY
**Overall**: $OVERALL

Run \`rise sustain score\` for full details."
fi

# Send to OpenClaw channel
openclaw send "$MESSAGE"
