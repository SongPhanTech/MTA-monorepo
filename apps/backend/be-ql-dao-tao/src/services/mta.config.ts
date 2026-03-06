type AppSecret = {
  clientId: string
  secretKey: string
}

export const APP_SECRET_MAP: Record<string, AppSecret> = {
    
  lms: {
    clientId: process.env.MTA_CLIENT_ID || "",
    secretKey: process.env.MTA_SECRET_KEY || ""
  }
}