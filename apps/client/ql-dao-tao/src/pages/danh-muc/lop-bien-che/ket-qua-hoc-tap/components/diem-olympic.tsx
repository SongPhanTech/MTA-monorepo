import Table from '@components/commons/table'
import { ModalPrintToKQHT } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useFindManySemester } from '@workspace/db/hooks'
import { Button, Col, Flex, Row } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export default function OlympicScorePage({ student }: { student: any }) {
    const router = useRouter()
    const studentId = router.query.id as string
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [currentPage, setCurrentPage] = useState(1)
    const [filters, setFilters] = useState({
        searchText: '',
    })

    const { onOpen, onClose } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: ModalPrintToKQHT.name,
    })

    const { data = [], refetch } = useFindManySemester({
        where: {
            subjectClasses: {
                some: {
                    subjectClassStudent: {
                        some: {
                            studentId: studentId,
                        },
                    },
                },
            },
        },
        include: {
            subjectClasses: {
                where: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
                include: {
                    subjectClassStudent: {
                        include: {
                            subjectVersion: true,
                        },
                    },
                },
            },
            trainingCoursesStart: {
                include: {
                    scoreConverts: {
                        where: {
                            trainingCourseId:
                                (student?.fixedClass
                                    ?.trainingCourseId as string) || '',
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    // const { convertScore } = useScoreConverter(
    //     data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts
    // )

    // const debouncedRefetch = useCallback(
    //     _.debounce(() => {
    //         refetch()
    //     }, 500),
    //     []
    // )

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                {/* Row nút thêm */}
                <Row gutter={[8, 8]} align="top" justify="space-between">
                    {/* Hàng chứa các button */}
                    <Col xs={24}>
                        <Flex
                            justify="end"
                            wrap="wrap"
                            gap="8px"
                            className="mt-1"
                        >
                            <Button type="primary">Cộng điểm</Button>
                        </Flex>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Table
                    rowKey="key"
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) =>
                                index +
                                1 +
                                (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Cuộc thi',
                            align: 'center',
                            dataIndex: [
                                'subjectClassStudent',
                                '0',
                                'subjectVersion',
                                'code',
                            ],
                            width: 150,
                        },
                        {
                            title: 'Môn thi',
                            align: 'center',
                            dataIndex: [
                                'subjectClassStudent',
                                '0',
                                'subjectVersion',
                                'name',
                            ],
                            fixed: 'left',
                            width: 200,
                        },
                        {
                            title: 'Điểm cộng',
                            align: 'center',
                            dataIndex: [
                                'subjectClassStudent',
                                '0',
                                'attendanceScore',
                            ],
                            width: 130,
                        },
                        {
                            title: 'Thành tích',
                            align: 'center',
                            dataIndex: [
                                'subjectClassStudent',
                                '0',
                                'midtermScore',
                            ],
                            width: 150,
                        },
                        {
                            title: 'Ngày thi',
                            align: 'center',
                            dataIndex: [
                                'subjectClassStudent',
                                '0',
                                'examScore',
                            ],
                            width: 100,
                        },
                    ]}
                    pagination={{
                        hideOnSinglePage: true,
                    }}
                />
            </Col>
        </Row>
    )
}
