FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy server package files and prisma schema
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install && npx prisma generate

# Copy server source
COPY server/src ./src

# Expose port
EXPOSE 10000

# Set production mode
ENV NODE_ENV=production

# Start server (run db push first to create new tables)
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
