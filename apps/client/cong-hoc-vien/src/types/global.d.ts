declare global {
  interface Window {
    contextData?: {
      userId: string
      userName: string
      organizationId: string
    }
    MTAMenuComponents?: {
      default?: {
        createPlugin: (containerId: string, options: Record<string, unknown>) => void
      }
    }
    tenantCode?: string
  }
}

export {}
