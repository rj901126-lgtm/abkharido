FROM node:20-alpine

WORKDIR /app

# Install native dependencies required for some Node modules like bcrypt
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure we run as non-root for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backenduser
USER backenduser

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "--max-old-space-size=4096", "server.js"]
