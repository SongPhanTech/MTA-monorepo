import { useFindManyTopic } from '@workspace/db/hooks'

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

    return {
        topics,
        topicOptions,
        ...rest,
    }
}
