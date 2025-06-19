export type Session = {
    exp: number
    iat: number
    auth_time: number
    jti: string
    iss: string
    aud: Array<string>
    sub: string
    typ: string
    azp: string
    sid: string
    acr: string
    'allowed-origins': Array<string>
    realm_access: {
        roles: Array<string>
    }
    resource_access: {
        'fe-test-local': {
            roles: Array<string>
        }
        'realm-management': {
            roles: Array<string>
        }
        'fe-system-local': {
            roles: Array<string>
        }
        broker: {
            roles: Array<string>
        }
        account: {
            roles: Array<string>
        }
    }
    scope: string
    sDM_NhanVienId: string
    email_verified: boolean
    sDM_DonViId: string
    name: string
    preferred_username: string
    given_name: string
    family_name: string
    email: string
    access_token: string
}

export type SessionStatus = 'authenticated' | 'unauthenticated' | 'loading'
