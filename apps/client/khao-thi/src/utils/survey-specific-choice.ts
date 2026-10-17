export type SpecificChoiceItem = {
  answer: string
  description?: string | null
}

export function buildSpecificChoiceMap(
  questions?: Array<{ id: string; specificChoice?: SpecificChoiceItem[] | null }> | null
): Record<string, SpecificChoiceItem[]> {
  const map: Record<string, SpecificChoiceItem[]> = {}
  questions?.forEach((q) => {
    if (q.specificChoice?.length) {
      map[q.id] = q.specificChoice
    }
  })
  return map
}

export function getSpecialChoiceLabel(
  choices: SpecificChoiceItem[] | undefined,
  answerIndex: number,
  choiceAnswer?: string
): string | null {
  if (!choices?.length) return null

  const matched =
    (choiceAnswer != null
      ? choices.find((c) => String(c.answer) === String(choiceAnswer))
      : undefined) || choices[answerIndex]

  return matched?.description?.trim() || matched?.answer?.trim() || null
}

export function formatSpecialAnswerCell(label: string | null, percentText: string): string {
  return label ? `${label}\n${percentText}` : percentText
}
