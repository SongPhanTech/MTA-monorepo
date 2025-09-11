import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilte'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useSurveyQuestionTypeOptions } from '@hooks/survey-question-type'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountSurveyQuestion,
    useFindManySurveyQuestion,
    useUpdateSurveyQuestion,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function Page() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: surveyQuestionTypeOptions, getSurveyQuestionTypeLabel } =
        useSurveyQuestionTypeOptions()
    const id = router.query.id as string
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        surveyQuestionType: undefined,
        surveyId: undefined,
    })

    const where = useMemo(
        () => ({
            surveyQuestionGroupId: id,
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.surveyId
                ? Array.isArray(filters.surveyId)
                    ? { surveyId: { in: filters.surveyId } }
                    : { surveyId: filters.surveyId }
                : {}),
            ...(filters.surveyQuestionType && filters.surveyQuestionType.length > 0
                ? {
                      type: { in: filters.surveyQuestionType },
                  }
                : {}),
        }),
        [filters.code, filters.name, filters.surveyId, filters.surveyQuestionType, id]
    )

    const { data = [], refetch } = useFindManySurveyQuestion(
        {
            where,
            include: { survey: true },
            orderBy: { createdAt: 'desc' },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!id,
        }
    )

    const { data: count } = useCountSurveyQuestion({
        where: {
            ...where,
            deletedAt: null,
        },
    })
    // const { data: surveyData } = useFindManySurvey({ orderBy: { createdAt: 'desc' } })

    const { onOpen } = useDisclosure<{
        id: string
        surveyQuestionGroupId?: string
    }>({
        tag: 'PutSurveyQuestionModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen({ id: '', surveyQuestionGroupId: id })
    }
    const { mutateAsync: updateSurveyQuestion } = useUpdateSurveyQuestion()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSurveyQuestion({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Flex justify="end">
                        <Button onClick={handleModal} type="primary">
                            Thêm mới
                        </Button>
                    </Flex>
                </Col>
                <Col span={24}>
                    <Table
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên câu hỏi khảo sát',
                                dataIndex: 'name',
                                type: 'input',
                            },

                            {
                                title: 'Loại câu hỏi khảo sát',
                                dataIndex: 'surveyQuestionType',
                                type: 'select',
                                options: surveyQuestionTypeOptions,
                                render: (_, record) => getSurveyQuestionTypeLabel(record?.type),
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id, surveyQuestionGroupId }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={onOpen.bind(null, {
                                                id,
                                                surveyQuestionGroupId,
                                            })}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => handleDelete(id),
                                            }}
                                        />
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

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Thiết lập khảo sát' },
                {
                    title: 'Nhóm câu hỏi khảo sát',
                    href: ROUTER_PATH.KHAO_THI.THIET_LAP_KHAO_SAT_NHOM_CAU_HOI_KHAO_SAT,
                },
                { title: 'Danh sách câu hỏi trong nhóm câu hỏi' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
