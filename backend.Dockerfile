FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV MONGOMS_DISABLE_POSTINSTALL=1
ENV NODE_OPTIONS="--max_old_space_size=1024"
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Ensure we run as non-root for security
USER node

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "--max-old-space-size=1024", "server.js"]
