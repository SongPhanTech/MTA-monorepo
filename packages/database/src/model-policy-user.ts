export type ModelPolicyUser<T extends { id?: string | null }> = T & { mock?: boolean }

/**
 * User passed to ZenStack `enhance`. A missing request identity is anonymous.
 * The startup "first profile" is never substituted. An explicit non-production
 * MOCK_USER_PROFILE_ID is marked `mock` so CHAT policy does not treat it as a recipient.
 */
export function modelPolicyUser<T extends { id?: string | null }>(
  requestUser: T | null | undefined,
  env: { nodeEnv?: string; mockProfileId?: string | null } = {
    nodeEnv: process.env.NODE_ENV,
    mockProfileId: process.env.MOCK_USER_PROFILE_ID,
  },
): ModelPolicyUser<T> | undefined {
  if (!requestUser?.id) return undefined
  const mockId = env.mockProfileId?.trim()
  if (mockId && env.nodeEnv !== "production" && requestUser.id === mockId) {
    return { ...requestUser, mock: true }
  }
  return requestUser
}
