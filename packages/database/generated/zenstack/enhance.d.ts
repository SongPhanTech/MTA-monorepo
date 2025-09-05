import { type EnhancementContext, type EnhancementOptions } from '@zenstackhq/runtime';
import { Prisma as _Prisma, PrismaClient as _PrismaClient } from '../prisma-client';
import type { InternalArgs, DynamicClientExtensionThis } from '../prisma-client/runtime/library';
import type * as _P from './logical-prisma-client';
import type { Prisma, PrismaClient } from './logical-prisma-client';
export type { PrismaClient };
export declare namespace auth {
    type WithRequired<T, K extends keyof T> = T & {
        [P in K]-?: T[P];
    };
    export type DM_NhanVien = WithRequired<Partial<_P.DM_NhanVien>, 'Id'> & Record<string, unknown>;
    export {};
}
export declare function enhance<ExtArgs extends Record<string, any> & InternalArgs>(prisma: _PrismaClient<any, any, ExtArgs>, context?: EnhancementContext<auth.DM_NhanVien>, options?: EnhancementOptions): PrismaClient;
export declare function enhance<ExtArgs extends Record<string, any> & InternalArgs>(prisma: DynamicClientExtensionThis<_Prisma.TypeMap<ExtArgs>, _Prisma.TypeMapCb, ExtArgs>, context?: EnhancementContext<auth.DM_NhanVien>, options?: EnhancementOptions): DynamicClientExtensionThis<Prisma.TypeMap<ExtArgs>, Prisma.TypeMapCb, ExtArgs>;
/**
 * Infers the type of PrismaClient with ZenStack's enhancements.
 * @example
 * type EnhancedPrismaClient = Enhanced<typeof prisma>;
 */
export type Enhanced<Client> = Client extends _PrismaClient<any, any, any> ? PrismaClient : Client extends DynamicClientExtensionThis<_Prisma.TypeMap<infer ExtArgs>, infer _TypeMapCb, infer ExtArgs> ? DynamicClientExtensionThis<Prisma.TypeMap<ExtArgs>, Prisma.TypeMapCb, ExtArgs> : Client;
