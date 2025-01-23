import { HTTPException } from 'hono/http-exception'

export interface UserCreateRequest {
    schemas: string[]
    name: Name
    userName: string
    password: string
    emails: Email[]
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'?: {
        accountLocked: boolean
    }
}

export interface ListResponse {
    totalResults: number
    startIndex: number
    itemsPerPage: number
    schemas: string[]
    Resources: UserResponse[]
}

export interface UserResponse {
    emails: Email[]
    meta: Meta
    roles: Role[]
    name: Name
    id: string
    userName: string
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
interface Filter {
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

export interface Email {
    primary?: boolean
    value: string
    type?: 'home' | 'work'
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

interface SCIMClientOptions {
    baseURL: string
    username: string
    password: string
}

export class SCIMClient {
    private baseURL: string
    private auth: string

    constructor(options: SCIMClientOptions) {
        this.baseURL = options.baseURL
        this.auth = Buffer.from(
            `${options.username}:${options.password}`
        ).toString('base64')
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`
        const headers = {
            'Content-Type': 'application/scim+json',
            Authorization: `Basic ${this.auth}`,
            ...options.headers,
        }

        const response = await fetch(url, { ...options, headers })

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null)
            throw new HTTPException(400, {
                message: errorBody.detail || response.statusText,
            })
        }

        if (response.status !== 204) {
            return response.json()
        }

        return null as T // Explicitly return `null` for DELETE and similar requests
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

    async listUsers(filter?: Filter): Promise<UserResponse[]> {
        const params = filter
            ? `?filter=${encodeURIComponent(JSON.stringify(filter))}`
            : ''
        return this.request<UserResponse[]>(`/Users${params}`, {
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
