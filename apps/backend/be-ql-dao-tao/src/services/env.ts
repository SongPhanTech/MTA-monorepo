function getEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    console.error(`[Internal Config Error]: Environment variable "${name}" is not defined.`)
    throw new Error("Internal server configuration error.")
  }

  return value
}
export const env = {
  get MTA_API_URL() {
    return getEnv("MTA_API_URL")
  },
  get KEYCLOAK_CLIENT_ID_LMS() {
    return getEnv("KEYCLOAK_CLIENT_ID_LMS")
  },
  get KEYCLOAK_CLIENT_SECRET_LMS() {
    return getEnv("KEYCLOAK_CLIENT_SECRET_LMS")
  },
}
