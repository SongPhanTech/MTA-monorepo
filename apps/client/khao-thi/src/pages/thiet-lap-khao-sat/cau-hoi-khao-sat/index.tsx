import DefaultLayout from '@layouts/default-layout'
import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import {
    useCountSurveyQuestion,
    useFindManySurveyQuestion,
    useUpdateSurveyQuestion,
    useCreateManySurveyAnswer,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Flex,
    Form,
    Input,
    message,
    Row,
    Tag,
    Tooltip,
} from 'antd'
import _ from 'lodash'
import DeleteIcon from '@components/icons/delete'
import { useCallback, useMemo, useState } from 'react'
import { PutSurveyQuestionModal } from '@components/modal'
import { useDisclosure } from 'react-hook-disclosure-modal'
import FilterSurveyQuestion, {
    type FilterSurveyQuestionProps,
} from '@components/filter/filter-survey-question'
import EditIcon from '@components/icons/edit'
type Filter = FilterSurveyQuestionProps & {
    searchText: string
}
function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

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

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
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
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={10}>
                            <FilterSurveyQuestion
                                onSearchChange={handleFilterChange}
                                onFilterChange={handleAdvancedFilter}
                            />
                        </Col>
                        <Col span={14}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                    {/* <Flex
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap="16px"
                    >
                        <Form.Item
                            label="Tìm kiếm"
                            name="search"
                            style={{ marginBottom: 0 }}
                        >
                            <Input
                                id="search"
                                style={{ width: 300 }}
                                onChange={(e) =>
                                    debouncedSearchText(e.target.value)
                                }
                                placeholder="Tìm kiếm ..."
                            />
                        </Form.Item>

                        <Button onClick={handleModal} type="primary">
                            Thêm mới
                        </Button>
                    </Flex> */}
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã câu hỏi khảo sát',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên câu hỏi khảo sát',
                                dataIndex: 'name',
                            },

                            {
                                title: 'Loại câu hỏi khảo sát',
                                render: ({ surveyQuestionType }) =>
                                    surveyQuestionType
                                        ? surveyQuestionType.name
                                        : '',
                            },
                            {
                                title: 'Tên khảo sát',
                                render: ({ survey }) =>
                                    survey ? survey.name : '',
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
                                                onConfirm: () =>
                                                    handleDelete(id),
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
