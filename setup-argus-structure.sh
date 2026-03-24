#!/bin/bash

echo "🚀 Creating ARGUS AI Agent project structure..."

PROJECT_NAME="argus-ai-agent"

# Root
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME || exit

# Base files
touch README.md LICENSE .gitignore docker-compose.yml .env.example

# Frontend
mkdir -p frontend/js frontend/css frontend/assets/{audio,images}
touch frontend/voice.html
touch frontend/js/app.js
touch frontend/css/styles.css

# n8n
mkdir -p n8n/workflows n8n/credentials
touch n8n/workflows/argus-voice-full-pipeline.json
touch n8n/credentials/README.md

# Flowise
mkdir -p flowise/chatflows flowise/tools
touch flowise/chatflows/argus-chatflow.json
touch flowise/README.md

# Database
mkdir -p database/migrations
touch database/schema.sql
touch database/seed.sql

# ESP32
mkdir -p esp32/mic/inmp441
mkdir -p esp32/audio/max98357a
mkdir -p esp32/display/{st7789,ips}
mkdir -p esp32/camera/ov3660
mkdir -p esp32/main
mkdir -p esp32/config

touch esp32/main/argus_main.ino
touch esp32/config/wifi.h

# Docs
mkdir -p docs/images
touch docs/architecture.md
touch docs/workflows.md
touch docs/setup.md
touch docs/roadmap.md

touch docs/images/architecture.png
touch docs/images/n8n-workflow.png
touch docs/images/frontend.png
touch docs/images/esp32-diagram.png

# Scripts
mkdir -p scripts
touch scripts/setup.sh
touch scripts/run.sh
touch scripts/export-workflows.sh

# Assets
mkdir -p assets/demo assets/screenshots assets/audio
touch assets/demo/video-link.txt

# Tests
mkdir -p tests

# Permissions
chmod +x scripts/*.sh

echo "✅ ARGUS structure created successfully!"
echo "📁 Location: $(pwd)"