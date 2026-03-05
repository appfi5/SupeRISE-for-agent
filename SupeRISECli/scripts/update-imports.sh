#!/bin/bash

# Update all imports to use @ alias and remove .js suffix

find src -name "*.ts" -type f -exec sed -i '' \
  -e 's|from "\.\./\.\./\.\./services/|from "@/services/|g' \
  -e 's|from "\.\./\.\./services/|from "@/services/|g' \
  -e 's|from "\.\./services/|from "@/services/|g' \
  -e 's|from "\./services/|from "@/services/|g' \
  -e 's|from "\.\./\.\./\.\./core/|from "@/core/|g' \
  -e 's|from "\.\./\.\./core/|from "@/core/|g' \
  -e 's|from "\.\./core/|from "@/core/|g' \
  -e 's|from "\./core/|from "@/core/|g' \
  -e 's|from "\.\./\.\./\.\./storage/|from "@/storage/|g' \
  -e 's|from "\.\./\.\./storage/|from "@/storage/|g' \
  -e 's|from "\.\./storage/|from "@/storage/|g' \
  -e 's|from "\./storage/|from "@/storage/|g' \
  -e 's|from "\.\./\.\./\.\./utils/|from "@/utils/|g' \
  -e 's|from "\.\./\.\./utils/|from "@/utils/|g' \
  -e 's|from "\.\./utils/|from "@/utils/|g' \
  -e 's|from "\./utils/|from "@/utils/|g' \
  -e 's|from "\.\./\.\./\.\./commands/|from "@/commands/|g' \
  -e 's|from "\.\./\.\./commands/|from "@/commands/|g' \
  -e 's|from "\.\./commands/|from "@/commands/|g' \
  -e 's|from "\./commands/|from "@/commands/|g' \
  -e 's|from "\.\./\.\./\.\./mcp-server/|from "@/mcp-server/|g' \
  -e 's|from "\.\./\.\./mcp-server/|from "@/mcp-server/|g' \
  -e 's|from "\.\./mcp-server/|from "@/mcp-server/|g' \
  -e 's|from "\./mcp-server/|from "@/mcp-server/|g' \
  -e 's|from "\.\./\.\./\.\./mock/|from "@/mock/|g' \
  -e 's|from "\.\./\.\./mock/|from "@/mock/|g' \
  -e 's|from "\.\./mock/|from "@/mock/|g' \
  -e 's|from "\./mock/|from "@/mock/|g' \
  -e 's|\.js"|"|g' \
  {} \;

echo "Import paths updated successfully"
