import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import { PutOpenClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Semester, TrainingObjectType } from '@workspace/db'
import {
    useCountStudent,
    useCreateStudentTrainingScore,
    useCreateStudentTrainingSemester,
    useFindManyFixedClass,
    useFindManySemester,
    useFindManyStudent,
    useFindManyStudentTrainingScore,
    useFindManyStudentTrainingSemester,
    useFindManyTrainingObjectType,
    useFindManyTrainingScoreSession,
    useUpdateStudentTrainingScore,
    useUpdateStudentTrainingSemester,
} from '@workspace/db/hooks'
import { Button, Col, DatePicker, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import { Save, Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import LopBienCheItem from './lop-bien-che'

// const { Option } = Select;
interface FilterProps {
    semesterId: string | null //Học kỳ
    searchText: string | null
    trainingObjectTypeId: string | null
    fixedClassIds: string[]
    timeFilter?: [string, string] | null // Khoảng thời gian
}

export default function SubjectClassScore() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedFixedClass, setSelectedFixedClass] = useState<string | undefined>(undefined)
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined)
    const [selectedSemester, setSelectedSemester] = useState<Semester | undefined>(undefined)
    const [selectedTrainingScoreSessionId, setSelectedTrainingScoreSessionId] = useState<
        string | undefined
    >(undefined)
    const [scoreList, setScoreList] = useState<{ studentId: string; trainingScore: number }[]>([])

    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        semesterId: null,
        trainingObjectTypeId: null,
        timeFilter: undefined,
        fixedClassIds: [],
    })
    // TODO: Chưa biết cách tính rèn luyện DS nên tạm thời quy đổi rèn luyện thành điểm 0-10
    const optionsRank = [
        { value: 7, label: 'Xuất sắc' },
        { value: 6, label: 'Tốt' },
        { value: 5, label: 'Khá' },
        { value: 4, label: 'Trung bình khá' },
        { value: 3, label: 'Trung bình' },
        { value: 2, label: 'Yếu' },
        { value: 1, label: 'Kém' },
        { value: 0, label: 'Chưa xếp loại' },
    ]
    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: semesterData = [], refetch: refetchSemester } = useFindManySemester({
        orderBy: {
            startDate: 'desc',
        },
    })

    // const { data: subjectClassData = [] } = useFindManyFixedClass({
    const { data: fixedClassData = [] } = useFindManyFixedClass({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          { name: { contains: filters.searchText } },
                          { code: { contains: filters.searchText } },
                      ],
                  }
                : {}),
        },
        orderBy: {
            name: 'desc',
        },
    })

    const { data: dataTable = [], refetch } = useFindManyStudent({
        where: {
            fixedClassId: selectedFixedClass || '',
            deletedAt: null,
        },
        include: {
            userProfile: true,
            // fixedClass: true,
        },
        orderBy: {
            userProfile: {
                // lastName: 'asc',
                firstName: 'asc',
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: trainingScoreSessionData = [], refetch: refetchTrainingScoreSession } =
        useFindManyTrainingScoreSession({
            where: selectedSemesterId
                ? {
                      semesterId: selectedSemesterId,
                      ...(filters.trainingObjectTypeId
                          ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                          : {}),
                      ...(filters.timeFilter?.[0] && filters.timeFilter[1]
                          ? {
                                time: {
                                    gte: new Date(filters.timeFilter[0]).toISOString(),
                                    lte: new Date(filters.timeFilter[1]).toISOString(),
                                },
                            }
                          : {}),
                  }
                : {
                      // If no selectedSemesterId, return no data by using an impossible condition.
                      id: { equals: '' },
                  },
            orderBy: {
                createdAt: 'desc',
            },
        })

    const { data: studentTrainingScoreData = [], refetch: refetchStudentTrainingScore } =
        useFindManyStudentTrainingScore({
            where: {
                trainingScoreSessionId: {
                    in: trainingScoreSessionData.map((session) => session.id),
                },
            },
        })

    const { data: studentTrainingSemesterData = [] } = useFindManyStudentTrainingSemester({
        where: {
            semesterId: selectedSemesterId || '',
            student: {
                fixedClassId: selectedFixedClass || '',
            },
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
            refetchTrainingScoreSession()
            refetchStudentTrainingScore()
        }, 500),
        []
    )

    const { data: count } = useCountStudent({
        where: {
            fixedClassId: selectedFixedClass || '',
            deletedAt: null,
        },
    })

    const handleChangeFixedClass = async (id: string) => {
        try {
            showSpinner()
            console.log('Selected Fixed Class ID:', id)
            if (id.includes('class-')) {
                console.log('Selected Fixed Class ID 1:', id.replace('class-', ''))
                setSelectedFixedClass(id.replace('class-', ''))
            } else {
                console.log('Selected Fixed Class ID 2:', id)
                setSelectedFixedClass(id)
            }
            await refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleChangeSemester = async (id: string) => {
        try {
            showSpinner()
            console.log('Selected Semester ID:', id)
            setSelectedSemesterId(id)
            const semester = semesterData.find((sem: Semester) => sem.id === id)
            setSelectedSemester(semester)

            await refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { mutateAsync: createStudentTrainingSemester } = useCreateStudentTrainingSemester()
    const { mutateAsync: updateStudentTrainingSemester } = useUpdateStudentTrainingSemester()
    const handleSave = async () => {
        try {
            showSpinner()
            // Lưu điểm rèn luyện
            console.log('Saving training scores:', scoreList, studentTrainingSemesterData)
            for (const score of scoreList) {
                // Kiểm tra nếu điểm rèn luyện đã tồn tại
                const existingScore = studentTrainingSemesterData.find(
                    (s) => s.studentId === score.studentId && s.semesterId === selectedSemesterId
                )

                if (existingScore) {
                    // Cập nhật điểm rèn luyện
                    console.log('Existing score:', existingScore)
                    await updateStudentTrainingSemester({
                        where: { id: existingScore.id },
                        data: { score: score.trainingScore },
                    })
                } else {
                    // Tạo mới điểm rèn luyện
                    console.log('Creating new score for student:', score.studentId)
                    await createStudentTrainingSemester({
                        data: {
                            studentId: score.studentId,
                            semesterId: selectedSemesterId ?? '',
                            score: score.trainingScore,
                        },
                    })
                }
                // Gọi API để lưu điểm rèn luyện cho từng sinh viên
                // Ví dụ: await saveTrainingScore(score.id, score.trainingScore)
                console.log(`Saving score for student ${score.studentId}: ${score.trainingScore}`)
            }
            message.success('Lưu điểm rèn luyện thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi khi lưu điểm rèn luyện')
        } finally {
            hideSpinner()
        }
    }

    useEffect(() => {
        console.log('Student training score data changed:', studentTrainingSemesterData)
        if (studentTrainingSemesterData) {
            const initialScores = studentTrainingSemesterData.map((score) => ({
                studentId: score.studentId,
                trainingScore: score.score,
            }))
            setScoreList(initialScores)
        }
    }, [studentTrainingSemesterData])

    const { mutateAsync: createStudentTrainingScore } = useCreateStudentTrainingScore()
    const { mutateAsync: updateStudentTrainingScore } = useUpdateStudentTrainingScore()

    return (
        <div>
            {/* Từ ngày {selectedSemester?.startDate ? new Date(selectedSemester.startDate).toLocaleDateString('vi-VN') : ''} đến ngày {selectedSemester?.endDate ? new Date(selectedSemester.endDate).toLocaleDateString('vi-VN') : ''} */}
            <Row>
                <Col span={4} className="flex">
                    <LopBienCheItem
                        dataTable={fixedClassData.map((item) => ({
                            ...item,
                            code: item.code || '',
                        }))}
                        onChangeSelected={handleChangeFixedClass}
                        selectedItem={selectedFixedClass}
                    />
                </Col>
                <Col span={20} className="flex justify-end">
                    <Row>
                        <Col span={24}>
                            <Row gutter={[16, 16]} align="top" justify="space-between">
                                <Col span={12}>
                                    <Flex>
                                        <Col span={8}>
                                            <Form.Item name="searchText">
                                                <Input
                                                    id="search"
                                                    onChange={(e) =>
                                                        handleFilterChange(
                                                            'searchText',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Nhập tên lớp"
                                                    style={{
                                                        height: 40,
                                                    }}
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

                                        <Col span={8}>
                                            <Form.Item
                                                className="mb-0"
                                                name="semesterId"
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                labelAlign="left"
                                            >
                                                <TreeSelectSemester
                                                    style={{ height: 40 }}
                                                    placeholder="Học kỳ"
                                                    onChange={(val) => handleChangeSemester(val)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                className="mb-0"
                                                name="trainingObjectId"
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                labelAlign="left"
                                            >
                                                <Select
                                                    placeholder="Chọn đối tượng đào tạo"
                                                    options={trainingObjectTypeData.map(
                                                        (i: TrainingObjectType) => ({
                                                            value: i.id,
                                                            label: i.name,
                                                        })
                                                    )}
                                                    style={{
                                                        height: 40,
                                                    }}
                                                    onChange={(val) =>
                                                        handleFilterChange(
                                                            'trainingObjectTypeId',
                                                            val
                                                        )
                                                    }
                                                    allowClear
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={10} className="flex">
                                            <Form.Item
                                                className="mb-0"
                                                name="timeFilter"
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                                labelAlign="left"
                                            >
                                                <DatePicker.RangePicker
                                                    placeholder={['Từ ngày', 'Đến ngày']}
                                                    style={{ width: '100%', height: 40 }}
                                                    allowClear
                                                    onChange={(dates, dateStrings) => {
                                                        setFilters((prev) => ({
                                                            ...prev,
                                                            timeFilter: dateStrings.length
                                                                ? [dateStrings[0], dateStrings[1]]
                                                                : null,
                                                        }))
                                                    }}
                                                    format={{ format: 'DD/MM/YYYY', type: 'mask' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Flex>
                                </Col>

                                <Col span={6} />
                            </Row>
                            <Row className="mt-4">
                                <Col span={20} className="flex" />
                                <Col span={4} className="flex justify-end">
                                    <Flex justify="end" gap={4}>
                                        <Button
                                            type="primary"
                                            className="h-[40px]"
                                            disabled={!selectedFixedClass}
                                            onClick={handleSave}
                                        >
                                            <Save stroke="white" />
                                            Lưu
                                        </Button>
                                    </Flex>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Table
                                rowKey="id"
                                id="training-category"
                                // rowSelection={rowSelection}
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
                                        width: 150,
                                        render: (text, record) => (
                                            <>
                                                {record.userProfile?.lastName || ''}{' '}
                                                {record.userProfile?.firstName || ''} <br />
                                                {record.userProfile?.dateOfBirth
                                                    ? new Date(
                                                          record.userProfile.dateOfBirth
                                                      ).toLocaleDateString('vi-VN')
                                                    : ''}
                                            </>
                                        ),
                                    },
                                    {
                                        title: 'Kết quả rèn luyện trong học kỳ',
                                        dataIndex: 'trainingScore',
                                        width: 120,
                                        align: 'center',
                                        render: (text, record) => {
                                            const scores = studentTrainingScoreData.filter(
                                                (s) => s.studentId === record.id
                                            )

                                            // Tính tổng số điểm theo loại trong đợt (cho tất cả sinh viên)
                                            const countByType = {
                                                'Xuất sắc': scores.filter((s) => s.score === 7)
                                                    .length,
                                                Tốt: scores.filter((s) => s.score === 6).length,
                                                Khá: scores.filter((s) => s.score === 5).length,
                                                'Trung bình khá': scores.filter(
                                                    (s) => s.score === 4
                                                ).length,
                                                'Trung bình': scores.filter((s) => s.score === 3)
                                                    .length,
                                                Yếu: scores.filter((s) => s.score === 2).length,
                                                Kém: scores.filter((s) => s.score === 1).length,
                                            }

                                            return (
                                                <div>
                                                    <div
                                                        style={{ fontSize: '0.8em', color: 'gray' }}
                                                    >
                                                        {countByType['Xuất sắc'] > 0 && (
                                                            <>
                                                                Xuất sắc: {countByType['Xuất sắc']}{' '}
                                                                |{' '}
                                                            </>
                                                        )}
                                                        {countByType.Tốt > 0 && (
                                                            <>Tốt: {countByType.Tốt} | </>
                                                        )}
                                                        {countByType.Khá > 0 && (
                                                            <>Khá: {countByType.Khá} | </>
                                                        )}
                                                        {countByType['Trung bình khá'] > 0 && (
                                                            <>
                                                                Trung bình khá:{' '}
                                                                {countByType['Trung bình khá']} |{' '}
                                                            </>
                                                        )}
                                                        {countByType['Trung bình'] > 0 && (
                                                            <>
                                                                Trung bình:{' '}
                                                                {countByType['Trung bình']} |{' '}
                                                            </>
                                                        )}
                                                        {countByType.Yếu > 0 && (
                                                            <>Yếu: {countByType.Yếu} | </>
                                                        )}
                                                        {countByType.Kém > 0 && (
                                                            <>Kém: {countByType.Kém}</>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        },
                                    },
                                    {
                                        title: 'Xếp loại',
                                        dataIndex: 'ranking',
                                        width: 150,
                                        align: 'center',
                                        render: (text, record) => {
                                            return (
                                                <Select
                                                    placeholder="Chọn xếp loại"
                                                    style={{ width: '100%' }}
                                                    options={optionsRank}
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
            </Row>
        </div>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
