import DeleteIcon from '@components/icons/delete'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { PutStudentAcademicDecision } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useAcademicActionTypeOption } from '@hooks/academicActionType'
import { useDecisionStatusOptions } from '@hooks/decisionStatus'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type { FixedClass, TrainingCourse } from '@workspace/db'
import {
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyStudentAcademicDecision,
    useFindManyTrainingCourse,
    useUpdateStudentAcademicDecision,
} from '@workspace/db/hooks'
import { BookPlus } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

interface XetThoiHocProps {
    semesterId: string
}

const XetThoiHoc = ({ semesterId }: XetThoiHocProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { options: academicActionTypeOption, getAcademicActionTypeLabel } =
        useAcademicActionTypeOption()
    const {
        options: decisionStatusOption,
        getDecisionStatusLabel,
        getDecisionStatusColor,
    } = useDecisionStatusOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        fixedClass: undefined,
        trainingCourse: undefined,
        organization: undefined,
        actionTaken: undefined,
        status: undefined,
    })

    const { data, refetch } = useFindManyStudentAcademicDecision(
        {
            where: {
                semesterId,
                student: {
                    userProfile: {
                        ...(filters.code && filters.code !== ''
                            ? {
                                  code: {
                                      contains: filters.code,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...(filters.name && filters.name !== ''
                            ? {
                                  fullname: {
                                      contains: filters.name,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                    },
                    ...emptyObjectIf(
                        {
                            fixedClassId: {
                                in: filters.fixedClass,
                            },
                        },
                        !!filters.fixedClass
                    ),
                    fixedClass: {
                        ...(filters.trainingCourse
                            ? {
                                  trainingCourseId: { in: filters.trainingCourse },
                              }
                            : {}),
                        ...(filters.organization
                            ? {
                                  managementOrganizationId: { in: filters.organization },
                              }
                            : {}),
                    },
                },
                ...(filters.actionTaken
                    ? {
                          actionTaken: { in: filters.actionTaken },
                      }
                    : {}),
                ...(filters.status
                    ? {
                          status: { in: filters.status },
                      }
                    : {}),
            },
            include: {
                student: {
                    include: {
                        fixedClass: {
                            include: {
                                trainingCourse: true,
                                managementOrganization: true,
                            },
                        },
                        userProfile: true,
                    },
                },
                appliedConfig: true,
            },
        },
        { enabled: !!semesterId }
    )

    const { mutateAsync: updateStudentAcademicDecision } = useUpdateStudentAcademicDecision()
    async function handleDeleteStudentAcademicDecision(id: string) {
        try {
            showSpinner()
            await updateStudentAcademicDecision({
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

    const { onOpen, onClose } = useDisclosure<{ id: string; semesterId: string }>({
        tag: PutStudentAcademicDecision.name,
    })

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
            orderBy: {
                name: 'asc',
            },
        })

    const { data: fixedClassData = [], refetch: refetchFixedClass } = useFindManyFixedClass({
        orderBy: {
            name: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        {/* <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            className="py-0"
                                            placeholder="Tìm kiếm mã, tên học viên"
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
                            </Flex>
                        </Col> */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpen({
                                            id: '',
                                            semesterId,
                                        })
                                    }
                                >
                                    <BookPlus />
                                    Thêm học viên
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="key"
                        data={data}
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                multiple: [
                                    'name',
                                    'fixedClass',
                                    'trainingCourse',
                                    'organization',
                                    'actionTaken',
                                    'status',
                                ],
                                render: (__, record) => record?.student?.code,
                            },
                            {
                                title: 'Tên sinh viên',
                                dataIndex: 'name',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                                multiple: [
                                    'code',
                                    'fixedClass',
                                    'trainingCourse',
                                    'organization',
                                    'actionTaken',
                                    'status',
                                ],
                                render: (__, record) => record?.student?.userProfile?.fullname,
                            },
                            {
                                title: 'Lớp niên chế',
                                dataIndex: 'fixedClass',
                                width: 150,
                                align: 'center',
                                type: 'select',
                                multiple: [
                                    'code',
                                    'name',
                                    'trainingCourse',
                                    'organization',
                                    'actionTaken',
                                    'status',
                                ],
                                options: fixedClassData.map((i: FixedClass) => ({
                                    value: i.id,
                                    label: i.name,
                                })),
                                render: (__, record) => record?.student?.fixedClass?.name,
                            },
                            {
                                title: 'Khóa',
                                dataIndex: 'trainingCourse',
                                width: 100,
                                align: 'center',
                                type: 'select',
                                multiple: [
                                    'code',
                                    'name',
                                    'fixedClass',
                                    'organization',
                                    'actionTaken',
                                    'status',
                                ],
                                options: trainingCourseData.map((i: TrainingCourse) => ({
                                    value: i.id,
                                    label: i.name,
                                })),
                                render: (__, record) =>
                                    record?.student?.fixedClass?.trainingCourse?.name,
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organization',
                                width: 150,
                                align: 'center',
                                type: 'tree_select',
                                options: treeData,
                                multiple: [
                                    'code',
                                    'name',
                                    'fixedClass',
                                    'trainingCourse',
                                    'actionTaken',
                                    'status',
                                ],
                                render: (__, record) =>
                                    record?.student?.fixedClass?.managementOrganization?.sTen,
                            },
                            {
                                title: 'Ngày quyết định',
                                // dataIndex: 'decisionDate',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                render: ({ decisionDate }) =>
                                    decisionDate ? dayjs(decisionDate).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Hành động đã thực hiện',
                                dataIndex: 'actionTaken',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                type: 'select',
                                multiple: [
                                    'code',
                                    'name',
                                    'fixedClass',
                                    'trainingCourse',
                                    'organization',
                                    'status',
                                ],
                                options: academicActionTypeOption,
                                render: (value) => getAcademicActionTypeLabel(value),
                            },
                            {
                                title: 'Trạng thái của quyết định',
                                dataIndex: 'status',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                type: 'select',
                                multiple: [
                                    'code',
                                    'name',
                                    'fixedClass',
                                    'trainingCourse',
                                    'organization',
                                    'actionTaken',
                                ],
                                options: decisionStatusOption,
                                render: (status) => (
                                    <Tag color={getDecisionStatusColor(status)}>
                                        {getDecisionStatusLabel(status)}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Ghi chú lý do',
                                dataIndex: 'reason',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (value) => <span className="line-clamp-2">{value}</span>,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    return record?.id ? (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                onClick={() =>
                                                    onOpen({
                                                        id: record?.id,
                                                        semesterId,
                                                    })
                                                }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDeleteStudentAcademicDecision(
                                                            record?.id
                                                        ),
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

export default XetThoiHoc
