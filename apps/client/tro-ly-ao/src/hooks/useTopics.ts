import { useFindManyTopic } from '@workspace/db/hooks'

// System topic types that cannot be edited or deleted
export const SYSTEM_TOPIC_TYPES = [
    'ABSTRACTIVE_TEXT_SUMMARIZATION',
    'EXTRACTIVE_TEXT_SUMMARIZATION',
    'DETECTION_AND_CORRECTION_OF_TEXT_ERRORS',
    'TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE',
] as const

export const useTopics = () => {
    const { data: topics = [], ...rest } = useFindManyTopic({
        orderBy: {
            name: 'asc',
        },
    })

    const topicOptions = topics.map((topic) => ({
        id: topic.id, // Topic ID
        name: topic.name, // Topic name
        type: topic.type, // Topic type
    }))

    // Helper function to check if a topic is system topic
    const isSystemTopic = (topicType: string) => {
        return SYSTEM_TOPIC_TYPES.includes(topicType as any)
    }

    // Helper function to check if a topic type already exists
    const isTopicTypeExists = (topicType: string) => {
        return topics.some((topic) => topic.type === topicType)
    }

    return {
        topics,
        topicOptions,
        isSystemTopic,
        isTopicTypeExists,
        systemTopicTypes: SYSTEM_TOPIC_TYPES,
        ...rest,
    }
}
