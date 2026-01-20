FROM node:20-slim

WORKDIR /app

# Install system dependencies
# Using Debian slim for better Playwright compatibility
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    cron \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Install build/start tools globally
RUN npm install -g tsx cross-env

# Setup Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies in the virtual environment
RUN pip install --upgrade pip && \
    pip install playwright psycopg2-binary python-dotenv

# Install Playwright chromium browser
RUN npx playwright install --with-deps chromium

COPY . .

# Setup entrypoint and cron job
COPY cron_update_atas /etc/cron.d/cron_update_atas
RUN chmod 0644 /etc/cron.d/cron_update_atas && \
    crontab /etc/cron.d/cron_update_atas && \
    touch /var/log/cron_update_atas.log

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose the internal port
EXPOSE 5000

# Use entrypoint script to start cron and the app
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]