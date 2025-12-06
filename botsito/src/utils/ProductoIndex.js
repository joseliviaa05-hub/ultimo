/**
 * ═══════════════════════════════════════════════════════════════
 * 🔍 PRODUCTO INDEX - Índice de Búsqueda de Productos
 * ═══════════════════════════════════════════════════════════════
 * 
 * Optimiza la búsqueda de productos usando estructuras de datos eficientes
 * 
 * MEJORAS IMPLEMENTADAS:
 * 1. ✅ Normalización de plurales (peluches → peluche)
 * 2. ✅ Sinónimos (boli → lapicera)
 * 3. ✅ Búsqueda difusa (tolerancia a errores)
 * 4. ✅ Abreviaturas (A4, USB, etc.)
 * 5. ✅ Búsqueda por color/tamaño
 * 
 * ═══════════════════════════════════════════════════════════════
 */

class ProductoIndex {
    constructor() {
        // Índices de búsqueda
        this.indiceNombres = new Map();           // nombre → producto
        this.indicePalabras = new Map();          // palabra → [productos]
        this.indiceCodigoBarras = new Map();      // codigo → producto
        this.indiceCategoria = new Map();         // categoria → [productos]
        this.indiceSubcategoria = new Map();      // subcategoria → [productos]
        this.todosLosProductos = [];              // Array con todos los productos
        
        // ✅ MEJORA 2: Diccionario de sinónimos
        this.sinonimos = {
            'boli': ['lapicera', 'birome', 'boligrafo'],
            'birome': ['lapicera', 'boli', 'boligrafo'],
            'boligrafo': ['lapicera', 'boli', 'birome'],
            'cuaderno': ['libreta', 'anotador'],
            'libreta': ['cuaderno', 'anotador'],
            'anotador': ['cuaderno', 'libreta'],
            'goma': ['borrador'],
            'borrador': ['goma'],
            'sacapuntas': ['afilador', 'tajador'],
            'afilador': ['sacapuntas'],
            'muneco': ['peluche', 'juguete'],
            'juguete': ['muneco', 'peluche', 'juego'],
            'celular': ['telefono', 'movil', 'smartphone', 'celu'],
            'telefono': ['celular', 'movil', 'celu'],
            'celu': ['celular', 'telefono'],
            'movil': ['celular', 'telefono'],
            'cargador': ['cable'],
            'cable': ['cargador'],
            'auricular': ['audifonos', 'auriculares'],
            'audifonos': ['auricular', 'auriculares'],
            'parlante': ['altavoz', 'bocina'],
            'altavoz': ['parlante', 'bocina'],
            'bocina': ['parlante', 'altavoz']
        };
        
        // ✅ MEJORA 4: Diccionario de abreviaturas
        this.abreviaturas = {
            'a4': 'cuaderno a4',
            'a5': 'cuaderno a5',
            'hb': 'lapiz hb',
            '2b': 'lapiz 2b',
            'usb': 'cable usb',
            'cd': 'disco cd',
            'dvd': 'disco dvd'
        };
        
        // ✅ MEJORA 5: Características (colores y tamaños)
        this.colores = ['rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 
                        'rosa', 'violeta', 'naranja', 'celeste', 'gris'];
        this.tamanos = ['grande', 'mediano', 'pequeno', 'chico', 'mini', 'enorme'];
        
        // Estadísticas
        this.stats = {
            totalProductos: 0,
            totalCategorias: 0,
            totalSubcategorias: 0,
            palabrasIndexadas: 0
        };
        
        console.log('🔍 ProductoIndex inicializado con mejoras avanzadas');
    }

    /**
     * Normaliza texto para búsqueda
     */
    _normalizar(texto) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // Eliminar acentos
            .replace(/[¿?¡!,;.:()\[\]{}'"]/g, '')  // Eliminar signos de puntuación
            .replace(/_/g, ' ')
            .trim();
    }

    /**
     * ✅ MEJORA 1: Convierte plurales a singular
     */
    _singularizar(palabra) {
        // Reglas de pluralización en español
        if (palabra.endsWith('ces') && palabra.length > 4) {
            // lápices → lápiz
            return palabra.slice(0, -3) + 'z';
        }
        
        if (palabra.endsWith('es') && palabra.length > 4) {
            // peluches → peluche, auriculares → auricular
            return palabra.slice(0, -2);
        }
        
        if (palabra.endsWith('s') && palabra.length > 3) {
            // globos → globo, cables → cable
            return palabra.slice(0, -1);
        }
        
        return palabra;
    }

    /**
     * ✅ MEJORA 3: Calcula similitud entre palabras (Levenshtein Distance)
     */
    _calcularSimilitud(palabra1, palabra2) {
        const len1 = palabra1.length;
        const len2 = palabra2.length;
        const matriz = [];

        for (let i = 0; i <= len1; i++) {
            matriz[i] = [i];
        }

        for (let j = 0; j <= len2; j++) {
            matriz[0][j] = j;
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (palabra1[i - 1] === palabra2[j - 1]) {
                    matriz[i][j] = matriz[i - 1][j - 1];
                } else {
                    matriz[i][j] = Math.min(
                        matriz[i - 1][j - 1] + 1,
                        matriz[i][j - 1] + 1,
                        matriz[i - 1][j] + 1
                    );
                }
            }
        }

        const distancia = matriz[len1][len2];
        const maxLen = Math.max(len1, len2);
        
        // Retorna porcentaje de similitud (0-100)
        return ((maxLen - distancia) / maxLen) * 100;
    }

