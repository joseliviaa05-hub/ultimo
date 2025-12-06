# 🤖 Botsitot - Bot de WhatsApp con IA

Bot inteligente de WhatsApp para gestión automatizada de pedidos usando ChatGPT.

## ✨ Características

- 🤖 **IA Conversacional**: Procesamiento de pedidos con ChatGPT
- 📦 **Gestión de Productos**: Catálogo completo con categorías
- 🛒 **Carrito Inteligente**: Reconocimiento de productos por texto
- 💰 **Cálculos Automáticos**: Subtotales, descuentos y delivery
- 👤 **Gestión de Clientes**: Historial y estadísticas
- 📊 **Dashboard Admin**: Panel de administración (próximamente)
- ✅ **100% Testeado**: 57 tests unitarios

---

## 🚀 Inicio Rápido

### Requisitos Previos

```bash
Node.js >= 18.0. 0
PostgreSQL >= 14.0
npm o yarn
```

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github. com/tu-usuario/botsitot. git
cd botsitot

# 2. Instalar dependencias
npm install

# 3.  Configurar variables de entorno
cp .env.example .env
# Editar . env con tus credenciales

# 4.  Configurar base de datos
npm run migrate

# 5. Cargar datos iniciales (opcional)
npm run seed

# 6. Iniciar bot
npm start
```

---

## 📁 Estructura del Proyecto

```
botsitot/
├── src/
│   ├── __tests__/          # Tests unitarios e integración
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── helpers/
│   ├── services/           # Lógica de negocio
│   │   ├── cliente. service.ts
│   │   ├── producto.service.ts
│   │   ├── pedido.service.ts
│   │   └── prisma.service.ts
│   ├── utils/              # Utilidades
│   │   └── textHelpers.ts
│   ├── flows/              # Flujos de conversación
│   └── app.js              # Punto de entrada
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   ├── migrations/         # Migraciones
│   └── seed.js             # Datos iniciales
├── jest.config.js          # Configuración de tests
├── tsconfig.json           # Configuración TypeScript
├── package.json
└── README.md
```

---

## 🗄️ Base de Datos

### Modelos Principales

- **Cliente**: Gestión de clientes de WhatsApp
- **Producto**: Catálogo de productos con categorías
- **Pedido**: Pedidos con items, totales y estados
- **Usuario**: Usuarios del sistema admin

### Migraciones

```bash
# Crear nueva migración
npm run migrate

# Ver base de datos
npm run studio
```

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Cobertura Actual

```
Statements   : 75%
Branches     : 70%
Functions    : 80%
Lines        : 75%
```

---

## 📦 Scripts Disponibles

```json
{
  "start": "node src/app.js",
  "dev": "nodemon src/app.js",
  "test": "jest --runInBand",
  "test:watch": "jest --watch --runInBand",
  "test:coverage": "jest --coverage --runInBand",
  "migrate": "prisma migrate dev",
  "studio": "prisma studio",
  "seed": "node prisma/seed. js"
}
```

---

## ⚙️ Configuración

### Variables de Entorno

Copiar `. env.example` a `.env` y configurar:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
BUSINESS_NAME="Tu Negocio"
DELIVERY_COST=500
```

### Configuración de WhatsApp

Al iniciar por primera vez, escanear el código QR con WhatsApp:

```bash
npm start
# Escanear QR que aparece en la terminal
```

---

## 🏗️ Arquitectura

```
┌─────────────┐
│  WhatsApp   │
└──────┬──────┘
       │
┌──────▼──────┐
│   Bot Core  │
└──────┬──────┘
       │
┌──────▼──────┐     ┌──────────┐
│   ChatGPT   │────▶│ Parsear  │
└─────────────┘     └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ Services │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │   DB     │
                    └──────────┘
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3.  Commit cambios (`git commit -m 'Add: amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5.  Abrir Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👤 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu@email.com

---

## 🙏 Agradecimientos

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [OpenAI](https://openai. com/)
- [Prisma](https://www.prisma.io/)

---

## 📞 Soporte

Si tenés problemas o preguntas:
- Abrí un [Issue](https://github.com/tu-usuario/botsitot/issues)
- Contactá por email: soporte@tudominio.com

---

**Hecho con ❤️ en Argentina 🇦🇷**