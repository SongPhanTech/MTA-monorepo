function getEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export const env = {
  MTA_API_URL: getEnv("MTA_API_URL"),
  MTA_CLIENT_ID: getEnv("MTA_CLIENT_ID"),
  MTA_SECRET_KEY: getEnv("MTA_SECRET_KEY")
}