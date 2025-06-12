import Table, { type TableParamsAntdType } from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import {
    useCountSurvey,
    useFindManySurvey,
    useUpdateSurvey,
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
import { useCallback, useMemo, useState } from 'react'
import { PutSurveyModal } from '@components/modal'
import { useDisclosure } from 'react-hook-disclosure-modal'
import useSpinner from '@hooks/spinner'
import { EyeOutlined } from '@ant-design/icons'
import DeleteIcon from '@components/icons/delete'
import dayjs from 'dayjs'
import FilterSurvey, {
    type FilterSurveyProps,
} from '@components/filter/filter-survey'
import EditIcon from '@components/icons/edit'
type Filter = FilterSurveyProps & {
    searchText: string
}
function TabDotKhaoSat() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState<Filter>({
        searchText: '',
        surveyObjectTypeId: null,
        surveyTopicId: null,
        startDate: null,
        endDate: null,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const handleAdvancedFilter = (values: FilterSurveyProps) => {
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

    const { data = [], refetch } = useFindManySurvey({
        where: {
            name: {
                contains: filters.searchText,
            },
            ...(filters.startDate && filters.endDate
                ? {
                      startDate: {
                          gte: new Date(filters.startDate),
                          lte: new Date(filters.endDate),
                      },
                  }
                : {}),
            ...(filters.surveyObjectTypeId
                ? { surveyObjectId: filters.surveyObjectTypeId }
                : {}),
            ...(filters.surveyTopicId
                ? { surveyTopicId: filters.surveyTopicId }
                : {}),
        },
        include: {
            surveyObjectType: true,
            surveyTopic: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSurvey()

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutSurveyModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSurvey } = useUpdateSurvey()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSurvey({
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
                            <FilterSurvey
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
                                title: 'Tên đợt khảo sát',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Chủ đề khảo sát',
                                render: ({ surveyTopic }) =>
                                    surveyTopic ? surveyTopic.name : '',
                            },
                            {
                                title: 'Đối tượng khảo sát',
                                render: ({ surveyObjectType }) =>
                                    surveyObjectType
                                        ? surveyObjectType.name
                                        : '',
                            },
                            {
                                title: 'Ngày bắt đầu',
                                render: ({ startDate }) =>
                                    startDate
                                        ? dayjs(startDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Ngày kết thúc',
                                render: ({ endDate }) =>
                                    endDate
                                        ? dayjs(endDate).format('DD/MM/YYYY')
                                        : '',
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

export default TabDotKhaoSat
