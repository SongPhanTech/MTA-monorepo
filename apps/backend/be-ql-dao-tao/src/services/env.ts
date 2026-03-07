function getEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export const env = {
  MTA_API_URL: getEnv("MTA_API_URL"),
  LMS_CLIENT_ID: getEnv("LMS_CLIENT_ID"),
  LMS_SECRET_KEY: getEnv("LMS_SECRET_KEY"),
  HRM_CLIENT_ID: getEnv("HRM_CLIENT_ID"),
  HRM_CLIENT_SECRET: getEnv("HRM_CLIENT_SECRET")
}