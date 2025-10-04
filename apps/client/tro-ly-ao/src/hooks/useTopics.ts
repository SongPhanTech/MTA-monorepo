import { useFindManyTopic } from '@workspace/db/hooks'

export const useTopics = () => {
    const { data: topics = [], ...rest } = useFindManyTopic({
        orderBy: {
            name: 'asc',
        },
    })

    // Transform topics to match the old DOCUMENT_TYPE format for easier migration
    const topicOptions = topics.map((topic) => ({
        value: topic.type,
        label: topic.name,
        id: topic.id,
    }))

    return {
        topics,
        topicOptions,
        ...rest,
    }
}
