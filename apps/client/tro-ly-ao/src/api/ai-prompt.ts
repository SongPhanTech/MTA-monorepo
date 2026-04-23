import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getRuntimeEnv } from "@workspace/libs/utils"

export type AiPrompt = {
  code: string
  prompt_content?: string
  prompt?: string
  description?: string
  active?: boolean
  status?: string
  reason?: string
  [key: string]: unknown
}

const getBaseUrl = () => getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL")

const handleJson = async (res: Response) => {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const data = await res.json()
      msg = (data as { detail?: string; message?: string })?.detail ?? (data as { message?: string })?.message ?? msg
    } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const getPromptContent = (prompt: AiPrompt | undefined | null): string => {
  if (!prompt) return ""
  const pc = prompt.prompt_content
  if (typeof pc === "string") return pc
  const p = prompt.prompt
  if (typeof p === "string") return p
  // Nested record fallback: some wrappers return { prompt: { prompt: "..." } }
  if (p && typeof p === "object") {
    const nested = p as AiPrompt
    if (typeof nested.prompt_content === "string") return nested.prompt_content
    if (typeof nested.prompt === "string") return nested.prompt
  }
  return ""
}

export const AI_PROMPTS_LIST_KEY = ["ai-prompts"] as const
export const AI_PROMPT_BY_CODE_KEY = (code: string | undefined) => ["ai-prompt", code] as const

export const useAiPromptList = () => {
  return useQuery({
    queryKey: AI_PROMPTS_LIST_KEY,
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/prompts`, { method: "GET" })
      const data = await handleJson(res)
      if (Array.isArray(data)) return data as AiPrompt[]
      if (Array.isArray((data as { prompts?: AiPrompt[] })?.prompts))
        return (data as { prompts: AiPrompt[] }).prompts
      if (Array.isArray((data as { data?: AiPrompt[] })?.data))
        return (data as { data: AiPrompt[] }).data
      if (Array.isArray((data as { items?: AiPrompt[] })?.items))
        return (data as { items: AiPrompt[] }).items
      if (data && typeof data === "object") {
        return Object.entries(data as Record<string, unknown>).map(([code, value]) => ({
          code,
          ...(typeof value === "object" && value !== null
            ? (value as Record<string, unknown>)
            : { prompt_content: String(value) }),
        })) as AiPrompt[]
      }
      return [] as AiPrompt[]
    },
  })
}

export const useAiPromptByCode = (code: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: AI_PROMPT_BY_CODE_KEY(code),
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/prompts/${encodeURIComponent(code as string)}`, {
        method: "GET",
      })
      const data = await handleJson(res)
      // Unwrap common wrappers: {prompt: {...}} / {data: {...}} / raw object
      const raw = data as Record<string, unknown>
      if (raw && typeof raw === "object") {
        const inner = raw.prompt ?? raw.data
        if (inner && typeof inner === "object") return inner as AiPrompt
      }
      return data as AiPrompt
    },
    enabled: enabled && !!code,
  })
}

export type UpsertAiPromptInput = {
  code: string
  prompt_content: string
  description?: string
  active?: boolean
  reason?: string
}

export const useUpsertAiPrompt = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpsertAiPromptInput) => {
      const formData = new FormData()
      formData.append("code", input.code)
      formData.append("prompt_content", input.prompt_content)
      if (input.description != null) formData.append("description", input.description)
      if (input.active != null) formData.append("active", String(input.active))
      if (input.reason != null) formData.append("reason", input.reason)
      const res = await fetch(`${getBaseUrl()}/prompts`, { method: "POST", body: formData })
      const data = await handleJson(res)
      // Best-effort: refresh server-side prompt cache so AI picks up the new prompt
      try {
        await fetch(`${getBaseUrl()}/prompts/reload`, { method: "POST" })
      } catch {
        // ignore — update already persisted
      }
      return data as AiPrompt
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: AI_PROMPTS_LIST_KEY })
      queryClient.invalidateQueries({ queryKey: AI_PROMPT_BY_CODE_KEY(variables.code) })
    },
  })
}
