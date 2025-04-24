import { env } from '@/env'
import { signOut } from 'next-auth/react'

const signOutAction = () => {
    const formDom = document.createElement('form')
    formDom.action = `${env.NEXT_PUBLIC_AUTH_ASGARDEO_ISSUER?.replace('/oauth2/token', '')}/oidc/logout`
    formDom.method = 'post'

    const clientIdInput = document.createElement('input')
    clientIdInput.hidden = true
    clientIdInput.readOnly = true
    clientIdInput.name = 'client_id'
    clientIdInput.value = env.NEXT_PUBLIC_AUTH_ASGARDEO_ID

    const postLogoutRedirectUriInput = document.createElement('input')
    postLogoutRedirectUriInput.hidden = true
    postLogoutRedirectUriInput.readOnly = true
    postLogoutRedirectUriInput.name = 'post_logout_redirect_uri'
    postLogoutRedirectUriInput.value = `${env.NEXT_PUBLIC_NEXTAUTH_URL}`

    const stateInput = document.createElement('input')
    stateInput.hidden = true
    stateInput.readOnly = true
    stateInput.name = 'state'
    stateInput.value = '1'

    const button = document.createElement('button')
    button.type = 'submit'

    formDom.appendChild(clientIdInput)
    formDom.appendChild(postLogoutRedirectUriInput)
    formDom.appendChild(stateInput)
    formDom.appendChild(button)
    document.body.appendChild(formDom)
    button.click()
    signOut({
        redirect: false,
    })
    formDom.remove()
}

export default signOutAction
