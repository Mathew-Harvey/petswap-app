FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy app
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 10000

# Start server
CMD ["npm", "start"]
