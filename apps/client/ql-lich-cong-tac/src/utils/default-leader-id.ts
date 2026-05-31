import { WEEK_SCHEDULE_LEADERS } from "@constants/work-schedule-week-mock"

const LEADER_NAME_HINTS: Record<string, string> = {
  "lê minh thái": "w-leader-1",
  "trần văn thương": "w-leader-2",
  "trần xuân nam": "w-leader-3",
  "mai quang huy": "w-leader-4",
}

export function resolveDefaultWeekLeaderId(displayName?: string | null) {
  if (!displayName) {
    return WEEK_SCHEDULE_LEADERS[0]?.id ?? "w-leader-1"
  }

  const normalized = displayName.toLowerCase().trim()

  for (const [hint, leaderId] of Object.entries(LEADER_NAME_HINTS)) {
    if (normalized.includes(hint)) {
      return leaderId
    }
  }

  const matchedLeader = WEEK_SCHEDULE_LEADERS.find((leader) =>
    normalized.includes(leader.fullName.toLowerCase())
  )

  return matchedLeader?.id ?? WEEK_SCHEDULE_LEADERS[0]?.id ?? "w-leader-1"
}
