import Table from '@components/commons/table'
import type { FilterSurveyQuestionProps } from '@components/filter/filter-survey-question'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSurveyQuestionModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountSurveyQuestion,
    useFindManySurveyQuestion,
    useUpdateSurveyQuestion,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Filter = FilterSurveyQuestionProps & {
    searchText: string
}
function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [_searchText, setSearchText] = useState<string>('')

    const [filters, setFilters] = useState<Filter>({
        searchText: '',
        surveyQuestionTypeId: null,
        surveyId: null,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const handleAdvancedFilter = (values: FilterSurveyQuestionProps) => {
        const newFilters = { ...filters, ...values }
        setFilters(newFilters)
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data = [], refetch } = useFindManySurveyQuestion({
        where: {
            name: {
                contains: filters.searchText,
            },
            ...(filters.surveyId ? { surveyId: filters.surveyId } : {}),
            ...(filters.surveyQuestionTypeId
                ? { surveyQuestionTypeId: filters.surveyQuestionTypeId }
                : {}),
        },
        include: {
            surveyQuestionType: true,
            survey: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSurveyQuestion()

    const _debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen } = useDisclosure<string>({
        tag: PutSurveyQuestionModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSurveyObjectType } = useUpdateSurveyQuestion()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSurveyObjectType({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã đề thi',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên đề thi',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Thời gian bắt dầu',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Thời gian kết thúc',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Thời gian thi',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Điểm đạt',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Tên khảo sát',
                                render: ({ survey }) => (survey ? survey.name : ''),
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={onOpen.bind(null, id)}
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
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default Page
Page.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
