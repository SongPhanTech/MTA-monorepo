import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSubjectListModal, PutVersionSubjectModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import type { DM_DonVi, ExamType } from '@workspace/db'
import {
    useCountSubject,
    useFindManyDM_DonVi,
    useFindManySubject,
    useUpdateSubject,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, message, Row, Select, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function SubjectList() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        managementOrganizationId: undefined,
        examType: undefined,
        active: undefined,
        code: '',
        name: '',
        credit: undefined,
        period: undefined,
        numberOfTheory: undefined,
        numberOfPractical: undefined,
        numberOfSelfStudy: undefined,
        numberOfPractice: undefined,
        numberOfReview: undefined,
        numberOfExam: undefined,
        numberOfOther: undefined,
    })
    const { getExamTypeLabel, options: examTypeFilters } = useExamTypeOptions()

    const { data: organization = [] } = useFindManyDM_DonVi()

    const { data: SubjectData, refetch } = useFindManySubject({
        where: {
            subjectVersion: {
                some: {
                    name: { contains: filters.name, mode: 'insensitive' },
                    code: { contains: filters.code, mode: 'insensitive' },
                },
            },
            ...(filters.managementOrganizationId
                ? { managementOrganizationId: filters.managementOrganizationId }
                : {}),
            ...(filters.examType
                ? {
                      subjectVersion: { some: { examType: { in: filters.examType } } },
                  }
                : {}),
            ...(filters.active?.length === 1
                ? {
                      subjectVersion: {
                          some: { active: filters.active[0] },
                      },
                  }
                : {}),
        },
        include: {
            _count: true,
            subjectVersion: {
                orderBy: [
                    ...emptyObjectIf([{ credit: filters.credit }], !!filters.credit),
                    ...emptyObjectIf([{ period: filters.period }], !!filters.period),
                    ...emptyObjectIf(
                        [{ numberOfTheory: filters.numberOfTheory }],
                        !!filters.numberOfTheory
                    ),
                    ...emptyObjectIf(
                        [{ numberOfPractical: filters.numberOfPractical }],
                        !!filters.numberOfPractical
                    ),
                    ...emptyObjectIf(
                        [{ numberOfSelfStudy: filters.numberOfSelfStudy }],
                        !!filters.numberOfSelfStudy
                    ),
                    ...emptyObjectIf(
                        [{ numberOfPractice: filters.numberOfPractice }],
                        !!filters.numberOfPractice
                    ),
                    ...emptyObjectIf(
                        [{ numberOfReview: filters.numberOfReview }],
                        !!filters.numberOfReview
                    ),
                    ...emptyObjectIf(
                        [{ numberOfExam: filters.numberOfExam }],
                        !!filters.numberOfExam
                    ),
                    ...emptyObjectIf(
                        [{ numberOfOther: filters.numberOfOther }],
                        !!filters.numberOfOther
                    ),
                    {
                        createdAt: 'desc',
                    },
                ],
            },
            managementOrganization: true,
        },

        orderBy: {
            name: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubject({
        where: {
            subjectVersion: {
                some: {
                    name: { contains: filters.name, mode: 'insensitive' },
                    code: { contains: filters.code, mode: 'insensitive' },
                },
            },
            ...(filters.managementOrganizationId
                ? { managementOrganizationId: filters.managementOrganizationId }
                : {}),
            ...(filters.examType
                ? {
                      subjectVersion: { some: { examType: { in: filters.examType } } },
                  }
                : {}),
            ...(filters.active?.length === 1
                ? {
                      subjectVersion: {
                          some: { active: filters.active[0] },
                      },
                  }
                : {}),
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutSubjectListModal.name,
    })

    const { onOpen: onOpenSubjectVersion } = useDisclosure<{
        subjectId: string
        subjectVersionId?: string
    }>({
        tag: PutVersionSubjectModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const handleModalSubjectVersion = (subjectId: string, subjectVersionId: string) => {
        onOpenSubjectVersion({ subjectId, subjectVersionId })
    }

    const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSubjectVersion({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    async function handleDeleteSubject(id: string) {
        try {
            showSpinner()
            await updateSubject({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (key: string, value: string | ExamType[] | boolean) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Form.Item
                                        className="mb-0"
                                        name="managementOrganizationId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chọn đơn vị quản lý"
                                            options={organization.map((i: DM_DonVi) => ({
                                                value: i.Id,
                                                label: i.sTen,
                                            }))}
                                            onChange={(val) =>
                                                handleFilterChange('managementOrganizationId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" gap={8}>
                                <Button onClick={handleModal} type="primary">
                                    <BookPlus />
                                    Thêm
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey={({ code, name, managementOrganization }) =>
                            `${[code, name, managementOrganization?.sTen].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="subjectVersion"
                        currentPage={currentPage}
                        defaultExpandAll
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã môn học',
                                dataIndex: 'code',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tên phiên bản MH',
                                dataIndex: 'name',
                                width: 200,
                                type: 'input',
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: '',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'credit',
                                width: 150,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                    'period',
                                ],
                            },
                            {
                                title: 'Số tiết',
                                dataIndex: 'period',
                                width: 150,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'LT',
                                dataIndex: 'numberOfTheory',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'period',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'BT',
                                dataIndex: 'numberOfPractical',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'period',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'ThL',
                                dataIndex: 'numberOfSelfStudy',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'period',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'TN, TH',
                                dataIndex: 'numberOfPractice',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'period',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'Ôn',
                                dataIndex: 'numberOfReview',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'period',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'KT, Thi',
                                dataIndex: 'numberOfExam',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: [
                                    'credit',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'period',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                width: 150,
                                type: 'select',
                                align: 'center',
                                options: examTypeFilters.map((opt) => ({
                                    label: opt.label,
                                    value: opt.value,
                                })),
                                render: (value: ExamType) => getExamTypeLabel(value),
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                width: 200,
                                render: (record) => <div className="line-clamp-2">{record}</div>,
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                align: 'center',
                                fixed: 'right',
                                width: 150,
                                options: [
                                    { label: 'Đang đào tạo', value: true },
                                    { label: 'Ngừng đào tạo', value: false },
                                ],
                                type: 'select',
                                render: (record) => {
                                    return !record ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record: { id?: string; subjectId?: string }) => {
                                    const { id: subjectVersionId, subjectId } = record
                                    return subjectVersionId && subjectId ? (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                onClick={() =>
                                                    onOpenSubjectVersion({
                                                        subjectId,
                                                        subjectVersionId,
                                                    })
                                                }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () => handleDelete(subjectVersionId),
                                                }}
                                            />
                                        </Row>
                                    ) : null
                                },
                            },
                        ]}
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
                        headerRight={({ id: subjectId }) => (
                            <Flex gap={8} align="center">
                                <Tooltip title="Thêm mới phiên bản môn học" placement="bottomLeft">
                                    <BookPlus
                                        onClick={() => handleModalSubjectVersion(subjectId, '')}
                                        className="cursor-pointer"
                                    />
                                </Tooltip>
                                <EditIcon
                                    onClick={onOpen.bind(null, subjectId)}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () => handleDeleteSubject(subjectId),
                                    }}
                                />
                            </Flex>
                        )}
                        data={SubjectData}
                    />
                </Col>
            </Row>
        </div>
    )
}

SubjectList.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
