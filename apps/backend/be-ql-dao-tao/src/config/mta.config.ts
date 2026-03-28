type AppSecret = {
  clientId: string
  secretKey: string
}

export const APP_SECRET_MAP: Record<string, AppSecret> = {
  lms: {
    clientId: process.env.LMS_CLIENT_ID || "",
    secretKey: process.env.LMS_SECRET_KEY || "",
  },
  hrm: {
    clientId: process.env.HRM_CLIENT_ID || "",
    secretKey: process.env.HRM_CLIENT_SECRET || "",
  },
}
