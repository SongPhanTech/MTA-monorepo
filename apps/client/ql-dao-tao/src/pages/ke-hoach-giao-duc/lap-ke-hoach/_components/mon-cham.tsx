import { queryClient } from '@api/index'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { type TrainingMajor } from '@workspace/db'
import { PlanTraining } from '@workspace/db/client'
import {
    useFindFirstPlanTrainingDelay,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useState } from 'react'

interface SubjectBySemesterForm {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
    subjectDelaySelected?: Array<string>
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
    const subjectDelaySelected = Form.useWatch('subjectDelaySelected', form) || []

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: planTrainingDelayData } = useFindFirstPlanTrainingDelay(
        {
            where: {
                trainingObjectTypeId,
            },
            include: {
                planTrainingDelaySubjects: {
                    include: {
                        subjectVersion: {
                            include: {
                                managementOrganization: {
                                    select: { sMa: true },
                                },
                            },
                        },
                        fixedClasses: {
                            include: {
                                _count: {
                                    select: {
                                        students: {
                                            where: {
                                                active: true,
                                                status: 'ENROLLED',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    where: {
                        subjectVersion: {
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
                    },
                    take: numberOfPages,
                    skip: (currentPage - 1) * numberOfPages,
                },
                _count: {
                    select: { planTrainingDelaySubjects: true },
                },
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
            const subject = planTrainingDelayData?.planTrainingDelaySubjects.filter((subject) =>
                subjectDelaySelected.includes(subject.subjectVersionId)
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

            if (planTraining.status !== 200 || !subject) {
                throw new Error('Lỗi khi tạo kế hoạch đào tạo')
            }

            const planTrainingId = (planTraining?.data?.[0] as PlanTraining)?.id
            if (!planTrainingId) {
                throw new Error('Kế hoạch đào tạo không tồn tại')
            }
            const planTrainingDelayId = planTrainingDelayData?.id
            if (!planTrainingDelayId) {
                throw new Error('Kế hoạch đào tạo môn chậm tiến độ không tồn tại')
            }

            const res = await sqlTransaction([
                {
                    model: 'PlanTraining',
                    operation: 'update',
                    data: {
                        where: { id: planTrainingId },
                        data: {
                            planTrainingSubjects: {
                                create: subject.map((subject) => ({
                                    subjectVersionId: subject.subjectVersionId,
                                    fixedClasses: {
                                        connect: subject.fixedClasses.map((fc) => ({
                                            id: fc.id,
                                        })),
                                    },
                                })),
                            },
                        },
                    },
                },
                {
                    model: 'PlanTrainingDelay',
                    operation: 'update',
                    data: {
                        where: { id: planTrainingDelayId },
                        data: {
                            planTrainingDelaySubjects: {
                                deleteMany: subjectDelaySelected.map((id) => ({
                                    subjectVersionId: id,
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
        <div>
            <Row gutter={[0, 0]}>
                <Form
                    className="w-full"
                    form={form}
                    onValuesChange={(filter: SubjectBySemesterForm) => {
                        if (!filter.subjectDelaySelected) {
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
                        <Form.Item hidden name="subjectDelaySelected" />
                        <Table
                            rowKey="subjectVersionId"
                            data={planTrainingDelayData?.planTrainingDelaySubjects ?? []}
                            rowSelection={{
                                type: 'checkbox',
                                checkStrictly: true,
                                selectedRowKeys: subjectDelaySelected,
                                onChange: (selectedRowKeys) => {
                                    form.setFieldValue('subjectDelaySelected', selectedRowKeys)
                                },
                                columnWidth: 15,
                            }}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        const isSelected = subjectDelaySelected.includes(
                                            record.subjectVersionId
                                        )
                                        if (isSelected) {
                                            form.setFieldValue(
                                                'subjectDelaySelected',
                                                subjectDelaySelected.filter(
                                                    (id) => id !== record.subjectVersionId
                                                )
                                            )
                                        } else {
                                            form.setFieldValue('subjectDelaySelected', [
                                                ...subjectDelaySelected,
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
                                    dataIndex: ['subjectVersion', 'code'],
                                    align: 'center',
                                    width: 100,
                                },
                                {
                                    title: 'Tên môn học',
                                    align: 'center',
                                    render: (_, record) => {
                                        return (
                                            <div className="text-left">
                                                {`${record?.subjectVersion?.name} (${record?.subjectVersion?.credit})` ||
                                                    ''}
                                            </div>
                                        )
                                    },
                                },
                                {
                                    title: 'Danh sách lớp quản lý',
                                    dataIndex: 'fixedClass',
                                    align: 'center',
                                    width: 180,
                                    render: (__, record) => {
                                        return record?.fixedClasses.length ? (
                                            <TextTruncate
                                                arr={record?.fixedClasses.map((i: any) => {
                                                    return {
                                                        key: i?.id,
                                                        label: ` ${i.code} (${i._count?.students})`,
                                                    }
                                                })}
                                                key="fixedClass"
                                            />
                                        ) : (
                                            ''
                                        )
                                    },
                                },
                                {
                                    title: 'Đơn vị phụ trách',
                                    dataIndex: ['subjectVersion', 'managementOrganization', 'sMa'],
                                    width: 150,
                                    align: 'center',
                                },
                            ]}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                total: planTrainingDelayData?._count.planTrainingDelaySubjects ?? 0,
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
