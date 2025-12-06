import { Client } from 'whatsapp-web.js';
declare class WhatsAppService {
    private client;
    private isReady;
    constructor();
    private initializeClient;
    private setupEventHandlers;
    private handleMessage;
    private handleMenu;
    private handlePedido;
    private handleConsulta;
    private mostrarCarrito;
    private mostrarHistorial;
    private mostrarCategorias;
    private mostrarInformacion;
    initialize(): Promise<void>;
    sendMessage(to: string, message: string): Promise<void>;
    sendMediaMessage(to: string, mediaPath: string, caption?: string): Promise<void>;
    getClient(): Client | null;
    isClientReady(): boolean;
}
export declare const whatsappService: WhatsAppService;
export {};
//# sourceMappingURL=whatsapp.service.d.ts.map