/**
 * ═══════════════════════════════════════════════════════════════
 * PRODUCTO SERVICE - Gestión de productos
 * ═══════════════════════════════════════════════════════════════
 */
export declare class ProductoService {
    /**
     * Obtener todas las categorías disponibles
     */
    obtenerCategorias(): Promise<string[]>;
    /**
     * Obtener productos por categoría
     */
    obtenerPorCategoria(categoria: string): Promise<({
        imagenes: {
            id: string;
            productoId: string;
            createdAt: Date;
            url: string;
            publicId: string;
            width: number;
            height: number;
            format: string;
            size: number;
            orden: number;
        }[];
    } & {
        id: string;
        nombre: string;
        categoria: import(".prisma/client").$Enums.Categoria;
        subcategoria: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        precioDesde: import("@prisma/client/runtime/library").Decimal | null;
        unidad: string | null;
        stock: boolean;
        codigoBarras: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    /**
     * Buscar productos por texto
     */
    buscar(texto: string): Promise<({
        imagenes: {
            id: string;
            productoId: string;
            createdAt: Date;
            url: string;
            publicId: string;
            width: number;
            height: number;
            format: string;
            size: number;
            orden: number;
        }[];
    } & {
        id: string;
        nombre: string;
        categoria: import(".prisma/client").$Enums.Categoria;
        subcategoria: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        precioDesde: import("@prisma/client/runtime/library").Decimal | null;
        unidad: string | null;
        stock: boolean;
        codigoBarras: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    /**
     * Obtener producto por ID
     */
    obtenerPorId(id: string): Promise<({
        imagenes: {
            id: string;
            productoId: string;
            createdAt: Date;
            url: string;
            publicId: string;
            width: number;
            height: number;
            format: string;
            size: number;
            orden: number;
        }[];
    } & {
        id: string;
        nombre: string;
        categoria: import(".prisma/client").$Enums.Categoria;
        subcategoria: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        precioDesde: import("@prisma/client/runtime/library").Decimal | null;
        unidad: string | null;
        stock: boolean;
        codigoBarras: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    /**
     * Obtener producto por nombre (aproximado)
     */
    obtenerPorNombre(nombre: string): Promise<({
        imagenes: {
            id: string;
            productoId: string;
            createdAt: Date;
            url: string;
            publicId: string;
            width: number;
            height: number;
            format: string;
            size: number;
            orden: number;
        }[];
    } & {
        id: string;
        nombre: string;
        categoria: import(".prisma/client").$Enums.Categoria;
        subcategoria: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        precioDesde: import("@prisma/client/runtime/library").Decimal | null;
        unidad: string | null;
        stock: boolean;
        codigoBarras: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    /**
     * Verificar stock de un producto
     */
    verificarStock(productoId: string): Promise<boolean>;
    /**
     * Obtener productos destacados (más vendidos)
     */
    obtenerDestacados(limit?: number): Promise<({
        imagenes: {
            id: string;
            productoId: string;
            createdAt: Date;
            url: string;
            publicId: string;
            width: number;
            height: number;
            format: string;
            size: number;
            orden: number;
        }[];
    } & {
        id: string;
        nombre: string;
        categoria: import(".prisma/client").$Enums.Categoria;
        subcategoria: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        precioDesde: import("@prisma/client/runtime/library").Decimal | null;
        unidad: string | null;
        stock: boolean;
        codigoBarras: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
declare const _default: ProductoService;
export default _default;
//# sourceMappingURL=producto.service.d.ts.map