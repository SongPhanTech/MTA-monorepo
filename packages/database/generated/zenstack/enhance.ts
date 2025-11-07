/* eslint-disable */
import { type EnhancementContext, type EnhancementOptions, type ZodSchemas, type AuthUser } from '@zenstackhq/runtime';
import { createEnhancement } from '@zenstackhq/runtime/enhancements/node';
import modelMeta from './model-meta';
import policy from './policy';
import * as zodSchemas from '../zod';

import { Prisma as _Prisma, PrismaClient as _PrismaClient } from '../prisma-client';
import type { InternalArgs, DynamicClientExtensionThis } from '../prisma-client/runtime/library';
import type * as _P from './logical-prisma-client';
import type { Prisma, PrismaClient } from './logical-prisma-client';
export type { PrismaClient };


export namespace auth {
    type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
    export type UserProfile = WithRequired<Partial<_P.UserProfile>, 'id'> & Record<string, unknown>;
}




// overload for plain PrismaClient
export function enhance<ExtArgs extends Record<string, any> & InternalArgs>(
    prisma: _PrismaClient<any, any, ExtArgs>,
    context?: EnhancementContext<auth.UserProfile>, options?: EnhancementOptions): PrismaClient;
    
// overload for extended PrismaClient
export function enhance<ExtArgs extends Record<string, any> & InternalArgs>(
    prisma: DynamicClientExtensionThis<_Prisma.TypeMap<ExtArgs>, _Prisma.TypeMapCb, ExtArgs>,
    context?: EnhancementContext<auth.UserProfile>, options?: EnhancementOptions): DynamicClientExtensionThis<Prisma.TypeMap<ExtArgs>, Prisma.TypeMapCb, ExtArgs>;

export function enhance(prisma: any, context?: EnhancementContext<auth.UserProfile>, options?: EnhancementOptions): any {
    return createEnhancement(prisma, {
        modelMeta,
        policy,
        zodSchemas: zodSchemas as unknown as (ZodSchemas | undefined),
        prismaModule: _Prisma,
        ...options
    }, context);
}

/**
 * Infers the type of PrismaClient with ZenStack's enhancements.
 * @example
 * type EnhancedPrismaClient = Enhanced<typeof prisma>;
 */
export type Enhanced<Client> = 
    Client extends _PrismaClient<any, any, any> ? PrismaClient :
    Client extends DynamicClientExtensionThis<_Prisma.TypeMap<infer ExtArgs>, infer _TypeMapCb, infer ExtArgs> ? DynamicClientExtensionThis<Prisma.TypeMap<ExtArgs>, Prisma.TypeMapCb, ExtArgs> : Client;

    