import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import type { PlanTraining } from '@workspace/db/client'
import { $Enums } from '@workspace/db/client'
import { sqlTransaction } from '@workspace/libs/api/model'
import type { OpenSubjectClass } from '@workspace/libs/api/schemas/openSubjectClass'
import { useOpenSubjectClass } from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import {
    useFixedClassStore,
    useSemesterStore,
    useTrainingCourseStore,
    useTrainingMajorStore,
    useTrainingObjectTypeStore,
} from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Row, Skeleton } from 'antd'
import _ from 'lodash'
import { useCallback, useMemo } from 'react'

interface SubjectBySemesterForm {
    searchText?: string
    subjectSelected?: Array<string>
}

export default function MonTheoKeHoachDuKien() {
    const { canSome } = useAbility()
    const [form] = Form.useForm<SubjectBySemesterForm>()
    const { id: semesterId } = useSemesterStore()
    const searchText = Form.useWatch('searchText', form)
    const subjectSelected = Form.useWatch('subjectSelected', form) || []

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: trainingCourseId } = useTrainingCourseStore()
    const { id: trainingMajorId } = useTrainingMajorStore()
    const { id: fixedClassId } = useFixedClassStore()
    const {
        data: subjects,
        refetch,
        isFetching,
    } = useOpenSubjectClass(
        {
            semesterId: semesterId as string,
            search: searchText || undefined,
            trainingCourseId: trainingCourseId || '',
            trainingMajorId,
            trainingObjectTypeId: trainingObjectTypeId || '',
            nextSemester: 0,
            fixedClassId: fixedClassId,
        },
        { query: { enabled: !!semesterId && !!trainingObjectTypeId && !!trainingCourseId } }
    )

    const data = useMemo(() => {
        if (subjects?.status !== 200) return []
        const result: Array<
            Omit<OpenSubjectClass, 'fixedClass'> &
                OpenSubjectClass['fixedClass'][number] & {
                    rowSpan: number
                    index: number
                }
        > = []
        subjects?.data?.data
            .map((subjectVersion) => ({
                id: subjectVersion.subjectVersionId,
                ...subjectVersion,
            }))
            .forEach((subject, idx) => {
                const { fixedClass, ...subjectInfo } = subject
                const length = fixedClass?.length || 0
                fixedClass.forEach((cls, index) => {
                    result.push({
                        ...subjectInfo,
                        ...cls,
                        rowSpan: index === 0 ? length : 0,
                        index: idx + index + 1,
                    })
                })
            })
        return result
    }, [subjects])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
            queryClient.invalidateQueries({ queryKey: ['/api/subject-class/open-subject-class'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTraining'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'SubjectClass'] })
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const onSubmit = async () => {
        try {
            if (!semesterId || !trainingObjectTypeId || subjects?.status !== 200) return
            showSpinner()
            const planTraining = await sqlTransaction([
                {
                    model: 'PlanTraining',
                    operation: 'upsert',
                    data: {
                        where: {
                            trainingObjectTypeId_semesterId_trainingCourseId: {
                                trainingObjectTypeId,
                                semesterId,
                                trainingCourseId,
                            },
                        },
                        update: {},
                        create: {
                            trainingObjectTypeId,
                            semesterId,
                            trainingCourseId,
                        },
                        select: {
                            id: true,
                            planTrainingSubjects: {
                                where: {
                                    subjectClassType: $Enums.SubjectClassType.RETAKE,
                                },
                            },
                        },
                    },
                },
            ])

            if (planTraining.status !== 200) {
                throw new Error('Lỗi khi tạo kế hoạch đào tạo')
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
                                create: [...new Set(subjectSelected)].map(
                                    (trainingBlockSubjectId) => ({
                                        trainingBlockSubjectId: trainingBlockSubjectId,
                                        subjectClassType: $Enums.SubjectClassType.NORMAL,
                                    })
                                ),
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
            <Row gutter={[0, 8]}>
                <Col span={24}>
                    <Flex justify="space-between" gap={4}>
                        <Col span={8}>
                            <Form.Item className="m-0" name="searchText">
                                <Input id="search" placeholder="Tìm kiếm" allowClear />
                            </Form.Item>
                        </Col>
                        <Flex gap={8}>
                            <Button
                                onClick={onSubmit}
                                type="primary"
                                disabled={subjectSelected.length === 0}
                            >
                                Đưa {subjectSelected.length || ''} môn vào KHDK
                            </Button>
                        </Flex>
                    </Flex>
                </Col>
                <Col span={24}>
                    <Form.Item hidden name="subjectSelected" />
                    {isFetching ? (
                        <Skeleton />
                    ) : (
                        <Table
                            className="mt-0"
                            rowKey="trainingBlockSubjectId"
                            data={data}
                            scrollable
                            maxHeight={'calc(100vh - 390px)'}
                            rowSelection={{
                                type: 'checkbox',
                                checkStrictly: true,
                                selectedRowKeys: subjectSelected,
                                onChange: (selectedRowKeys) => {
                                    form.setFieldValue('subjectSelected', selectedRowKeys)
                                },
                            }}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        const isSelected = subjectSelected.includes(
                                            record.trainingBlockSubjectId
                                        )
                                        if (isSelected) {
                                            form.setFieldValue(
                                                'subjectSelected',
                                                subjectSelected.filter(
                                                    (id) => id !== record.trainingBlockSubjectId
                                                )
                                            )
                                        } else {
                                            form.setFieldValue('subjectSelected', [
                                                ...subjectSelected,
                                                record.trainingBlockSubjectId,
                                            ])
                                        }
                                    },
                                }
                            }}
                            columns={[
                                {
                                    title: 'TT',
                                    width: 35,
                                    // dataIndex: 'index',
                                    align: 'center',
                                    render: (_, __, index) => {
                                        return index + 1
                                    },
                                },
                                {
                                    title: 'Mã MH',
                                    dataIndex: 'subjectVersionCode',
                                    align: 'center',
                                    width: 80,
                                    onCell: (record) => ({ rowSpan: record.rowSpan }),
                                },
                                {
                                    title: 'Tên môn học',
                                    dataIndex: 'subjectVersionName',
                                    align: 'center',
                                    onCell: (record) => ({ rowSpan: record.rowSpan }),
                                    render: (__, record) => {
                                        return (
                                            <div className="text-left">
                                                {`${record?.subjectVersionName} (${record?.subjectVersionCredit})` ||
                                                    ''}
                                            </div>
                                        )
                                    },
                                },
                                {
                                    title: 'Lớp quản lý',
                                    align: 'center',
                                    width: 120,
                                    render: (__, record) => {
                                        return `${record?.fixedClassCode} (${record?.fixedClassCount})`
                                    },
                                },
                                {
                                    title: 'CTĐT',
                                    align: 'center',
                                    render: (__, record) => {
                                        return `${record?.curriculumVersionName}`
                                    },
                                },
                                {
                                    title: 'HKDK',
                                    align: 'center',
                                    width: 80,
                                    render: (__, record) => {
                                        return `Kỳ ${record?.fixedClassSemester}`
                                    },
                                },
                                {
                                    title: 'Tổng SV',
                                    dataIndex: 'countStudent',
                                    width: 80,
                                    align: 'center',
                                    onCell: (record) => ({ rowSpan: record.rowSpan }),
                                },
                                {
                                    title: 'Đơn vị phụ trách',
                                    dataIndex: 'managementOrganizationCode',
                                    width: 150,
                                    align: 'center',
                                    onCell: (record) => ({ rowSpan: record.rowSpan }),
                                },
                            ]}
                            pagination={false}
                        />
                    )}
                </Col>
            </Row>
        </Form>
    )
}
