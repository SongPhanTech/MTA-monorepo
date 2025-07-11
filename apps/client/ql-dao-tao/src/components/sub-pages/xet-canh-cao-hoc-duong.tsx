import DeleteIcon from '@components/icons/delete'
import { Button, Col, Flex, Form, Input, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { PutDisciplinaryWarning } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { getWarningLevelColor } from '@hooks/getWarningLevelColor'
import useSpinner from '@hooks/spinner'
import type { DisciplinaryWarning, DisciplinaryWarningReason } from '@workspace/db'
import {
    useFindManyDisciplinaryWarning,
    useUpdateDisciplinaryWarning,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { BookPlus, Search } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

interface FilterProps {
    searchText: string | undefined
    trainingObjectId: string | undefined
    trainingCourseId: string | undefined
    managementOrganizationId: string | undefined
}

interface XetCanhCaoHocDuongProps {
    semesterId: string
}

const XetCanhCaoHocDuong = ({ semesterId }: XetCanhCaoHocDuongProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectId: '',
        trainingCourseId: '',
        managementOrganizationId: '',
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data } = useFindManyDisciplinaryWarning(
        {
            where: {
                semesterId,
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

    const { onOpen: onOpenPutDisciplinaryWarning } = useDisclosure<{
        id: string
        semesterId: string
    }>({
        tag: PutDisciplinaryWarning.name,
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            // onChange={(e) =>
                                            //     handleFilterChange(
                                            //         'searchText',
                                            //         e.target.value
                                            //     )
                                            // }
                                            className="py-0"
                                            placeholder="Nhập tên học viên, lớp niên chế"
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
                        </Col>
                        <Col span={6}>
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
                                dataIndex: ['student', 'code'],
                                width: 120,
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Tên sinh viên',
                                dataIndex: ['student', 'userProfile', 'fullname'],
                                width: 200,
                                fixed: 'left',
                            },
                            {
                                title: 'Lớp niên chế',
                                dataIndex: ['student', 'fixedClass', 'name'],
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Khóa',
                                dataIndex: ['student', 'fixedClass', 'trainingCourse', 'name'],
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: [
                                    'student',
                                    'fixedClass',
                                    'managementOrganization',
                                    'sTen',
                                ],
                                width: 150,
                                align: 'center',
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
                                // dataIndex: 'increasedFrom',
                                width: 120,
                                align: 'center',
                                fixed: 'right',
                                render: (record) => record?.increasedFrom || '-',
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
                    />
                </Col>
            </Row>
        </div>
    )
}

export default XetCanhCaoHocDuong
