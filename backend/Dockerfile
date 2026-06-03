# Usar una imagen ligera de Node.js
FROM node:20-alpine

# Crear el directorio de trabajo
WORKDIR /app

# Copiar solo los archivos de configuración de dependencias primero
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm globalmente y luego instalar las dependencias del proyecto
RUN npm install -g pnpm && pnpm install

# Copiar el resto de los archivos de la carpeta backend
COPY . .

# Exponer el puerto que usará tu API (asegúrate de que en tu server.js uses process.env.PORT || 3000)
EXPOSE 3000

# Comando para iniciar la API
CMD ["node", "server.js"]