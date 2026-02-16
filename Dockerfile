FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy server app
COPY server/ .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 10000

# Start server
CMD ["npm", "start"]
