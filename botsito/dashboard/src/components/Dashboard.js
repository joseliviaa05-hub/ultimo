import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEstadisticas();
    const interval = setInterval(cargarEstadisticas, 5000);
    return () => clearInterval(interval);
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/estadisticas');
      console.log('📊 Estadísticas recibidas:', res.data);
      
      // ✅ CORRECCIÓN: Extraer datos de res.data.estadisticas
      const estadisticas = res.data.estadisticas || res.data;
      
      // Formatear pedidos_por_dia con fechas legibles
      const pedidosPorDia = (estadisticas.pedidos_por_dia || []).map(dia => ({
        fecha: new Date(dia.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        ventas: dia.ventas || 0,
        pedidos: dia.pedidos || 0
      }));
      
      const datosFinales = {
        total_clientes: estadisticas.total_clientes || 0,
        total_pedidos: estadisticas.total_pedidos || 0,
        total_vendido: estadisticas.total_vendido || 0,
        pedidos_por_dia: pedidosPorDia,
        ultimo_pedido: estadisticas.ultimo_pedido || null
      };
      
      console.log('📊 Datos procesados:', datosFinales);
      setStats(datosFinales);
      setError(null);
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
      setError(error.message);
    }
  };

  // Función helper para formatear números
  const formatearNumero = (numero) => {
    if (numero === null || numero === undefined || isNaN(numero)) return '0';
    return numero.toLocaleString('es-AR');
  };

  // Función helper para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // Estado de error
  if (error) {
    return (
      <div className="dashboard">
        <div className="error-mensaje">
          ❌ Error al cargar estadísticas: {error}
          <br />
          <button onClick={cargarEstadisticas}>🔄 Reintentar</button>
        </div>
      </div>
    );
  }

  // Estado de carga
  if (!stats) {
    return (
      <div className="dashboard">
        <div className="cargando">
          <div className="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>📊 Estadísticas Generales</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icono">👥</div>
          <div className="stat-info">
            <div className="stat-numero">{formatearNumero(stats.total_clientes)}</div>
            <div className="stat-label">Clientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icono">📦</div>
          <div className="stat-info">
            <div className="stat-numero">{formatearNumero(stats.total_pedidos)}</div>
            <div className="stat-label">Pedidos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icono">💰</div>
          <div className="stat-info">
            <div className="stat-numero">${formatearNumero(stats.total_vendido)}</div>
            <div className="stat-label">Ventas Totales</div>
          </div>
        </div>
      </div>

      {/* Gráfico de ventas */}
      {stats.pedidos_por_dia && stats.pedidos_por_dia.length > 0 ? (
        <div className="grafico-container">
          <h3>📈 Ventas de los últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.pedidos_por_dia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ventas" stroke="#25D366" name="Ventas ($)" strokeWidth={2} />
              <Line type="monotone" dataKey="pedidos" stroke="#8884d8" name="Pedidos" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grafico-container">
          <h3>📈 Ventas de los últimos 7 días</h3>
          <div className="sin-datos">
            📭 No hay datos de ventas disponibles
          </div>
        </div>
      )}

      {/* Último pedido */}
      {stats.ultimo_pedido ? (
        <div className="ultimo-pedido">
          <h3>🔔 Último Pedido</h3>
          <p>
            <strong>#{stats.ultimo_pedido.id}</strong> - {stats.ultimo_pedido.nombre || 'Sin nombre'}
          </p>
          <p>
            💰 ${formatearNumero(stats.ultimo_pedido.total)} | 
            📅 {formatearFecha(stats.ultimo_pedido.fecha)} |
            {stats.ultimo_pedido.tipo_entrega === 'delivery' ? ' 🚚 Delivery' : ' 🏪 Retiro'}
          </p>
          {stats.ultimo_pedido.productos && stats.ultimo_pedido.productos.length > 0 && (
            <div style={{marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '5px'}}>
              <strong>Productos:</strong>
              <ul style={{margin: '5px 0', paddingLeft: '20px'}}>
                {stats.ultimo_pedido.productos.map((prod, idx) => (
                  <li key={idx}>
                    {prod.nombre} x{prod.cantidad} - ${formatearNumero(prod.subtotal)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="ultimo-pedido">
          <h3>🔔 Último Pedido</h3>
          <div className="sin-datos">
            📭 Aún no hay pedidos registrados
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;