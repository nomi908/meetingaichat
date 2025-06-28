# Base image
FROM node:18-slim

# Install ffmpeg, python3, pip and clean cache
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create alias 'python' for 'python3'
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy package files and install node dependencies
COPY package*.json ./
RUN npm install

# Copy requirements.txt and install python dependencies if file exists
COPY requirements.txt ./
RUN if [ -f requirements.txt ]; then pip3 install --break-system-packages -r requirements.txt && rm -rf ~/.cache/pip; fi

# Copy all other source code
COPY . .

# Expose backend port
EXPOSE 10000

# Start the node server
CMD ["node", "index.js"]
