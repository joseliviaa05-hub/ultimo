// src/services/imageService.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 📸 IMAGE SERVICE - Gestión de imágenes con Cloudinary
 * ═══════════════════════════════════════════════════════════════
 */

const cloudinary = require('../config/cloudinary');
const cache = require('../utils/CacheManager');
const productoIndex = require('../utils/ProductoIndex');
const { normalizarTexto } = require('../utils/textHelpers');
const logger = require('../middlewares/logger');
const fs = require('fs');
const path = require('path');

class ImageService {
    constructor() {
        // ✅ FIX: Ruta correcta del archivo (desde src/services/ hacia raíz)
        this.dataPath = path.join(__dirname, '../../../data/lista-precios.json');
        
        console.log('📂 Ruta de datos configurada:', this.dataPath);
        
        // ✅ Verificar que el archivo existe
        if (!fs.existsSync(this.dataPath)) {
            console.warn('⚠️ ADVERTENCIA: No se encontró lista-precios.json en:', this.dataPath);
        }
    }

    /**
     * Sube una imagen a Cloudinary
     */
    async subirImagen(buffer, mimetype, options = {}) {
        try {
            const b64 = Buffer.from(buffer).toString('base64');
            const dataURI = `data:${mimetype};base64,${b64}`;
            
            const defaultOptions = {
                transformation: [
                    { width: 1000, height: 1000, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            };
            
            const uploadOptions = { ...defaultOptions, ...options };
            
            const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
            
            logger.info(`✅ Imagen subida a Cloudinary: ${result.public_id}`);
            
            return {
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes
            };
            
        } catch (error) {
            logger.error('❌ Error subiendo imagen a Cloudinary:', error);
            throw error;
        }
    }

    /**
     * Elimina una imagen de Cloudinary
     */
    async eliminarImagen(publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
            logger.info(`✅ Imagen eliminada de Cloudinary: ${publicId}`);
            return true;
        } catch (error) {
            logger.error('❌ Error eliminando imagen de Cloudinary:', error);
            throw error;
        }
    }

    /**
     * Agrega imagen a un producto
     */
    async agregarImagenAProducto(productoId, categoriaId, subcategoriaId, imagenData) {
        try {
            const listaPrecios = cache.obtenerProductosSync();
            
            const catId = normalizarTexto(categoriaId);
            const subId = normalizarTexto(subcategoriaId);
            
            // Extraer nombre del producto del ID
            let prodId;
            if (productoId.includes('::')) {
                const partes = productoId.split('::');
                prodId = partes[partes.length - 1];
            } else {
                prodId = normalizarTexto(productoId);
            }
            
            logger.info(`📝 Buscando producto: ${catId} / ${subId} / ${prodId}`);
            
            // Buscar el producto
            if (!listaPrecios[catId]) {
                throw new Error(`Categoría "${catId}" no encontrada`);
            }
            
            if (!listaPrecios[catId][subId]) {
                throw new Error(`Subcategoría "${subId}" no encontrada en categoría "${catId}"`);
            }
            
            if (!listaPrecios[catId][subId][prodId]) {
                throw new Error(`Producto "${prodId}" no encontrado en "${catId}/${subId}"`);
            }
            
            const producto = listaPrecios[catId][subId][prodId];
            
            // Inicializar array de imágenes si no existe
            if (!producto.imagenes) {
                producto.imagenes = [];
            }
            
            // Agregar nueva imagen
            producto.imagenes.push({
                url: imagenData.url,
                public_id: imagenData.public_id,
                width: imagenData.width,
                height: imagenData.height,
                format: imagenData.format,
                subida: new Date().toISOString()
            });
            
            // ✅ Verificar que el directorio existe
            const dataDir = path.dirname(this.dataPath);
            if (!fs.existsSync(dataDir)) {
                logger.warn('⚠️ Creando directorio data...');
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            // Guardar
            logger.info(`💾 Guardando en: ${this.dataPath}`);
            fs.writeFileSync(this.dataPath, JSON.stringify(listaPrecios, null, 2));
            cache.invalidarProductos();
            productoIndex.reconstruir(cache.obtenerProductosSync());
            
            logger.info(`✅ Imagen agregada al producto: ${prodId} (Total: ${producto.imagenes.length})`);
            
            return producto.imagenes;
            
        } catch (error) {
            logger.error('❌ Error agregando imagen al producto:', error);
            throw error;
        }
    }

    /**
     * Elimina imagen de un producto
     */
    async eliminarImagenDeProducto(productoId, categoriaId, subcategoriaId, publicId) {
        try {
            // Eliminar de Cloudinary
            await this.eliminarImagen(publicId);
            
            // Eliminar de JSON
            const listaPrecios = cache.obtenerProductosSync();
            
            const catId = normalizarTexto(categoriaId);
            const subId = normalizarTexto(subcategoriaId);
            
            // Extraer nombre del producto del ID
            let prodId;
            if (productoId.includes('::')) {
                const partes = productoId.split('::');
                prodId = partes[partes.length - 1];
            } else {
                prodId = normalizarTexto(productoId);
            }
            
            if (!listaPrecios[catId]?.[subId]?.[prodId]) {
                throw new Error('Producto no encontrado');
            }
            
            const producto = listaPrecios[catId][subId][prodId];
            
            if (producto.imagenes) {
                producto.imagenes = producto.imagenes.filter(img => img.public_id !== publicId);
            }
            
            // Guardar
            fs.writeFileSync(this.dataPath, JSON.stringify(listaPrecios, null, 2));
            cache.invalidarProductos();
            productoIndex.reconstruir(cache.obtenerProductosSync());
            
            logger.info(`✅ Imagen eliminada del producto: ${prodId}`);
            
            return producto.imagenes;
            
        } catch (error) {
            logger.error('❌ Error eliminando imagen del producto:', error);
            throw error;
        }
    }

    /**
     * Obtiene imágenes de un producto
     */
    obtenerImagenesProducto(categoriaId, subcategoriaId, productoId) {
        try {
            const listaPrecios = cache.obtenerProductosSync();
            
            const catId = normalizarTexto(categoriaId);
            const subId = normalizarTexto(subcategoriaId);
            const prodId = normalizarTexto(productoId);
            
            const producto = listaPrecios[catId]?.[subId]?.[prodId];
            
            if (!producto) {
                return [];
            }
            
            return producto.imagenes || [];
            
        } catch (error) {
            logger.error('❌ Error obteniendo imágenes del producto:', error);
            return [];
        }
    }

    /**
     * Reordena imágenes de un producto
     */
    async reordenarImagenes(productoId, categoriaId, subcategoriaId, imagenesOrdenadas) {
        try {
            const listaPrecios = cache.obtenerProductosSync();
            
            const catId = normalizarTexto(categoriaId);
            const subId = normalizarTexto(subcategoriaId);
            const prodId = normalizarTexto(productoId);
            
            if (!listaPrecios[catId]?.[subId]?.[prodId]) {
                throw new Error('Producto no encontrado');
            }
            
            const producto = listaPrecios[catId][subId][prodId];
            producto.imagenes = imagenesOrdenadas;
            
            // Guardar
            fs.writeFileSync(this.dataPath, JSON.stringify(listaPrecios, null, 2));
            cache.invalidarProductos();
            productoIndex.reconstruir(cache.obtenerProductosSync());
            
            logger.info(`✅ Imágenes reordenadas para: ${prodId}`);
            
            return producto.imagenes;
            
        } catch (error) {
            logger.error('❌ Error reordenando imágenes:', error);
            throw error;
        }
    }

    /**
     * Sube imagen de producto (método completo)
     */
    async subirImagenProducto(buffer, mimetype, productoId, categoriaId, subcategoriaId) {
        try {
            logger.info(`📸 Iniciando subida de imagen para producto: ${productoId}`);
            logger.info(`   Categoría: ${categoriaId} / Subcategoría: ${subcategoriaId}`);
            
            // Subir a Cloudinary
            const imagenData = await this.subirImagen(buffer, mimetype, {
                folder: `gestionbot/productos/${categoriaId}/${subcategoriaId}`,
                public_id: `${productoId}_${Date.now()}`
            });
            
            logger.info(`✅ Imagen subida a Cloudinary exitosamente`);
            
            // Agregar al producto
            const imagenes = await this.agregarImagenAProducto(
                productoId,
                categoriaId,
                subcategoriaId,
                imagenData
            );
            
            return {
                success: true,
                imagen: imagenData,
                totalImagenes: imagenes.length
            };
            
        } catch (error) {
            logger.error('❌ Error en proceso completo de subida:', error);
            throw error;
        }
    }
}

module.exports = new ImageService();