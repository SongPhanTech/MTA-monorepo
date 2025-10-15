import PutFormModal from '@components/commons/put-modal'
import Table from '@components/commons/table'
import {
    DEFAULT_PAGINATE_SIZE,
    FIXED_CLASS_STUDENT_STATUS,
    GENDER_MEAN,
} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { Prisma } from '@workspace/db/client'
import {
    useCountStudent,
    useFindManyStudent,
    useFindManyFixedClass,
    useUpdateManyStudent,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, message, Row, Select, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { ArrowBigLeftDash, ArrowBigRightDash } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const ModalChuyenLop = () => {
    const [currentPageNotClass, setCurrentPageNotClass] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const [selectedRowsInClass, setSelectedRowsInClass] = useState<string[]>([])
    const [transferredStudentIds, setTransferredStudentIds] = useState<string[]>([])
    const [filter, setFilter] = useState<{
        search?: string
        searchClassArrive?: string
        fixedClassId?: string
        fixedClassArriveId?: string
    }>({
        search: '',
        searchClassArrive: '',
        fixedClassId: undefined,
        fixedClassArriveId: undefined,
    })

    const { isOpen, onClose } = useDisclosure({
        tag: 'ModalChuyenLop',
    })

    const [form] = Form.useForm()

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: fixedClasses = [] } = useFindManyFixedClass({
        where: {
            active: true,
            deletedAt: null,
        },
        include: {
            trainingCourse: true,
        },
        orderBy: {
            name: 'asc',
        },
    })

    const { data = [], refetch } = useFindManyStudent(
        {
            where: {
                OR: filter.search
                    ? [
                          {
                              userProfile: {
                                  firstName: {
                                      contains: filter.search,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  lastName: {
                                      contains: filter.search,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  fullname: {
                                      contains: filter.search,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      ]
                    : undefined,
                fixedClassId: filter.fixedClassId,
            },
            include: {
                userProfile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        fullname: true,
                        dateOfBirth: true,
                        gender: true,
                    },
                },
                fixedClass: {
                    include: {
                        curriculumVersion: {
                            include: {
                                curriculum: {
                                    include: {
                                        trainingMajor: {
                                            include: {
                                                trainingField: {
                                                    select: {
                                                        name: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                curriculumVersion: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!filter.fixedClassId,
        }
    )

    const { data: count } = useCountStudent(
        {
            where: {
                OR: filter.search
                    ? [
                          {
                              userProfile: {
                                  firstName: {
                                      contains: filter.search,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  lastName: {
                                      contains: filter.search,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  fullname: {
                                      contains: filter.search,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      ]
                    : undefined,
                fixedClassId: filter.fixedClassId,
            },
        },
        {
            enabled: !!filter.fixedClassId,
        }
    )

    const { data: studentClassArrives = [], refetch: refetchClassArrives } = useFindManyStudent(
        {
            where: {
                OR: filter.searchClassArrive
                    ? [
                          {
                              userProfile: {
                                  firstName: {
                                      contains: filter.searchClassArrive,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  lastName: {
                                      contains: filter.searchClassArrive,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  fullname: {
                                      contains: filter.searchClassArrive,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      ]
                    : undefined,
                fixedClassId: filter.fixedClassArriveId,
            },
            include: {
                userProfile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        fullname: true,
                        dateOfBirth: true,
                        gender: true,
                    },
                },
                fixedClass: {
                    include: {
                        curriculumVersion: {
                            include: {
                                curriculum: {
                                    include: {
                                        trainingMajor: {
                                            include: {
                                                trainingField: {
                                                    select: {
                                                        name: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                curriculumVersion: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!filter.fixedClassArriveId,
        }
    )

    const { data: countStudentClassArrives } = useCountStudent(
        {
            where: {
                OR: filter.searchClassArrive
                    ? [
                          {
                              userProfile: {
                                  firstName: {
                                      contains: filter.searchClassArrive,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  lastName: {
                                      contains: filter.searchClassArrive,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              userProfile: {
                                  fullname: {
                                      contains: filter.searchClassArrive,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      ]
                    : undefined,
                fixedClassId: filter.fixedClassArriveId,
            },
        },
        {
            enabled: !!filter.fixedClassArriveId,
        }
    )

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        [refetch]
    )

    const debouncedRefetchStudentClassArrive = useCallback(
        _.debounce(() => {
            refetchClassArrives()
        }, 500),
        [refetchClassArrives]
    )

    useEffect(() => {
        return () => {
            debouncedRefetch.cancel()
            debouncedRefetchStudentClassArrive.cancel()
        }
    }, [debouncedRefetch, debouncedRefetchStudentClassArrive])

    const handleSearch = (key: string, value: string) => {
        setFilter((prev) => {
            const newFilter = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilter
        })
    }

    const handleSearchStudentClassArrive = (key: string, value: string) => {
        setFilter((prev) => {
            const newFilter = { ...prev, [key]: value }
            debouncedRefetchStudentClassArrive()
            return newFilter
        })
    }

    const { mutateAsync: updateManyStudents } = useUpdateManyStudent()

    const onOk = async () => {
        setSelectedRows([])
        setSelectedRowsInClass([])
        setTransferredStudentIds([])
        setFilter({
            search: '',
            searchClassArrive: '',
            fixedClassId: undefined,
            fixedClassArriveId: undefined,
        })
        onClose()
    }

    const updateStudentsToNewClass = async () => {
        try {
            showSpinner()
            const targetClass = fixedClasses.find((fc) => fc.id === filter.fixedClassArriveId)

            const updateData: Prisma.XOR<
                Prisma.StudentUpdateManyMutationInput,
                Prisma.StudentUncheckedUpdateManyInput
            > = {
                fixedClassId: filter.fixedClassArriveId,
            }

            if (targetClass?.curriculumVersionId) {
                updateData.curriculumVersionId = targetClass?.curriculumVersionId
            }

            await updateManyStudents({
                where: {
                    id: {
                        in: selectedRows,
                    },
                },
                data: updateData,
            })

            message.success('Cập nhật thành công')
            setTransferredStudentIds((prev) => [...prev, ...selectedRows])
            setSelectedRows([])
            refetch()
            refetchClassArrives()
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

    const removeStudentsFromClass = async () => {
        try {
            showSpinner()
            await updateManyStudents({
                where: {
                    id: {
                        in: selectedRowsInClass,
                    },
                },
                data: {
                    fixedClassId: filter.fixedClassId,
                    curriculumVersionId: fixedClasses.find((fc) => fc.id === filter.fixedClassId)
                        ?.curriculumVersionId,
                },
            })

            message.success('Cập nhật thành công')
            setTransferredStudentIds((prev) =>
                prev.filter((id) => !selectedRowsInClass.includes(id))
            )
            setSelectedRowsInClass([])
            refetch()
            refetchClassArrives()
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
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            maskClosable={true}
            onCancel={onClose}
            title="Chuyển lớp"
            className="w-[100vw]"
        >
            <Row gutter={[16, 16]}>
                <Col span={11}>
                    <Flex>
                        <Col>
                            <Select
                                placeholder="Chọn lớp quản lý"
                                value={filter.fixedClassId}
                                onChange={(value) => {
                                    setFilter({
                                        ...filter,
                                        fixedClassId: value,
                                    })
                                    setCurrentPage(1)
                                }}
                                className="w-96"
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                options={fixedClasses.map((fixedClass) => ({
                                    label: `${fixedClass.name} - ${fixedClass.trainingCourse?.name || ''}`,
                                    value: fixedClass.id,
                                }))}
                            />
                        </Col>
                        <Col>
                            <Input
                                placeholder="Tìm kiếm theo tên..."
                                value={filter.search}
                                className="w-72"
                                onChange={(e) => {
                                    handleSearch('search', e.target.value)
                                    setCurrentPage(1)
                                }}
                                allowClear
                            />
                        </Col>
                    </Flex>
                    <Table
                        rowKey="id"
                        rowSelection={{
                            selectedRowKeys: selectedRows,
                            onChange: (selectedKeys: any) => setSelectedRows(selectedKeys),
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
                            },
                            {
                                title: 'Họ và tên',
                                width: 150,
                                align: 'center',
                                render: (record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 100,
                                render: (record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 80,
                                render: (__, record) =>
                                    record?.userProfile?.gender
                                        ? GENDER_MEAN[
                                              record.userProfile.gender as keyof typeof GENDER_MEAN
                                          ]
                                        : '',
                            },
                            {
                                title: 'Ngành',
                                width: 150,
                                align: 'center',
                                render: (record) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.trainingField?.name
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                width: 180,
                                align: 'center',
                                render: (record) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.name
                                },
                            },
                            {
                                title: 'CTĐT',
                                width: 150,
                                align: 'center',
                                render: (record) => {
                                    const curriculum = record.curriculumVersion
                                    return curriculum ? curriculum.name : ''
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const statusInfo =
                                        FIXED_CLASS_STUDENT_STATUS[
                                            record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                                        ]
                                    return statusInfo ? (
                                        <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                                    ) : (
                                        <Tag color="default">Không xác định</Tag>
                                    )
                                },
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
                <Col span={2} className="flex items-center justify-center">
                    <Flex align="center" justify="center" vertical>
                        <Tooltip placement="top">
                            <Button
                                disabled={!selectedRows?.length}
                                className="mb-2"
                                onClick={updateStudentsToNewClass}
                            >
                                <ArrowBigRightDash className="cursor-pointer" />
                            </Button>
                        </Tooltip>
                        <Tooltip placement="top">
                            <Button
                                disabled={!selectedRowsInClass?.length}
                                className="mb-2"
                                onClick={removeStudentsFromClass}
                            >
                                <ArrowBigLeftDash className="cursor-pointer" />
                            </Button>
                        </Tooltip>
                    </Flex>
                </Col>
                <Col span={11}>
                    <Flex>
                        <Col>
                            <Select
                                placeholder="Chọn lớp đến"
                                value={filter.fixedClassArriveId}
                                onChange={(value) => {
                                    setFilter({
                                        ...filter,
                                        fixedClassArriveId: value,
                                    })
                                    setCurrentPageNotClass(1)
                                }}
                                className="w-96"
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                options={fixedClasses.map((fixedClass) => ({
                                    label: `${fixedClass.name} - ${fixedClass.trainingCourse?.name || ''}`,
                                    value: fixedClass.id,
                                }))}
                            />
                        </Col>
                        <Col>
                            <Input
                                placeholder="Tìm kiếm theo tên..."
                                value={filter.searchClassArrive}
                                className="w-72"
                                onChange={(e) => {
                                    handleSearchStudentClassArrive(
                                        'searchClassArrive',
                                        e.target.value
                                    )
                                    setCurrentPageNotClass(1)
                                }}
                                allowClear
                            />
                        </Col>
                    </Flex>
                    <Table
                        rowKey="id"
                        rowSelection={{
                            selectedRowKeys: selectedRowsInClass,
                            onChange: (selectedKeys: any) => setSelectedRowsInClass(selectedKeys),
                            getCheckboxProps: (record) => ({
                                // Chỉ cho phép chọn sinh viên đã được chuyển từ lớp nguồn
                                disabled: !transferredStudentIds.includes(record.id),
                            }),
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPageNotClass - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Họ và tên',
                                width: 150,
                                align: 'center',
                                render: (record) =>
                                    record.userProfile
                                        ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                                        : '',
                            },
                            {
                                title: 'Ngày sinh',
                                align: 'center',
                                width: 100,
                                render: (record) =>
                                    record.userProfile?.dateOfBirth
                                        ? dayjs(record.userProfile.dateOfBirth).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Giới tính',
                                align: 'center',
                                width: 80,
                                render: (__, record) =>
                                    record?.userProfile?.gender
                                        ? GENDER_MEAN[
                                              record.userProfile.gender as keyof typeof GENDER_MEAN
                                          ]
                                        : '',
                            },
                            {
                                title: 'Ngành',
                                width: 150,
                                align: 'center',
                                render: (record) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.trainingField?.name
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                width: 180,
                                align: 'center',
                                render: (record) => {
                                    return record?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.name
                                },
                            },
                            {
                                title: 'CTĐT',
                                width: 150,
                                align: 'center',
                                render: (record) => {
                                    const curriculum = record.curriculumVersion
                                    return curriculum ? curriculum.name : ''
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const statusInfo =
                                        FIXED_CLASS_STUDENT_STATUS[
                                            record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                                        ]
                                    return statusInfo ? (
                                        <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                                    ) : (
                                        <Tag color="default">Không xác định</Tag>
                                    )
                                },
                            },
                        ]}
                        data={studentClassArrives}
                        pagination={{
                            current: currentPageNotClass,
                            pageSize: numberOfPages,
                            total: countStudentClassArrives,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPageNotClass(page)
                                } else {
                                    setCurrentPageNotClass(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default ModalChuyenLop
