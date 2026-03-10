import { queryClient } from '@api/index'
import TreeSelectDepartment from '@components/commons/department-select/TreeSelectDepartment'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Table from '@components/commons/table'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import {
    useFindManySubjectVersion,
    useFindManyTrainingCourse,
    useInfiniteFindManySubject,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useSemesterStore, useTrainingCourseStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import dayjs from 'dayjs'
import TreeSelect from '@/components/commons/tree-select'
import 'dayjs/locale/vi'
import type { Subject, SubjectVersion } from '@workspace/db'
import type { $Enums, PlanTraining, Prisma } from '@workspace/db/client'
import { Trash2Icon } from 'lucide-react'
import { useCallback } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const PAGE_SIZE = 10

export type KhoiTaoMonFormType = {
    managementOrganizationIds: string[]
    subjectVersionIds: Record<string, Array<string>>
}
dayjs.locale('vi')
const KhoiTaoMon = () => {
    const [form] = Form.useForm<KhoiTaoMonFormType>()
    const { isOpen, onClose, input } = useDisclosure<{
        type?: $Enums.SubjectClassType
    }>({
        tag: 'KhoiTaoMon',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: trainingCourseId } = useTrainingCourseStore()
    const managementOrganizationIds = Form.useWatch('managementOrganizationIds', form) || []
    const subjectVersionIds = Form.useWatch('subjectVersionIds', form) || {}

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
                                select: {
                                    trainingBlockSubjectId: true,
                                },
                                where: {
                                    subjectClassType: input?.type,
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

            const resTB = await sqlTransaction(
                Object.entries(output.subjectVersionIds).map(
                    ([subjectVersionId, fixedClassIds]) => {
                        return {
                            model: 'TrainingBlockSubject',
                            operation: 'findFirst',
                            data: {
                                where: {
                                    subjectId: subjectVersionId,
                                    trainingBlockOnCurriculumVersion: {
                                        curriculumVersion: {
                                            ...(fixedClassIds?.length
                                                ? {
                                                      fixedClass: {
                                                          id: {
                                                              in: fixedClassIds,
                                                          },
                                                      },
                                                  }
                                                : {}),
                                        },
                                    },
                                },
                                select: {
                                    id: true,
                                    subjectId: true,
                                    trainingBlockOnCurriculumVersion: {
                                        select: {
                                            curriculumVersion: {
                                                select: {
                                                    fixedClass: {
                                                        select: {
                                                            id: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        }
                    }
                )
            )
            const res = await sqlTransaction(
                resTB?.data?.map((tbs: any) => {
                    return {
                        model: 'PlanTrainingSubject',
                        operation: 'create',
                        data: {
                            data: {
                                planTraining: {
                                    connect: { id: planTrainingId },
                                },
                                trainingBlockSubject: {
                                    connect: { id: tbs?.id },
                                },
                            },
                        },
                    }
                })
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
            queryClient.invalidateQueries({ queryKey: ['zenstack', 'SubjectClass'] })
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
    const fetchArgs = {
        where: {
            subjectVersion: {
                none: {
                    trainingBlocks: {
                        some: {
                            planTrainingSubjects: {
                                some: {
                                    planTraining: {
                                        trainingObjectTypeId,
                                        semesterId,
                                    },
                                    subjectClassType: input?.type,
                                },
                            },
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
        take: PAGE_SIZE,
        distinct: ['id'],
    }
    const {
        data: subjectVersionData,
        isLoading: isLoadingSubjectVersionData,
        isFetching: isFetchingSubjectVersionData,
        hasNextPage,
        fetchNextPage: fetchNextPageSubjectVersionData,
        isFetchingNextPage: isFetchingNextPageSubjectVersionData,
    } = useInfiniteFindManySubject(fetchArgs as Prisma.SubjectDefaultArgs, {
        getNextPageParam: (lastPage: [], pages: [][]) => {
            if (lastPage.length < PAGE_SIZE) {
                return undefined
            }
            const fetched = pages.flat().length
            return {
                ...fetchArgs,
                skip: fetched,
            }
        },
        enabled: managementOrganizationIds.length > 0,
    })

    const { data: trainingCourse = [] } = useFindManyTrainingCourse({
        where: {
            active: true,
            deletedAt: null,
            trainingObjectTypeId,
            id: trainingCourseId,
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
                    curriculumVersion: {},
                    planTrainingSubject: {
                        select: {
                            trainingBlockSubject: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            semesterStart: {
                startDate: 'desc',
            },
        },
    })

    const {
        data: subjectVersionTable = [],
        isLoading: isLoadingSubjectVersionTable,
        isFetching: isFetchingSubjectVersionTable,
    } = useFindManySubjectVersion(
        {
            where: {
                active: true,
                deletedAt: null,
                managementOrganizationId: {
                    in: managementOrganizationIds,
                },
                id: { in: Object.keys(subjectVersionIds) },
            },
        },
        {
            enabled: Object.keys(subjectVersionIds).length > 0,
        }
    )

    const treeData: DataNode[] = (subjectVersionData?.pages?.flat() || [])
        .map((subject: Subject & { subjectVersion: SubjectVersion[] }) => {
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

    const treeDataFixedClass = (_record: SubjectVersion): DataNode[] => {
        const result = trainingCourse.map((tc) => ({
            key: tc.id,
            value: tc.id,
            label: [tc.code, tc.name].filter(Boolean).join(' - '),
            selectable: false,
            children: tc.fixedClass
                .filter((fxc) => fxc?.planTrainingSubject?.trainingBlockSubject?.id === _record?.id)
                ?.map((fc) => ({
                    key: fc.id,
                    value: fc.id,
                    label: <p className="text-primary">{fc.code}</p>,
                })),
        }))
        return result?.filter?.((item) => item?.children?.length > 0)
    }

    const handleLoadMoreSubjectVersion = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
            if (
                scrollHeight - scrollTop - clientHeight < 50 &&
                hasNextPage &&
                !isFetchingNextPageSubjectVersionData &&
                !isFetchingSubjectVersionData &&
                !isLoadingSubjectVersionData
            ) {
                fetchNextPageSubjectVersionData()
            }
        },
        [
            hasNextPage,
            isFetchingNextPageSubjectVersionData,
            isLoadingSubjectVersionData,
            isFetchingSubjectVersionData,
            fetchNextPageSubjectVersionData,
        ]
    )

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
                        disabled={managementOrganizationIds?.length === 0}
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
                        onPopupScroll={handleLoadMoreSubjectVersion}
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
                    loading={isFetchingSubjectVersionTable || isFetchingSubjectVersionTable}
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
                            width: 180,
                            render: (__, record) => (
                                // <Form.Item
                                //     name={['subjectVersionIds', record.id]}
                                //     className="m-0"
                                //     required
                                // >

                                // </Form.Item>
                                <TreeSelect
                                    treeData={treeDataFixedClass(record as SubjectVersion)}
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
