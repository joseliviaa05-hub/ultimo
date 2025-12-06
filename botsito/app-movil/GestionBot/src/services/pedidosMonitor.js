// src/services/pedidosMonitor.js
import { getPedidos } from './api';
import { notificarNuevoPedido } from '../utils/notifications';

let ultimoPedidoId = null;
let monitorInterval = null;
let estaMonitoreando = false;

// Iniciar monitoreo de nuevos pedidos
export function iniciarMonitoreo(intervaloSegundos = 30) {
  if (estaMonitoreando) {
    console.log('⚠️ El monitoreo ya está activo');
    return;
  }

  console.log(`🔔 Iniciando monitoreo de pedidos (cada ${intervaloSegundos}s)...`);
  estaMonitoreando = true;
  
  // Cargar el último pedido conocido
  cargarUltimoPedido();
  
  // Monitorear cada X segundos
  monitorInterval = setInterval(async () => {
    await verificarNuevosPedidos();
  }, intervaloSegundos * 1000);
}

// Detener monitoreo
export function detenerMonitoreo() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    estaMonitoreando = false;
    console.log('🔕 Monitoreo de pedidos detenido');
  }
}

// Obtener estado del monitoreo
export function estaActivo() {
  return estaMonitoreando;
}

// Cargar el último pedido conocido
async function cargarUltimoPedido() {
  try {
    const data = await getPedidos();
    
    console.log('📦 Datos de pedidos para monitor:', data);
    
    // ✅ FIX: Extraer array de pedidos correctamente
    let pedidosArray = [];
    
    if (data.pedidos && Array.isArray(data.pedidos)) {
      pedidosArray = data.pedidos;
    } else if (Array.isArray(data)) {
      pedidosArray = data;
    } else if (data.success && data.pedidos && Array.isArray(data.pedidos)) {
      pedidosArray = data.pedidos;
    } else {
      console.error('❌ Formato de datos inválido:', data);
      pedidosArray = [];
    }
    
    if (pedidosArray.length > 0) {
      // Ordenar por fecha más reciente
      const pedidosOrdenados = pedidosArray.sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );
      ultimoPedidoId = pedidosOrdenados[0].id;
      console.log(`📌 Último pedido conocido: ${ultimoPedidoId}`);
    } else {
      console.log('📭 No hay pedidos previos');
    }
  } catch (error) {
    console.error('❌ Error al cargar último pedido:', error);
  }
}

// Verificar si hay nuevos pedidos
async function verificarNuevosPedidos() {
  try {
    const data = await getPedidos();
    
    console.log('🔍 Verificando nuevos pedidos...');
    
    // ✅ FIX: Extraer array de pedidos correctamente
    let pedidosArray = [];
    
    if (data.pedidos && Array.isArray(data.pedidos)) {
      pedidosArray = data.pedidos;
    } else if (Array.isArray(data)) {
      pedidosArray = data;
    } else if (data.success && data.pedidos && Array.isArray(data.pedidos)) {
      pedidosArray = data.pedidos;
    } else {
      console.error('❌ Formato de datos inválido:', data);
      pedidosArray = [];
    }
    
    if (pedidosArray.length === 0) {
      console.log('📭 No hay pedidos en el sistema');
      return;
    }
    
    // Ordenar por fecha más reciente
    const pedidosOrdenados = pedidosArray.sort((a, b) => 
      new Date(b.fecha) - new Date(a.fecha)
    );
    
    const pedidoMasReciente = pedidosOrdenados[0];
    
    // Si hay un nuevo pedido
    if (ultimoPedidoId !== pedidoMasReciente.id) {
      console.log(`🆕 ¡Nuevo pedido detectado! ${pedidoMasReciente.id}`);
      console.log(`   Cliente: ${pedidoMasReciente.nombre}`);
      console.log(`   Total: $${pedidoMasReciente.total}`);
      
      // Enviar notificación
      await notificarNuevoPedido(pedidoMasReciente);
      
      ultimoPedidoId = pedidoMasReciente.id;
    } else {
      console.log(`✓ Sin cambios (último: ${ultimoPedidoId})`);
    }
  } catch (error) {
    console.error('❌ Error al verificar nuevos pedidos:', error);
  }
}

// Forzar verificación manual
export async function verificarAhora() {
  console.log('🔄 Verificación manual iniciada...');
  await verificarNuevosPedidos();
}

// Resetear último pedido (útil para pruebas)
export function resetearUltimoPedido() {
  ultimoPedidoId = null;
  console.log('🔄 Último pedido reseteado');
}