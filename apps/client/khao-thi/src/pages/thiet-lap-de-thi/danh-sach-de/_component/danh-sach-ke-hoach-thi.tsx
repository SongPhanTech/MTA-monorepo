import { Checkbox, Col, Flex, Input, Popover, Row } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { store } from '../index'
import { useCountExam, useCreateExam, useFindManyExam } from '@workspace/db/hooks'
import Table from '@components/commons/table'
import { cn } from '@workspace/ui/lib/utils'
import { SubjectClass } from '@workspace/db'

interface Props {
    setActiveKey: (key: string) => void
}

export default function DanhSachKeHoachThi({ setActiveKey }: Props) {
    const semesterId = localStorage.getItem('semesterId')
    const selectedExamId = useStore(store, (state) => state['selectedExamId'])
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(10)

    const updateStateselectedExamId = (value: string, item: string) => {
        store.setState((state:any) => {
            return {
                ...state,
                selectedExamId: value,
                subjectVersionId: item,
            }
        })
    }
    const [filters, setFilters] = useState<any>({
        searchText: '',
        examType: undefined,
        examRoom: undefined,
    })

    const where = useMemo(
        () => ({
            semesterId,
            ...(filters.searchText && {
                subjectVersion: {
                    OR: [
                        {
                            code: {
                                contains: filters.searchText,
                            },
                        },
                        {
                            name: {
                                contains: filters.searchText,
                            },
                        },
                    ],
                },
            }),
        }),
        [filters.searchText, semesterId]
    )

    const { data: exams = [], refetch: refetchExams } = useFindManyExam(
        {
            where,
            include: {
                subjectVersion: {
                    include: {
                        subject: true,
                        managementOrganization: true,
                    },
                },
                semester: true,
                examRooms: {
                    include: {
                        examList: true,
                        room: {
                            select: {
                                name: true,
                                examCapacity: true,
                            },
                        },
                    },
                },
                examBank: true,
                subjectClass:true
            },
            orderBy: {
                subjectVersionId: 'asc',
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!semesterId,
        }
    )

    const { data: count, refetch: refetchCount } = useCountExam(
        {
            where,
        },
        {
            enabled: !!semesterId,
        }
    )

    const { mutateAsync: createExam } = useCreateExam()

    // const rowSelection: TableRowSelection = {
    //     selectedRowKeys: selectedRowKeys,
    //     onChange: (selectedKeys: React.Key[], selectedRows) => {
    //         setSelectedRowKeys(selectedKeys)
    //         if (selectedKeys.length === 0) {
    //             setSelectedSubjectId(undefined)
    //             return
    //         }
    //         setSelectedSubjectId(selectedRows[0]?.subjectClass?.[0]?.subjectId)
    //     },
    //     getCheckboxProps(record) {
    //         return {
    //             disabled:
    //                 record.subjectClass?.[0]?.subjectId !== selectedSubjectId &&
    //                 selectedSubjectId !== undefined,
    //         }
    //     },
    //     hideSelectAll: true,
    //     columnWidth: 35,
    //     columnTitle: 'Ghép/Tách',
    // }

    const debouncedSearch = useCallback((value: string) => {
        setFilters((prev: any) => ({
            ...prev,
            searchText: value,
        }))
    }, [])

    const HighlightText = ({ text, searchText }: { text: string; searchText?: string }) => {
        if (!searchText) return <>{text}</>

        const parts = text.split(new RegExp(`(${searchText})`, 'gi'))

        return (
            <>
                {parts.map((part) =>
                    part.toLowerCase() === searchText.toLocaleLowerCase() ? (
                        <span key={part} className="text-yellow-800 bg-yellow-300 font-semibold">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </>
        )
    }

    return (
        <Row gutter={[8, 0]}>
            <Col span={24}>
                <Flex justify="space-between" align="center">
                    <Flex gap={8}>
                        <Input
                            placeholder="Tìm kiếm"
                            className="w-60"
                            allowClear
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                    </Flex>
                </Flex>
            </Col>

            <Col span={24}>
                <Table
                    rowKey="id"
                    style={{
                        marginTop: '10px',
                    }}
                    // rowSelection={{
                    //     type: 'checkbox',
                    //     ...rowSelection,
                    // }}
                    onRow={(record) => ({
                        // onClick: () => {
                        //     const selectedKeys = [...selectedRowKeys]
                        //     if (
                        //         selectedSubjectId &&
                        //         record.subjectClass?.[0]?.subjectId !== selectedSubjectId
                        //     ) {
                        //         return
                        //     }
                        //     const index = selectedKeys.indexOf(record.id)
                        //     if (index >= 0) {
                        //         selectedKeys.splice(index, 1)
                        //     } else {
                        //         selectedKeys.push(record.id)
                        //     }
                        //     setSelectedRowKeys(selectedKeys)
                        //     setSelectedSubjectId(
                        //         selectedKeys.length > 0
                        //             ? record.subjectClass?.[0]?.subjectId
                        //             : undefined
                        //     )
                        // },
                        className: cn(selectedExamId === record.id && 'bg-orange-100'),
                        onClick: (e) => {
                            const target = e.target as HTMLElement
                            if (
                                target.closest('.ant-select') ||
                                target.closest('.ant-popover') ||
                                target.closest('.ant-input') ||
                                target.closest('.ant-table-row-selection')
                            ) {
                                e.stopPropagation()
                                return
                            }
                            updateStateselectedExamId(record?.id, record?.subjectVersionId)
                        },
                    })}
                    data={exams}
                    columns={[
                        {
                            title: 'TT',
                            align: 'center',
                            width: 50,
                            render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                        },
                        {
                            title: 'Tên môn học',
                            align: 'center',
                            dataIndex: 'searchText',
                            type: 'input',
                            render: (_, record) => {
                                const name =
                                    `${record.subjectVersion?.code} - ${record.subjectVersion?.name}` ||
                                    ''
                                return (
                                    <div className="text-left">
                                        <HighlightText
                                            text={name}
                                            searchText={filters.searchText}
                                        />
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Số SV',
                            align: 'center',
                            width: 60,
                            render: (_, record) => {
                                let total = 0
                                record?.examRooms?.forEach((item: any) => {
                                    total += item?.examList?.length
                                })
                                return total
                            },
                        },
                        {
                            title: 'Khóa DTS',
                            align: 'center',
                            width: 100,
                            render: (_, record) => {
                                const lockExamSessions = record.lockExamSessions
                                return <Checkbox checked={lockExamSessions} />
                            },
                        },
                        {
                            title: 'Phòng thi',
                            align: 'center',
                            // dataIndex: 'examRoom',
                            // type:'input',
                            width: 150,
                            render: (_, record) => {
                                if (!record?.examRooms || record.examRooms?.length === 0) {
                                    return (
                                        <span className="text-gray-400 text-left">
                                            Chưa có phòng thi
                                        </span>
                                    )
                                }

                                const totalRooms = record.examRooms.length
                                const displayLimit = 3 // Hiển thị tối đa 3 phòng
                                const displayRooms = record.examRooms.slice(0, displayLimit)
                                const remainingCount = totalRooms - displayLimit

                                // Nội dung đầy đủ cho Popover
                                const fullContent = (
                                    <div className="max-h-60 overflow-y-auto">
                                        {record.examRooms.map((examRoom: any, index: number) => (
                                            <div key={examRoom.id} className="py-1">
                                                {examRoom.room?.name} - {examRoom.capacity} chỗ
                                            </div>
                                        ))}
                                    </div>
                                )

                                return (
                                    <div className="text-left">
                                        {displayRooms.map((examRoom: any, index: number) => (
                                            <div key={examRoom.id}>
                                                {examRoom.room?.name}- {examRoom.capacity} chỗ
                                            </div>
                                        ))}
                                        {remainingCount > 0 && (
                                            <Popover content={fullContent} title="Tất cả phòng thi">
                                                <span className="text-blue-600 cursor-pointer hover:underline">
                                                    + {remainingCount} phòng khác
                                                </span>
                                            </Popover>
                                        )}
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Số phòng thi',
                            align: 'center',
                            width: 120,
                            render: (_, record) => {
                                return record?.examRooms?.length
                            },
                        },
                        {
                            title: 'Số ca thi',
                            align: 'center',
                            width: 100,
                            render: (_, record) => {
                                return record?.session
                            },
                        },
                        {
                            title: 'Lớp môn học',
                            align: 'center',
                            width: 150,
                            render: (_, record) => {
                              return record?.subjectClass.length>0 ? record?.subjectClass.map((i:SubjectClass)=>i.name).join(', ') :''
                            },
                        },
                          {
                            title: 'Đã tạo đề',
                            align: 'center',
                            width: 100,
                            render: (_, record) => {
                                const lockExamSessions = record?.examBank?.length>0
                                return <Checkbox checked={lockExamSessions} />
                            },
                        },
                    ]}
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
    )
}
