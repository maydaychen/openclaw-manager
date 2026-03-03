# OpenClaw Manager

A web-based management interface for OpenClaw - manage sessions, files, cron jobs, and more.

## Features

- 📊 **Dashboard** - Overview of active sessions, cron jobs, gateway status, and disk usage
- 📁 **File Management** - Browse and manage workspace files
- ⏰ **Cron Jobs** - Manage OpenClaw scheduled tasks
- 👥 **User Management** - Multi-user support with permission levels
- 🎭 **Persona Editor** - Edit SOUL.md, MEMORY.md, USER.md, IDENTITY.md
- 📈 **Analytics** - Token usage statistics with database persistence
- 💾 **Backup** - Local and Google Drive backup support

## Tech Stack

- **Backend**: Node.js + Express + MariaDB/MySQL
- **Frontend**: Vanilla JavaScript + CSS (Flat Design)
- **Authentication**: JWT Token
- **Deployment**: Systemd service

## Installation

### Prerequisites

- Node.js 18+
- MariaDB or MySQL
- OpenClaw CLI installed

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/openclaw-manager.git
cd openclaw-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create configuration file:
```bash
cp config.example.json config.json
# Edit config.json with your settings
```

4. Initialize database:
```sql
CREATE DATABASE openclaw_manager CHARACTER SET utf8mb4;
-- Run the SQL in database/schema.sql
```

5. Start the server:
```bash
npm start
# Or with systemd
sudo systemctl start openclaw-manager
```

## Configuration

Create `config.json` based on `config.example.json`:

```json
{
  "database": {
    "host": "your-mariadb-host",
    "user": "your-db-user",
    "password": "your-db-password",
    "database": "openclaw_manager"
  }
}
```

Or use environment variables:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Default Credentials

Default login (change after first login):
- Username: `maydaychen`
- Password: `AB2!REKj4bm7dcQECTdh`

## License

MIT
