import Table from '@components/commons/table'
import type { FilterSurveyQuestionProps } from '@components/filter/filter-survey-question'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutExam } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useExamStatusOptions } from '@hooks/exam-status'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useCountExam, useFindManyExam, useUpdateExam } from '@workspace/db/hooks'
import { Button, Checkbox, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Filter = FilterSurveyQuestionProps & {
    searchText: string
}
function Exam() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { getExamStatusLabel, getExamStatusColor } = useExamStatusOptions()
    const [_searchText, setSearchText] = useState<string>('')

    const [filters, setFilters] = useState<Filter>({
        searchText: '',
        surveyQuestionTypeId: null,
        surveyId: null,
    })

    const { data = [], refetch } = useFindManyExam({
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountExam()

    const { onOpen } = useDisclosure<string>({
        tag: PutExam.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateExam } = useUpdateExam()
    async function handleDeleteExam(id: string) {
        try {
            showSpinner()
            await updateExam({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
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
                                title: 'Tên kỳ thi',
                                dataIndex: 'title',
                                fixed: 'left',
                                width: 220,
                            },
                            {
                                title: 'Thời gian bắt dầu',
                                dataIndex: 'startTime',
                                align: 'center',
                                width: 150,
                                render: (value) => dayjs(value).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Thời gian kết thúc',
                                dataIndex: 'endTime',
                                align: 'center',
                                width: 150,
                                render: (value) => dayjs(value).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Thời gian thi',
                                dataIndex: 'duration',
                                align: 'center',
                                width: 150,
                                render: (value) => {
                                    return <span>{value} phút</span>
                                },
                            },
                            {
                                title: 'Điểm đạt',
                                dataIndex: 'passScore',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Xáo trộn câu hỏi',
                                dataIndex: 'shuffleQuestions',
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Xáo trộn đáp án',
                                dataIndex: 'shuffleAnswers',
                                align: 'center',
                                width: 80,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Hiển thị kết quả ngay',
                                dataIndex: 'showResult',
                                align: 'center',
                                width: 100,
                                render: (value) => {
                                    return (
                                        <div className="flex items-center justify-center">
                                            <Checkbox checked={value} disabled />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'status',
                                align: 'center',
                                fixed: 'right',
                                width: 100,
                                render: (value) => {
                                    return (
                                        <Tag color={getExamStatusColor(value)}>
                                            {getExamStatusLabel(value)}
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={onOpen.bind(null, id)}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => handleDeleteExam(id),
                                            }}
                                        />
                                    </Row>
                                ),
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default Exam
Exam.getLayout = function getLayout(page: React.ReactNode) {
    return <DefaultLayout>{page}</DefaultLayout>
}
