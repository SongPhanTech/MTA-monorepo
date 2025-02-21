import { HTTPException } from 'hono/http-exception'
import { customFetch } from './custom-fetch'

export interface UserCreateRequest {
    schemas: string[]
    name: Name
    userName: string
    password: string
    emails: string[]
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'?: {
        accountLocked: boolean
    }
}

export interface ListResponse {
    totalResults: number
    startIndex: number
    itemsPerPage: number
    schemas: string[]
    Resources?: UserResponse[]
}

export interface UserResponse {
    emails: string[]
    meta: Meta
    roles: Role[]
    name: Name
    id: string
    userName: string
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'?: {
        accountLocked: boolean
        unlockTime: number
        failedLoginAttempts: number
        failedLoginAttemptsBeforeSuccess: number
        totpEnabled: number
    }
}

export interface Meta {
    created: Date
    location: string
    lastModified: Date
    resourceType: string
}

export interface Name {
    givenName: string
    familyName: string
}
interface Query {
    startIndex?: number
    count?: number
    domain?: string
    email?: string
    name?: string
    userName?: string
}

export interface Role {
    value: string
    type: string
}

export interface Name {
    familyName: string
    givenName: string
}

export interface Meta {
    created: Date
    location: string
    lastModified: Date
    resourceType: string
}

export class SCIMClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers = {
            'Content-Type': 'application/scim+json',
            ...options.headers,
        }

        const { data, status } = await customFetch<{ data: T; status: number }>(
            'scim2',
            endpoint,
            {
                ...options,
                headers,
            }
        )

        if (status >= 400) {
            throw new HTTPException(500, {
                message: 'Internal Server Error',
                cause: data,
            })
        }

        return data
    }

    async createUser(user: UserCreateRequest): Promise<UserResponse> {
        return this.request<UserResponse>('/Users', {
            method: 'POST',
            body: JSON.stringify(user),
        })
    }

    async getUser(id: string): Promise<UserResponse> {
        return this.request<UserResponse>(`/Users/${id}`, {
            method: 'GET',
        })
    }

    async listUsers(query?: Query): Promise<ListResponse> {
        const { startIndex, count, domain, email, name, userName } = query || {}

        const filter = [
            email && `emails+co+${email}`,
            name && `name.givenName+co+${name}`,
            userName && `userName+co+${userName}`,
        ]
            .filter(Boolean)
            .join(' and ')

        const params = filter.length
            ? `?filter=${filter}&startIndex=${startIndex}&count=${count}`
            : `?startIndex=${startIndex}&count=${count}`

        return this.request<ListResponse>(`/Users${params}`, {
            method: 'GET',
        })
    }

    async updateUser(
        id: string,
        updates: Partial<UserCreateRequest>
    ): Promise<UserResponse> {
        return this.request<UserResponse>(`/Users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        })
    }

    async deleteUser(id: string): Promise<boolean> {
        await this.request<null>(`/Users/${id}`, {
            method: 'DELETE',
        })
        return true
    }
}
