import { ROUTER_PATH } from '@workspace/router'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
export default async function middleware(req: NextRequest) {
    const session = await auth()
    if (!session) {
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
         * - dang-ky-tai-khoan-tro-ly-ao (đăng ký tài khoản trợ lý ảo)
         */
        '/((?!api|_next/static|_next/image|assets|favicon.ico|sitemap.xml|robots.txt|dang-ky-tai-khoan-tro-ly-ao).*)',
    ],
}
