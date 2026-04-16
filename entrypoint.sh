#!/bin/bash

# Export environment variables for cron
# Cron runs in a clean environment, so we need Docker's env vars
printenv | grep -v "no_proxy" >> /etc/environment

# Also write env vars in a sourceable format for the cron job
printenv | grep -E "^(DB_|DATABASE_|GCE_|HEADLESS|PYTHONUNBUFFERED|NODE_ENV|PORT|SESSION_SECRET|SECRET_KEY|LDAP_|USERS_|GLPI_|PATH)" | sed 's/^\(.*\)$/export \1/' > /app/.env.cron

# Start cron service
service cron start

# Verify cron is running
if service cron status > /dev/null 2>&1; then
    echo "✅ Cron service started successfully"
    echo "Cron jobs:"
    crontab -l
else
    echo "❌ ERROR: Cron service failed to start"
fi

# If a command is passed as argument, execute it. Otherwise, start the application.
if [ $# -gt 0 ]; then
    echo "Executando comando customizado: $@"
    exec "$@"
else
    echo "Iniciando a aplicação..."
    exec npm run dev
fi
