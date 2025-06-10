import { PlusOutlined } from '@ant-design/icons'
import DeleteIcon from '@components/icons/delete'
import { PutSubjectListModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyTrainingBlock,
    useCountTrainingBlock,
} from '@workspace/db/hooks'
import type { ExamType, TrainingObjectType } from '@workspace/db'
import { Search } from 'lucide-react'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import VersionProgramSubject from '@components/sub-pages/phien-ban-mon-hoc-chuong-trinh-dao-tao'
import { useRouter } from 'next/router'
import TableCollapse from '@components/commons/tableCollapse'
import { useExamTypeOptions } from '@hooks/examType'
// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    trainingObjectTypeId: string | undefined
}

export default function TrainingProgramSubjects() {
    const router = useRouter()
    const { id } = router.query
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })

    const { getExamTypeLabel } = useExamTypeOptions()

    const { data = [], refetch } = useFindManyTrainingBlock({
        where: {
            // name: {
            //     contains: searchText,
            // },
            curriculumVersionId: id as string,
        },
        include: {
            subjects: {
                include: {
                    subject: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingBlock({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutSubjectListModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingCourse({
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

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    'searchText',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nhập tên ngành..."
                                            style={{
                                                height: 40,
                                                marginRight: 8,
                                            }}
                                            prefix={
                                                <Search
                                                    size={15}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingObjectId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                height: 40,
                                                marginRight: 8,
                                            }}
                                            // onChange={(val) =>
                                            //     handleFilterChange(
                                            //         'trainingObjectTypeId',
                                            //         val
                                            //     )
                                            // }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    <PlusOutlined />
                                    Thêm
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey="name"
                        childrenFieldName="subjects"
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'ĐV QL',
                                dataIndex: 'dvql',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'KTT',
                                dataIndex: 'ktt',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Mã',
                                dataIndex: ['subject', 'code'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: 'code',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Tên Môn Học',
                                dataIndex: ['subject', 'name'],
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Tên Viết Tắt',
                                dataIndex: ['subject', 'shortName'],
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: ['subject', 'credit'],
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Học kỳ dự kiến',
                                dataIndex: 'semester',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Học kỳ giảng dạy',
                                dataIndex: 'shortName',
                                width: 140,
                                align: 'center',
                            },
                            {
                                title: 'BB/TC',
                                dataIndex: 'shortName',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'ĐK',
                                dataIndex: 'shortName',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết TKB',
                                dataIndex: ['subject', 'period'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết lý thuyết',
                                dataIndex: ['subject', 'numberOfTheory'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết thực hành',
                                dataIndex: ['subject', 'numberOfPractice'],

                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết tự học',
                                dataIndex: ['subject', 'numberOfSelfStudy'],

                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'STTL',
                                dataIndex: 'numberOfPractice13',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết bài tập lớn',
                                dataIndex: ['subject', 'numberOfProject'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Hệ số học phần',
                                dataIndex: 'numberOfPractice13',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'DQ',
                                dataIndex: 'numberOfPractice13',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'TT',
                                dataIndex: 'numberOfPractice13',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Thi',
                                dataIndex: ['subject', 'examType'],
                                width: 150,
                                align: 'center',
                                render: (record: ExamType) =>
                                    getExamTypeLabel(record),
                            },
                            {
                                title: 'SDD',
                                dataIndex: 'numberOfPractice13',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Danh sách môn',
                                dataIndex: 'numberOfPractice13',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Đề cương',
                                dataIndex: 'numberOfPractice13',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 150,
                                render: (record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Ngừng đào tạo</Tag>
                                    ) : (
                                        <Tag color="success">
                                            Đang hoạt động
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingProgramSubjects.getLayout = function getLayout(
    page: React.ReactElement
) {
    return <DefaultLayout>{page}</DefaultLayout>
}
