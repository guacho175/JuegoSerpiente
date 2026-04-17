# Etapa 1: Construcción (Build)
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Instalar dependencias (usamos npm ci si existe package-lock, sino npm install)
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Compilar la aplicación React para producción
RUN npm run build

# Etapa 2: Servidor (Nginx)
FROM nginx:stable-alpine

# Copiar la configuración personalizada de Nginx
COPY default.conf /etc/nginx/conf.d/default.conf

# Limpiar los archivos por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar los assets compilados desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Indicar el puerto de Cloud Run
EXPOSE 8080

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
