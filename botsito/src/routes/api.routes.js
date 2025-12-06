// src/routes/api.routes.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 🛣️ API ROUTES - Rutas principales de la API
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const orderController = require('../controllers/orderController');
const multer = require('multer');

// Configurar multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ═══════════════════════════════════════════════════════════
// PRODUCTOS
// ═══════════════════════════════════════════════════════════
router.get('/productos', apiController.getProductos);
router.get('/productos/:id', apiController.getProductoById);
router.post('/productos', apiController.createProducto);
router.put('/productos/:id', apiController.updateProducto);
router.delete('/productos/:id', apiController.deleteProducto);
router.get('/productos/buscar-codigo/:codigo', apiController.buscarPorCodigo);

// Estructura completa (para dashboard antiguo)
router.get('/productos-estructura', apiController.getProductos);
router.get('/productos-completo', apiController.getProductos);

// ═══════════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════════
router.get('/categorias', apiController.getCategorias);
router.put('/categorias/:nombre', apiController.updateCategoria);
router.post('/categorias', apiController.createCategoria);
router.delete('/categorias/:nombre', apiController.deleteCategoria);

// ═══════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════
router.get('/clientes', apiController.getClientes);
router.get('/clientes/:telefono', apiController.getClienteByTelefono);

// ═══════════════════════════════════════════════════════════
// PEDIDOS
// ═══════════════════════════════════════════════════════════
router.get('/pedidos', orderController.getAll);
router.get('/pedidos/hoy', orderController.getToday);
router.get('/pedidos/:id', orderController.getById);
router.get('/pedidos/cliente/:telefono', orderController.getByCliente);
router.put('/pedidos/:id', orderController.updatePedido);
router.put('/pedidos/:id/estado', orderController.updateEstado);
router.put('/pedidos/:id/pago', orderController.updateEstadoPago);

// ═══════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════
router.get('/estadisticas', orderController.getStats);
router.get('/stats', orderController.getStats);

// ═══════════════════════════════════════════════════════════
// IMÁGENES
// ═══════════════════════════════════════════════════════════
router.post('/productos/imagen', upload.single('imagen'), apiController.uploadImagen);
router.delete('/productos/imagen', apiController.deleteImagen);
router.get('/productos/:categoriaId/:subcategoriaId/:productoId/imagenes', apiController.getImagenes);
router.put('/productos/imagenes/reordenar', apiController.reordenarImagenes);

module.exports = router;