    /**
     * ✅ MEJORA 3: Busca palabra similar si no encuentra exacta
     */
    _buscarPalabraSimilar(palabra, umbral = 75) {
        let mejorCoincidencia = null;
        let mejorScore = 0;

        for (const palabraIndexada of this.indicePalabras.keys()) {
            const similitud = this._calcularSimilitud(palabra, palabraIndexada);
            
            if (similitud >= umbral && similitud > mejorScore) {
                mejorScore = similitud;
                mejorCoincidencia = palabraIndexada;
            }
        }

        return mejorCoincidencia;
    }

    /**
     * ✅ MEJORA 5: Extrae características del texto
     */
    _extraerCaracteristicas(texto) {
        const caracteristicas = {
            colores: [],
            tamanos: [],
            texto_limpio: texto
        };
        
        this.colores.forEach(color => {
            if (texto.includes(color)) {
                caracteristicas.colores.push(color);
                caracteristicas.texto_limpio = caracteristicas.texto_limpio.replace(color, '').trim();
            }
        });
        
        this.tamanos.forEach(tamano => {
            if (texto.includes(tamano)) {
                caracteristicas.tamanos.push(tamano);
                caracteristicas.texto_limpio = caracteristicas.texto_limpio.replace(tamano, '').trim();
            }
        });
        
        return caracteristicas;
    }

    /**
     * Construye el índice completo desde lista de precios
     */
    construirIndice(listaPrecios) {
        console.log('🏗️  Construyendo índice de productos...');
        
        const inicio = Date.now();
        
        // Limpiar índices anteriores
        this.indiceNombres.clear();
        this.indicePalabras.clear();
        this.indiceCodigoBarras.clear();
        this.indiceCategoria.clear();
        this.indiceSubcategoria.clear();
        this.todosLosProductos = [];
        
        this.stats = {
            totalProductos: 0,
            totalCategorias: 0,
            totalSubcategorias: 0,
            palabrasIndexadas: 0
        };

        const categorias = new Set();
        const subcategorias = new Set();

        // Recorrer todos los productos
        for (const [categoria, subcats] of Object.entries(listaPrecios)) {
            categorias.add(categoria);
            
            for (const [subcategoria, productos] of Object.entries(subcats)) {
                subcategorias.add(subcategoria);
                
                for (const [nombre, info] of Object.entries(productos)) {
                    
                    const producto = {
                        id: `${categoria}::${subcategoria}::${nombre}`,
                        categoria,
                        subcategoria,
                        nombre,
                        nombreOriginal: nombre,
                        nombreFormateado: nombre.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        precio: info.precio || info.precio_desde || 0,
                        precioDesde: info.precio_desde || null,
                        stock: info.stock !== false,
                        unidad: info.unidad || null,
                        codigoBarras: info.codigo_barras || null,
                        imagenes: info.imagenes || []
                    };
                    
                    // Agregar a la lista completa
                    this.todosLosProductos.push(producto);
                    
                    // 1. Índice por nombre completo (usando ID único como clave)
                    const nombreNormalizado = this._normalizar(nombre);
                    this.indiceNombres.set(producto.id, producto);
                    
                    // 2. Índice por palabras individuales
                    const palabras = nombreNormalizado.split(/\s+/);
                    palabras.forEach(palabra => {
                        if (palabra.length > 2) {  // Ignorar palabras muy cortas
                            if (!this.indicePalabras.has(palabra)) {
                                this.indicePalabras.set(palabra, []);
                                this.stats.palabrasIndexadas++;
                            }
                            this.indicePalabras.get(palabra).push(producto);
                        }
                    });
                    
                    // 3. Índice por código de barras
                    if (producto.codigoBarras) {
                        this.indiceCodigoBarras.set(producto.codigoBarras, producto);
                    }
                    
                    // 4. Índice por categoría
                    if (!this.indiceCategoria.has(categoria)) {
                        this.indiceCategoria.set(categoria, []);
                    }
                    this.indiceCategoria.get(categoria).push(producto);
                    
                    // 5. Índice por subcategoría
                    const keySubcat = `${categoria}::${subcategoria}`;
                    if (!this.indiceSubcategoria.has(keySubcat)) {
                        this.indiceSubcategoria.set(keySubcat, []);
                    }
                    this.indiceSubcategoria.get(keySubcat).push(producto);
                    
                    this.stats.totalProductos++;
                }
            }
        }

        this.stats.totalCategorias = categorias.size;
        this.stats.totalSubcategorias = subcategorias.size;

        const duracion = Date.now() - inicio;
        
        console.log('✅ Índice construido en', duracion, 'ms');
        console.log('📊 Estadísticas del índice:');
        console.log(`   • Productos: ${this.stats.totalProductos}`);
        console.log(`   • Categorías: ${this.stats.totalCategorias}`);
        console.log(`   • Subcategorías: ${this.stats.totalSubcategorias}`);
        console.log(`   • Palabras indexadas: ${this.stats.palabrasIndexadas}`);
    }

