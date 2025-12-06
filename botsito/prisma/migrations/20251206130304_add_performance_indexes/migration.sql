-- CreateIndex
CREATE INDEX "clientes_nombre_idx" ON "clientes"("nombre");

-- CreateIndex
CREATE INDEX "clientes_fechaRegistro_idx" ON "clientes"("fechaRegistro");

-- CreateIndex
CREATE INDEX "clientes_totalPedidos_idx" ON "clientes"("totalPedidos");

-- CreateIndex
CREATE INDEX "imagenes_producto_productoId_orden_idx" ON "imagenes_producto"("productoId", "orden");

-- CreateIndex
CREATE INDEX "imagenes_producto_publicId_idx" ON "imagenes_producto"("publicId");

-- CreateIndex
CREATE INDEX "items_pedido_productoId_pedidoId_idx" ON "items_pedido"("productoId", "pedidoId");

-- CreateIndex
CREATE INDEX "pedidos_estadoPago_idx" ON "pedidos"("estadoPago");

-- CreateIndex
CREATE INDEX "pedidos_tipoEntrega_idx" ON "pedidos"("tipoEntrega");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_estado_idx" ON "pedidos"("clienteId", "estado");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_fecha_idx" ON "pedidos"("clienteId", "fecha");

-- CreateIndex
CREATE INDEX "pedidos_estado_fecha_idx" ON "pedidos"("estado", "fecha");

-- CreateIndex
CREATE INDEX "pedidos_fecha_desc_idx" ON "pedidos"("fecha" DESC);

-- CreateIndex
CREATE INDEX "productos_categoria_stock_idx" ON "productos"("categoria", "stock");

-- CreateIndex
CREATE INDEX "productos_categoria_subcategoria_idx" ON "productos"("categoria", "subcategoria");

-- CreateIndex
CREATE INDEX "productos_stock_categoria_idx" ON "productos"("stock", "categoria");

-- CreateIndex
CREATE INDEX "productos_precio_idx" ON "productos"("precio");

-- CreateIndex
CREATE INDEX "productos_createdAt_idx" ON "productos"("createdAt");

-- CreateIndex
CREATE INDEX "productos_updatedAt_idx" ON "productos"("updatedAt");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE INDEX "usuarios_rol_activo_idx" ON "usuarios"("rol", "activo");

-- RenameIndex
ALTER INDEX "pedidos_fecha_idx" RENAME TO "pedidos_fecha_asc_idx";
