import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/tex-truncate'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import {
    useCountSurveyQuestionGroup,
    useFindManySurveyQuestionGroup,
    useFindManySurveyTopic,
    useUpdateSurveyQuestionGroup,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function TabNhomCauHoi() {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const router = useRouter()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        surveyTopicId: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.surveyTopicId
                ? {
                      surveyTopicId: {
                          in: filters.surveyTopicId,
                      },
                  }
                : {}),
        }),
        [filters.name, filters.surveyTopicId]
    )

    const { data = [] } = useFindManySurveyQuestionGroup({
        where,
        include: {
            surveyTopic: true,
            surveyQuestion: true,
        },
        orderBy: { createdAt: 'desc' },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSurveyQuestionGroup({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen } = useDisclosure<string>({
        tag: 'PutSurveyQuestionGroupModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { data: surveyTopicData, refetch } = useFindManySurveyTopic({
        orderBy: { createdAt: 'desc' },
    })
    const { mutateAsync: updateSurveyQuestionGroup } = useUpdateSurveyQuestionGroup()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSurveyQuestionGroup({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            refetch()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    console.log('data', data)

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Flex justify="end">
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                            'THEM'
                        ) && (
                            <Button onClick={handleModal} type="primary">
                                Thêm mới
                            </Button>
                        )}
                    </Flex>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey={'id'}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        onRowClick={({ id }) => {
                            router.push(
                                ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_NHOM_CAU_HOI_KHAO_SAT_ID.replace(
                                    '[id]',
                                    id
                                )
                            )
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên nhóm câu hỏi khảo sát',
                                dataIndex: 'name',
                                type: 'input',
                            },
                            {
                                title: 'Chủ đề khảo sát',
                                dataIndex: 'surveyTopicId',
                                type: 'select',
                                options: surveyTopicData?.map(({ id, name }) => ({
                                    value: id,
                                    label: name,
                                })),
                                render: (_, record) => {
                                    return record.surveyTopic?.length ? (
                                        <TextTruncate
                                            arr={record.surveyTopic.map((i: any) => {
                                                return {
                                                    key: i.id,
                                                    label: i.name,
                                                }
                                            })}
                                            key="surveyTopic"
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Số lượng câu hỏi',
                                dataIndex: 'surveyQuestion',
                                align: 'center',
                                render: (_, { surveyQuestion }) =>
                                    surveyQuestion.length ? surveyQuestion.length : 0,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id, surveyQuestion }) => (
                                    <Row className="justify-center gap-2">
                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_CAU_HOI_KHAO_SAT,
                                            'XEM'
                                        ) && (
                                            <Tooltip
                                                title={'Xem danh sách câu hỏi'}
                                                placement="top"
                                            >
                                                <EyeOutlined
                                                    onClick={() => {
                                                        router.push(
                                                            ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_NHOM_CAU_HOI_KHAO_SAT_ID.replace(
                                                                '[id]',
                                                                id
                                                            )
                                                        )
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                                            'SUA'
                                        ) && (
                                            <EditIcon
                                                onClick={(e: any) => {
                                                    e.stopPropagation()
                                                    onOpen(id)
                                                }}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        )}
                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                disabled={surveyQuestion.length > 0}
                                                popConfirm={{
                                                    onConfirm: (e) => {
                                                        handleDelete(id)
                                                        e?.stopPropagation()
                                                    },
                                                    onCancel: (e) => {
                                                        e?.stopPropagation()
                                                    },
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </Row>
                                ),
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default TabNhomCauHoi
