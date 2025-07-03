import Select from '@components/commons/select'
import TreeSelectSemester from '@components/commons/semester-select/TreeSelectSemester'
import Table from '@components/commons/table'
import { PutOpenClassModal } from '@components/modal'
import { CUSTOM_VI_LOCALE, DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Semester, TrainingObjectType } from '@workspace/db'
import {
    useCountStudent,
    useCreateStudentTrainingScore,
    useFindManyFixedClass,
    useFindManySemester,
    useFindManyStudent,
    useFindManyStudentTrainingScore,
    useFindManyTrainingObjectType,
    useFindManyTrainingScoreSession,
    useUpdateStudentTrainingScore,
} from '@workspace/db/hooks'
import { Col, DatePicker, Flex, Form, Input, message, Row, Tag } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'
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

    // #endregion
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: any) => {
            setSelectedRowKeys(selectedKeys)
            console.log(selectedKeys)
        },
    }

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
                                                    locale={CUSTOM_VI_LOCALE}
                                                    format="DD/MM/YYYY"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Flex>
                                </Col>

                                <Col span={6} />
                            </Row>
                            {/* <Row className="mt-4">
                                <Col span={20} className="flex">
                                    <Select
                                        placeholder="Chọn đợt đánh giá"
                                        style={{ width: 200, height: 40 }}
                                        options={trainingScoreSessionData.map((session) => ({
                                            value: session.id,
                                            label: session.name,
                                        }))}
                                        onChange={(value) => {
                                            handleFilterChange(
                                                'trainingScoreSessionId',
                                                value
                                            );
                                            setSelectedTrainingScoreSessionId(value);
                                        }}
                                    />
                                </Col>
                                <Col span={4} className="flex justify-end">
                                    <Flex justify="end" gap={4}>
                                        <Button
                                            type="primary"
                                            className="h-[40px]"
                                            disabled={!selectedFixedClass || !selectedTrainingScoreSessionId}
                                            onClick={handleSave}
                                        >
                                            <Save stroke="white" />
                                            Lưu
                                        </Button>
                                    </Flex>
                                </Col>
                            </Row> */}
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
                                        title: 'Kết quả rèn luyện',
                                        dataIndex: 'trainingScore',
                                        width: 80,
                                        align: 'center',
                                        render: (text, record) => {
                                            const scores = studentTrainingScoreData.filter(
                                                (s) => s.studentId === record.id
                                            )
                                            const score =
                                                scores.length > 0
                                                    ? scores.reduce(
                                                          (total, curr) => total + curr.score,
                                                          0
                                                      ) / scores.length
                                                    : null

                                            // Tính tổng số điểm theo loại trong đợt (cho tất cả sinh viên)
                                            const countByType = {
                                                'Xuất sắc': scores.filter((s) => s.score >= 9)
                                                    .length,
                                                Tốt: scores.filter(
                                                    (s) => s.score >= 8 && s.score < 9
                                                ).length,
                                                Khá: scores.filter(
                                                    (s) => s.score >= 7 && s.score < 8
                                                ).length,
                                                'Trung bình': scores.filter(
                                                    (s) => s.score >= 6 && s.score < 7
                                                ).length,
                                                Yếu: scores.filter(
                                                    (s) => s.score > 0 && s.score < 6
                                                ).length,
                                            }

                                            return (
                                                <div>
                                                    <div>{score !== null ? score : '-'}</div>
                                                    <div
                                                        style={{ fontSize: '0.8em', color: 'gray' }}
                                                    >
                                                        Xuất sắc: {countByType['Xuất sắc']} | Tốt:{' '}
                                                        {countByType.Tốt} | Khá: {countByType.Khá} |
                                                        Trung bình: {countByType['Trung bình']} |
                                                        Yếu: {countByType.Yếu}
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
                                            const scores = studentTrainingScoreData.filter(
                                                (s) => s.studentId === record.id
                                            )
                                            const score =
                                                scores.length > 0
                                                    ? scores.reduce(
                                                          (total, curr) => total + curr.score,
                                                          0
                                                      ) / scores.length
                                                    : 0
                                            let ranking = ''
                                            if (score >= 9) {
                                                ranking = 'Xuất sắc'
                                            } else if (score >= 8) {
                                                ranking = 'Tốt'
                                            } else if (score >= 7) {
                                                ranking = 'Khá'
                                            } else if (score >= 6) {
                                                ranking = 'Trung bình'
                                            } else if (score === 0) {
                                                ranking = ''
                                            } else {
                                                ranking = 'Yếu'
                                            }
                                            return (
                                                <Tag
                                                    color={
                                                        ranking === 'Xuất sắc'
                                                            ? 'green'
                                                            : ranking === 'Tốt'
                                                              ? 'blue'
                                                              : ranking === 'Khá'
                                                                ? 'orange'
                                                                : ranking === 'Trung bình'
                                                                  ? 'yellow'
                                                                  : 'red'
                                                    }
                                                >
                                                    {ranking}
                                                </Tag>
                                            )
                                        },
                                    },
                                ]}
                                data={dataTable}
                                pagination={{
                                    current: currentPage,
                                    pageSize: numberOfPages,
                                    total: count,
                                    onChange: setCurrentPage,
                                    onShowSizeChange: setNumberOfPages,
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
