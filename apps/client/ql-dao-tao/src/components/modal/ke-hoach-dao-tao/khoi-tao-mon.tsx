import TreeSelect from '@/components/commons/tree-select'
import { queryClient } from '@api/index'
import TreeSelectDepartment from '@components/commons/department-select/TreeSelectDepartment'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Table from '@components/commons/table'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import {
    useFindManySubject,
    useFindManySubjectVersion,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { Trash2Icon } from 'lucide-react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { $Enums, PlanTraining } from '@workspace/db/client'

export type KhoiTaoMonFormType = {
    managementOrganizationIds: string[]
    subjectVersionIds: Record<string, Array<string>>
}
dayjs.locale('vi')
const KhoiTaoMon = () => {
    const [form] = Form.useForm<KhoiTaoMonFormType>()
    const { isOpen, onClose, input } = useDisclosure<{
        hocLai: boolean
    }>({
        tag: 'KhoiTaoMon',
        onClose: form.resetFields,
    })
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const managementOrganizationIds = Form.useWatch('managementOrganizationIds', form) || []
    const subjectVersionIds = Form.useWatch('subjectVersionIds', form) || {}

    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output?: KhoiTaoMonFormType) {
        if (!output) return
        try {
            showSpinner()
            const planTraining = await sqlTransaction([
                {
                    model: 'PlanTraining',
                    operation: 'upsert',
                    data: {
                        where: {
                            trainingObjectTypeId_semesterId: {
                                trainingObjectTypeId,
                                semesterId,
                            },
                        },
                        update: {},
                        create: {
                            trainingObjectTypeId,
                            semesterId,
                        },
                        select: {
                            id: true,
                            planTrainingSubjects: {
                                select: {
                                    subjectVersionId: true,
                                },
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

            const res = await sqlTransaction(
                Object.entries(output.subjectVersionIds).map(
                    ([subjectVersionId, fixedClassIds]) => {
                        return {
                            model: 'PlanTrainingSubject',
                            operation: 'create',
                            data: {
                                data: {
                                    subjectVersionId,
                                    planTrainingId,
                                    fixedClasses: {
                                        connect: fixedClassIds.map((id) => ({ id })),
                                    },
                                },
                            },
                        }
                    }
                )
            )
            if (res.status !== 200) {
                message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
                return
            }

            queryClient.invalidateQueries({ queryKey: ['/api/subject-class/open-subject-class'] })
            queryClient.invalidateQueries({
                queryKey: ['/api/subject-class/open-subject-class-retake'],
            })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTraining'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTrainingSubject'] })
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'PlanTrainingDelay'] })
            message.success('Thêm mới thành công')
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }

            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { getExamTypeLabel } = useExamTypeOptions()

    const { data: subjectVersionData = [] } = useFindManySubject({
        where: {
            subjectVersion: {
                none: {
                    planTrainingSubject: {
                        some: {
                            planTraining: {
                                trainingObjectTypeId,
                                semesterId,
                            },
                            subjectClassType: input?.hocLai
                                ? $Enums.SubjectClassType.RETAKE
                                : $Enums.SubjectClassType.NORMAL,
                        },
                    },
                },
                ...(managementOrganizationIds.length > 0
                    ? {
                          some: {
                              managementOrganizationId: {
                                  in: managementOrganizationIds,
                              },
                          },
                      }
                    : {}),
            },
            active: true,
            deletedAt: null,
        },
        include: { subjectVersion: true },
    })

    const { data: trainingCourse = [] } = useFindManyTrainingCourse({
        where: {
            active: true,
            deletedAt: null,
            trainingObjectTypeId,
        },
        select: {
            name: true,
            code: true,
            id: true,
            fixedClass: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    })

    const { data: subjectVersionTable = [] } = useFindManySubjectVersion(
        {
            where: {
                active: true,
                deletedAt: null,
                id: { in: Object.keys(subjectVersionIds) },
            },
        },
        {
            enabled: Object.keys(subjectVersionIds).length > 0,
        }
    )

    const treeData: DataNode[] = subjectVersionData
        .map((subject) => {
            const children: DataNode[] = subject.subjectVersion
                .filter((sv) => !subjectVersionIds[sv.id])
                .map((sv) => ({
                    key: sv.id,
                    value: sv.id,
                    label: (
                        <p className="text-primary">{`${[sv.code, sv.name].filter(Boolean).join(' - ')} (${sv.credit})`}</p>
                    ),
                }))
            if (children.length === 0) return null
            return {
                key: subject.id,
                value: subject.id,
                label: [subject.code, subject.name].filter(Boolean).join(' - '),
                selectable: false,
                children,
            } as DataNode
        })
        .filter((item): item is DataNode => item !== null)

    const treeDataFixedClass: DataNode[] = trainingCourse.map((tc) => ({
        key: tc.id,
        value: tc.id,
        label: [tc.code, tc.name].filter(Boolean).join(' - '),
        selectable: false,
        children: tc.fixedClass.map((fc) => ({
            key: fc.id,
            value: fc.id,
            label: <p className="text-primary">{fc.code}</p>,
        })),
    }))

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm môn học'}
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="managementOrganizationIds" label="Đơn vị phụ trách">
                    <TreeSelectDepartment />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="subjectVersionIds" hidden />
                <Form.Item label="Môn học">
                    <TreeSelect
                        placeholder="Chọn môn học"
                        treeData={treeData}
                        allowClear
                        value={[]}
                        onChange={(value) => {
                            form.setFieldsValue({
                                subjectVersionIds: {
                                    ...subjectVersionIds,
                                    [value[0]]: [],
                                },
                            })
                        }}
                        multiple
                        treeDefaultExpandAll
                        style={{ width: '100%' }}
                        showSearch
                    />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Table
                    data={subjectVersionTable}
                    columns={[
                        {
                            title: 'TT',
                            width: 30,
                            render: (__, ____, index) => index + 1,
                        },
                        {
                            title: 'Mã môn học',
                            dataIndex: 'code',
                            align: 'center',
                            width: 150,
                        },
                        {
                            title: 'Tên môn học',
                            dataIndex: 'name',
                        },
                        {
                            title: 'Số tín chỉ',
                            dataIndex: 'credit',
                            width: 100,
                            align: 'center',
                        },
                        {
                            title: 'Hình thức thi',
                            dataIndex: 'examType',
                            width: 150,
                            align: 'center',
                            render: (__, record) =>
                                getExamTypeLabel(record.examType) || 'Chưa xác định',
                        },
                        {
                            title: 'Lớp QL',
                            align: 'center',
                            render: (__, record) => (
                                // <Form.Item
                                //     name={['subjectVersionIds', record.id]}
                                //     className="m-0"
                                //     required
                                // >

                                // </Form.Item>
                                <TreeSelect
                                    treeData={treeDataFixedClass}
                                    className="w-full"
                                    dropdownStyle={{
                                        width: 400,
                                    }}
                                    onChange={(value) =>
                                        form.setFieldValue('subjectVersionIds', {
                                            ...subjectVersionIds,
                                            [record.id]: value,
                                        })
                                    }
                                    multiple
                                    placeholder="Chọn lớp quản lý"
                                />
                            ),
                        },
                        {
                            title: 'Thao tác',
                            width: 80,
                            align: 'center',
                            render: (_, record) => (
                                <div className="flex items-center justify-center">
                                    <Trash2Icon
                                        className="text-red-500"
                                        onClick={() => {
                                            form.setFieldValue(
                                                'subjectVersionIds',
                                                (({ [record.id]: _, ...rest }) => rest)(
                                                    subjectVersionIds
                                                )
                                            )
                                        }}
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            </Col>
        </PutFormModal>
    )
}

export { KhoiTaoMon }
