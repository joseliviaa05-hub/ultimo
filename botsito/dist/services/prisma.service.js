"use strict";
/**
 * ═══════════════════════════════════════════════════════════════
 * PRISMA SERVICE - Singleton para gestionar conexiones
 * ═══════════════════════════════════════════════════════════════
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
class PrismaService {
    constructor() { }
    static getInstance() {
        if (!PrismaService.instance) {
            PrismaService.instance = new client_1.PrismaClient({
                log: ['error', 'warn'],
            });
            // Manejar desconexión limpia
            process.on('beforeExit', async () => {
                await PrismaService.instance.$disconnect();
            });
        }
        return PrismaService.instance;
    }
    static async disconnect() {
        if (PrismaService.instance) {
            await PrismaService.instance.$disconnect();
        }
    }
}
exports.prisma = PrismaService.getInstance();
exports.default = PrismaService;
//# sourceMappingURL=prisma.service.js.map