# VPN Client Setup Guide

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/hakifalt-beep/test876523.git
cd test876523
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Credentials

Copy the example environment file and add your VPN credentials:

```bash
cp .env.example .env
```

Edit `.env` with your details:

```
VPN_SERVER=your-vpn-server.com
VPN_PORT=1194
VPN_PROTOCOL=wireguard
VPN_USERNAME=your_username
VPN_PASSWORD=your_password
AUTO_CONNECT=true
AUTO_RECONNECT=true
```

## Running the Client

### Start the VPN Client

```bash
npm start
```

This launches an interactive terminal UI where you can:

- **Click CONNECT** — Establish VPN connection
- **Click DISCONNECT** — Close VPN tunnel
- **Click QUIT** — Exit and disconnect
- **Press ESC or Ctrl+C** — Gracefully shutdown

### Development Mode (with auto-reload)

```bash
npm run dev
```

## Features

### User Authentication

The client securely authenticates with your VPN server using:
- Username and password
- TLS encrypted connection
- Challenge-response authentication
- SHA-256 password hashing with salt

### Auto-Connect

When `AUTO_CONNECT=true`, the client automatically establishes a VPN connection on startup.

### Auto-Reconnect

When `AUTO_RECONNECT=true`, the client automatically attempts to reconnect if:
- The connection drops unexpectedly
- The network becomes unavailable
- The server becomes unreachable

Reconnection attempts are delayed exponentially (5s, 10s, 15s...) up to 5 attempts.

### Health Monitoring

The client monitors VPN connection health every 10 seconds and logs status changes.

## Logs

Connection logs are stored in `./logs/vpn-client.log`

View logs:

```bash
tail -f logs/vpn-client.log
```

Control log level via `.env`:

```
LOG_LEVEL=debug    # More verbose
LOG_LEVEL=info     # Normal (default)
LOG_LEVEL=warn     # Warnings only
LOG_LEVEL=error    # Errors only
```

## Platform-Specific Setup

### macOS

Install WireGuard or OpenVPN:

```bash
brew install wireguard-tools
# or
brew install openvpn
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get install wireguard-tools
# or
sudo apt-get install openvpn
```

### Windows

Download and install:
- [WireGuard](https://www.wireguard.com/install/)
- [OpenVPN](https://openvpn.net/download-open-vpn/)

Then adjust the script paths in `src/client/vpn-connection.js` for Windows commands.

## Troubleshooting

### "Server unreachable" error

- Verify the VPN server address and port are correct
- Check your internet connection
- Confirm the server is online and listening

### "Authentication failed" error

- Double-check your username and password
- Verify credentials in `.env` file
- Check server authentication logs

### Connection drops frequently

- Increase `RECONNECT_INTERVAL` in `.env`
- Check network stability
- Review logs for patterns

### Logs not appearing

- Ensure `LOG_FILE` directory exists
- Check file permissions
- Verify `LOG_LEVEL` isn't set to `error`

## Security Considerations

1. **Never commit `.env`** — It contains credentials
2. **Use strong passwords** — The server should require minimum complexity
3. **Verify server certificates** — In production, enable certificate verification
4. **Monitor logs** — Review logs regularly for suspicious activity
5. **Update dependencies** — Run `npm update` periodically

## Architecture

```
VPN Client
    ↓
[Authentication]
    ├── TLS Connection to Server
    ├── Challenge-Response Auth
    └── Token Received
    ↓
[VPN Protocol Setup]
    ├── WireGuard OR OpenVPN
    └── Tunnel Established
    ↓
[Connection Monitoring]
    ├── Health Check (every 10s)
    ├── Auto-Reconnect on Failure
    └── Status Logging
```

## Advanced Usage

### Using Environment Variables Only (CLI)

```bash
VPN_SERVER=vpn.example.com \
VPN_USERNAME=user \
VPN_PASSWORD=pass \
AUTO_CONNECT=true \
npm start
```

### Custom Log Output

```bash
LOG_LEVEL=debug LOG_FILE=./my-vpn.log npm start
```

### Split Tunneling (Advanced)

Modify `src/client/vpn-connection.js` to add routes:

```javascript
// Route specific IP ranges through VPN only
// Route internal networks without VPN
```

## Support

For issues, check:
1. Log files in `./logs/`
2. README.md for feature documentation
3. Server-side logs for authentication failures

## License

MIT
