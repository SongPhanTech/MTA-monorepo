import { env } from '@/env'
import { LogoutOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { signOut } from 'next-auth/react'

const SignOut = () => {
    return (
        <form
            action={`${env.NEXT_PUBLIC_AUTH_ASGARDEO_ISSUER?.replace('/oauth2/token', '')}/oidc/logout`}
            method="post"
            onSubmit={signOut.bind(null, {
                redirect: false,
            })}
        >
            <input
                hidden
                readOnly
                name="client_id"
                value={env.NEXT_PUBLIC_AUTH_ASGARDEO_ID}
            />
            <input
                hidden
                readOnly
                name="post_logout_redirect_uri"
                value={`${env.NEXT_PUBLIC_NEXTAUTH_URL}`}
            />
            <input hidden readOnly name="state" value="1" />
            {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button className="text-red-500 flex items-center gap-2">
                <LogoutOutlined />
                <span>Đăng xuất</span>
            </button>
        </form>
    )
}

export default SignOut
