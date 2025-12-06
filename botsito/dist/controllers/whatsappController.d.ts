import { Request, Response } from 'express';
export declare class WhatsAppController {
    /**
     * POST /api/whatsapp/send
     * Envía un mensaje de WhatsApp (MOCK por ahora)
     */
    sendMessage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/whatsapp/send-image
     * Envía una imagen por WhatsApp (MOCK)
     */
    sendImage(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/whatsapp/status
     * Estado del servicio de WhatsApp
     */
    getStatus(req: Request, res: Response): Promise<void>;
}
declare const _default: WhatsAppController;
export default _default;
//# sourceMappingURL=whatsappController.d.ts.map