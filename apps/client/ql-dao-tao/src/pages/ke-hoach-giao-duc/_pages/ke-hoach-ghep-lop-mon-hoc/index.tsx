import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { createId } from '@workspace/db'
import type { FixedClass } from '@workspace/db/client'
import { $Enums } from '@workspace/db/client'
import { useFindManySubjectVersion } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingCourseStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { cn } from '@workspace/ui/lib/utils'
import { Button, Col, Flex, Form, Input, message, Popconfirm, Row, Skeleton, Tooltip } from 'antd'
import _ from 'lodash'
import { PlusCircle, XCircleIcon } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DndProvider, type DragSourceMonitor, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

type SubjectClassForm = {
    id: string
    code: string | null
    count: number
    createdAt?: Date
    fixedClasses?: {
        id: string
        code: string | null
        count: number
    }[]
}

type OpenSubjectClassForm = {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
    subjectVersions?: Record<
        string,
        {
            count: number
            name: string | null
            code: string | null
            maxStudent: number
            examType?: $Enums.ExamType | null
            subjectClasses?: Record<string, SubjectClassForm>
            isEdit?: boolean
        }
    >
    // SubjectVersionId -> SubjectClassId -> FixedClassId
}

const SubjectClassDropItem: React.FC<{
    item: SubjectClassForm
    subjectVersionId: string
}> = ({ item, subjectVersionId }) => {
    const form = Form.useFormInstance<OpenSubjectClassForm>()
    const subjectVersionsForm = Form.useWatch('subjectVersions', form) || {}
    const fixedClass =
        subjectVersionsForm?.[subjectVersionId]?.subjectClasses?.[item.id]?.fixedClasses || []
    const ref = useRef<HTMLDivElement>(null)
    const [{ canDrop, isOver }, drop] = useDrop(
        () => ({
            accept: 'fixedClass',
            drop: () => ({
                item,
            }),
            collect: (monitor) => {
                return {
                    isOver: monitor.isOver(),
                    canDrop: monitor.canDrop(),
                }
            },
            canDrop(item: any) {
                return !!item?.subjectVersionId && item.subjectVersionId === subjectVersionId
            },
        }),
        [subjectVersionId, item]
    )

    const onRemoveFixedClass = (fixedClassId: string) => {
        const subjectClasses = subjectVersionsForm[subjectVersionId] || {}
        form.setFieldValue('subjectVersions', {
            ...subjectVersionsForm,
            [subjectVersionId]: {
                ...subjectClasses,
                isEdit: true,
                subjectClasses: {
                    ...subjectClasses?.subjectClasses,
                    [item?.id]: {
                        ...(subjectClasses?.subjectClasses?.[item?.id] || {}),
                        fixedClasses:
                            subjectClasses?.subjectClasses?.[item?.id]?.fixedClasses?.filter(
                                (fc) => fc.id !== fixedClassId
                            ) || [],
                    },
                },
            },
        })
    }

    const onRemoveSubjectClass = () => {
        const { [item.id]: _, ...subjectClass } =
            subjectVersionsForm[subjectVersionId].subjectClasses || {}
        form.setFieldValue('subjectVersions', {
            ...subjectVersionsForm,
            [subjectVersionId]: {
                ...subjectVersionsForm[subjectVersionId],
                subjectClasses: subjectClass,
                isEdit: true,
            },
        })
    }

    drop(ref)
    return (
        <div
            ref={ref}
            className="border border-dashed border-gray-400 rounded p-1 bg-white select-none h-fit relative"
            style={{
                opacity: canDrop && isOver ? 0.4 : 1,
            }}
        >
            <Tooltip title="Xóa LMH">
                <XCircleIcon
                    onClick={onRemoveSubjectClass}
                    className="absolute -top-4 -right-2 z-10 text-red-500 bg-white rounded p-0"
                    size={14}
                />
            </Tooltip>
            {item?.code} ({fixedClass.reduce((sum, fcId) => sum + (fcId?.count || 0), 0)})
            <div className="gap-1 w-fit">
                {!!fixedClass?.length &&
                    fixedClass.map((fcId) => (
                        <div
                            onClick={() => onRemoveFixedClass(fcId.id)}
                            className="border border-dashed border-gray-400 rounded p-1 bg-green-100 select-none hover:opacity-40"
                            key={fcId.id}
                        >
                            {fcId?.code} ({fcId?.count})
                        </div>
                    ))}
            </div>
        </div>
    )
}