    /**
     * Busca un producto por nombre exacto
     */
    buscarPorNombre(nombre) {
        const nombreNormalizado = this._normalizar(nombre);
        
        // Buscar en TODOS los productos
        for (const producto of this.todosLosProductos) {
            if (this._normalizar(producto.nombre) === nombreNormalizado) {
                return producto;
            }
        }
        
        return null;
    }

    /**
     * Busca productos que contengan una palabra
     */
    buscarPorPalabra(palabra) {
        const palabraNormalizada = this._normalizar(palabra);
        return this.indicePalabras.get(palabraNormalizada) || [];
    }

    /**
     * Busca un producto por código de barras
     */
    buscarPorCodigoBarras(codigo) {
        return this.indiceCodigoBarras.get(codigo) || null;
    }

    /**
     * Busca productos por categoría
     */
    buscarPorCategoria(categoria) {
        const categoriaNormalizada = this._normalizar(categoria);
        return this.indiceCategoria.get(categoriaNormalizada) || [];
    }

    /**
     * Busca productos por subcategoría
     */
    buscarPorSubcategoria(categoria, subcategoria) {
        const key = `${this._normalizar(categoria)}::${this._normalizar(subcategoria)}`;
        return this.indiceSubcategoria.get(key) || [];
    }

    /**
     * ✅ BÚSQUEDA INTELIGENTE CON TODAS LAS MEJORAS
     */
    buscar(consulta) {
        if (!consulta || consulta.trim() === '') {
            return [];
        }

        const consultaNormalizada = this._normalizar(consulta);
        const resultados = new Map();
        
        // ✅ MEJORA 5: Extraer características (color, tamaño)
        const caracteristicas = this._extraerCaracteristicas(consultaNormalizada);
        const textoLimpio = caracteristicas.texto_limpio;
        
        // ✅ MEJORA 4: Buscar abreviaturas
        if (this.abreviaturas[textoLimpio]) {
            const expansion = this.abreviaturas[textoLimpio];
            const productos = this.buscar(expansion);
            productos.forEach(producto => {
                if (!resultados.has(producto.id)) {
                    resultados.set(producto.id, { producto, score: 90 });
                }
            });
        }
        
        // 1. Búsqueda exacta por nombre
        for (const producto of this.todosLosProductos) {
            const nombreNormalizado = this._normalizar(producto.nombre);
            if (nombreNormalizado === consultaNormalizada || nombreNormalizado === textoLimpio) {
                resultados.set(producto.id, { producto, score: 100 });
            }
        }

        // 2. Búsqueda por palabras (con mejoras)
        const palabras = textoLimpio.split(/\s+/);
        palabras.forEach(palabra => {
            if (palabra.length > 2) {
                // Buscar palabra original
                let productos = this.buscarPorPalabra(palabra);
                
                // ✅ MEJORA 1: Si no encuentra, intentar singular
                if (productos.length === 0) {
                    const singular = this._singularizar(palabra);
                    if (singular !== palabra) {
                        productos = this.buscarPorPalabra(singular);
                    }
                }
                
                // ✅ MEJORA 2: Si no encuentra, buscar sinónimos
                if (productos.length === 0 && this.sinonimos[palabra]) {
                    this.sinonimos[palabra].forEach(sinonimo => {
                        const productosSinonimo = this.buscarPorPalabra(sinonimo);
                        productos = productos.concat(productosSinonimo);
                    });
                }
                
                // ✅ MEJORA 3: Si no encuentra, búsqueda difusa
                if (productos.length === 0 && palabra.length > 4) {
                    const palabraSimilar = this._buscarPalabraSimilar(palabra);
                    if (palabraSimilar) {
                        productos = this.buscarPorPalabra(palabraSimilar);
                    }
                }
                
                productos.forEach(producto => {
                    if (!resultados.has(producto.id)) {
                        resultados.set(producto.id, { producto, score: 50 });
                    } else {
                        resultados.get(producto.id).score += 25;
                    }
                });
            }
        });

        // 3. Búsqueda parcial en nombres
        for (const producto of this.todosLosProductos) {
            const nombreNormalizado = this._normalizar(producto.nombre);
            
            if (nombreNormalizado.includes(textoLimpio) || 
                textoLimpio.includes(nombreNormalizado)) {
                
                if (!resultados.has(producto.id)) {
                    resultados.set(producto.id, { producto, score: 75 });
                } else {
                    resultados.get(producto.id).score += 30;
                }
            }
        }
        
        // ✅ MEJORA 5: Filtrar por características (color, tamaño)
        if (caracteristicas.colores.length > 0 || caracteristicas.tamanos.length > 0) {
            for (const [id, item] of resultados.entries()) {
                const nombreProducto = this._normalizar(item.producto.nombre);
                
                // Bonus por coincidencia de color
                caracteristicas.colores.forEach(color => {
                    if (nombreProducto.includes(color)) {
                        item.score += 15;
                    }
                });
                
                // Bonus por coincidencia de tamaño
                caracteristicas.tamanos.forEach(tamano => {
                    if (nombreProducto.includes(tamano)) {
                        item.score += 15;
                    }
                });
            }
        }

        // Convertir a array y ordenar por score
        return Array.from(resultados.values())
            .sort((a, b) => b.score - a.score)
            .map(item => item.producto);
    }

