/**
 * ═══════════════════════════════════════════════════════════════
 * PRISMA SERVICE - Singleton para gestionar conexiones
 * ═══════════════════════════════════════════════════════════════
 */
import { PrismaClient } from '@prisma/client';
declare class PrismaService {
    private static instance;
    private constructor();
    static getInstance(): PrismaClient;
    static disconnect(): Promise<void>;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default PrismaService;
//# sourceMappingURL=prisma.service.d.ts.map