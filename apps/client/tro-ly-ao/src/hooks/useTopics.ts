import { useFindManyTopic } from "@workspace/db/hooks"

// System topic types
export const SYSTEM_TOPIC_TYPES = [
  "ABSTRACTIVE_TEXT_SUMMARIZATION",
  "EXTRACTIVE_TEXT_SUMMARIZATION",
  "DETECTION_AND_CORRECTION_OF_TEXT_ERRORS",
  "TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE",
] as const

export const useTopics = () => {
  const { data: topics = [], ...rest } = useFindManyTopic({
    orderBy: {
      name: "asc",
    },
  })

  const topicOptions = topics.map((topic) => ({
    id: topic.id, // Topic ID
    name: topic.name, // Topic name
    type: topic.type, // Topic type
  }))

  const selectableTopicOptions = topics
    .filter((topic) => !SYSTEM_TOPIC_TYPES.includes(topic.type as any))
    .map((topic) => ({
      id: topic.id, // Topic ID
      name: topic.name, // Topic name
      type: topic.type, // Topic type
    }))

  const isSystemTopic = (topicType: string) => {
    return SYSTEM_TOPIC_TYPES.includes(topicType as any)
  }

  const isTopicTypeExists = (topicType: string) => {
    return topics.some((topic) => topic.type === topicType)
  }

  return {
    topics,
    topicOptions,
    selectableTopicOptions, // New option for excluding system topics
    isSystemTopic,
    isTopicTypeExists,
    systemTopicTypes: SYSTEM_TOPIC_TYPES,
    ...rest,
  }
}
