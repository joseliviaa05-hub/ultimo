# 🚀 Guía de Deployment - Botsitot

---

## 📋 Pre-Deployment Checklist

```yaml
✅ Tests pasando (npm test)
✅ Variables de entorno configuradas
✅ Base de datos PostgreSQL lista
✅ Credenciales de OpenAI válidas
✅ . gitignore actualizado
✅ README completo
```

---

## 🖥️ Deployment Local (Desarrollo)

### 1. Preparar Entorno

```bash
# Instalar dependencias
npm install

# Configurar . env
cp .env.example . env
nano .env  # Editar con tus valores
```

### 2. Base de Datos

```bash
# Ejecutar migraciones
npm run migrate

# Cargar datos de prueba
npm run seed
```

### 3. Iniciar Bot

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

---

## ☁️ Deployment en VPS (Ubuntu)

### 1. Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource. com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2
```

### 2. Configurar PostgreSQL

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE botsitot;
CREATE USER botsitot_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE botsitot TO botsitot_user;
\q
```

### 3. Clonar Proyecto

```bash
# Crear directorio
mkdir -p /var/www
cd /var/www

# Clonar repositorio
git clone https://github. com/tu-usuario/botsitot.git
cd botsitot

# Instalar dependencias
npm install --production
```

### 4.  Configurar Variables

```bash
# Crear . env
nano .env
```

```env
DATABASE_URL="postgresql://botsitot_user:tu_password_seguro@localhost:5432/botsitot"
OPENAI_API_KEY="sk-tu-api-key"
NODE_ENV="production"
BUSINESS_NAME="Tu Negocio"
DELIVERY_COST=500
```

### 5. Migrar Base de Datos

```bash
npm run migrate
```

### 6. Iniciar con PM2

```bash
# Iniciar bot
pm2 start src/app.js --name botsitot

# Guardar configuración
pm2 save

# Auto-inicio en reboot
pm2 startup
```

### 7. Comandos PM2 Útiles

```bash
# Ver logs
pm2 logs botsitot

# Reiniciar
pm2 restart botsitot

# Detener
pm2 stop botsitot

# Estado
pm2 status
```

---

## 🐳 Deployment con Docker

### 1. Crear Dockerfile

**Crear:** `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
```

### 2.  Crear docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: botsitot
      POSTGRES_USER: botsitot_user
      POSTGRES_PASSWORD: tu_password_seguro
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  bot:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://botsitot_user:tu_password_seguro@db:5432/botsitot
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      NODE_ENV: production
    volumes:
      - ./whatsapp-session:/app/whatsapp-session
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. Ejecutar

```bash
# Construir e iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f bot

# Detener
docker-compose down
```

---

## 🔒 Seguridad

### 1. Variables de Entorno

```bash
# NO commitear . env
echo ". env" >> .gitignore

# Usar secretos en producción
# - Railway: Variables de entorno
# - Heroku: Config Vars
# - VPS: Archivos con permisos restringidos
```

### 2. PostgreSQL

```bash
# Cambiar password por defecto
ALTER USER postgres WITH PASSWORD 'password_seguro';

# Restringir acceso remoto
sudo nano /etc/postgresql/14/main/pg_hba. conf
```

### 3.  Firewall

```bash
# Permitir solo SSH y puerto necesario
sudo ufw allow 22
sudo ufw allow 3000
sudo ufw enable
```

---

## 📊 Monitoreo

### 1. PM2 Monitoring

```bash
# Dashboard web
pm2 plus

# Logs en tiempo real
pm2 logs botsitot --lines 100
```

### 2. Logs del Sistema

```bash
# Ver logs
tail -f /var/log/botsitot.log

# Rotar logs
sudo logrotate /etc/logrotate.d/botsitot
```

---

## 🔄 Actualización

```bash
# En el servidor
cd /var/www/botsitot

# Pull cambios
git pull origin main

# Instalar nuevas dependencias
npm install

# Ejecutar migraciones
npm run migrate

# Reiniciar
pm2 restart botsitot
```

---

## 🆘 Troubleshooting

### Bot no inicia

```bash
# Verificar logs
pm2 logs botsitot

# Verificar permisos
ls -la whatsapp-session/

# Verificar DB
psql -U botsitot_user -d botsitot -c "SELECT 1;"
```

### Problemas con WhatsApp

```bash
# Limpiar sesión
rm -rf whatsapp-session/
rm -rf .wwebjs_*

# Reiniciar bot
pm2 restart botsitot
```

### Alta carga de CPU

```bash
# Verificar procesos
pm2 monit

# Limitar memoria
pm2 start src/app.js --max-memory-restart 500M
```

---

## 📞 Soporte

Si tenés problemas:
- Revisar logs: `pm2 logs`
- Abrir issue en GitHub
- Contactar: soporte@tudominio.com

---

**Deployment exitoso = Bot 24/7 funcionando** ✅