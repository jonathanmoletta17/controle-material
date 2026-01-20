#!/bin/bash

# Exporta variáveis de ambiente para o cron
# O cron roda em um ambiente limpo, então precisamos das variáveis do Docker
printenv | grep -v "no_proxy" >> /etc/environment

# Inicia o serviço de cron
service cron start

# Se um comando for passado como argumento, executa ele. Caso contrário, inicia a aplicação.
if [ $# -gt 0 ]; then
    echo "Executando comando customizado: $@"
    exec "$@"
else
    echo "Iniciando a aplicação..."
    exec npm run dev
fi
