function getEnv(name: string): string {
    const value = process.env[name]

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`)
    }

    return value
}

export const env = {
    get MTA_API_URL() {
        return getEnv('MTA_API_URL')
    },
    get LMS_CLIENT_ID() {
        return getEnv('LMS_CLIENT_ID')
    },
    get LMS_SECRET_KEY() {
        return getEnv('LMS_SECRET_KEY')
    },
    get HRM_CLIENT_ID() {
        return getEnv('HRM_CLIENT_ID')
    },
    get HRM_CLIENT_SECRET() {
        return getEnv('HRM_CLIENT_SECRET')
    },
}
