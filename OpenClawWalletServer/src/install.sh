#!/bin/sh
# install.sh - Cross-platform (Linux/macOS) installer for OpenClawWallet

set -e

APP_NAME="OpenClawWallet"
REPO="appfi5/OpenClawWallet"
INSTALL_DIR="$HOME/openClawWallet"
LOG_FILE="$INSTALL_DIR/openclaw.log"
DOWNLOAD=false

# Detect OS and architecture
UNAME_S=$(uname -s)
UNAME_M=$(uname -m)

OS=""
ARCH=""

case "$UNAME_S" in
    Linux*)
        OS="linux"
        ;;
    Darwin*)
        OS="osx"
        ;;
    *)
        echo "❌ Unsupported OS: $UNAME_S"
        exit 1
        ;;
esac

case "$UNAME_M" in
    x86_64|amd64)
        ARCH="x64"
        ;;
    aarch64|arm64)
        if [ "$OS" = "osx" ]; then
            ARCH="arm64"
        else
            ARCH="x64"
        fi
        ;;
    *)
        echo "❌ Unsupported architecture: $UNAME_M"
        exit 1
        ;;
esac

if [ "$OS" = "osx" ] && [ "$UNAME_M" = "arm64" ]; then
    ARCH="arm64"
fi

if [ "$OS" = "osx" ]; then
    if [ "$ARCH" = "arm64" ]; then
        RID="osx-arm64"
    else
        RID="osx-x64"
    fi
else
    if [ "$ARCH" = "arm64" ]; then
        RID="linux-arm64"
    else
        RID="linux-x64"
    fi
fi

FILE="${APP_NAME}-${RID}.tar.gz"
URL="https://github.com/${REPO}/releases/latest/download/${FILE}"

echo "🔍 Detected OS: $OS, Arch: $UNAME_M → Using ${RID}"
echo "📁 Install directory: $INSTALL_DIR"

# Create install dir if not exists
if [ ! -d "$INSTALL_DIR" ]; then
  mkdir -p "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Check if files exist
EXECUTABLE_EXISTS=false
CONFIG_EXISTS=false

if [ -f "$APP_NAME" ]; then
    EXECUTABLE_EXISTS=true
fi

if [ -f "appsettings.json" ] || [ -f "appsettings.Production.json" ]; then
    CONFIG_EXISTS=true
fi

# Ask user if files exist
if [ "$EXECUTABLE_EXISTS" = true ] && [ "$CONFIG_EXISTS" = true ]; then
    echo ""
    echo "📦 Found existing installation in $INSTALL_DIR"
    # 检查是否是交互式终端（有用户输入）
        if [ -t 0 ]; then
            # 交互式模式：提示用户
            printf "Do you want to download the latest version? [y/N]: "
            read -r response
            if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
                echo "🚀 Starting existing version..."
            else
                DOWNLOAD=true
                echo "⬇️ Downloading latest version..."
            fi
        else
            # 非交互式模式（如 curl | sh）：默认下载最新版本
            DOWNLOAD=true
            echo "⬇️ Downloading latest version (default in non-interactive mode)"
        fi
else
    DOWNLOAD=true
    echo "📦 Installation not found, downloading latest version..."
fi

# Download and extract if needed
if [ "$DOWNLOAD" = true ]; then
    BACKUP_DIR="$INSTALL_DIR/.backup"
    BACKUP_CREATED=false
    
    if [ "$EXECUTABLE_EXISTS" = true ] || [ "$CONFIG_EXISTS" = true ]; then
        echo "📦 Backing up existing files..."
        mkdir -p "$BACKUP_DIR"
        if [ -f "$APP_NAME" ]; then
            mv "$APP_NAME" "$BACKUP_DIR/"
            BACKUP_CREATED=true
        fi
        if [ -f "appsettings.json" ]; then
            mv "appsettings.json" "$BACKUP_DIR/"
            BACKUP_CREATED=true
        fi
        if [ -f "appsettings.Production.json" ]; then
            mv "appsettings.Production.json" "$BACKUP_DIR/"
            BACKUP_CREATED=true
        fi
    fi
    
    echo "⬇️ Downloading $FILE..."
    if ! curl -L --progress-bar "$URL" | tar -xz; then
        echo "❌ Download or extraction failed!"
        
        if [ "$BACKUP_CREATED" = true ]; then
            echo "🔄 Restoring backup..."
            mv "$BACKUP_DIR"/* .
            rm -rf "$BACKUP_DIR"
        fi
        
        echo "Please check your network connection and try again."
        exit 1
    fi
    
    if [ ! -f "$APP_NAME" ]; then
        echo "❌ Executable file not found after extraction!"
        
        if [ "$BACKUP_CREATED" = true ]; then
            echo "🔄 Restoring backup..."
            mv "$BACKUP_DIR"/* .
            rm -rf "$BACKUP_DIR"
        fi
        
        exit 1
    fi
    
    if [ ! -f "appsettings.json" ] && [ ! -f "appsettings.Production.json" ]; then
        echo "❌ Configuration file not found after extraction!"
        
        if [ "$BACKUP_CREATED" = true ]; then
            echo "🔄 Restoring backup..."
            mv "$BACKUP_DIR"/* .
            rm -rf "$BACKUP_DIR"
        fi
        
        exit 1
    fi
    
    chmod +x "$APP_NAME"
    
    if [ "$BACKUP_CREATED" = true ]; then
        rm -rf "$BACKUP_DIR"
        echo "🗑️ Backup removed"
    fi
    
    echo "✅ Download and extraction completed"
fi

# Create log file if not exists
if [ ! -f "$LOG_FILE" ]; then
    touch "$LOG_FILE"
fi

# Stop old process
pkill -f "$APP_NAME" 2>/dev/null || true

# Start in background
nohup "./$APP_NAME" --urls "http://*:8080" > "$LOG_FILE" 2>&1 &
sleep 2

# Get IP for Linux
if [ "$OS" = "Linux" ]; then
    IP=$(hostname -I | awk '{print $1}')
else
    IP="localhost"
fi

echo ""
echo "✅ OpenClaw Wallet Server started!"
echo "🌐 Access at: http://$IP:8080/openclaw-wallet-server/swagger/index.html"
echo "📄 Log file: $LOG_FILE"
echo "📁 Data directory: $INSTALL_DIR/data"