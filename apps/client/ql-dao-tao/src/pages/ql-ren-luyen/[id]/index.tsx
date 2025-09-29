import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useStudentTrainingTypeOptions } from '@hooks/studentTrainingType'
import DefaultLayout from '@layouts/default-layout'
import type { StudentTrainingType } from '@workspace/db'
import {
    useCountStudent,
    useFindManyStudent,
    useFindManyStudentTrainingScore,
    useFindUniqueTrainingScoreSession,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Button, Col, Divider, Flex, InputNumber, message, Row, Select, Tag } from 'antd'
import { Save } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import LopBienCheItem from './lop-bien-che'

export default function SubjectClassScore() {
    const router = useRouter()
    const id = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)
    const {
        options: studentTrainingTypeOptions,
        getStudentTrainingTypeLabel,
        getStudentTrainingTypeColor,
    } = useStudentTrainingTypeOptions()

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
            include: { semester: { include: { schoolYear: true } }, trainingObjectType: true },
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

    const mergedData = useMemo(() => {
        if (!data) return []
        console.log(data)

        return data.map((student) => {
            const scoreInfo = studentTrainingScoreData.find((s) => s.studentId === student.id)

            return {
                ...student,
                scoreId: scoreInfo?.id ?? null,
                score: scoreInfo?.score ?? null,
                studentTrainingType: scoreInfo?.studentTrainingType ?? null,
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
                                <Button
                                    type="primary"
                                    disabled={!selectedFixedClass}
                                    onClick={handleSave}
                                >
                                    <Save stroke="white" />
                                    Lưu
                                </Button>
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
                                        width: 100,
                                        render: (_, record) => record.code || '',
                                    },
                                    {
                                        title: 'Họ và tên',
                                        align: 'center',
                                        dataIndex: 'name',
                                        width: 180,
                                        render: (_, record) => record?.userProfile?.fullname,
                                    },
                                    {
                                        title: 'Điểm',
                                        align: 'center',
                                        dataIndex: 'name',
                                        width: 100,
                                        render: (_, record) => (
                                            <InputNumber
                                                type="number"
                                                min={0}
                                                value={
                                                    editableData.get(record.id)?.score ??
                                                    record.score ??
                                                    undefined
                                                }
                                                onChange={(value) => {
                                                    setEditableData((prev) => {
                                                        const newMap = new Map(prev)

                                                        const entry = newMap.get(record.id)
                                                        if (entry) {
                                                            entry.score = value
                                                        } else {
                                                            newMap.set(record.id, {
                                                                studentId: record.id,
                                                                scoreId: record.id,
                                                                score: value,
                                                            })
                                                        }

                                                        return newMap
                                                    })
                                                }}
                                            />
                                        ),
                                    },
                                    {
                                        title: 'Xếp loại',
                                        dataIndex: 'ranking',
                                        width: 100,
                                        align: 'center',
                                        render: (_, record) => {
                                            return (
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
