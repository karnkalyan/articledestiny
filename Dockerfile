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

# Build Next.js
RUN npm run build

EXPOSE 3400
ENV PORT=3400

# Push database schema, seed database, and start in production
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm run start"]