const FixedClassDragItem: React.FC<{
    item: FixedClass & { _count?: { students: number } }
    subjectVersionId: string
    hiddenAlreadyAdded?: boolean
}> = ({ item, subjectVersionId, hiddenAlreadyAdded = true }) => {
    const ref = useRef<HTMLDivElement>(null)
    const form = Form.useFormInstance<OpenSubjectClassForm>()
    const subjectVersionsForm = Form.useWatch('subjectVersions', form) || {}
    const subjectClasses = subjectVersionsForm[subjectVersionId] || {}
    const [{ opacity }, drag] = useDrag(
        () => ({
            type: 'fixedClass',
            item: {
                subjectVersionId,
            },
            end(_, monitor) {
                const dropResult = monitor.getDropResult() as any
                if (!dropResult) return
                form.setFieldValue('subjectVersions', {
                    ...subjectVersionsForm,
                    [subjectVersionId]: {
                        ...subjectClasses,
                        isEdit: true,
                        subjectClasses: {
                            ...subjectClasses?.subjectClasses,
                            [dropResult?.item?.id]: {
                                ...(subjectClasses?.subjectClasses?.[dropResult?.item?.id] || {}),
                                fixedClasses: [
                                    ...(subjectClasses?.subjectClasses?.[dropResult?.item?.id]
                                        ?.fixedClasses || []),
                                    {
                                        id: item?.id,
                                        code: item?.code,
                                        count: item?._count?.students || 0,
                                    },
                                ],
                            },
                        },
                    },
                })
            },
            collect: (monitor: DragSourceMonitor) => ({
                opacity: monitor.isDragging() ? 0.4 : 1,
            }),
        }),
        [item?.id, subjectVersionId, subjectVersionsForm]
    )

    drag(ref)

    const isAlreadyAdded = !!Object.values(subjectClasses.subjectClasses || {}).find((e) =>
        e.fixedClasses?.some((fc) => fc.id === item?.id)
    )

    return (
        <div
            ref={ref}
            hidden={isAlreadyAdded && hiddenAlreadyAdded}
            onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
            }}
            className="border border-dashed border-gray-400 rounded px-2 py-1 m-1 bg-green-100 select-none cursor-move"
            style={{ opacity }}
        >
            {item?.code} ({item?._count?.students})
        </div>
    )
}

