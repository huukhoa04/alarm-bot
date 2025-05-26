# MiniCar Control App

A mobile application for controlling a remote mini car with real-time video streaming and session history tracking.

## Features

- Remote control interface for the mini car
- Live video streaming from the car's camera
- Session history tracking
- Real-time statistics monitoring

## Prerequisites

- Node.js (version 20 or later)
- Expo CLI
- Supabase account (for backend services)

## Setup Instructions

1. Clone the repository
2. Install dependencies

   ```bash
   npm install
   ```
3. Environment Setup

   Run this command for setup environment file:

   ```bash
   cp .env.example .env
   ```

   Then reconfig your `EXPO_PUBLIC_WEBSOCKET` and `EXPO_PUBLIC_CAMERA_URL` to match your WebSocket Server and Camera Server URL

4. Start the app

   ```bash
   npx expo start
   ```

## Docker Setup

You can also run the app using Docker:

```bash
# Build the Docker image
docker build -t minicar-control-app .

# Run the Docker container
docker run -p 19000:19000 -p 19001:19001 -p 19002:19002 minicar-control-app
```

## Project Structure

- `app/` - Main application code with file-based routing
- `components/` - Reusable UI components
- `constants/` - Configuration files
- `utils/` - Utility functions
- `contexts/` - React context providers
