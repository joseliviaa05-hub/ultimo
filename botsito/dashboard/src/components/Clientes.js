import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/clientes');
      console.log('Clientes recibidos:', res.data);
      
      // ✅ FIX: Verificar si res.data tiene la propiedad 'clientes'
      if (res.data.clientes && Array.isArray(res.data.clientes)) {
        setClientes(res.data.clientes.sort((a, b) => b.total_pedidos - a.total_pedidos));
      } else if (Array.isArray(res.data)) {
        setClientes(res.data.sort((a, b) => b.total_pedidos - a.total_pedidos));
      } else {
        console.error('Formato de datos inválido:', res.data);
        setClientes([]);
      }
      setError(null);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError(error.message);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  );

  const contactarCliente = (telefono) => {
    const tel = telefono.replace('@c.us', '');
    window.open(`https://wa.me/${tel}`, '_blank');
  };

  if (error) {
    return (
      <div className="clientes">
        <div className="error-mensaje">
          ❌ Error al cargar clientes: {error}
          <br />
          <button onClick={cargarClientes}>🔄 Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="clientes">
      <div className="clientes-header">
        <h2>👥 Clientes ({clientesFiltrados.length})</h2>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="busqueda"
        />
      </div>

      <div className="clientes-grid">
        {clientesFiltrados.length === 0 ? (
          <div className="sin-datos">No hay clientes para mostrar</div>
        ) : (
          clientesFiltrados.map(cliente => (
            <div key={cliente.telefono} className="cliente-card">
              <div className="cliente-avatar">
                {cliente.nombre?.charAt(0).toUpperCase() || '?'}
              </div>
              
              <div className="cliente-info">
                <h3>{cliente.nombre || 'Sin nombre'}</h3>
                <p className="telefono">{cliente.telefono?.replace('@c.us', '') || 'Sin teléfono'}</p>
                
                <div className="cliente-stats">
                  <div className="stat-item">
                    <span className="stat-label">📦 Pedidos:</span>
                    <span className="stat-value">{cliente.total_pedidos || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">💰 Total:</span>
                    <span className="stat-value">${(cliente.total_gastado || 0).toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <p className="fecha-registro">
                  📅 Cliente desde: {cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-AR') : 'Desconocida'}
                </p>

                <button 
                  className="btn-contactar"
                  onClick={() => contactarCliente(cliente.telefono)}
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

export default Clientes;