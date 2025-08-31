# Frontend Installation Guide

## System Requirements
- **OS**: Ubuntu 22.04 LTS (Recommended)
- **Node.js**: v18.x LTS
- **npm**: v9.x or later
- **Python**: 3.8+ (for node-gyp)
- **Build Tools**: gcc, g++, make

## Installation Steps

### 1. Install Node.js and npm (Using NodeSource)
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js and npm
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x
npm --version   # Should show 9.x or later
```

### 2. Install Build Dependencies
```bash
# Install build tools
sudo apt-get update
sudo apt-get install -y build-essential python3

# Set Python 3 as default for node-gyp
npm config set python python3
```

### 3. Install Project Dependencies
```bash
# Navigate to project directory
cd Frontend

# Clean previous installations (if any)
rm -rf node_modules package-lock.json

# Install dependencies
npm install --legacy-peer-deps

# If the above fails, try with --force
# npm install --force
```

## Common Issues and Solutions

### 1. Node-gyp Build Error
**Error**: `'uintptr_t' does not name a type`
**Solution**: Ensure you have all build tools and Python 3 installed:
```bash
sudo apt-get install -y build-essential python3
npm config set python python3
```

### 2. Python 2.7 Not Found
**Error**: `Unable to locate package python2.7`
**Solution**: The project works with Python 3. Set Python 3 as default:
```bash
npm config set python python3
```

### 3. Permission Issues
**Error**: `EACCES: permission denied`
**Solution**: Fix npm permissions:
```bash
# Option 1: Change npm's default directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your shell config file (.bashrc or .zshrc)
export PATH=~/.npm-global/bin:$PATH
source ~/.bashrc  # or source ~/.zshrc

# Option 2: Use a node version manager (recommended)
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal, then:
nvm install 18
nvm use 18
```

### 4. GL Module Build Failures
**Error**: `Failed to build gl module`
**Solution**: Install GL development libraries:
```bash
sudo apt-get install -y libgl1-mesa-dev
```

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Environment Variables
Create a `.env` file in the frontend directory with the following variables:
```env
VITE_API_URL=http://localhost:3001
VITE_PYTHON_API_URL=http://localhost:5001
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Troubleshooting
- If you encounter dependency issues, try:
  ```bash
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
  ```
- For persistent issues, try using Node.js LTS version 18.x
- Ensure all services (backend, database) are running before starting the frontend

## Support
For additional help, please contact the development team or open an issue in the repository.
