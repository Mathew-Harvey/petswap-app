FROM node:20-alpine

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Generate Prisma client
COPY server/prisma/ ./prisma/
RUN npx prisma generate

# Copy server source
COPY server/src/ ./src/

# Expose port
EXPOSE 10000

# Set production mode
ENV NODE_ENV=production

# Start server
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
