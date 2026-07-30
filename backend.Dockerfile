FROM node:20-alpine

WORKDIR /app

# Install native dependencies required for some Node modules like bcrypt
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV MONGOMS_DISABLE_POSTINSTALL=1
ENV NODE_OPTIONS="--max_old_space_size=512"
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Ensure we run as non-root for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backenduser
USER backenduser

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "--max-old-space-size=4096", "server.js"]
