# Etapa 1: Construcción (Build)
# Usar node:18-alpine en lugar de slim para tener soporte nativo de compilación
FROM node:18-alpine AS builder

# Instalar dependencias del sistema necesarias para bindings nativos (tailwindcss/oxide)
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Limpiar caché e instalar desde cero para compilar bindings nativos en Linux
RUN npm cache clean --force && npm install

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
