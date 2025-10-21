import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { type TrainingMajor } from '@workspace/db/client'
import { useFindManyTrainingCourse, useFindManyTrainingMajor } from '@workspace/db/hooks'
import { useOpenSubjectClassRetake } from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, Row } from 'antd'
import { type Key, useMemo, useState } from 'react'

interface SubjectBySemesterForm {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
}

export default function MonCoHVSVChuaDat({
    setSubjectVersionId,
}: {
    setSubjectVersionId: (id: string) => void
}) {
    const { canSome } = useAbility()
    const [form] = Form.useForm<SubjectBySemesterForm>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(100)
    const { id: semesterId } = useSemesterStore()
    const searchText = Form.useWatch('searchText', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const [selectedRowKey, setSelectedRowKey] = useState<Key>('')
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: res } = useOpenSubjectClassRetake(
        {
            search: searchText,
            trainingCourseId,
            trainingMajorId,
            trainingObjectTypeId: trainingObjectTypeId || '',
        },
        { query: { enabled: !!trainingObjectTypeId } }
    )
    // queryKey /api/subject-class/open-subject-class-retake

    const data = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })

    return (
        <Form form={form}>
            <Row gutter={[8, 0]}>
                <Col span={8}>
                    <Form.Item className="mb-0" name="searchText">
                        <Input id="search" placeholder="Tìm kiếm" allowClear />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item className="mb-0" name="trainingMajorId" labelAlign="left">
                        <Select
                            placeholder="Chọn chuyên ngành đào tạo"
                            options={trainingMajorData.map((i: TrainingMajor) => ({
                                value: i.id,
                                label: i.name,
                            }))}
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item className="mb-0" name="trainingCourseId" labelAlign="left">
                        <Select
                            placeholder="Khoá đào tạo"
                            options={trainingCourseData.map((i) => ({
                                value: i.id,
                                label: i.name,
                            }))}
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item hidden name="subjectSelected" />
                    <Table
                        rowKey="id"
                        data={data as any}
                        rowSelection={{
                            selectedRowKeys: [selectedRowKey],
                            onChange: (selectedRowKeys) => {
                                setSelectedRowKey(selectedRowKeys?.[0] as string)
                                setSubjectVersionId(selectedRowKeys?.[0] as string)
                            },
                            type: 'radio',
                            columnWidth: 35,
                        }}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    setSelectedRowKey(record.id)
                                    setSubjectVersionId(record.id)
                                },
                            }
                        }}
                        columns={[
                            {
                                title: 'TT',
                                width: 35,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã MH',
                                dataIndex: 'code',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'subjectVersionName',
                                align: 'center',
                                render: (__, record) => {
                                    return <div className="text-left">{`${record?.name}`}</div>
                                },
                            },
                            {
                                title: 'Số SV nợ',
                                dataIndex: 'count',
                                width: 80,
                                align: 'center',
                            },
                        ]}
                        // pagination={{
                        //     current: currentPage,
                        //     pageSize: numberOfPages,
                        //     total: res?.data?.count ?? 0,
                        //     onChange: (page, pageSize) => {
                        //         if (numberOfPages === pageSize) {
                        //             setCurrentPage(page)
                        //         } else {
                        //             setCurrentPage(1)
                        //             setNumberOfPages(pageSize)
                        //         }
                        //     },
                        // }}
                    />
                </Col>
            </Row>
        </Form>
    )
}
