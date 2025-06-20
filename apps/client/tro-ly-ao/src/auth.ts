import NextAuth, { type DefaultSession } from 'next-auth'
import Asgardeo from 'next-auth/providers/asgardeo'
import 'next-auth/jwt'
import { cookies } from 'next/headers'
import { env } from './env'
declare module 'next-auth/jwt' {
    interface JWT {
        user_id: string
        access_token: string
        refresh_token: string
        username: string
        given_name: string
    }
}

declare module 'next-auth' {
    interface User {
        user_id: string
        username: string
        given_name: string
        access_token: string
        refresh_token: string
    }

    interface Profile {
        user_id: string
        username: string
    }

    interface Session extends DefaultSession {
        user: User
        user_id: string
        username: string
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Asgardeo({
            issuer: env.AUTH_ASGARDEO_ISSUER,
            authorization: {
                params: {
                    scope: 'openid email profile',
                },
            },
            profile: (profile) => {
                return profile as any
            },
        }),
    ],
    trustHost: true,
    callbacks: {
        async session({ session, token }) {
            if (token) {
                const res = await fetch(
                    `${env.AUTH_ASGARDEO_ISSUER.replace('/oauth2/token', '')}/oauth2/userinfo`,
                    {
                        headers: {
                            Authorization: `Bearer ${token.access_token}`,
                        },
                    }
                )
                if (!res.ok) {
                    throw new Error('Failed to fetch user')
                }
                session.user.user_id = token.user_id
                session.user.username = token.username
                session.user.access_token = token.access_token
                session.user.refresh_token = token.refresh_token
                session.user.name = token.given_name
                session.user.given_name = token.given_name
            }
            return session
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.user_id = (user as any).sub.split('@')[0]
                token.username = user.username
                token.given_name = user.given_name
            }
            if (account) {
                token.access_token = account.access_token as string
                token.refresh_token = account.refresh_token as string
            }
            return token
        },
    },
    events: {
        async signOut() {
            const c = await cookies()
            const all = c.getAll()
            for (const key of all) {
                c.delete(key.name)
            }
        },
    },
})