export default function KeHoachGhepLopMonHoc() {
    const { canSome } = useAbility()
    const [form] = Form.useForm<OpenSubjectClassForm>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { id: semesterId } = useSemesterStore()

    const searchText = Form.useWatch('searchText', form)
    const { id: trainingCourseId } = useTrainingCourseStore()
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const subjectVersions = Form.useWatch('subjectVersions', form) || {}

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data, refetch, isFetching } = useFindManySubjectVersion(
        {
            where: {
                trainingBlocks: {
                    some: {
                        planTrainingSubjects: {
                            some: {
                                planTraining: {
                                    semesterId,
                                    trainingObjectTypeId,
                                    trainingCourseId,
                                },
                                subjectClassType: $Enums.SubjectClassType.NORMAL,
                            },
                        },
                    },
                },
                ...(searchText
                    ? {
                          OR: [
                              {
                                  name: { contains: searchText, mode: 'insensitive' },
                              },
                              {
                                  code: { contains: searchText, mode: 'insensitive' },
                              },
                          ],
                      }
                    : {}),
            },
            include: {
                trainingBlocks: {
                    where: {
                        planTrainingSubjects: {
                            some: {
                                planTraining: {
                                    semesterId,
                                    trainingObjectTypeId,
                                    trainingCourseId,
                                },
                                subjectClassType: $Enums.SubjectClassType.NORMAL,
                            },
                        },
                    },
                    select: {
                        planTrainingSubjects: {
                            select: {
                                studentCount: true,
                            },
                        },
                        trainingBlockOnCurriculumVersion: {
                            select: {
                                curriculumVersion: {
                                    select: {
                                        fixedClass: {
                                            select: {
                                                id: true,
                                                code: true,
                                                _count: {
                                                    select: {
                                                        students: {
                                                            where: {
                                                                deletedAt: null,
                                                                active: true,
                                                                status: 'ENROLLED',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                subjectClass: {
                    where: {
                        semesterId,
                        trainingObjectTypeId,
                    },
                    select: {
                        id: true,
                        code: true,
                        maxStudent: true,
                        createdAt: true,
                        fixedClasses: {
                            select: {
                                id: true,
                                code: true,
                                _count: {
                                    select: {
                                        students: {
                                            where: {
                                                deletedAt: null,
                                                active: true,
                                                status: 'ENROLLED',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                 subject: {
                    select: {
                     managementOrganization: {
                            select: {
                                 sMa: true,
                        },
            }
            },
        }
            },
        },
        {
            refetchOnWindowFocus: false,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <skip function>
    useEffect(() => {
        if (data) {
            resetSubjectClassToFixedClass()
        }
    }, [data])

    const resetSubjectClassToFixedClass = () => {
        if (!data) return
        form.setFieldValue(
            'subjectVersions',
            data.reduce(
                (acc, cur) => {
                    if (!acc) {
                        return {}
                    }
                    acc[cur.id] = {
                        count: cur.subjectClass.length ?? 0,
                        name: cur?.name,
                        code: cur?.code,
                        maxStudent:
                            cur.subjectClass?.[0]?.maxStudent ??
                            cur.trainingBlocks?.[0]?.planTrainingSubjects?.[0]?.studentCount,
                        examType: cur?.examType,
                        subjectClasses: cur.subjectClass.reduce(
                            (subAcc, subCur) => {
                                if (!subAcc) {
                                    return {}
                                }
                                subAcc[subCur.id] = {
                                    id: subCur.id,
                                    code: subCur?.code,
                                    count: subCur?.fixedClasses.reduce(
                                        (sum, fc) => sum + (fc?._count?.students ?? 0),
                                        0
                                    ),
                                    createdAt: subCur.createdAt,
                                    fixedClasses: subCur.fixedClasses.map((fc) => ({
                                        id: fc.id,
                                        code: fc?.code,
                                        count: fc?._count?.students || 0,
                                    })),
                                }
                                return subAcc
                            },
                            {} as Record<string, SubjectClassForm>
                        ),
                        isEdit: false,
                    }
                    return acc
                },
                {} as OpenSubjectClassForm['subjectVersions']
            )
        )
    }

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'DM_DonVi'],
            })
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'Subject'],
            })
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'SubjectClass'],
            })
        }, 500),
        []
    )

    const { hideSpinner, showSpinner } = useSpinner()

    const onAddSubjectClass = (subjectVersionId: string) => {
        const subjectClasses = subjectVersions[subjectVersionId] || {}
        const newId = createId()
        form.setFieldValue('subjectVersions', {
            ...subjectVersions,
            [subjectVersionId]: {
                ...subjectClasses,
                isEdit: true,
                subjectClasses: {
                    ...subjectClasses?.subjectClasses,
                    [newId]: {
                        id: newId,
                        code: `${subjectVersions[subjectVersionId]?.code ?? ''} ${
                            Number(
                                Object.values(subjectClasses.subjectClasses || {})
                                    .sort((a, b) => (a?.code || '').localeCompare(b?.code || ''))
                                    .pop()
                                    ?.code?.split(' ')
                                    .pop() ?? '0'
                            ) + 1
                        }`,
                        count: 0,
                        createdAt: new Date(),
                        fixedClasses: [],
                    },
                },
            },
        })
    }

    const onSaveLayering = async () => {
        try {
            showSpinner()
            const payload = Object.entries(subjectVersions)
                .filter(([, subjectVersion]) => subjectVersion.isEdit)
                .flatMap(([subjectVersionId, subjectVersion]) =>
                    Object.entries(subjectVersion.subjectClasses || {}).flatMap(
                        ([subjectClassId, subjectClass], index) => ({
                            subjectClassId,
                            ...subjectClass,
                            subjectVersion,
                            index,
                            subjectVersionId,
                        })
                    )
                )

            const allSubjectVersionIds = Object.entries(subjectVersions)
                .filter(([, subjectVersion]) => subjectVersion.isEdit)
                .map(([key]) => key)

            const res = await sqlTransaction([
                ...allSubjectVersionIds.flatMap((subjectVersionId) => [
                    {
                        model: 'ClassRegisterLogs' as const,
                        operation: 'deleteMany',
                        data: {
                            where: {
                                subjectClass: {
                                    semesterId,
                                    trainingObjectTypeId,
                                    subjectId: subjectVersionId,
                                    type: $Enums.SubjectClassType.NORMAL,
                                },
                            },
                        },
                    },
                    {
                        model: 'SubjectClassTime' as const,
                        operation: 'deleteMany',
                        data: {
                            where: {
                                subjectClass: {
                                    semesterId,
                                    trainingObjectTypeId,
                                    subjectId: subjectVersionId,
                                    type: $Enums.SubjectClassType.NORMAL,
                                },
                            },
                        },
                    },
                    {
                        model: 'ClassSchedule' as const,
                        operation: 'deleteMany',
                        data: {
                            where: {
                                subjectClass: {
                                    semesterId,
                                    trainingObjectTypeId,
                                    subjectId: subjectVersionId,
                                    type: $Enums.SubjectClassType.NORMAL,
                                },
                            },
                        },
                    },
                    {
                        model: 'SubjectClass' as const,
                        operation: 'deleteMany',
                        data: {
                            where: {
                                subjectId: subjectVersionId,
                                semesterId: semesterId,
                                trainingObjectTypeId: trainingObjectTypeId,
                                type: $Enums.SubjectClassType.NORMAL,
                            },
                        },
                    },
                ]),
                ...payload.map((e) => ({
                    model: 'SubjectClass' as const,
                    operation: 'upsert',
                    data: {
                        where: {
                            id: e.subjectClassId,
                        },
                        update: {
                            subjectId: e.subjectVersionId,
                            semesterId: semesterId,
                            trainingObjectTypeId: trainingObjectTypeId,
                            code: `${e.subjectVersion?.code} ${String(e.index + 1)}`,
                            name: e.subjectVersion?.name,
                            maxStudent: e.subjectVersion?.maxStudent,
                            examType: e.subjectVersion?.examType,
                            schedule: $Enums.SubjectClassSchedule.MORNING,
                            fixedClasses: {
                                set: e.fixedClasses?.map((fc) => ({
                                    id: fc.id,
                                })),
                            },
                        },
                        create: {
                            subjectId: e.subjectVersionId,
                            semesterId: semesterId,
                            trainingObjectTypeId: trainingObjectTypeId,
                            code: `${e.subjectVersion?.code} ${String(e.index + 1)}`,
                            name: e.subjectVersion?.name,
                            maxStudent: e.subjectVersion?.maxStudent,
                            examType: e.subjectVersion?.examType,
                            schedule: $Enums.SubjectClassSchedule.MORNING,
                            fixedClasses: {
                                connect: e.fixedClasses?.map((fc) => ({
                                    id: fc.id,
                                })),
                            },
                        },
                    },
                })),
            ])
            if (res.status !== 200) throw new Error('Lưu ghép lớp thất bại')
            message.success('Lưu ghép lớp thành công')
            form.resetFields()
            debouncedRefetch()
        } catch (error) {
            message.error('Lưu ghép lớp thất bại')
            console.error(error)
        }
        hideSpinner()
    }
    const paginatedData = data?.slice(
        (currentPage - 1) * numberOfPages,
        currentPage * numberOfPages
    )

    return (
        <DndProvider backend={HTML5Backend}>
            <div>
                <Row gutter={[0, 0]}>
                    <Form
                        className="w-full"
                        form={form}
                        onValuesChange={(filter: OpenSubjectClassForm) => {
                            if (!filter.subjectVersions) {
                                debouncedRefetch()
                            } else {
                                const subjectVersionId = Object.keys(
                                    filter.subjectVersions || {}
                                )?.[0]
                                if (subjectVersionId)
                                    form.setFieldValue('subjectVersions', {
                                        ...subjectVersions,
                                        [subjectVersionId]: {
                                            ...subjectVersions[subjectVersionId],
                                            ...filter.subjectVersions[subjectVersionId],
                                            isEdit: true,
                                        },
                                    })
                            }
                        }}
                    >
                        <Row gutter={[0, 0]}>
                            <Col span={12}>
                                <Flex gap={4}>
                                    <Col span={8}>
                                        <Form.Item className="m-0" name="searchText">
                                            <Input id="search" placeholder="Tìm kiếm" allowClear />
                                        </Form.Item>
                                    </Col>
                                </Flex>
                            </Col>
                            <Col span={12}>
                                <Flex justify="end" gap={4}>
                                    <Popconfirm
                                        onConfirm={onSaveLayering}
                                        title="Xác nhận lưu kế hoạch ghép lớp?"
                                        okText="Xác nhận"
                                        cancelText="Hủy"
                                    >
                                        <Button type="primary">Lưu ghép lớp</Button>
                                    </Popconfirm>
                                </Flex>
                            </Col>
                        </Row>
                        <Form.Item name="subjectVersions" hidden />
                        <Col span={24}>
                            {isFetching ? (
                                <Skeleton />
                            ) : (
                                <Table
                                    rowKey="id"
                                    data={paginatedData}
                                    scrollable
                                    maxHeight={'calc(100vh - 380px)'}
                                    onRow={(record) => {
                                        return {
                                            className: cn(
                                                Object.keys(
                                                    subjectVersions?.[record.id]?.subjectClasses ||
                                                        {}
                                                ).length === 0 && 'bg-red-100',
                                                subjectVersions?.[record.id]?.isEdit &&
                                                    'bg-yellow-100'
                                            ),
                                        }
                                    }}
                                    columns={[
                                        {
                                            title: 'TT',
                                            width: 35,
                                            align: 'center',
                                            render: (_, __, index) =>
                                                index +
                                                1 +
                                                (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                        },
                                        {
                                            title: 'Mã MH',
                                            align: 'center',
                                            width: 100,
                                            render: (_, record) => record?.code,
                                        },
                                        {
                                            title: 'Tên môn học',
                                            align: 'center',
                                            width: 300,
                                            render: (_, record) => {
                                                return (
                                                    <div className="text-left">
                                                        {`${record?.name} (${record?.credit})`}
                                                    </div>
                                                )
                                            },
                                        },
                                        {
                                            title: 'Ghép lớp',
                                            align: 'center',
                                            render: (_, record) => {
                                                return (
                                                    // <DndProvider backend={HTML5Backend}>
                                                    <div className="flex flex-col items-center justify-center m-2">
                                                        <div className="flex h-fit gap-4 items-center">
                                                            {subjectVersions?.[record.id]
                                                                ?.subjectClasses &&
                                                                Object.entries(
                                                                    subjectVersions?.[record.id]
                                                                        ?.subjectClasses || {}
                                                                ).map(
                                                                    ([
                                                                        subjectClassId,
                                                                        subjectClass,
                                                                    ]) => (
                                                                        <SubjectClassDropItem
                                                                            subjectVersionId={
                                                                                record.id
                                                                            }
                                                                            item={subjectClass}
                                                                            key={subjectClassId}
                                                                        />
                                                                    )
                                                                )}
                                                            <Tooltip
                                                                title="Thêm lớp MH"
                                                                className="select-none cursor-pointer"
                                                            >
                                                                <PlusCircle
                                                                    onClick={() =>
                                                                        onAddSubjectClass(record.id)
                                                                    }
                                                                    size={16}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                        <div className="flex h-fit">
                                                            {record?.trainingBlocks?.map(
                                                                // @ts-expect-error
                                                                (block) => {
                                                                    const fixedClass =
                                                                        block
                                                                            .trainingBlockOnCurriculumVersion
                                                                            ?.curriculumVersion
                                                                            ?.fixedClass
                                                                    return (
                                                                        <FixedClassDragItem
                                                                            subjectVersionId={
                                                                                record.id
                                                                            }
                                                                            item={fixedClass}
                                                                            key={fixedClass?.id}
                                                                        />
                                                                    )
                                                                }
                                                            )}
                                                            {/* {record?.trainingBlocks?.[0]?.trainingBlockOnCurriculumVersion?.curriculumVersion?.fixedClasses?.map?.(
                                                                (e: FixedClass) => (
                                                                    <FixedClassDragItem
                                                                        subjectVersionId={record.id}
                                                                        item={e}
                                                                        key={e.id}
                                                                    />
                                                                )
                                                            )} */}
                                                        </div>
                                                    </div>
                                                    // </DndProvider>
                                                )
                                            },
                                        },
                                        {
                                            title: 'Tổng SV',
                                            width: 80,
                                            align: 'center',
                                            render: (_: any, record: any) => {
                                                const fixedClasses = record?.trainingBlocks.map(
                                                    // @ts-expect-error
                                                    (block) =>
                                                        block?.trainingBlockOnCurriculumVersion
                                                            ?.curriculumVersion?.fixedClass
                                                )
                                                return (
                                                    fixedClasses?.reduce(
                                                        (sum: number, fc: any) =>
                                                            sum + (fc?._count?.students ?? 0),
                                                        0
                                                    ) || 0
                                                )
                                            },
                                        },
                                        {
                                            title: 'Đơn vị phụ trách',
                                            width: 150,
                                            align: 'center',
                                           render: (_, record) => record?.subject?.managementOrganization?.sMa || '',
                                        },
                                    ]}
                                    pagination={{
                                        current: currentPage,
                                        pageSize: numberOfPages,
                                        total: data?.length || 0,
                                        // total: res?._count?.planTrainingSubjects ?? 0,
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
                            )}
                        </Col>
                    </Form>
                </Row>
            </div>
        </DndProvider>
    )
}

KeHoachGhepLopMonHoc.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
