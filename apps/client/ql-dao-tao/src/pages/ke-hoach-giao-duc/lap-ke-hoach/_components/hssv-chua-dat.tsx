import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useFindManyFixedClass, useFindManyTrainingCourse } from '@workspace/db/hooks'
import { useOpenSubjectClassRetakeStudents } from '@workspace/libs/api/training'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Form, Input, Row, Select } from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { type Key, useCallback, useMemo, useState } from 'react'

interface FilterProps {
    searchText?: string | null
    trainingCourseId?: string
    fixedClassId?: string
}

interface RegisterClassProps {
    subjectVersionId?: string
    viewOnly?: boolean
}

export default function HSSVChuaDat({ subjectVersionId, viewOnly }: RegisterClassProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(50)
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

    const [filters, setFilters] = useState<FilterProps>({
        searchText: undefined,
        trainingCourseId: undefined,
        fixedClassId: undefined,
    })
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: {
            name: 'asc',
        },
        where: {
            active: true,
            trainingObjectTypeId,
        },
    })

    const { data: res, refetch } = useOpenSubjectClassRetakeStudents(
        {
            search: filters.searchText || undefined,
            trainingObjectTypeId: trainingObjectTypeId || '',
            trainingCourseId: filters.trainingCourseId,
            subjectVersionId: subjectVersionId || '',
            page: `${currentPage}`,
            pageSize: `${numberOfPages}`,
        },
        { query: { enabled: !!trainingObjectTypeId && !!subjectVersionId } }
    )
    // queryKey /api/subject-class/open-subject-class-retake

    const data = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])
    const countData = useMemo(() => (res?.status === 200 ? res?.data.count : 0), [res])

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        orderBy: {
            code: 'asc',
        },
        where: {
            active: true,
            trainingCourseId: filters.trainingCourseId,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const handleRowSelection = (keys: Key[]) => {
        setSelectedRowKeys(Array.isArray(keys) ? keys : [keys])
    }

    return (
        <Row gutter={[4, 0]}>
            <Col span={8}>
                <Form.Item className="mb-1" name="searchText">
                    <Input
                        id="search"
                        placeholder="Tìm kiếm HV/SV..."
                        onChange={(e) => handleFilterChange('searchText', e.target.value)}
                        style={{ height: 32 }}
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
            <Col span={7}>
                <Select
                    placeholder="Chọn khoá"
                    className="w-full"
                    options={trainingCourseData.map((i) => ({
                        value: i.id,
                        label: i.name,
                    }))}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    onChange={(value) => handleFilterChange('trainingCourseId', value)}
                />
            </Col>
            <Col span={7}>
                <Select
                    placeholder="Chọn lớp"
                    className="w-full"
                    dropdownStyle={{
                        width: '400px',
                    }}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={fixedClassData.map((i) => ({
                        value: i.id,
                        label: `${i.code} - ${i.name}`,
                    }))}
                    onChange={(value) => handleFilterChange('fixedClassId', value)}
                />
            </Col>
            {!viewOnly && (
                <Col span={2}>
                    <Button type="primary">Lưu</Button>
                </Col>
            )}
            <Col span={24}>
                <Table
                    rowKey="id"
                    className="mt-0"
                    data={data as any}
                    onRow={(record) => ({
                        onClick: () => {
                            const isSelected = selectedRowKeys.includes(record.id)
                            if (isSelected) {
                                setSelectedRowKeys(
                                    selectedRowKeys.filter((key) => key !== record.id)
                                )
                            } else {
                                setSelectedRowKeys([...selectedRowKeys, record.id])
                            }
                        },
                        style: { cursor: 'pointer' },
                        columnWidth: 35,
                    })}
                    rowSelection={
                        !viewOnly
                            ? {
                                  selectedRowKeys: selectedRowKeys,
                                  onChange: (selectedRowKeys) => {
                                      handleRowSelection(selectedRowKeys)
                                  },
                                  type: 'checkbox',
                                  columnWidth: 35,
                              }
                            : undefined
                    }
                    columns={[
                        {
                            title: 'TT',
                            width: 35,
                            align: 'center',
                            render: (_, __, index) =>
                                index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                        },
                        {
                            title: 'Mã',
                            dataIndex: 'code',
                            align: 'center',
                            width: 100,
                        },
                        {
                            title: 'Tên',
                            dataIndex: ['userProfile', 'fullname'],
                            align: 'center',
                            width: 200,
                            render: (text: string) => <p className="text-left">{text}</p>,
                        },
                        {
                            title: 'Lớp',
                            align: 'center',
                            width: 80,
                            dataIndex: ['fixedClass', 'code'],
                        },
                        {
                            title: 'Khoá',
                            align: 'center',
                            width: 80,
                            dataIndex: ['fixedClass', 'trainingCourse', 'name'],
                        },
                        {
                            title: 'Điểm',
                            align: 'center',
                            dataIndex: 'diem_cuoi',
                            width: 80,
                        },
                    ]}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: countData,
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
    )
}
