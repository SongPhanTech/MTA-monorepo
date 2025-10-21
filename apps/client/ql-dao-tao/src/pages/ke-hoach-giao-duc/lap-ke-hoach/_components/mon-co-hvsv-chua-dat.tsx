import { queryClient } from '@api/index'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { PlanTraining } from '@workspace/db/client'
import { $Enums, type TrainingMajor } from '@workspace/db/client'
import {
    useFindFirstPlanTraining,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useOpenSubjectClassRetake } from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface SubjectBySemesterForm {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
    subjectSelected?: Array<string>
}

export default function MonCoHVSVChuaDat() {
    const { canSome } = useAbility()
    const [form] = Form.useForm<SubjectBySemesterForm>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(100)
    const { id: semesterId } = useSemesterStore()
    const searchText = Form.useWatch('searchText', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const subjectSelected = Form.useWatch('subjectSelected', form) || []

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: res, refetch } = useOpenSubjectClassRetake(
        {
            search: searchText,
            trainingCourseId,
            trainingMajorId,
            trainingObjectTypeId: trainingObjectTypeId || '',
        },
        { query: { enabled: !!trainingObjectTypeId } }
    )

    const { data: planTrainingData } = useFindFirstPlanTraining(
        {
            where: {
                semesterId: semesterId as string,
                trainingObjectTypeId,
                planTrainingSubjects: {
                    some: {
                        subjectClassType: $Enums.SubjectClassType.RETAKE,
                    },
                },
            },
            select: {
                planTrainingSubjects: {
                    select: {
                        subjectVersionId: true,
                    },
                    where:{
                        subjectClassType: $Enums.SubjectClassType.RETAKE,
                    }
                },
            },
        },
        {
            enabled: !!semesterId && !!trainingObjectTypeId,
        }
    )

    const data = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])
    
    useEffect(() => {
        if (planTrainingData) {
            form.setFieldValue(
                'subjectSelected',
                planTrainingData.planTrainingSubjects.map((subject) => subject.subjectVersionId)
            )
        }
    }, [planTrainingData, form])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTraining'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTrainingDelay'] })
        }, 500),
        []
    )

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const onSubmit = async () => {
        try {
            if (!semesterId || !trainingObjectTypeId) return
            showSpinner()
            const subject = data.filter((subject) =>
                subjectSelected.includes(subject.id)
            )

            let planTraining = await sqlTransaction([
                {
                    model: 'PlanTraining',
                    operation: 'findFirst',
                    data: {
                        where: { semesterId, trainingObjectTypeId },
                    },
                },
            ])
            if (planTraining.status === 200 && !planTraining?.data?.[0]) {
                planTraining = await sqlTransaction([
                    {
                        model: 'PlanTraining',
                        operation: 'create',
                        data: {
                            data: { semesterId, trainingObjectTypeId },
                        },
                    },
                ])
            }

            const planTrainingId = (planTraining?.data?.[0] as PlanTraining)?.id
            if (!planTrainingId) {
                throw new Error('Kế hoạch đào tạo không tồn tại')
            }

            const res = await sqlTransaction([
                {
                    model: 'PlanTraining',
                    operation: 'update',
                    data: {
                        where: { id: planTrainingId },
                        data: {
                            planTrainingSubjects: {
                                deleteMany: {},
                            },
                        },
                    },
                },
                {
                    model: 'PlanTraining',
                    operation: 'update',
                    data: {
                        where: { id: planTrainingId },
                        data: {
                            planTrainingSubjects: {
                                create: subject.map((subject) => ({
                                    subjectVersionId: subject.id,
                                    subjectClassType: $Enums.SubjectClassType.RETAKE,
                                })),
                            },
                        },
                    },
                },
            ])
            if (res.status !== 200) {
                throw new Error('Lỗi khi lưu kế hoạch đào tạo')
            }
            message.success('Thêm môn học vào kế hoạch thành công')
            form.resetFields()
            debouncedRefetch()
        } catch (error) {
            message.error('Lưu kế hoạch môn thất bại')
            console.error(error)
        }
        hideSpinner()
    }

    return (
        <Form
            form={form}
            onValuesChange={(filter: SubjectBySemesterForm) => {
                if (!filter.subjectSelected) {
                    debouncedRefetch()
                }
            }}
        >
            <Row>
                <Col span={20}>
                    <Flex gap={4}>
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
                    </Flex>
                </Col>
                <Col span={4}>
                    <Flex justify="end" gap={4}>
                        <Button onClick={onSubmit} type="primary">
                            Lưu kế hoạch
                        </Button>
                    </Flex>
                </Col>
                <Col span={24}>
                    <Form.Item hidden name="subjectSelected" />
                    <Table
                        rowKey="subjectVersionId"
                        data={data}
                        rowSelection={{
                            type: 'checkbox',
                            checkStrictly: true,
                            selectedRowKeys: subjectSelected,
                            onChange: (selectedRowKeys) => {
                                form.setFieldValue('subjectSelected', selectedRowKeys)
                            },
                            columnWidth: 15,
                        }}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    const isSelected = subjectSelected.includes(
                                        record.subjectVersionId
                                    )
                                    if (isSelected) {
                                        form.setFieldValue(
                                            'subjectSelected',
                                            subjectSelected.filter(
                                                (id) => id !== record.subjectVersionId
                                            )
                                        )
                                    } else {
                                        form.setFieldValue('subjectSelected', [
                                            ...subjectSelected,
                                            record.subjectVersionId,
                                        ])
                                    }
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
                                dataIndex: 'subjectVersionCode',
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
