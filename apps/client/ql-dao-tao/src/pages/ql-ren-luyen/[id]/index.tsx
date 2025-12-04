import Table from '@components/commons/table'
import ApproveIcon from '@components/icons/approve'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import {
    useStudentTrainingTypeOptions,
    useTrainingScoreStatusStatusOptions,
} from '@hooks/studentTrainingType'
import DefaultLayout from '@layouts/default-layout'
import type { StudentTrainingType } from '@workspace/db/client'
import {
    useCountStudent,
    useFindManyStudent,
    useFindManyStudentTrainingScore,
    useFindUniqueTrainingScoreSession,
    useUpdateManyStudentTrainingScore,
    useUpdateStudentTrainingScore,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Button, Col, Divider, Flex, message, Popover, Row, Select, Tag } from 'antd'
import { Save } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import LopBienCheItem from './lop-bien-che'

export default function SubjectClassScore() {
    const router = useRouter()
    const { can, canSome } = useAbility()
    const id = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(50)
    const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)
    const {
        options: studentTrainingTypeOptions,
        getStudentTrainingTypeLabel,
        getStudentTrainingTypeColor,
    } = useStudentTrainingTypeOptions()
    const {
        statusOptions: trainingScoreStatusOptions,
        getTrainingScoreStatusLabel,
        getTrainingScoreStatusColor,
    } = useTrainingScoreStatusStatusOptions()
    const [openApprove, setOpenApprove] = useState(false)
    const [openRank, setOpenRank] = useState(false)
    const [defaultTrainingType, setDefaultTrainingType] = useState<StudentTrainingType>()

    const { mutateAsync: updateTrainingScore } = useUpdateStudentTrainingScore()
    const { mutateAsync: updateManyTrainingScore } = useUpdateManyStudentTrainingScore()

    const [editableData, setEditableData] = useState<
        Map<
            string,
            {
                studentId: string
                scoreId?: string
                score?: number
                studentTrainingType?: StudentTrainingType
            }
        >
    >(new Map())

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue, refetch: refetchSession } = useFindUniqueTrainingScoreSession(
        {
            where: { id },
            include: {
                semester: { include: { schoolYear: true } },
                trainingObjectType: true,
            },
        },
        { enabled: !!id }
    )

    const { data = [], refetch } = useFindManyStudent(
        {
            where: {
                fixedClassId: selectedFixedClass,
            },
            include: {
                userProfile: true,
            },
            orderBy: {
                userProfile: {
                    firstName: 'asc',
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!selectedFixedClass,
        }
    )

    const { data: count } = useCountStudent(
        {
            where: {
                fixedClassId: selectedFixedClass || '',
                deletedAt: null,
            },
        },
        {
            enabled: !!selectedFixedClass,
        }
    )

    const { data: studentTrainingScoreData = [], refetch: refetchStudentTrainingScore } =
        useFindManyStudentTrainingScore(
            {
                where: {
                    trainingScoreSessionId: id,
                    student: {
                        fixedClassId: selectedFixedClass,
                    },
                },
                orderBy: {
                    student: {
                        userProfile: {
                            firstName: 'asc',
                        },
                    },
                },
            },
            {
                enabled: !!selectedFixedClass,
            }
        )

    const handleApprove = (id: string) => {
        updateTrainingScore({
            where: { id: id },
            data: { status: 'APPROVED' },
        }).then(() => {
            message.success('Đã duyệt')
        })
    }

    const handleApproveAll = () => {
        updateManyTrainingScore({
            where: {
                trainingScoreSessionId: id,
                student: { fixedClassId: selectedFixedClass },
            },
            data: { status: 'APPROVED' },
        }).then(() => {
            message.success('Đã duyệt')
        })
    }

    const mergedData = useMemo(() => {
        if (!data) return []

        return data.map((student) => {
            const scoreInfo = studentTrainingScoreData.find((s) => s.studentId === student.id)

            return {
                ...student,
                scoreId: scoreInfo?.id ?? null,
                score: scoreInfo?.score ?? null,
                studentTrainingType: scoreInfo?.studentTrainingType ?? null,
                scoreStatus: scoreInfo?.status ?? null,
            }
        })
    }, [data, studentTrainingScoreData])

    useEffect(() => {
        if (selectedFixedClass) setEditableData(new Map())
    }, [selectedFixedClass])

    const handleChangeFixedClass = (id: string) => {
        try {
            showSpinner()
            const classId = id.includes('class-') ? id.replace('class-', '') : id
            setSelectedFixedClass(classId)
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleSave = async () => {
        try {
            showSpinner()

            const commands = Array.from(
                editableData.values().map((value) => ({
                    model: 'StudentTrainingScore' as const,
                    operation: 'upsert',
                    data: {
                        where: {
                            trainingScoreSessionId_studentId: {
                                trainingScoreSessionId: id,
                                studentId: value.studentId,
                            },
                        },
                        create: {
                            trainingScoreSessionId: id,
                            studentId: value.studentId,
                            score: value.score,
                            studentTrainingType: value.studentTrainingType,
                        },
                        update: {
                            score: value.score,
                            studentTrainingType: value.studentTrainingType,
                        },
                    },
                }))
            )

            await sqlTransaction(commands)
            await refetchStudentTrainingScore()

            message.success('Lưu điểm rèn luyện thành công')
            editableData.clear()
            refetch()
            // setEditableData(new Map())
        } catch (error) {
            message.error('Đã xảy ra lỗi khi lưu điểm rèn luyện')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Divider orientation="left" className="bg-white rounded-lg shadow-sm py-2">
                Đợt rèn luyện:{' '}
                {[
                    initialValue?.name,
                    initialValue?.trainingObjectType?.name,
                    initialValue?.semester?.name,
                    initialValue?.semester?.schoolYear?.name,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <div className="flex gap-2 mr-2">
                <Col span={4} className="bg-white rounded-lg shadow-sm">
                    <LopBienCheItem
                        onChangeSelected={handleChangeFixedClass}
                        objectTrainingTypeId={initialValue?.trainingObjectTypeId}
                    />
                </Col>
                <Col span={20} className="bg-white rounded-lg shadow-sm p-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Flex justify="end" gap={4}>
                                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN, 'DUYET') && (
                                    <Popover
                                        content={
                                            <div className="max-w-56">
                                                <Col span={24} className="text-right mt-4">
                                                    <Button
                                                        type="primary"
                                                        onClick={(value) => {
                                                            handleApproveAll()
                                                            setOpenApprove(false)
                                                        }}
                                                    >
                                                        Xác nhận
                                                    </Button>
                                                </Col>
                                            </div>
                                        }
                                        title="Phê duyệt toàn bộ"
                                        trigger="click"
                                        placement="bottomRight"
                                        open={openApprove}
                                        onOpenChange={setOpenApprove}
                                    >
                                        <Button
                                            type="primary"
                                            disabled={
                                                !mergedData.some((s) => s.scoreStatus === 'PENDING')
                                            }
                                        >
                                            Phê duyệt
                                        </Button>
                                    </Popover>
                                )}

                                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN, 'SUA') && (
                                    <>
                                        <Popover
                                            content={
                                                <div className="max-w-56">
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        value={defaultTrainingType}
                                                        onChange={(value) => {
                                                            setDefaultTrainingType(value)
                                                        }}
                                                        options={studentTrainingTypeOptions.map(
                                                            (opt) => ({
                                                                label: (
                                                                    <Tag color={opt.color}>
                                                                        {opt.label}
                                                                    </Tag>
                                                                ),
                                                                value: opt.value,
                                                            })
                                                        )}
                                                        tagRender={(props) => (
                                                            <Tag
                                                                color={getStudentTrainingTypeColor(
                                                                    props.value
                                                                )}
                                                            >
                                                                {props.label}
                                                            </Tag>
                                                        )}
                                                    />
                                                    <Col span={24} className="text-right mt-4">
                                                        <Button
                                                            type="primary"
                                                            disabled={!defaultTrainingType}
                                                            onClick={(value) => {
                                                                if (!defaultTrainingType) return
                                                                setEditableData((prev) => {
                                                                    return new Map(
                                                                        mergedData
                                                                            .filter(
                                                                                (s) =>
                                                                                    !prev.has(
                                                                                        s.id
                                                                                    ) ||
                                                                                    !s.studentTrainingType
                                                                            )
                                                                            .map((s) => [
                                                                                s.id,
                                                                                {
                                                                                    ...s,
                                                                                    studentId: s.id,
                                                                                    scoreId:
                                                                                        s.scoreId ||
                                                                                        undefined,
                                                                                    score: undefined,
                                                                                    studentTrainingType:
                                                                                        defaultTrainingType,
                                                                                },
                                                                            ])
                                                                    )
                                                                })
                                                                setOpenRank(false)
                                                            }}
                                                        >
                                                            Xác nhận
                                                        </Button>
                                                    </Col>
                                                </div>
                                            }
                                            title="Đặt xếp loại mặc định"
                                            trigger="click"
                                            placement="bottomRight"
                                            open={openRank}
                                            onOpenChange={setOpenRank}
                                        >
                                            <Button
                                                type="primary"
                                                disabled={
                                                    !mergedData.some((s) => !s.studentTrainingType)
                                                }
                                            >
                                                Xếp loại mặc định
                                            </Button>
                                        </Popover>
                                        <Button
                                            type="primary"
                                            disabled={
                                                !selectedFixedClass || editableData.size === 0
                                            }
                                            onClick={handleSave}
                                        >
                                            <Save stroke="white" />
                                            Lưu
                                        </Button>
                                    </>
                                )}
                            </Flex>
                        </Col>
                        <Col span={24}>
                            <Table
                                rowKey="id"
                                id="training-category"
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 60,
                                        align: 'center',
                                        fixed: 'left',
                                        render: (_, __, index) =>
                                            index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                    },
                                    {
                                        title: 'Mã sinh viên',
                                        align: 'center',
                                        width: 150,
                                        render: (_, record) => record.code || '',
                                    },
                                    {
                                        title: 'Họ và tên',
                                        align: 'center',
                                        dataIndex: 'name',
                                        render: (_, record) => record?.userProfile?.fullname,
                                    },
                                    // {
                                    //     title: 'Điểm',
                                    //     align: 'center',
                                    //     dataIndex: 'name',
                                    //     width: 100,
                                    //     render: (_, record) => (
                                    //         <InputNumber
                                    //             type="number"
                                    //             min={0}
                                    //             value={
                                    //                 editableData.get(record.id)?.score ??
                                    //                 record.score ??
                                    //                 undefined
                                    //             }
                                    //             onChange={(value) => {
                                    //                 setEditableData((prev) => {
                                    //                     const newMap = new Map(prev)

                                    //                     const entry = newMap.get(record.id)
                                    //                     if (entry) {
                                    //                         entry.score = value
                                    //                     } else {
                                    //                         newMap.set(record.id, {
                                    //                             studentId: record.id,
                                    //                             scoreId: record.id,
                                    //                             score: value,
                                    //                         })
                                    //                     }

                                    //                     return newMap
                                    //                 })
                                    //             }}
                                    //         />
                                    //     ),
                                    // },
                                    {
                                        title: 'Xếp loại',
                                        dataIndex: 'ranking',
                                        width: 250,
                                        align: 'center',
                                        render: (_, record) => {
                                            return record.scoreStatus === 'APPROVED' ||
                                                can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                                    'SUA'
                                                ) ? (
                                                <Tag
                                                    color={getStudentTrainingTypeColor(
                                                        record.studentTrainingType
                                                    )}
                                                >
                                                    {getStudentTrainingTypeLabel(
                                                        record.studentTrainingType
                                                    )}
                                                </Tag>
                                            ) : (
                                                <Select
                                                    style={{ width: '100%' }}
                                                    value={
                                                        editableData.get(record.id)
                                                            ?.studentTrainingType ??
                                                        record.studentTrainingType ??
                                                        undefined
                                                    }
                                                    onChange={(value) => {
                                                        setEditableData((prev) => {
                                                            const newMap = new Map(prev)

                                                            const entry = newMap.get(record.id)
                                                            if (entry) {
                                                                entry.studentTrainingType = value
                                                            } else {
                                                                newMap.set(record.id, {
                                                                    studentId: record.id,
                                                                    scoreId: record.id,
                                                                    studentTrainingType: value,
                                                                })
                                                            }

                                                            return newMap
                                                        })
                                                    }}
                                                    options={studentTrainingTypeOptions.map(
                                                        (opt) => ({
                                                            label: (
                                                                <Tag color={opt.color}>
                                                                    {opt.label}
                                                                </Tag>
                                                            ),
                                                            value: opt.value,
                                                        })
                                                    )}
                                                    tagRender={(props) => (
                                                        <Tag
                                                            color={getStudentTrainingTypeColor(
                                                                props.value
                                                            )}
                                                        >
                                                            {props.label}
                                                        </Tag>
                                                    )}
                                                />
                                            )
                                        },
                                    },
                                    {
                                        title: 'Trạng thái',
                                        align: 'center',
                                        dataIndex: 'name',
                                        width: 150,
                                        render: (_, record) => (
                                            <Tag
                                                color={getTrainingScoreStatusColor(
                                                    record.scoreStatus
                                                )}
                                            >
                                                {getTrainingScoreStatusLabel(record.scoreStatus)}
                                            </Tag>
                                        ),
                                    },
                                    {
                                        title: 'Thao tác',
                                        dataIndex: 'action',
                                        width: 100,
                                        align: 'center',
                                        hidden: !canSome(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                            'DUYET'
                                        ),
                                        render: (text, record) => (
                                            <Row className="justify-center gap-2">
                                                <ApproveIcon
                                                    disabled={record.scoreStatus === 'APPROVED'}
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleApprove(record.scoreId)
                                                            e?.stopPropagation()
                                                        },
                                                        onCancel: (e) => {
                                                            e?.stopPropagation()
                                                        },
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Row>
                                        ),
                                    },
                                ]}
                                data={mergedData}
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
                </Col>
            </div>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
