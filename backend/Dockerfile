# ==============================================================================
# ATMORA BACKEND - DOCKERFILE OPTIMIZADO
# ==============================================================================

# Usar una imagen base ligera de Node.js
FROM node:20-alpine

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias del proyecto (incluyendo devDependencies para compilar/desarrollo)
RUN pnpm install --frozen-lockfile

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto en el que corre Express (3000 por defecto)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
