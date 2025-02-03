# Dockerfile
FROM node:18-slim

# Prevent apt from showing dialogs
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies including Python and browser dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    # Browser dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    # Useful utilities
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# First, build Eko
COPY eko /app/eko
WORKDIR /app/eko
RUN yarn install
RUN yarn build
RUN yarn link

# Set up task runner
WORKDIR /app/task-runner
COPY package.json yarn.lock ./

# Link to local Eko and install other dependencies
RUN yarn link @eko-ai/eko
RUN yarn install

# Install Playwright
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# Copy source code and run script
COPY main.ts run.sh ./
RUN chmod +x run.sh

# Create results directory with proper permissions
RUN mkdir -p /app/results /app/results/screenshots && \
    chmod 777 /app/results /app/results/screenshots

# Set default environment variables
ENV NODE_ENV=production \
    RESULTS_DIR=/app/results

# Use the run script
CMD ["./run.sh"]
