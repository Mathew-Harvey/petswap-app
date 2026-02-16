FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install

# Copy client and build it
COPY client/ ./client/
WORKDIR /app/client
RUN npm install && npm run build

# Copy server
WORKDIR /app
COPY server/ ./server/
WORKDIR /app/server
RUN npm install && npx prisma generate

# Expose port
EXPOSE 10000

# Start server
CMD ["npm", "start"]
