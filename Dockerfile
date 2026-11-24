FROM node:20-slim

# git: Baileys pulls a dependency from GitHub, so npm needs it
# ffmpeg: needed for animated stickers
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
CMD ["npm", "start"]
