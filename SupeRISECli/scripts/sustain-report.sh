#!/bin/bash
# Sustain Report Script - Sends health check and forecast results to OpenClaw channel

# Run health check and capture output
HEALTH=$(rise sustain health-check 2>/dev/null)
HEALTH_STATUS=$(echo "$HEALTH" | grep "Status:" | awk '{print $2}')
BALANCE=$(echo "$HEALTH" | grep "Balance:" | awk '{print $2}')

# Run forecast and capture output
FORECAST=$(rise sustain forecast 2>/dev/null)
BURN_RATE=$(echo "$FORECAST" | grep "Burn Rate:" | awk '{print $3, $4}')
ETA_CRITICAL=$(echo "$FORECAST" | grep "ETA Critical:" | awk '{$1=$2=""; print $0}' | xargs)

# Compose message
MESSAGE="📊 **Sustain Report**

**Health Status**: $HEALTH_STATUS
**Balance**: $BALANCE
**Burn Rate**: $BURN_RATE
**ETA Critical**: $ETA_CRITICAL

Run \`rise sustain health-check\` for full details."

# Send to OpenClaw channel
openclaw send "$MESSAGE"