    /**
     * Busca productos con stock disponible
     */
    buscarConStock(consulta) {
        const resultados = this.buscar(consulta);
        return resultados.filter(p => p.stock);
    }

    /**
     * Busca productos en un rango de precio
     */
    buscarPorRangoPrecio(min, max) {
        const resultados = [];
        
        for (const producto of this.todosLosProductos) {
            if (producto.precio >= min && producto.precio <= max) {
                resultados.push(producto);
            }
        }
        
        return resultados.sort((a, b) => a.precio - b.precio);
    }

    /**
     * Obtiene todos los productos
     */
    obtenerTodos() {
        return [...this.todosLosProductos];
    }

    /**
     * Obtiene todas las categorías
     */
    obtenerCategorias() {
        return Array.from(this.indiceCategoria.keys());
    }

    /**
     * Obtiene todas las subcategorías de una categoría
     */
    obtenerSubcategorias(categoria) {
        const categoriaNormalizada = this._normalizar(categoria);
        const subcats = new Set();
        
        for (const key of this.indiceSubcategoria.keys()) {
            const [cat, subcat] = key.split('::');
            if (cat === categoriaNormalizada) {
                subcats.add(subcat);
            }
        }
        
        return Array.from(subcats);
    }

    /**
     * Obtiene estadísticas del índice
     */
    obtenerEstadisticas() {
        return { ...this.stats };
    }

    /**
     * Verifica si el índice está vacío
     */
    estaVacio() {
        return this.stats.totalProductos === 0;
    }

    /**
     * Limpia el índice
     */
    limpiar() {
        this.indiceNombres.clear();
        this.indicePalabras.clear();
        this.indiceCodigoBarras.clear();
        this.indiceCategoria.clear();
        this.indiceSubcategoria.clear();
        this.todosLosProductos = [];
        
        this.stats = {
            totalProductos: 0,
            totalCategorias: 0,
            totalSubcategorias: 0,
            palabrasIndexadas: 0
        };
        
        console.log('🧹 Índice limpiado');
    }

    /**
     * Reconstruye el índice (útil cuando se modifican productos)
     */
    reconstruir(listaPrecios) {
        console.log('🔄 Reconstruyendo índice...');
        this.construirIndice(listaPrecios);
    }
}

// ═══════════════════════════════════════════════════════════════
// 📤 EXPORTAR INSTANCIA ÚNICA (Singleton)
// ═══════════════════════════════════════════════════════════════

module.exports = new ProductoIndex();