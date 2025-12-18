# Stage 1: Builder
# Usa uma imagem Node.js leve baseada em Alpine Linux para o build
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Instala dependências do sistema necessárias para compilação (se houver)
# python3 e make são comuns para rebuild de módulos nativos
RUN apk add --no-cache python3 make g++

# Copia os arquivos de configuração de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# Copia o código fonte do projeto
COPY . .

# Executa o script de build (gera a pasta dist/ com server e client)
RUN npm run build

# Stage 2: Runner
# Imagem final de produção, menor e mais segura
FROM node:20-alpine AS runner

WORKDIR /app

# Define ambiente de produção
ENV NODE_ENV=production

# Copia apenas os arquivos necessários do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Exposição da porta padrão da aplicação
EXPOSE 5000

# Usuário não-root para segurança
USER node

# Comando de inicialização
CMD ["npm", "run", "start"]
