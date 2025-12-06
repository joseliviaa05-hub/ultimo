import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPedidos();
    const interval = setInterval(cargarPedidos, 5000);
    return () => clearInterval(interval);
  }, []);

  const cargarPedidos = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/pedidos');
      console.log('Pedidos recibidos:', res.data);
      
      // ✅ FIX: Verificar si res.data tiene la propiedad 'pedidos'
      if (res.data.pedidos && Array.isArray(res.data.pedidos)) {
        setPedidos(res.data.pedidos.reverse());
      } else if (Array.isArray(res.data)) {
        setPedidos(res.data.reverse());
      } else {
        console.error('Formato de datos inválido:', res.data);
        setPedidos([]);
      }
      setError(null);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      setError(error.message);
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtro === 'todos') return true;
    return p.tipo_entrega === filtro;
  });

  const contactarCliente = (telefono) => {
    const tel = telefono.replace('@c.us', '');
    window.open(`https://wa.me/${tel}`, '_blank');
  };

  if (error) {
    return (
      <div className="pedidos">
        <div className="error-mensaje">
          ❌ Error al cargar pedidos: {error}
          <br />
          <button onClick={cargarPedidos}>🔄 Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos">
      <div className="pedidos-header">
        <h2>📦 Pedidos ({pedidosFiltrados.length})</h2>
        <div className="filtros">
          <button 
            className={filtro === 'todos' ? 'activo' : ''}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
          <button 
            className={filtro === 'retiro' ? 'activo' : ''}
            onClick={() => setFiltro('retiro')}
          >
            Retiro
          </button>
          <button 
            className={filtro === 'delivery' ? 'activo' : ''}
            onClick={() => setFiltro('delivery')}
          >
            Delivery
          </button>
        </div>
      </div>

      <div className="pedidos-lista">
        {pedidosFiltrados.length === 0 ? (
          <div className="sin-datos">No hay pedidos para mostrar</div>
        ) : (
          pedidosFiltrados.map(pedido => (
            <div key={pedido.id} className="pedido-card">
              <div className="pedido-header-card">
                <h3>{pedido.id}</h3>
                <span className={`badge ${pedido.tipo_entrega}`}>
                  {pedido.tipo_entrega === 'delivery' ? '🚚 Delivery' : '🏪 Retiro'}
                </span>
              </div>

              <div className="pedido-info">
                <p><strong>👤 Cliente:</strong> {pedido.nombre}</p>
                <p><strong>📅 Fecha:</strong> {new Date(pedido.fecha).toLocaleString('es-AR')}</p>
                <p><strong>💰 Total:</strong> ${pedido.total?.toLocaleString('es-AR') || 0}</p>
              </div>

              <div className="pedido-productos">
                <strong>📦 Productos:</strong>
                <ul>
                  {pedido.productos?.map((prod, idx) => (
                    <li key={idx}>
                      {prod.nombre} x{prod.cantidad} - ${prod.subtotal}
                    </li>
                  )) || <li>Sin productos</li>}
                </ul>
              </div>

              <div className="pedido-acciones">
                <button 
                  className="btn-contactar"
                  onClick={() => contactarCliente(pedido.cliente)}
                >
                  💬 Contactar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Pedidos;