# test876523 - VPN Client

A lightweight VPN client that connects to a VPN server over your existing network connection. Features username/password authentication, auto-connect on startup, and reconnection handling.

## Features

- **Easy Connection**: Click "Connect" to establish VPN tunnel over your current network
- **User Authentication**: Secure login with username and password
- **Auto-Connect**: Automatically connect on application startup (configurable)
- **Auto-Reconnect**: Automatically reconnects if connection drops
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Lightweight**: Minimal resource usage with modern VPN protocols

## Quick Start

### Prerequisites

- Node.js 16+ or Python 3.8+
- Your VPN server address and credentials

### Installation

```bash
git clone https://github.com/hakifalt-beep/test876523.git
cd test876523
npm install
# or
pip install -r requirements.txt
```

### Configuration

Create a `.env` file:

```
VPN_SERVER=vpn.example.com
VPN_PORT=1194
VPN_PROTOCOL=wireguard
AUTO_CONNECT=true
```

### Run

```bash
npm start
# or
python main.py
```

## Architecture

- **VPN Protocol**: WireGuard (fast, modern) or OpenVPN (widely compatible)
- **Authentication**: Username/password over TLS
- **Connection Management**: Automatic reconnection and state monitoring

## Project Structure

```
test876523/
├── src/
│   ├── client/
│   │   ├── vpn-connection.js
│   │   ├── auth.js
│   │   └── ui.js
│   ├── config/
│   │   └── defaults.js
│   └── utils/
│       ├── logger.js
│       └── network.js
├── config/
│   ├── vpn-client.conf
│   └── .env.example
├── package.json
├── main.js
└── README.md
```

## License

MIT