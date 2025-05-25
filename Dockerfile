FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    watchman \
    && rm -rf /var/lib/apt/lists/*

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port 19000 (Expo), 19001 (Metro), 19002 (Expo web interface)
EXPOSE 19000 19001 19002

# Start the Expo development server
CMD ["npm", "start"]