import DeleteIcon from '@components/icons/delete'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { getWarningLevelColor } from '@hooks/getWarningLevelColor'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import type { DisciplinaryWarning, DisciplinaryWarningReason } from '@workspace/db/client'
import {
    useCountDisciplinaryWarning,
    useFindManyDisciplinaryWarning,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useUpdateDisciplinaryWarning,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { BookPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

interface XetCanhCaoHocDuongProps {
    semesterId: string
}

const XetCanhCaoHocDuong = ({ semesterId }: XetCanhCaoHocDuongProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        fixedClassId: '',
        trainingCourseId: '',
        managementOrganizationId: '',
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const where = useMemo(
        () => ({
            semesterId,
            student: {
                ...(filters.code && filters.code !== ''
                    ? {
                          code: {
                              contains: filters.code,
                              mode: 'insensitive' as const,
                          },
                      }
                    : {}),
                userProfile: {
                    ...(filters.name && filters.name !== ''
                        ? {
                              fullname: {
                                  contains: filters.name,
                                  mode: 'insensitive' as const,
                              },
                          }
                        : {}),
                },
                ...(filters.fixedClassId
                    ? {
                          fixedClassId: {
                              in: Array.isArray(filters.fixedClassId)
                                  ? filters.fixedClassId
                                  : [filters.fixedClassId],
                          },
                      }
                    : {}),
                fixedClass: {
                    ...(filters.trainingCourseId
                        ? {
                              trainingCourseId: {
                                  in: Array.isArray(filters.trainingCourseId)
                                      ? filters.trainingCourseId
                                      : [filters.trainingCourseId],
                              },
                          }
                        : {}),
                    ...(filters.managementOrganizationId
                        ? {
                              managementOrganizationId: {
                                  in: Array.isArray(filters.managementOrganizationId)
                                      ? filters.managementOrganizationId
                                      : [filters.managementOrganizationId],
                              },
                          }
                        : {}),
                },
            },
        }),
        [
            semesterId,
            filters.code,
            filters.name,
            filters.fixedClassId,
            filters.trainingCourseId,
            filters.managementOrganizationId,
        ]
    )

    const { data } = useFindManyDisciplinaryWarning(
        {
            where,
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
                reasonDetails: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        { enabled: !!semesterId }
    )

    const { data: count } = useCountDisciplinaryWarning(
        {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        { enabled: !!semesterId }
    )

    const { onOpen: onOpenPutDisciplinaryWarning } = useDisclosure<{
        id: string
        semesterId: string
    }>({
        tag: 'PutDisciplinaryWarning',
    })

    const { mutateAsync: updateDisciplinaryWarning } = useUpdateDisciplinaryWarning()
    const { mutateAsync: updateStudent } = useUpdateStudent()
    async function handleDeleteDisciplinaryWarning({
        id,
        studentId,
        increasedFrom,
        level,
    }: DisciplinaryWarning) {
        try {
            showSpinner()
            await updateDisciplinaryWarning({
                where: { id },
                data: { deletedAt: new Date() },
            })
            await updateStudent({
                where: { id: studentId },
                data: {
                    disciplinaryWarningLevel: {
                        decrement: level - (increasedFrom || 0),
                    },
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: {
            name: 'asc',
        },
        where: {
            trainingObjectTypeId,
            active: true,
            deletedAt: null,
        },
    })

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: {
            name: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
        orderBy: { iSTT: 'desc' }
    })
    const treeData = buildOrgTree(manageOrgData)

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end">
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpenPutDisciplinaryWarning({
                                            id: '',
                                            semesterId: semesterId,
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
                        rowKey="id"
                        data={data}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
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
                                render: (__, record) => record?.student?.code,
                            },
                            {
                                title: 'Tên sinh viên',
                                dataIndex: 'name',
                                width: 200,
                                fixed: 'left',
                                type: 'input',
                                render: (__, record) => record?.student?.userProfile?.fullname,
                            },
                            {
                                title: 'Ngày sinh',
                                width: 120,
                                align: 'center',
                                render: (__, record) => {
                                    const date = record?.student?.userProfile?.dateOfBirth
                                    return date ? dayjs(date).format('DD/MM/YYYY') : ''
                                },
                            },
                            {
                                title: 'Lớp niên chế',
                                dataIndex: 'fixedClassId',
                                width: 150,
                                align: 'center',
                                type: 'select',
                                options: fixedClassData.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                })),
                                render: (__, record) => record?.student?.fixedClass?.name,
                            },
                            {
                                title: 'Khoá',
                                dataIndex: 'trainingCourseId',
                                width: 150,
                                align: 'center',
                                type: 'select',
                                options: trainingCourseData.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                })),
                                render: (__, record) =>
                                    record?.student?.fixedClass?.trainingCourse?.name,
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'managementOrganizationId',
                                width: 150,
                                align: 'center',
                                type: 'tree_select',
                                options: treeData,
                                render: (__, record) =>
                                    record?.student?.fixedClass?.managementOrganization?.sTen,
                            },
                            {
                                title: 'Mức CCHĐ',
                                dataIndex: 'level',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                render: (value: number) => (
                                    <Tag color={getWarningLevelColor(value)}>{value}</Tag>
                                ),
                            },
                            {
                                title: 'Mức CCHĐ trước đó',
                                width: 120,
                                align: 'center',
                                fixed: 'right',
                                render: (record) => (
                                    <Tag color={getWarningLevelColor(record?.increasedFrom)}>
                                        {record?.increasedFrom || '-'}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Nguyên do',
                                width: 120,
                                align: 'center',
                                fixed: 'right',
                                render: (record) =>
                                    record?.reasonDetails
                                        ?.map(
                                            ({ name, severityLevel }: DisciplinaryWarningReason) =>
                                                `${name} (${severityLevel})`
                                        )
                                        .join(', '),
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => {
                                    const { id: studentId } = record
                                    return studentId ? (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                onClick={() =>
                                                    onOpenPutDisciplinaryWarning({
                                                        id: studentId,
                                                        semesterId,
                                                    })
                                                }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDeleteDisciplinaryWarning(
                                                            record as DisciplinaryWarning
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

export default XetCanhCaoHocDuong
