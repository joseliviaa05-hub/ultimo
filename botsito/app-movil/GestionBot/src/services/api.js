// src/services/api.js
import axios from 'axios';
import Constants from 'expo-constants';

// ═══════════════════════════════════════
// 🔥 CONFIGURACIÓN DE LA API
// ═══════════════════════════════════════

// ✅ USAR VARIABLE DE ENTORNO O FALLBACK
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
                     process.env.EXPO_PUBLIC_API_URL || 
                     'http://192.168.0.72:3000'; // ← Cambia esta IP

console.log('🔗 API conectada a:', API_BASE_URL);

const API_URL = `${API_BASE_URL}/api`;

// URLs específicas
export const API_URLS = {
  base: API_BASE_URL,
  api: API_URL,
  productosImagen: `${API_BASE_URL}/api/productos/imagen`,
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ═══════════════════════════════════════
// 🔧 UTILIDADES AUXILIARES
// ═══════════════════════════════════════

export const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
};

export const formatearTexto = (texto) => {
  if (!texto) return '';
  
  return texto
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export const parsearIdProducto = (id) => {
  if (!id) return null;
  
  const partes = id.split('::');
  
  if (partes.length < 3) {
    console.warn('ID de producto inválido:', id);
    return null;
  }

  return {
    categoria: partes[0],
    subcategoria: partes[1],
    nombre: partes.slice(2).join('::'),
  };
};

export const construirIdProducto = (categoria, subcategoria, nombre) => {
  return `${categoria}::${subcategoria}::${nombre}`;
};

// ═══════════════════════════════════════
// 📊 ESTADÍSTICAS
// ═══════════════════════════════════════

export const getEstadisticas = async () => {
  try {
    const response = await api.get('/estadisticas');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 📦 PEDIDOS
// ═══════════════════════════════════════

export const getPedidos = async () => {
  try {
    const response = await api.get('/pedidos');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error.response?.data || error.message);
    throw error;
  }
};

export const getPedido = async (id) => {
  try {
    const response = await api.get(`/pedidos/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener pedido:', error.response?.data || error.message);
    throw error;
  }
};

export const marcarPedidoCompletado = async (id) => {
  try {
    const response = await api.put(`/pedidos/${id}`, {
      estado: 'completado'
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar pedido:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 🏷️ PRODUCTOS
// ═══════════════════════════════════════

export const getProductos = async () => {
  try {
    const response = await api.get('/productos');
    console.log(`✅ ${response.data.length} productos cargados`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener productos:', error.response?.data || error.message);
    throw error;
  }
};

export const getCategorias = async () => {
  try {
    const response = await api.get('/categorias');
    console.log(`✅ ${response.data.length} categorías cargadas`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error.response?.data || error.message);
    throw error;
  }
};

export const buscarProductoPorCodigo = async (codigo) => {
  try {
    console.log('🔍 Buscando producto por código:', codigo);
    const response = await api.get(`/productos/buscar-codigo/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al buscar por código:', error.response?.data || error.message);
    throw error;
  }
};

export const crearProducto = async (producto) => {
  try {
    if (!producto.categoria || producto.categoria.trim() === '') {
      throw new Error('La categoría es obligatoria');
    }

    if (!producto.subcategoria || producto.subcategoria.trim() === '') {
      throw new Error('La subcategoría es obligatoria');
    }

    if (!producto.nombre || producto.nombre.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }

    if (!producto.precio && !producto.precio_desde) {
      throw new Error('Debes ingresar un precio (fijo o "desde")');
    }

    if (producto.precio && producto.precio_desde) {
      throw new Error('Solo puedes usar precio fijo O precio desde, no ambos');
    }

    const datos = {
      ...producto,
      precio: producto.precio ? parseFloat(producto.precio) : undefined,
      precio_desde: producto.precio_desde ? parseFloat(producto.precio_desde) : undefined,
      stock: producto.stock !== undefined ? producto.stock : true,
      codigo_barras: producto.codigo_barras ? producto.codigo_barras.trim() : undefined,
    };

    console.log('📤 Creando producto:', datos);

    const response = await api.post('/productos', datos);
    
    console.log('✅ Producto creado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear producto:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarProducto = async (id, datosActualizados) => {
  try {
    console.log(`📝 Actualizando producto ${id}:`, datosActualizados);
    
    if (datosActualizados.precio && datosActualizados.precio_desde) {
      throw new Error('Solo puedes usar precio fijo O precio desde, no ambos');
    }

    const datos = {};

    // ✅ CORREGIDO: Enviar "nombre" directamente (el backend lo maneja)
    if (datosActualizados.nombre !== undefined) {
      datos.nombre = datosActualizados.nombre;
    }

    // ✅ CATEGORÍA (para mover)
    if (datosActualizados.categoria !== undefined) {
      datos.categoria = datosActualizados.categoria;
    }

    // ✅ SUBCATEGORÍA (para mover)
    if (datosActualizados.subcategoria !== undefined) {
      datos.subcategoria = datosActualizados.subcategoria;
    }

    if (datosActualizados.precio !== undefined) {
      datos.precio = parseFloat(datosActualizados.precio);
    }

    if (datosActualizados.precio_desde !== undefined) {
      datos.precio_desde = parseFloat(datosActualizados.precio_desde);
    }

    if (datosActualizados.unidad !== undefined) {
      datos.unidad = datosActualizados.unidad;
    }

    if (datosActualizados.stock !== undefined) {
      datos.stock = datosActualizados.stock;
    }

    if (datosActualizados.codigo_barras !== undefined) {
      datos.codigo_barras = datosActualizados.codigo_barras ? datosActualizados.codigo_barras.trim() : null;
    }

    // ✅ Guardar imágenes
    if (datosActualizados.imagenes !== undefined) {
      datos.imagenes = datosActualizados.imagenes;
    }

    const response = await api.put(`/productos/${id}`, datos);
    
    console.log('✅ Producto actualizado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error.response?.data || error.message);
    throw error;
  }
};

export const eliminarProducto = async (id) => {
  try {
    console.log('🗑️ Eliminando producto:', id);
    
    const response = await api.delete(`/productos/${id}`);
    
    console.log('✅ Producto eliminado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 🖼️ IMÁGENES
// ═══════════════════════════════════════

export const eliminarImagenProducto = async (productoId, categoriaId, subcategoriaId, publicId) => {
  try {
    console.log('🗑️ Eliminando imagen:', { productoId, categoriaId, subcategoriaId, publicId });
    
    const response = await api.delete('/productos/imagen', {
      data: {
        productoId,
        categoriaId,
        subcategoriaId,
        publicId
      }
    });
    
    console.log('✅ Imagen eliminada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar imagen:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 📁 CATEGORÍAS
// ═══════════════════════════════════════

export const crearCategoria = async (nombre, subcategoria) => {
  try {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la categoría es obligatorio');
    }

    if (!subcategoria || subcategoria.trim() === '') {
      throw new Error('La subcategoría es obligatoria');
    }

    console.log('📤 Creando categoría:', nombre, 'con subcategoría:', subcategoria);

    const response = await api.post('/categorias', {
      nombre: nombre.trim(),
      subcategoria: subcategoria.trim(),
    });
    
    console.log('✅ Categoría creada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al crear categoría:', error.response?.data || error.message);
    throw error;
  }
};

export const editarNombreCategoria = async (nombreActual, nuevoNombre) => {
  try {
    if (!nuevoNombre || nuevoNombre.trim() === '') {
      throw new Error('El nuevo nombre no puede estar vacío');
    }

    console.log('✏️ Renombrando categoría:', nombreActual, '→', nuevoNombre);

    const response = await api.put(`/categorias/${nombreActual}`, {
      nuevoNombre: nuevoNombre.trim(),
    });
    
    console.log('✅ Categoría renombrada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al renombrar categoría:', error.response?.data || error.message);
    throw error;
  }
};

export const eliminarCategoria = async (nombre) => {
  try {
    console.log('🗑️ Eliminando categoría:', nombre);
    
    const response = await api.delete(`/categorias/${nombre}`);
    
    console.log('✅ Categoría eliminada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al eliminar categoría:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 👥 CLIENTES
// ═══════════════════════════════════════

export const getClientes = async () => {
  try {
    const response = await api.get('/clientes');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error.response?.data || error.message);
    throw error;
  }
};

export const getCliente = async (telefono) => {
  try {
    const response = await api.get(`/clientes/${telefono}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener cliente:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// ⚙️ CONFIGURACIÓN
// ═══════════════════════════════════════

export const getConfiguracion = async () => {
  try {
    const response = await api.get('/configuracion');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener configuración:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarConfiguracion = async (datos) => {
  try {
    console.log('📤 Actualizando configuración:', datos);
    
    const response = await api.put('/configuracion', datos);
    
    console.log('✅ Configuración actualizada exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar configuración:', error.response?.data || error.message);
    throw error;
  }
};

export const getConfiguracionPedidos = async () => {
  try {
    const response = await api.get('/configuracion/pedidos');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener configuración de pedidos:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarConfiguracionPedidos = async (datos) => {
  try {
    console.log('📤 Actualizando configuración de pedidos:', datos);
    
    const response = await api.put('/configuracion/pedidos', datos);
    
    console.log('✅ Configuración de pedidos actualizada');
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar configuración de pedidos:', error.response?.data || error.message);
    throw error;
  }
};

export const getPalabrasClave = async () => {
  try {
    const response = await api.get('/configuracion/palabras-clave');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener palabras clave:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarPalabrasClave = async (datos) => {
  try {
    const response = await api.put('/configuracion/palabras-clave', datos);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar palabras clave:', error.response?.data || error.message);
    throw error;
  }
};

export const getRespuestas = async () => {
  try {
    const response = await api.get('/respuestas');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener respuestas:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarRespuestas = async (datos) => {
  try {
    const response = await api.put('/respuestas', datos);
    return response.data;
  } catch (error) {
    console.error('❌ Error al actualizar respuestas:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 🤖 CONTROL DEL BOT
// ═══════════════════════════════════════

export const getEstadoBot = async () => {
  try {
    const response = await api.get('/estado');
    return response.data;
  } catch (error) {
    console.error('❌ Error al obtener estado del bot:', error.response?.data || error.message);
    throw error;
  }
};

export const toggleRespuestas = async () => {
  try {
    console.log('🔄 Cambiando estado de respuestas automáticas...');
    
    const response = await api.post('/toggle-respuestas');
    
    console.log('✅ Estado cambiado:', response.data.estado ? 'Activadas' : 'Pausadas');
    return response.data;
  } catch (error) {
    console.error('❌ Error al cambiar estado de respuestas:', error.response?.data || error.message);
    throw error;
  }
};

// ═══════════════════════════════════════
// 🔧 FUNCIONES AUXILIARES
// ═══════════════════════════════════════

export const validarProducto = (producto) => {
  const errores = [];

  if (!producto.categoria || producto.categoria.trim() === '') {
    errores.push('La categoría es obligatoria');
  }

  if (!producto.subcategoria || producto.subcategoria.trim() === '') {
    errores.push('La subcategoría es obligatoria');
  }

  if (!producto.nombre || producto.nombre.trim() === '') {
    errores.push('El nombre del producto es obligatorio');
  }

  if (!producto.precio && !producto.precio_desde) {
    errores.push('Debes ingresar un precio (fijo o "desde")');
  }

  if (producto.precio && producto.precio_desde) {
    errores.push('Solo puedes usar precio fijo O precio desde, no ambos');
  }

  if (producto.precio && (isNaN(producto.precio) || producto.precio <= 0)) {
    errores.push('El precio debe ser un número mayor a 0');
  }

  if (producto.precio_desde && (isNaN(producto.precio_desde) || producto.precio_desde <= 0)) {
    errores.push('El precio desde debe ser un número mayor a 0');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};

export const formatearPrecio = (precio, unidad = '') => {
  if (!precio && precio !== 0) return '';
  
  const precioFormateado = parseFloat(precio).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return unidad ? `$${precioFormateado} ${unidad}` : `$${precioFormateado}`;
};

export const formatearFecha = (isoString) => {
  if (!isoString) return '';
  
  const fecha = new Date(isoString);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const año = fecha.getFullYear();
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  
  return `${dia}/${mes}/${año} ${hora}:${minutos}`;
};

export default api;