FROM node:20-alpine

# Install libc6-compat for compatibility on Alpine Linux
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency configs
COPY package*.json ./
COPY prisma ./prisma/

# Clean install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000
ENV PORT=3000

# Push database schema, build Next.js with active connection, and start in production
CMD ["sh", "-c", "npx prisma db push && npm run build && npm run start"]
