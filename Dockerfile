FROM node:18-slim

# Install system dependencies for FlareSolverr and Chromium
# We include all common libraries required by headless Chrome
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    tar \
    xvfb \
    # FlareSolverr/Chromium dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1-0-0 \
    libcairo2 \
    libasound2 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    libappindicator3-1 \
    libv4l-0 \
    libu2f-udev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Enable productions optimizations
ENV NODE_ENV=production
ENV IN_DOCKER=true

# FlareSolverr environment variables for better Docker compatibility
ENV HEADLESS=true
ENV BROWSER_TIMEOUT=60000

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

EXPOSE 7000

# Start the addon directly
CMD ["node", "stremio_addon.js"]
