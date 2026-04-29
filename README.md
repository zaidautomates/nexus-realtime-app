<div align="center">

# ⚡ Nexus — Real-Time Communication Platform

**A secure, full-featured video conferencing and collaboration tool built from scratch.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![WebRTC](https://img.shields.io/badge/WebRTC-Native-FF6B35?style=flat-square)](https://webrtc.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*Multi-user video calls · Screen sharing · Encrypted chat · Collaborative whiteboard · File sharing*

<!-- Add screenshots here -->
<!-- ![Nexus Dashboard](screenshots/dashboard.png) -->

</div>

---

## ✨ Features

### 🎥 Video Conferencing
- **Multi-user HD video calls** powered by WebRTC peer-to-peer mesh architecture
- **Adaptive grid layout** — tiles auto-resize and reposition perfectly as participants join or leave (1→6 users)
- **Mic & camera controls** — individual toggle with real-time state broadcast to all peers
- **Speaker detection** — visual indicators for active audio

### 🖥️ Screen Sharing
- One-click screen/window/tab sharing via `getDisplayMedia` API
- Replaces video track live on all peer connections — no reconnection needed
- Auto-stops sharing when the browser's native "Stop sharing" button is clicked

### 💬 Encrypted Chat
- Real-time room chat via Socket.io
- **Client-side AES-256-GCM encryption** (Web Crypto API) — messages are encrypted before leaving your browser
- Messages decrypt inline per bubble — unreadable to the server

### 📁 File Sharing
- Drag & drop or click-to-upload interface
- Up to **50MB per file**, all file types supported
- Files stored on server, download link broadcast to all room participants
- Progress bar with upload percentage

### 🎨 Collaborative Whiteboard
- Shared HTML5 Canvas — draw in real time with all participants
- Tools: **Pen**, **Eraser**
- **12 colors**, adjustable brush size (1–30px)
- **Clear board** (synced to everyone) and **Export as PNG**
- Touch-screen support

### 🔐 User Authentication & Profile
- Register / Login with **JWT** tokens (7-day expiry)
- Passwords hashed with **bcrypt** (12 rounds)
- Full **profile customization**:
  - Display name & bio
  - Status indicator (Online / Busy / Do Not Disturb / Away)
  - **12 avatar styles** powered by DiceBear (Illustrated, Robots, Pixel Art, Emoji, and more)
  - Custom avatar seed for unique look
  - Password change with strength meter

### 🛡️ Security
- **AES-256-GCM** encryption for chat messages (client-side) and file transfers (server-side)
- **JWT HMAC-SHA256** signed tokens for all authenticated requests
- CORS restricted to frontend origin only
- No third-party auth services — fully self-hosted

---

## 🖼️ Screenshots

> *(Add your screenshots here)*

| Login | Dashboard | Room |
|---|---|---|
| `screenshot-login.png` | `screenshot-dashboard.png` | `screenshot-room.png` |

| Chat | Whiteboard | Profile |
|---|---|---|
| `screenshot-chat.png` | `screenshot-whiteboard.png` | `screenshot-profile.png` |

---

## 🏗️ Architecture

```
nexus/
├── client/                    # React 18 + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── DashboardPage.jsx
│       │   └── RoomPage.jsx
│       ├── components/
│       │   ├── VideoGrid.jsx       # Adaptive grid (ResizeObserver + optimal layout)
│       │   ├── VideoTile.jsx       # Single video participant tile
│       │   ├── ChatSidebar.jsx     # E2E encrypted chat
│       │   ├── FileSharePanel.jsx  # File upload/download
│       │   ├── Whiteboard.jsx      # Canvas drawing + Socket.io sync
│       │   ├── ParticipantsPanel.jsx
│       │   └── ProfileModal.jsx    # Profile customization
│       ├── hooks/
│       │   ├── useWebRTC.js        # Peer connection lifecycle
│       │   └── useSocket.js        # Socket.io connection
│       ├── contexts/
│       │   └── AuthContext.jsx     # Global auth state
│       └── lib/
│           ├── apiClient.js        # Fetch wrapper with JSON guards
│           ├── encryption.js       # AES-256-GCM (Web Crypto API)
│           └── utils.js
│
├── server/                    # Node.js + Express backend
│   └── src/
│       ├── index.js               # Server entry + Socket.io setup
│       ├── routes/
│       │   ├── auth.js            # Register, Login, /me, PATCH profile
│       │   ├── rooms.js           # Create & join rooms
│       │   └── files.js           # Upload & download
│       ├── socket/
│       │   └── signalingHandler.js # WebRTC signaling, chat, whiteboard, file events
│       ├── middleware/
│       │   └── authMiddleware.js
│       └── utils/
│           ├── jwtHelper.js
│           └── encryption.js      # AES-256-GCM (Node.js crypto)
│
├── package.json               # Root — runs both with concurrently
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast SPA with HMR |
| **Styling** | TailwindCSS 3 + shadcn/ui | Dark UI design system |
| **Icons** | Lucide React | Consistent icon set |
| **Real-time media** | WebRTC (native browser API) | P2P video/audio mesh |
| **Signaling & sync** | Socket.io v4 | Signaling, chat, whiteboard, files |
| **Backend** | Node.js + Express 4 | REST API + Socket.io server |
| **Auth** | JWT + bcryptjs | Stateless authentication |
| **Encryption** | AES-256-GCM | Client & server-side encryption |
| **File storage** | Multer + local disk | File upload handling |
| **Avatar** | DiceBear API | Generated user avatars |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- A modern browser (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nexus-realtime-app.git
cd nexus-realtime-app
```

### 2. Install all dependencies

```bash
npm run install:all
```

> This installs dependencies for the root, `/client`, and `/server` in one command.

### 3. Configure environment (optional)

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your own secrets:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
ENCRYPTION_KEY=your_super_secret_encryption_key_here
```

### 4. Start the app

```bash
npm start
```

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:5173 |
| ⚙️ Backend API | http://localhost:5000 |
| 🏥 Health check | http://localhost:5000/api/health |

---

## 📖 Usage Guide

### Getting Started
1. Open http://localhost:5173
2. **Register** a new account (username, display name, email, password)
3. You'll land on the **Dashboard**

### Creating a Meeting
1. Click **Create a Room** → optionally name it → click **Create**
2. A unique **Room ID** appears (e.g. `AB12C3`) — copy and share it with participants

### Joining a Meeting
1. Click **Join a Room** → paste the Room ID → click **Join**

### Inside the Room

| Action | How |
|---|---|
| Mute/Unmute mic | Click the **Mic** button in the toolbar |
| Start/Stop camera | Click the **Camera** button |
| Share screen | Click the **Monitor** icon |
| Open chat | Click the **Chat** bubble icon |
| Share a file | Click **Files** tab → drag & drop or click to upload |
| Open whiteboard | Click the **Pen** icon |
| View participants | Click the **People** icon |
| Edit your profile | Click your avatar in the header |
| Leave the room | Click the red **Leave** button |

### Profile Customization
Click your **avatar** (top-right on Dashboard or in Room header) to open the Profile modal:
- **Profile tab** — edit display name, bio, status
- **Avatar tab** — pick from 12 avatar styles, customize seed, randomize
- **Security tab** — change password with strength indicator

---

## 🔧 Available Scripts

From the **root** directory:

```bash
npm start          # Start both frontend and backend
npm run server     # Start backend only (with nodemon)
npm run client     # Start frontend only (Vite dev)
npm run install:all  # Install all dependencies
```

From `/client`:

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
```

From `/server`:

```bash
npm run dev        # Start with nodemon (auto-restart)
npm start          # Start without nodemon
```

---

## 🌐 WebRTC Signaling Flow

```
User A                   Signaling Server              User B
  |                           |                           |
  |── room:join ─────────────>|                           |
  |<─ room:peers ─────────────|                           |
  |                           |<──── room:join ───────────|
  |<─ room:user-joined ───────|                           |
  |── rtc:offer ─────────────>|──── rtc:offer ───────────>|
  |                           |<─── rtc:answer ───────────|
  |<─ rtc:answer ─────────────|                           |
  |── rtc:ice-candidate ─────>|── rtc:ice-candidate ─────>|
  |                           |<── rtc:ice-candidate ─────|
  |<──────────── P2P video/audio connection established ──|
```

---

## 🔒 Security Details

| Concern | Implementation |
|---|---|
| Password storage | bcrypt hash, **12 salt rounds** |
| Auth tokens | JWT signed with **HMAC-SHA256**, 7-day expiry |
| Chat encryption | **AES-256-GCM** encrypted client-side before socket transmission |
| File encryption | **AES-256-GCM** applied server-side via Node.js `crypto` |
| CORS | Restricted to `http://localhost:5173` |
| Token verification | Every protected route validates JWT via middleware |

---

## 🌍 Browser Support

| Browser | Minimum Version |
|---|---|
| Chrome / Chromium | 90+ |
| Firefox | 88+ |
| Safari | 15+ |
| Edge | 90+ |

> WebRTC and the Web Crypto API are required. Both are supported in all modern browsers.

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [WebRTC](https://webrtc.org) — browser-native P2P media
- [Socket.io](https://socket.io) — real-time bidirectional communication
- [DiceBear](https://dicebear.com) — avatar generation API
- [Lucide](https://lucide.dev) — beautiful open-source icons
- [shadcn/ui](https://ui.shadcn.com) — accessible UI component primitives
- [TailwindCSS](https://tailwindcss.com) — utility-first CSS framework

---

<div align="center">

Built with ❤️ as part of the **Code Alpha Internship 2026**

*If you found this useful, please ⭐ star the repository!*

</div>
