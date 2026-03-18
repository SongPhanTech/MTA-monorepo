import {
    useCountSubjectClassAttendance,
    useFindManySubjectClassAttendance,
    useUpdateSubjectClassAttendance,
} from '@workspace/db/hooks'
import { useMemo, useState } from 'react'
import { useAbility } from '@workspace/permissions'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Button, Col, Flex, message, Row } from 'antd'
import Table from '@components/commons/table'
import { FilterProps } from '@constants/type'
import { formatDate } from '@lib/utils'

import { useDisclosure } from 'react-hook-disclosure-modal'
import EditIcon from '@components/icons/edit'
import DeleteIcon from '@components/icons/delete'
import useSpinner from '@hooks/spinner'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Flag } from 'lucide-react'

export default function DiemDanhList({ selectedSubjectClassId, setSelectedSubjectClassId }: any) {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { showSpinner, hideSpinner } = useSpinner()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        code: '',
        name: '',
        examType: undefined,
        schoolYearId: undefined,
        semesterId: undefined,
        startDate: undefined,
        endDate: undefined,
        examDate: undefined,
        credit: undefined,
        mainLecturer: undefined,
        enterGradeLecturer: undefined,
        fixedClassId: undefined,
    })
    const where = useMemo(() => {
        return {
            subjectClassId: selectedSubjectClassId,
        }
    }, [selectedSubjectClassId])
    const { data: dataTable = [], refetch } = useFindManySubjectClassAttendance({
        where,
        include: {
            subjectClassAttendanceStudent: true,
            profile: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: count } = useCountSubjectClassAttendance({ where })
    const { mutateAsync: updateSubjectClassAttendance } = useUpdateSubjectClassAttendance()
    const { onOpen } = useDisclosure<{ id?: string; subjectClassId: string }>({
        tag: 'AddSubjectClassAttendance',
    })

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSubjectClassAttendance({
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
        } finally {
            hideSpinner()
        }
    }
    return (
        <div>
            <Row gutter={[0, 0]}>
                <Col span={24} className="flex justify-end">
                    <Flex gap={4}>
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_DANH, 'THEM') && (
                            <Button
                                onClick={() => {
                                    onOpen({ subjectClassId: selectedSubjectClassId })
                                }}
                                type="primary"
                                className="w-full flex justify-start"
                            >
                                Điểm danh
                            </Button>
                        )}
                    </Flex>
                </Col>

                <Col span={24} className="mt-2">
                    <Table
                        filters={filters}
                        setFilters={setFilters}
                        rowKey="id"
                        id="training-category"
                        columns={[
                            {
                                title: 'STT',
                                width: 40,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Thời gian học',
                                align: 'center',
                                render: (_, record) => {
                                    return record?.time ? formatDate(record?.time) : ''
                                },
                            },
                            {
                                title: 'Điểm danh',
                                align: 'center',
                                render: (_, record) => {
                                    return `${record?.subjectClassAttendanceStudent.filter((i: any) => i?.attendanceStatus === true)?.length || 0}/${record?.subjectClassAttendanceStudent?.length || 0}`
                                },
                            },
                            {
                                title: ' Người điểm danh',
                                align: 'center',
                                render: (_, record) => {
                                    return record?.profile?.fullname || ''
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_DANH,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_DANH,
                                            'SUA'
                                        ) && (
                                            <Flex>
                                                <Flag />
                                                <EditIcon
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                            </Flex>
                                        )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_DANH,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () => handleDelete(id),
                                                }}
                                            />
                                        )}
                                    </Row>
                                ),
                            },
                        ]}
                        data={dataTable}
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}
