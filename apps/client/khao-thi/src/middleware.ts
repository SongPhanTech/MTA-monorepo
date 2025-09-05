import { auth } from '@workspace/auth/server'
import { ROUTER_PATH } from '@workspace/router'
import { type NextRequest, NextResponse } from 'next/server'
export default async function middleware(req: NextRequest) {
    console.log(req,'1237');
    const session = await auth(req.cookies.get('x-token')?.value)
    if (!session && req.nextUrl.pathname !== ROUTER_PATH.QL_NGUOI_DUNG.INDEX) {
        return NextResponse.rewrite(new URL(ROUTER_PATH.QL_NGUOI_DUNG.INDEX, req.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|assets|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}
