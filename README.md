# Permaweb Point-N-Shoot

A decentralized point-and-shoot camera using the **ESP32-CAM** that uploads captured images directly to the **Arweave permaweb** — ensuring permanent, immutable storage.

## 🚀 Features

- Snap photos via ESP32-CAM with one click
- Images are permanently stored on Arweave
- Backend service handles wallet signing and transaction broadcasting
- Web UI for viewing uploaded photos from the blockchain

## 📁 Project Structure

```bash
Permaweb_point-n-shoot/
├── esp32_cam_arweave       # ESP32 firmware (C++)
├── Turbo SDK Server        # Middleware (Lua/JS)
└── Frontend_with_AO        # Frontend (React + TS)
```

## 🧰 Tech Stack

- ESP32-CAM (C++)
- Arweave SDK
- TypeScript + React
- Lua / JavaScript

## ⚙️ Setup

### 1. ESP32-CAM

- Add your `SSID` and `Password` in Script.
- Add your `local ip address` to the Script
- Flash `esp32_cam_arweave` code using Arduino IDE or PlatformIO.
- Set your Wi-Fi and backend server configs.

### 2. Turbo SDK Server

```bash
cd "Turbo SDK Server"
npm install
node server_v3.js
```
- Add your Arweave wallet json

### 3. Frontend

```bash
cd Frontend_with_AO
npm install
npm run dev
```
- Open http://localhost:3000
