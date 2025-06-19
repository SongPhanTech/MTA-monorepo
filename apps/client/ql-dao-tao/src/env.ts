import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    /**
     * Specify your server-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars.
     */
    server: {
        ENVIROMENT: z.enum(['develop', 'test', 'product']).default('develop'),
        AUTH_ISSUER: z.string().url(),
    },

    /**
     * Specify your client-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars. To expose them to the client, prefix them with
     * `NEXT_PUBLIC_`.
     */
    client: {
        NEXT_PUBLIC_API_BASE_URL: z.string().url(),
        NEXT_PUBLIC_API_MODEL_BASE_URL: z.string().url(),
        NEXT_PUBLIC_MY_ACCOUNT: z.string().url(),
        NEXT_PUBLIC_MINIO_ENDPOINT: z.string().url(),
        NEXT_PUBLIC_AUTH_ISSUER: z.string().url().optional(),
    },

    /**
     * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
     * middlewares) or client-side so we need to destruct manually.
     */
    runtimeEnv: {
        ENVIROMENT: process.env.ENVIROMENT,
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_API_MODEL_BASE_URL:
            process.env.NEXT_PUBLIC_API_MODEL_BASE_URL,
        NEXT_PUBLIC_MY_ACCOUNT: process.env.NEXT_PUBLIC_MY_ACCOUNT,
        NEXT_PUBLIC_MINIO_ENDPOINT: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
        NEXT_PUBLIC_AUTH_ISSUER: process.env.NEXT_PUBLIC_AUTH_ISSUER,
        AUTH_ISSUER: process.env.AUTH_ISSUER,
    },
    /**
     * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
     * useful for Docker builds.
     */
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    /**
     * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
     * `SOME_VAR=''` will throw an error.
     */
    emptyStringAsUndefined: true,
})
