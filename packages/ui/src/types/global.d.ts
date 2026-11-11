export {}

declare global {
  interface Window {
    contextData?: {
      userId: string
      userName: string
      organizationId: string
    }
  }
}
