FROM node:20-alpine

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Build client
COPY client/ ./client/
WORKDIR /app/client
RUN npm install && npm run build

# Install server dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

# Generate Prisma client
COPY server/prisma ./prisma/
RUN npx prisma generate

# Copy server source
COPY server/src/ ./src/

# Expose port
EXPOSE 10000

# Set production mode
ENV NODE_ENV=production

# Start server (Prisma db push runs on start to ensure schema is up to date)
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
