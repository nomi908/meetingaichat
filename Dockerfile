# Base image - Node.js 18 slim version
FROM node:18-slim

# ffmpeg install karna (jo speech-to-text ke liye zaroori hai)
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

# App directory banayein aur wahan kaam karenge
WORKDIR /app

# Package files copy karo
COPY package*.json ./

# NPM dependencies install karo
RUN npm install

# Baaki app ka code copy karo
COPY . .

# Port expose karo (jo aapka backend use karta hai, maan ke 10000 hai)
EXPOSE 10000

# Server start command (aapka main file jaisa ho)
CMD ["node", "index.js"]
