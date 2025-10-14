import { queryClient } from '@api/index'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { type TrainingMajor } from '@workspace/db'
import {
    useFindFirstPlanTrainingDelay,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useState } from 'react'

interface SubjectBySemesterForm {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
    subjectSelected?: Array<string>
}

export default function MonCham() {
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

    const { data: planTrainingDelayData } = useFindFirstPlanTrainingDelay(
        {
            where: {
                trainingObjectTypeId,
            },
            include: {
                subjects: {
                    include: {
                        managementOrganization: {
                            select: { sMa: true },
                        },
                    },
                    where: {
                        ...(searchText && searchText !== ''
                            ? {
                                  name: {
                                      contains: searchText,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...(trainingCourseId
                            ? {
                                  trainingCourseId,
                              }
                            : {}),
                        ...(trainingMajorId
                            ? {
                                  trainingMajorId,
                              }
                            : {}),
                    },
                    take: numberOfPages,
                    skip: (currentPage - 1) * numberOfPages,
                },
                _count: {
                    select: { subjects: true },
                },
                fixedClasses: true,
            },
        },
        {
            enabled: !!trainingObjectTypeId,
        }
    )

    const debouncedRefetch = useCallback(
        _.debounce(() => {
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
            // const delaySubject = data.filter(
            //     (subject) => !subjectSelected.includes(subject.subjectVersionId)
            // )

            // const fixedClasses = data.filter((subject) =>
            //     subjectSelected.includes(subject.subjectVersionId)
            // )
            // const fixedClassDelay = delaySubject.flatMap((subject) => subject.fixedClass)

            // let planTraining = await sqlTransaction([
            //     {
            //         model: 'PlanTraining',
            //         operation: 'findFirst',
            //         data: {
            //             where: { semesterId, trainingObjectTypeId },
            //         },
            //     },
            // ])
            // let planTrainingDelay = await sqlTransaction([
            //     {
            //         model: 'PlanTrainingDelay',
            //         operation: 'findFirst',
            //         data: {
            //             where: { semesterId, trainingObjectTypeId },
            //         },
            //     },
            // ])

            // if (planTraining.status === 200 && !planTraining?.data?.[0]) {
            //     planTraining = await sqlTransaction([
            //         {
            //             model: 'PlanTraining',
            //             operation: 'create',
            //             data: {
            //                 data: { semesterId, trainingObjectTypeId },
            //             },
            //         },
            //     ])
            // }

            // if (planTrainingDelay.status === 200 && !planTrainingDelay?.data?.[0]) {
            //     planTrainingDelay = await sqlTransaction([
            //         {
            //             model: 'PlanTrainingDelay',
            //             operation: 'create',
            //             data: {
            //                 data: { semesterId, trainingObjectTypeId },
            //             },
            //         },
            //     ])
            // }

            // if (planTraining.status !== 200 || planTrainingDelay.status !== 200) {
            //     throw new Error('Lỗi khi tạo kế hoạch đào tạo')
            // }

            // const planTrainingId = (planTraining?.data?.[0] as PlanTraining)?.id
            // if (!planTrainingId) {
            //     throw new Error('Kế hoạch đào tạo không tồn tại')
            // }
            // const planTrainingDelayId = (planTrainingDelay?.data?.[0] as PlanTrainingDelay)?.id
            // if (!planTrainingDelayId) {
            //     throw new Error('Kế hoạch đào tạo môn chậm tiến độ không tồn tại')
            // }

            // const res = await sqlTransaction([
            //     {
            //         model: 'PlanTraining',
            //         operation: 'update',
            //         data: {
            //             where: { id: planTrainingId },
            //             data: {
            //                 subjects: {
            //                     set: subjectSelected.map((subjectVersionId) => ({
            //                         id: subjectVersionId,
            //                     })),
            //                 },
            //                 fixedClasses: {
            //                     set: fixedClasses.flatMap((subject) =>
            //                         subject.fixedClass.map((fc) => ({
            //                             id: fc.fixedClassId,
            //                         }))
            //                     ),
            //                 },
            //             },
            //         },
            //     },
            //     {
            //         model: 'PlanTrainingDelay',
            //         operation: 'update',
            //         data: {
            //             where: { id: planTrainingDelayId },
            //             data: {
            //                 subjects: {
            //                     set: delaySubject.map((subject) => ({
            //                         id: subject.id,
            //                     })),
            //                 },
            //                 fixedClasses: {
            //                     set: fixedClassDelay.map((fc) => ({
            //                         id: fc.fixedClassId,
            //                     })),
            //                 },
            //             },
            //         },
            //     },
            // ])
            // if (res.status !== 200) {
            //     throw new Error('Lỗi khi lưu kế hoạch đào tạo')
            // }
            message.success('Thêm môn học vào kế hoạch thành công')
            form.resetFields()
            debouncedRefetch()
        } catch (error) {
            message.error('Lưu kế hoạch mở lớp thất bại')
            console.error(error)
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[0, 0]}>
                <Form
                    className="w-full"
                    form={form}
                    onValuesChange={(filter: SubjectBySemesterForm) => {
                        if (!filter.subjectSelected) {
                            debouncedRefetch()
                        }
                    }}
                >
                    <Col span={24}>
                        <Flex gap={4}>
                            <Col span={8}>
                                <Form.Item className="mb-0" name="searchText">
                                    <Input id="search" placeholder="Tìm kiếm" allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    className="mb-0"
                                    name="trainingMajorId"
                                    labelAlign="left"
                                >
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
                                <Form.Item
                                    className="mb-0"
                                    name="trainingCourseId"
                                    labelAlign="left"
                                >
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
                    <Col span={24} className="mt-2">
                        <Flex justify="end" gap={4}>
                            <Button onClick={onSubmit} type="primary">
                                Thêm vào kế hoạch
                            </Button>
                        </Flex>
                    </Col>
                    <Col span={24}>
                        <Form.Item hidden name="subjectSelected" />
                        <Table
                            rowKey="id"
                            data={planTrainingDelayData?.subjects ?? []}
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
                                    dataIndex: 'code',
                                    align: 'center',
                                    width: 100,
                                },
                                {
                                    title: 'Tên môn học',
                                    align: 'center',
                                    render: (_, record) => {
                                        return (
                                            <div className="text-left">
                                                {`${record?.name} (${record?.credit})` || ''}
                                            </div>
                                        )
                                    },
                                },
                                {
                                    title: 'Đơn vị phụ trách',
                                    dataIndex: ['managementOrganization', 'sMa'],
                                    width: 150,
                                    align: 'center',
                                },
                            ]}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                total: planTrainingDelayData?._count.subjects ?? 0,
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
                </Form>
            </Row>
        </div>
    )
}
