import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE, SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree, formatDate } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type {
    SubjectClass,
    SubjectClassSchedule,
    SubjectVersion,
    TrainingCourse,
    TrainingMajor,
} from '@workspace/db'
import {
    useCountSubjectClass,
    useDeleteSubjectClass,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManySubjectClass,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { putManySubjectClass } from '@workspace/libs/api/training'
import { Button, Checkbox, Col, Flex, message, Row } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TeachingAssignment() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        trainingCourseId: null,
        semesterStartId: null,
        trainingMajorId: null,
        lecturerId: undefined,
        credit: undefined,
        maxStudent: undefined,
        subjectClassStudent: undefined,
        mainLecturer: undefined,
        extraLecturer: undefined,
        enterGradeLecturer: undefined,
        examType: undefined,
        organization: undefined,
    })

    const [isEdit, setIsEdit] = useState(false)
    const [dataSubmit, setDataSubmit] = useState<SubjectClass[]>([])
    const { options, getExamTypeLabel } = useExamTypeOptions()

    const where = useMemo(
        () => ({
            name: { contains: filters.name, mode: 'insensitive' as const },
            code: { contains: filters.code, mode: 'insensitive' as const },
            ...(filters.examType
                ? {
                      examType: {
                          in: filters.examType,
                      },
                  }
                : {}),
            ...(filters.schedule
                ? {
                      schedule: {
                          in: filters.schedule,
                      },
                  }
                : {}),
            semester: {
                ...(filters.semesterStartId ? { id: filters.semesterStartId } : {}),
                ...(filters.trainingCourseId
                    ? {
                          trainingCoursesStart: {
                              some: { id: filters.trainingCourseId },
                          },
                      }
                    : {}),
            },
            ...(filters.trainingMajorId
                ? {
                      subject: {
                          managementOrganization: {
                              trainingMajors: {
                                  some: {
                                      id: filters.trainingMajorId,
                                  },
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.organization
                ? {
                      managementOrganizationId: {
                          in: filters.organization,
                      },
                  }
                : {}),
            ...(filters.lecturerId?.length === 1
                ? {
                      ...(filters.lecturerId[0]
                          ? { lecturerId: { not: null } }
                          : { lecturerId: null }),
                  }
                : {}),
            ...(filters.mainLecturer
                ? {
                      mainLecturer: {
                          userProfile: {
                              OR: [
                                  {
                                      firstName: {
                                          contains: filters.mainLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                                  {
                                      lastName: {
                                          contains: filters.mainLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                              ],
                          },
                      },
                  }
                : {}),
            ...(filters.extraLecturer
                ? {
                      extraLecturer: {
                          userProfile: {
                              OR: [
                                  {
                                      firstName: {
                                          contains: filters.extraLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                                  {
                                      lastName: {
                                          contains: filters.extraLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                              ],
                          },
                      },
                  }
                : {}),
        }),
        [
            filters.name,
            filters.code,
            filters.examType,
            filters.schedule,
            filters.semesterStartId,
            filters.trainingCourseId,
            filters.trainingMajorId,
            filters.organization,
            filters.lecturerId,
            filters.mainLecturer,
            filters.extraLecturer,
        ]
    )

    const { data = [], refetch } = useFindManySubjectClass({
        where,
        include: {
            semester: true,
            mainLecturer: {
                include: {
                    userProfile: true,
                },
            },
            subject: {
                include: {
                    managementOrganization: true,
                },
            },
            extraLecturer: {
                include: {
                    userProfile: true,
                },
            },
            enterGradeLecturer: {
                include: {
                    userProfile: true,
                },
            },
            room: {
                include: {
                    building: {
                        include: {
                            trainingLocation: true,
                        },
                    },
                },
            },
            subjectClassStudent: true,
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        subject: {
                            credit: filters.credit,
                        },
                    },
                ],
                !!filters.credit
            ),
            ...emptyObjectIf(
                [
                    {
                        maxStudent: filters.maxStudent,
                    },
                ],
                !!filters.maxStudent
            ),
            ...emptyObjectIf(
                [
                    {
                        subjectClassStudent: {
                            _count: filters.maxStudent,
                        },
                    },
                ],
                !!filters.maxStudent
            ),
            {
                createdAt: 'desc',
            },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubjectClass({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: manageOrgData = [] } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(manageOrgData)

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    const { data: lecturerData = [] } = useFindManyLecturer({
        include: {
            userProfile: true,
        },
    })
    async function handleChangeData() {
        try {
            showSpinner()
            const res = await putManySubjectClass(
                dataSubmit.map((subjectClass) => ({
                    id: subjectClass.id,
                    lecturerId: subjectClass.lecturerId ?? null,
                    extraLecturerId: subjectClass.extraLecturerId ?? null,
                    enterGradeLecturerId: subjectClass.enterGradeLecturerId ?? null,
                }))
            )
            if (res?.data?.failedIds?.length) {
                message.error(
                    `${res?.data?.failedIds?.length} lớp có lỗi khi phân công giảng dạy, vui lòng gửi lại`
                )
            } else {
                message.success('Phân công giảng dạy thành công')
            }
            await refetch()
            setIsEdit(false)
            setDataSubmit([...data])
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const { mutateAsync: deleteSubjectClass } = useDeleteSubjectClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await deleteSubjectClass({
                where: {
                    id,
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleChangeLecturer = (
        record: SubjectClass,
        value: string | undefined,
        objectIdName: string,
        objectName: string
    ) => {
        console.log(record)
        if (value) {
            const itemChange = lecturerData.find((i) => i?.id === value)

            setDataSubmit((prev) =>
                prev.map((subjectClass) =>
                    subjectClass.id === record.id
                        ? {
                              ...subjectClass,
                              [objectIdName]: value,
                              [objectName]: itemChange,
                              enterGradeLecturer: null,
                              enterGradeLecturerId: null,
                          }
                        : subjectClass
                )
            )
        } else {
            setDataSubmit((prev) =>
                prev.map((subjectClass) =>
                    subjectClass.id === record.id
                        ? {
                              ...subjectClass,
                              [objectIdName]: null,
                              [objectName]: null,
                              enterGradeLecturer: null,
                              enterGradeLecturerId: null,
                          }
                        : subjectClass
                )
            )
        }
    }

    const handleChangeEnterGradeLecturer = (record: SubjectClass, value: string | undefined) => {
        if (value) {
            const itemChange = lecturerData.find((i) => i?.id === value)
            setDataSubmit((prev) =>
                prev.map((subjectClass) =>
                    subjectClass.id === record.id
                        ? {
                              ...subjectClass,
                              enterGradeLecturerId: value,
                              enterGradeLecturer: itemChange,
                          }
                        : subjectClass
                )
            )
        } else {
            setDataSubmit((prev) =>
                prev.map((subjectClass) =>
                    subjectClass.id === record.id
                        ? {
                              ...subjectClass,
                              enterGradeLecturer: null,
                              enterGradeLecturerId: null,
                          }
                        : subjectClass
                )
            )
        }
    }

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutOpenSubjectClassModal',
    })

    const { onOpen: onOpenEditSubjectClass, onClose: onCloseEditSubjectClass } =
        useDisclosure<string>({
            tag: 'PutOneSubjectClassModal',
        })

    const handleModal = () => {
        onOpen()
    }

    const handleCancel = () => {
        setIsEdit(false)
        setDataSubmit([...data])
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (data) {
            setDataSubmit([...data])
        }
    }, [data?.length])

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Row gutter={[16, 16]} align="top">
                                <Col span={8}>
                                    <TreeSelectSemester
                                        filterTimeNow={true}
                                        onChange={(val) =>
                                            handleFilterChange('semesterStartId', val)
                                        }
                                    />
                                </Col>
                                <Col span={8}>
                                    <Select
                                        placeholder="Chọn khóa"
                                        options={trainingCourseData.map((i: TrainingCourse) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        })}
                                        style={{ width: '100%' }}
                                        onChange={(val) =>
                                            handleFilterChange('trainingCourseId', val)
                                        }
                                        allowClear
                                    />
                                </Col>
                                <Col span={8}>
                                    <Select
                                        placeholder="Chọn chuyên ngành"
                                        options={trainingMajorData.map((i: TrainingMajor) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        })}
                                        style={{ width: '100%' }}
                                        onChange={(val) =>
                                            handleFilterChange('trainingMajorId', val)
                                        }
                                    />
                                </Col>
                            </Row>
                        </Col>

                        <Col span={8}>
                            <Flex justify="end" gap={4}>
                                <Button
                                    onClick={() => handleModal()}
                                    //TODO: handle save
                                    type="primary"
                                >
                                    Thêm mới lớp MH
                                </Button>
                                <Button
                                    //TODO: handle export
                                    type="primary"
                                >
                                    <EditIcon stroke="white" />
                                    Nhập
                                </Button>
                                {isEdit ? (
                                    <>
                                        <Button
                                            //TODO: handle save
                                            onClick={() => handleChangeData()}
                                            type="primary"
                                            disabled={!dataSubmit.length}
                                        >
                                            Lưu
                                        </Button>
                                        <Button
                                            //TODO: handle cancel
                                            onClick={() => handleCancel()}
                                            type="primary"
                                            disabled={!dataSubmit.length}
                                        >
                                            Hủy
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setIsEdit(true)}
                                        //TODO: handle save
                                        type="primary"
                                        disabled={!dataSubmit.length}
                                    >
                                        PCGD
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
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
                                title: 'PCGD',
                                align: 'center',
                                width: 100,
                                dataIndex: 'lecturerId',
                                fixed: 'left',
                                type: 'select',
                                options: [
                                    { value: true, label: 'Đã phân công giảng dạy' },
                                    { value: false, label: 'Chưa phân công giảng dạy' },
                                ],
                                render: (value) => <Checkbox checked={!!value} />,
                            },
                            {
                                title: 'Mã lớp môn học',
                                dataIndex: 'code',
                                width: 150,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                width: 200,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'credit',
                                width: 120,
                                align: 'center',
                                type: 'order',
                                distinctFilters: ['maxStudent', 'subjectClassStudent'],
                                render: (__, record: { subject?: SubjectVersion }) =>
                                    record.subject?.credit ? record.subject?.credit : '',
                            },
                            {
                                title: 'Số SV tối đa',
                                dataIndex: 'maxStudent',
                                width: 150,
                                align: 'center',
                                type: 'order',
                                distinctFilters: ['credit', 'subjectClassStudent'],
                            },
                            {
                                title: 'Số SV',
                                dataIndex: 'subjectClassStudent',
                                width: 100,
                                align: 'center',
                                type: 'order',
                                distinctFilters: ['maxStudent', 'credit'],
                                render: (value) => (value?.length ? value?.length : ''),
                            },
                            {
                                title: 'Giảng viên 1',
                                width: 300,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'mainLecturer',
                                render: (__, record) => (
                                    <Select
                                        style={{ width: '100%' }}
                                        options={lecturerData
                                            .filter(
                                                (lecturer) =>
                                                    lecturer?.id !== record?.extraLecturerId
                                            )
                                            .map((i) => {
                                                return {
                                                    value: i?.id,
                                                    label: `${i.code} - ${i?.userProfile?.fullname ? i?.userProfile?.fullname : `${i?.userProfile?.firstName} ${i?.userProfile?.lastName}`}`,
                                                }
                                            })}
                                        value={record?.lecturerId}
                                        placeholder="Chọn giảng viên"
                                        onChange={(selectedValue) =>
                                            handleChangeLecturer(
                                                record as SubjectClass,
                                                selectedValue,
                                                'lecturerId',
                                                'mainLecturer'
                                            )
                                        }
                                        disabled={!isEdit}
                                    />
                                ),
                            },
                            {
                                title: 'Giảng viên 2',
                                width: 300,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'extraLecturer',
                                render: (__, record) => (
                                    <Select
                                        style={{ width: '100%' }}
                                        options={lecturerData
                                            .filter(
                                                (lecturer) => lecturer?.id !== record?.lecturerId
                                            )
                                            .map((i) => {
                                                return {
                                                    value: i?.id,
                                                    label: `${i.code} - ${i?.userProfile?.fullname ? i?.userProfile?.fullname : `${i?.userProfile?.firstName} ${i?.userProfile?.lastName}`}`,
                                                }
                                            })}
                                        value={record?.extraLecturerId || undefined}
                                        placeholder="Chọn giảng viên"
                                        onChange={(selectedValue) =>
                                            handleChangeLecturer(
                                                record as SubjectClass,
                                                selectedValue,
                                                'extraLecturerId',
                                                'extraLecturer'
                                            )
                                        }
                                        disabled={!isEdit}
                                    />
                                ),
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) =>
                                    getExamTypeLabel(record?.subject?.examType) || '',
                            },
                            {
                                title: 'Kíp học',
                                dataIndex: 'schedule',
                                align: 'center',
                                width: 100,
                                type: 'select',

                                options: Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(
                                    ([key, value_]) => {
                                        return {
                                            label: value_,
                                            value: key,
                                        }
                                    }
                                ),
                                render: (value: SubjectClassSchedule) =>
                                    SUBJECT_CLASS_SCHEDULE_TYPE[
                                        value as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE
                                    ],
                            },
                            {
                                title: 'Địa điểm',
                                dataIndex: 'room',
                                align: 'center',
                                width: 150,
                                type: 'input',
                                render: (value) =>
                                    value?.building?.trainingLocation?.name
                                        ? value?.building?.trainingLocation?.name
                                        : '',
                            },
                            {
                                title: 'Giảng viên nhập điểm',
                                width: 300,
                                align: 'center',
                                render: (record) => (
                                    <Select
                                        style={{ width: '100%' }}
                                        options={
                                            record?.mainLecturer && record?.extraLecturer
                                                ? [
                                                      {
                                                          label: `${record?.mainLecturer?.code} - ${record?.mainLecturer?.userProfile?.fullname}`,
                                                          value: record?.lecturerId,
                                                      },
                                                      {
                                                          label: `${record?.extraLecturer?.code} - ${record?.extraLecturer?.userProfile?.fullname}`,
                                                          value: record?.extraLecturerId,
                                                      },
                                                  ]
                                                : record?.mainLecturer
                                                  ? [
                                                        {
                                                            label: `${record?.mainLecturer?.code} - ${record?.mainLecturer?.userProfile?.fullname}`,
                                                            value: record?.lecturerId,
                                                        },
                                                    ]
                                                  : record?.extraLecturer
                                                    ? [
                                                          {
                                                              label: `${record?.extraLecturer?.code} - ${record?.extraLecturer?.userProfile?.fullname}`,
                                                              value: record?.extraLecturerId,
                                                          },
                                                      ]
                                                    : []
                                        }
                                        value={record?.enterGradeLecturerId || undefined}
                                        placeholder="Chọn giảng viên"
                                        onChange={(selectedValue) =>
                                            handleChangeEnterGradeLecturer(
                                                record as SubjectClass,
                                                selectedValue
                                            )
                                        }
                                        disabled={!isEdit && record?.lecturerId}
                                    />
                                ),
                            },
                            {
                                title: 'Phòng học',
                                dataIndex: 'room',
                                align: 'center',
                                width: 120,
                                render: (value) => value?.name || '',
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'examDate',
                                align: 'center',
                                width: 100,
                                render: (value) => (value ? formatDate(value) : ''),
                            },

                            {
                                title: 'Hạn PCGD',
                                dataIndex: 'lecturerAssignmentDeadline',
                                width: 120,
                                align: 'center',
                                render: (value) => (value ? formatDate(value) : ''),
                            },
                            {
                                title: 'Hạn nhập điểm CC/TX',
                                dataIndex: 'scoreDeadline',
                                width: 200,
                                align: 'center',
                                render: (value) => (value ? formatDate(value) : ''),
                            },
                            {
                                title: 'Hạn nhập điểm thi',
                                dataIndex: 'examScoreDeadline',
                                width: 170,
                                align: 'center',
                                render: (value) => (value ? formatDate(value) : ''),
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'subject',
                                width: 200,
                                align: 'center',
                                type: 'tree_select',
                                options: treeData,
                                render: (value) => value?.managementOrganization?.sTen || '',
                            },
                            // {
                            //     title: 'Điểm bằng nhau',
                            //     dataIndex: 'subject',
                            //     width: 150,
                            //     align: 'center',
                            //     render: (value) => (
                            //         <Checkbox checked={value.subjectEquivalentType} disabled />
                            //     ),
                            // },
                            // {
                            //     title: 'Lớp liên kết',
                            //     dataIndex: 'lopLienKet',
                            //     width: 150,
                            //     align: 'center',
                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (record, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {/* <Tooltip
                                                    title="Xem chi tiết"
                                                    placement="leftTop"
                                                >
                                                    <EyeOutlined
                                                        onClick={onOpen.bind(
                                                            null,
                                                            id
                                                        )}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </Tooltip> */}
                                                <EditIcon
                                                    onClick={onOpenEditSubjectClass.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
                                                    disabled={
                                                        record?.subjectClassStudent?.length > 0
                                                    }
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataSubmit}
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

TeachingAssignment.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
