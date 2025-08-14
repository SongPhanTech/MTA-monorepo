import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Survey } from '@workspace/db'
import { useCreateSurvey, useFindUniqueSurvey, useUpdateSurvey } from '@workspace/db/hooks'
import { Avatar, Form, List, message, Skeleton } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import InfiniteScroll from 'react-infinite-scroll-component'
export type PutSurveyType = Survey & { surveyObjectTypes: string[] }
interface DataType {
    gender?: string
    name?: string
    email?: string
    avatar?: string
    id?: string
}
const PutSurveyExamModal = () => {
    const [form] = Form.useForm<PutSurveyType>()
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [data, setData] = useState<DataType[]>([])
    const [page, setPage] = useState(1)

    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSurveyExamModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurvey()
    const { mutateAsync: update } = useUpdateSurvey()

    const loadMoreData = () => {
        if (loading) {
            return
        }
        setLoading(true)
        setPage(page + 1)
        // setLoading(false);
    }

    async function onOk(output?: PutSurveyType) {
        console.log(output)
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name,
                        surveyObjectType: {
                            // connect: {
                            //     id: output.surveyObjectTypes[0],
                            // },

                            connect: output.surveyObjectTypes.map((item) => ({ id: item })) || [],
                        },
                        // surveyTopic: {
                        //     connect: {
                        //         id: output.surveyTopicId,
                        //     },
                        // },
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        code: output.code,
                        additionalSuggestion: false,
                        name: output.name,
                        surveyObjectType: {
                            // connect: {
                            //     id: output.surveyObjectTypes[0],
                            // },

                            connect: output.surveyObjectTypes.map((item) => ({ id: item })) || [],
                        },
                        surveyTopic: {
                            connect: {
                                id: output.surveyTopicId,
                            },
                        },
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Level'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: survey } = useFindUniqueSurvey(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (survey) {
            form.setFieldsValue({
                ...survey,
                startDate: dayjs(survey.startDate),
                endDate: survey.endDate ? dayjs(survey.endDate) : undefined,
            })
        }
    }, [survey])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa khảo sát' : 'Thêm mới khảo sát'}
            className="w-[1000px]"
        >
            <div
                id="scrollableDiv"
                style={{
                    height: 400,
                    overflow: 'auto',
                    padding: '0 16px',
                    border: '1px solid rgba(140, 140, 140, 0.35)',
                }}
            >
                <InfiniteScroll
                    dataLength={data.length}
                    next={loadMoreData}
                    hasMore={hasMore}
                    loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                    scrollableTarget="scrollableDiv"
                >
                    <List
                        dataSource={data}
                        renderItem={(item) => (
                            <List.Item key={item.email}>
                                <List.Item.Meta
                                    avatar={<Avatar src={item.avatar} />}
                                    title={<a href="https://ant.design">{item.name}</a>}
                                    description={item.email}
                                />
                                <div>Content</div>
                            </List.Item>
                        )}
                    />
                </InfiniteScroll>
            </div>
        </PutFormModal>
    )
}

export default PutSurveyExamModal
