// ═══════════════════════════════════════════════════════════════
// TIPOS COMPARTIDOS - BOTSITOT
// ═══════════════════════════════════════════════════════════════

export interface Cliente {
  telefono: string;
  nombre?: string;
  email?: string;
  direccion?: string;
  fechaRegistro: Date;
  totalCompras: number;
  ultimoPedido?: Date;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion?: string;
  stock?: number;
  imagen?: string;
}

export interface Pedido {
  id: string;
  clienteTelefono: string;
  productos: Array<{
    productoId: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  total: number;
  estado: 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';
  fechaCreacion: Date;
  fechaActualizacion: Date;
  notas?: string;
}

export interface Carrito {
  clienteTelefono: string;
  productos: Array<{
    productoId: string;
    cantidad: number;
  }>;
  ultimaActualizacion: Date;
}

export interface ConfigNegocio {
  nombre: string;
  telefono: string;
  email: string;
  direccion?: string;
  horario?: string;
  mensajeBienvenida?: string;
}

export interface WhatsAppMessage {
  from: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  mediaUrl?: string;
}

export interface EnvConfig {
  NODE_ENV: 'development' | 'production';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  NUMERO_DUENO: string;
  SESSION_PATH: string;
  CACHE_PATH: string;
  DATA_DIR: string;
  LOGS_DIR: string;
  BACKUP_DIR: string;
  WHATSAPP_WHITELIST: string[];
}
