import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountStudent,
    useCreateStudentTrainingScore,
    useFindManyStudent,
    useFindManyStudentTrainingScore,
    useFindUniqueTrainingScoreSession,
    useUpdateStudentTrainingScore,
} from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, message, Row } from 'antd'
import { Save } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useState } from 'react'
import LopBienCheItem from './lop-bien-che'

export default function SubjectClassScore() {
    const router = useRouter()
    const id = router.query.id as string
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)
    const [scoreList, setScoreList] = useState<{ studentId: string; trainingScore: number }[]>([])

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue } = useFindUniqueTrainingScoreSession(
        {
            where: { id },
            include: { semester: { include: { schoolYear: true } }, trainingObjectType: true },
        },
        { enabled: !!id }
    )

    const { data: dataTable = [], refetch } = useFindManyStudent(
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

    const { data: studentTrainingScoreData = [] } = useFindManyStudentTrainingScore({
        where: {
            trainingScoreSessionId: id,
            student: {
                fixedClassId: selectedFixedClass,
            },
        },
    })

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

    const { mutateAsync: createStudentTrainingScore } = useCreateStudentTrainingScore()
    const { mutateAsync: updateStudentTrainingScore } = useUpdateStudentTrainingScore()
    // const handleSave = async () => {
    //     try {
    //         showSpinner()
    //         // Lưu điểm rèn luyện
    //         console.log('Saving training scores:', scoreList, studentTrainingScoreData)
    //         for (const score of scoreList) {
    //             // Kiểm tra nếu điểm rèn luyện đã tồn tại
    //             const existingScore = studentTrainingScoreData.find(
    //                 (s) =>
    //                     s.studentId === score.studentId &&
    //                     s.trainingScoreSessionId === selectedTrainingScoreSessionId
    //             )

    //             if (existingScore) {
    //                 // Cập nhật điểm rèn luyện
    //                 console.log('Existing score:', existingScore)
    //                 await updateStudentTrainingScore({
    //                     where: { id: existingScore.id },
    //                     data: { score: score.trainingScore },
    //                 })
    //             } else {
    //                 // Tạo mới điểm rèn luyện
    //                 console.log('Creating new score for student:', score.studentId)
    //                 await createStudentTrainingScore({
    //                     data: {
    //                         studentId: score.studentId,
    //                         trainingScoreSessionId: selectedTrainingScoreSessionId ?? '',
    //                         score: score.trainingScore,
    //                     },
    //                 })
    //             }
    //             // Gọi API để lưu điểm rèn luyện cho từng sinh viên
    //             // Ví dụ: await saveTrainingScore(score.id, score.trainingScore)
    //             console.log(`Saving score for student ${score.studentId}: ${score.trainingScore}`)
    //         }
    //         message.success('Lưu điểm rèn luyện thành công')
    //     } catch (error) {
    //         message.error('Đã xảy ra lỗi khi lưu điểm rèn luyện')
    //     } finally {
    //         hideSpinner()
    //     }
    // }

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
                                    // onClick={handleSave}
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
                                        render: (text, record) => record?.userProfile?.fullname,
                                    },
                                    {
                                        title: 'Điểm',
                                        align: 'center',
                                        dataIndex: 'name',
                                        width: 100,
                                    },
                                    {
                                        title: 'Xếp loại',
                                        dataIndex: 'ranking',
                                        width: 100,
                                        align: 'center',
                                        render: (text, record) => {
                                            return (
                                                <Select
                                                    placeholder="Chọn xếp loại"
                                                    style={{ width: '100%' }}
                                                    value={
                                                        scoreList.find(
                                                            (s) => s.studentId === record.id
                                                        )?.trainingScore || 0 // Mặc định là 0
                                                    }
                                                    allowClear
                                                    onChange={(value) => {
                                                        // Cập nhật điểm rèn luyện trong scoreList
                                                        setScoreList((prev) => {
                                                            const newList = [...prev]
                                                            const index = newList.findIndex(
                                                                (item) =>
                                                                    item.studentId === record.id
                                                            )
                                                            if (index !== -1) {
                                                                newList[index].trainingScore =
                                                                    value as number
                                                            } else {
                                                                newList.push({
                                                                    studentId: record.id,
                                                                    trainingScore: value as number,
                                                                })
                                                            }
                                                            return newList
                                                        })
                                                    }}
                                                />
                                            )
                                        },
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
                </Col>
            </div>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
