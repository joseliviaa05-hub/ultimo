// src/config/api.config.js
import Constants from 'expo-constants';

// ✅ USAR VARIABLE DE ENTORNO O FALLBACK
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
                     process.env.EXPO_PUBLIC_API_URL || 
                     'http://192.168.0.72:3000'; // ← Cambia esta IP

console.log('🔗 API conectada a:', API_BASE_URL);

// URLs completas
export const API_URLS = {
  // Base
  base: API_BASE_URL,
  api: `${API_BASE_URL}/api`,
  
  // Productos
  productos: `${API_BASE_URL}/api/productos`,
  productosImagen: `${API_BASE_URL}/api/productos/imagen`,
  
  // Pedidos
  pedidos: `${API_BASE_URL}/api/pedidos`,
  
  // Clientes
  clientes: `${API_BASE_URL}/api/clientes`,
  
  // Estadísticas
  estadisticas: `${API_BASE_URL}/api/estadisticas`,
  
  // Configuración
  config: `${API_BASE_URL}/api/config`,
  
  // Descuentos
  descuentos: `${API_BASE_URL}/api/descuentos`,
  
  // Bot
  bot: `${API_BASE_URL}/api/bot`,
  
  // Respuestas
  respuestas: `${API_BASE_URL}/api/respuestas`,
};

export { API_BASE_URL };
export default API_URLS;