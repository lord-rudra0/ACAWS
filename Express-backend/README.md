# Express Backend Setup

## System Requirements
- **Node.js**: v18.x LTS
- **npm**: v9.x or later
- **MongoDB**: v6.0 or later
- **Linux**: Ubuntu 22.04 LTS (Recommended)

## Installation

### 1. Install Node.js and npm
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js and npm
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x
npm --version   # Should show 9.x or later
```

### 2. Install MongoDB
```bash
# Import the public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update packages
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB on system startup
sudo systemctl enable mongod
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/acaws
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### 4. Install Dependencies
```bash
# Navigate to project directory
cd Express-backend

# Install dependencies
npm install
```

## Running the Server

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for automatic reloading.

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### AI Services
- `POST /api/ai/gemini` - Access Gemini AI services

### Health Check
- `GET /health` - Server health status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/acaws |
| JWT_SECRET | Secret for JWT token signing | (required) |
| NODE_ENV | Application environment | development |

## Common Issues

### Port Already in Use
```bash
# Find and kill the process
sudo lsof -i :3001
kill -9 <PID>
```

### MongoDB Connection Issues
- Ensure MongoDB service is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Verify MongoDB is accessible: `mongo --eval 'db.runCommand({ connectionStatus: 1 })'`

### Permission Issues
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

export PATH=~/.npm-global/bin:$PATH
source ~/.bashrc
```

## Development
- Use `npm run lint` to check code style
- Follow REST API best practices
- Write tests for new features
- Document API endpoints using JSDoc

## License
[Your License Here]
