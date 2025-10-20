import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { $Enums, type TrainingMajor } from '@workspace/db/client'
import type { FixedClass, SubjectClass } from '@workspace/db/client'
import {
    useFindFirstPlanTraining,
    useFindManyTrainingCourse,
    useFindManyTrainingLocation,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { cn } from '@workspace/ui/lib/utils'
import { Button, Col, Flex, Form, Input, InputNumber, message, Popconfirm, Row } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndProvider, type DragSourceMonitor, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

interface OpenSubjectClassForm {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
    subjectClassNumber?: Record<
        string,
        {
            count: number
            name: string | null
            code: string | null
            maxStudent: number
            countOld: number
            examType?: $Enums.ExamType | null
        }
    >
    subjectClassToFixedClass?: Record<
        string,
        Record<
            string,
            {
                id: string
                code: string | null
                count: number
            }[]
        >
    > // SubjectVersionId -> SubjectClassId -> FixedClassId
}

const SubjectClassDropItem: React.FC<{
    item: SubjectClass
    subjectVersionId: string
}> = ({ item, subjectVersionId }) => {
    const form = Form.useFormInstance<OpenSubjectClassForm>()
    const subjectClassToFixedForm = Form.useWatch('subjectClassToFixedClass', form) || {}
    const fixedClass = subjectClassToFixedForm?.[subjectVersionId]?.[item.id] || []
    const ref = useRef<HTMLDivElement>(null)
    const [{ canDrop, isOver }, drop] = useDrop(
        () => ({
            accept: 'fixedClass',
            drop: () => ({
                item,
            }),
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
            }),
        }),
        []
    )

    const onRemoveFixedClass = (fixedClassId: string) => {
        const subjectClass = subjectClassToFixedForm[subjectVersionId] || {}
        form.setFieldValue('subjectClassToFixedClass', {
            ...subjectClassToFixedForm,
            [subjectVersionId]: {
                ...subjectClass,
                [item.id]: (subjectClass?.[item.id] || []).filter((fc) => fc.id !== fixedClassId),
            },
        })
    }

    drop(ref)
    return (
        <div
            ref={ref}
            className="border border-dashed border-gray-400 rounded p-1 mx-1 bg-white select-none h-fit"
            style={{
                opacity: canDrop && isOver ? 0.4 : 1,
            }}
        >
            {item.code} ({fixedClass.reduce((sum, fcId) => sum + (fcId.count || 0), 0)})
            <div className="grid grid-cols-3 gap-1">
                {!!fixedClass?.length &&
                    fixedClass.map((fcId) => (
                        <div
                            onClick={() => onRemoveFixedClass(fcId.id)}
                            className="border border-dashed border-gray-400 rounded p-1 bg-green-100 select-none"
                            key={fcId.id}
                            style={{
                                height: (fcId.count || 0) * 1 + 30,
                            }}
                        >
                            {fcId.code} ({fcId.count})
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
    const subjectClassToFixedForm = Form.useWatch('subjectClassToFixedClass', form) || {}
    const subjectClass = subjectClassToFixedForm[subjectVersionId] || {}
    const [{ opacity }, drag] = useDrag(
        () => ({
            type: 'fixedClass',
            end(_, monitor) {
                const dropResult = monitor.getDropResult() as any
                if (!dropResult) return
                const subjectClass = subjectClassToFixedForm[subjectVersionId]
                form.setFieldValue('subjectClassToFixedClass', {
                    ...subjectClassToFixedForm,
                    [subjectVersionId]: {
                        ...subjectClass,
                        [dropResult?.item?.id]: [
                            ...(subjectClass?.[dropResult?.item?.id] || []),
                            {
                                id: item.id,
                                code: item.code,
                                count: item._count?.students || 0,
                            },
                        ],
                    },
                })
            },
            collect: (monitor: DragSourceMonitor) => ({
                opacity: monitor.isDragging() ? 0.4 : 1,
            }),
        }),
        [subjectClassToFixedForm]
    )

    drag(ref)

    const isAlreadyAdded = !!Object.values(subjectClass)
        .flat()
        .find((e) => e.id === item.id)

    // if (isAlreadyAdded) return null

    return (
        <div
            ref={ref}
            hidden={isAlreadyAdded && hiddenAlreadyAdded}
            onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
            }}
            className="border border-dashed border-gray-400 rounded px-2 py-1 m-1 bg-green-100 select-none cursor-move"
            style={{ opacity, height: (item?._count?.students ?? 0) * 1 + 30 }}
        >
            {item.code} ({item._count?.students})
        </div>
    )
}

export default function KeHoachMoLopMonHoc() {
    const { canSome } = useAbility()
    const [form] = Form.useForm<OpenSubjectClassForm>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { id: semesterId } = useSemesterStore()

    const [isLayering, setIsLayering] = useState(false)

    const searchText = Form.useWatch('searchText', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const subjectClassNumber = Form.useWatch('subjectClassNumber', form) || {}
    const subjectClassToFixed = Form.useWatch('subjectClassToFixedClass', form) || {}

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: res, refetch } = useFindFirstPlanTraining(
        {
            where: {
                semesterId: semesterId as string,
                trainingObjectTypeId: trainingObjectTypeId || '',
                ...(searchText
                    ? {
                          planTrainingSubjects: {
                              some: {
                                  subjectVersion: {
                                      OR: [
                                          {
                                              name: { contains: searchText, mode: 'insensitive' },
                                          },
                                          {
                                              code: { contains: searchText, mode: 'insensitive' },
                                          },
                                      ],
                                  },
                                  fixedClasses: {
                                      some: {
                                          trainingCourseId: trainingCourseId || undefined,
                                          curriculumVersion: {
                                              curriculum: {
                                                  trainingMajorId: trainingMajorId || undefined,
                                              },
                                          },
                                      },
                                  },
                                  subjectClassType: $Enums.SubjectClassType.NORMAL,
                              },
                          },
                      }
                    : {}),
            },
            include: {
                planTrainingSubjects: {
                    include: {
                        subjectVersion: {
                            include: {
                                subjectClass: {
                                    where: {
                                        semesterId: semesterId as string,
                                        trainingObjectTypeId: trainingObjectTypeId || '',
                                    },
                                    orderBy: { code: 'asc' },
                                    include: {
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
                                managementOrganization: {
                                    select: {
                                        sMa: true,
                                    },
                                },
                            },
                        },
                        fixedClasses: {
                            include: {
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
                            orderBy: { code: 'asc' },
                        },
                    },
                    where: {
                        subjectClassType: $Enums.SubjectClassType.NORMAL,
                    },
                    take: numberOfPages,
                    skip: (currentPage - 1) * numberOfPages,
                },
                _count: {
                    select: {
                        planTrainingSubjects: {
                            where: {
                                subjectClassType: $Enums.SubjectClassType.NORMAL,
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!semesterId && !!trainingObjectTypeId, refetchOnWindowFocus: false }
    )

    const data = useMemo(() => res?.planTrainingSubjects, [res])

    useEffect(() => {
        if (data) {
            form.setFieldValue(
                'subjectClassNumber',
                data.reduce(
                    (acc, cur) => {
                        if (!acc) {
                            return {}
                        }
                        acc[cur.subjectVersionId] = {
                            count: cur.subjectVersion.subjectClass.length ?? 0,
                            name: cur.subjectVersion?.name,
                            code: cur.subjectVersion?.code,
                            maxStudent: cur.fixedClasses.reduce(
                                (sum, fc) => sum + (fc._count?.students ?? 0),
                                0
                            ),
                            countOld: cur.subjectVersion.subjectClass.length ?? 0,
                            examType: cur.subjectVersion?.examType,
                        }
                        return acc
                    },
                    {} as OpenSubjectClassForm['subjectClassNumber']
                )
            )
            resetSubjectClassToFixedClass()
        }
    }, [data, form])

    const resetSubjectClassToFixedClass = () => {
        if (!data) return
        form.setFieldValue(
            'subjectClassToFixedClass',
            data.reduce(
                (acc, cur) => {
                    if (!acc) return {}
                    acc[cur.subjectVersionId] = {
                        ...(acc?.[cur.subjectVersionId] || {}),
                        ...cur.subjectVersion.subjectClass.reduce(
                            (acc2, sc) => {
                                acc2[sc.id] = sc.fixedClasses.map((fc) => ({
                                    code: fc.code,
                                    id: fc.id,
                                    count: fc._count?.students || 0,
                                }))
                                return acc2
                            },
                            {} as Record<
                                string,
                                { id: string; code: string | null; count: number }[]
                            >
                        ),
                    }
                    return acc
                },
                {} as OpenSubjectClassForm['subjectClassToFixedClass']
            )
        )
    }

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
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

    const { data: trainingLocationData = [] } = useFindManyTrainingLocation({
        orderBy: { name: 'asc' },
        where: { deletedAt: null, active: true },
    })

    const { hideSpinner, showSpinner } = useSpinner()

    const onSubmit = async () => {
        try {
            if (!semesterId || !trainingObjectTypeId) return
            showSpinner()
            const listSubjectVersionIds = Object.entries(subjectClassNumber)
                .filter(([, subjectVersion]) => subjectVersion.count !== subjectVersion.countOld)
                .map(([key]) => key)

            const res = await sqlTransaction([
                {
                    model: 'ClassRegisterLogs',
                    operation: 'deleteMany',
                    data: {
                        where: {
                            subjectClass: {
                                semesterId,
                                trainingObjectTypeId,
                                subjectId: {
                                    in: listSubjectVersionIds,
                                },
                            },
                        },
                    },
                },
                {
                    model: 'SubjectClassTime',
                    operation: 'deleteMany',
                    data: {
                        where: {
                            subjectClass: {
                                semesterId,
                                trainingObjectTypeId,
                                subjectId: {
                                    in: listSubjectVersionIds,
                                },
                            },
                        },
                    },
                },
                {
                    model: 'SubjectClass',
                    operation: 'deleteMany',
                    data: {
                        where: {
                            semesterId: semesterId,
                            trainingObjectTypeId: trainingObjectTypeId,
                            subjectId: {
                                in: listSubjectVersionIds,
                            },
                        },
                    },
                },
                {
                    model: 'SubjectClass',
                    operation: 'createMany',
                    data: {
                        data: Object.entries(subjectClassNumber)
                            .filter(
                                ([, subjectVersion]) =>
                                    subjectVersion.count !== subjectVersion.countOld
                            )
                            .flatMap(([subjectVersionId, subjectVersion]) =>
                                new Array(subjectVersion.count).fill(0).map((_, index) => ({
                                    subjectId: subjectVersionId,
                                    semesterId: semesterId,
                                    trainingObjectTypeId: trainingObjectTypeId,
                                    code: `${subjectVersion.code} ${String(index + 1)}`,
                                    name: subjectVersion.name,
                                    maxStudent: subjectVersion.count,
                                    examType: subjectVersion.examType,
                                    schedule: $Enums.SubjectClassSchedule.MORNING,
                                }))
                            ),
                    },
                },
            ])
            if (res.status !== 200) throw new Error('Lưu kế hoạch mở lớp thất bại')
            message.success('Lưu kế hoạch mở lớp thành công')
            form.resetFields()
            debouncedRefetch()
        } catch (error) {
            message.error('Lưu kế hoạch mở lớp thất bại')
            console.error(error)
        }
        hideSpinner()
    }

    const onSaveLayering = async () => {
        try {
            showSpinner()
            const payload = Object.entries(subjectClassToFixed).flatMap(([, subjectClass]) =>
                Object.entries(subjectClass).flatMap(([subjectClassId, fixedClasses]) => ({
                    subjectClassId,
                    fixedClasses,
                }))
            )
            const res = await sqlTransaction(
                payload.map((e) => ({
                    model: 'SubjectClass' as const,
                    operation: 'update',
                    data: {
                        where: {
                            id: e.subjectClassId,
                        },
                        data: {
                            fixedClasses: {
                                set: e.fixedClasses.map((fc) => ({
                                    id: fc.id,
                                })),
                            },
                        },
                    },
                }))
            )
            if (res.status !== 200) throw new Error('Lưu ghép lớp thất bại')
            message.success('Lưu kế hoạch mở lớp thành công')
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
                    onValuesChange={(filter: OpenSubjectClassForm) => {
                        if (!filter.subjectClassNumber) {
                            debouncedRefetch()
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

                                <Col span={8}>
                                    <Form.Item
                                        className="m-0"
                                        name="trainingMajorId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
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
                                        className="m-0"
                                        name="trainingCourseId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
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
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                <Button
                                    onClick={() => {
                                        setIsLayering(!isLayering)
                                        resetSubjectClassToFixedClass()
                                    }}
                                    type={isLayering ? 'default' : 'primary'}
                                >
                                    {isLayering ? 'Tắt' : 'Xem'} ghép lớp
                                </Button>
                                {isLayering && (
                                    <Popconfirm
                                        onConfirm={onSaveLayering}
                                        title="Xác nhận lưu kế hoạch ghép lớp?"
                                        okText="Xác nhận"
                                        cancelText="Hủy"
                                    >
                                        <Button type="primary">Lưu ghép lớp</Button>
                                    </Popconfirm>
                                )}
                                <Popconfirm
                                    onConfirm={onSubmit}
                                    title="Xác nhận lưu kế hoạch mở lớp?"
                                    okText="Xác nhận"
                                    cancelText="Hủy"
                                    description={
                                        'Sau khi lưu kế hoạch mở lớp, các môn học sẽ được tạo mới lại hoàn toàn theo kế hoạch.\nCác lớp học và lịch học đã được tạo trước đó sẽ bị xoá.\nBạn có chắc chắn muốn tiếp tục?'
                                    }
                                >
                                    <Button type="primary">Lưu mở lớp MH</Button>
                                </Popconfirm>
                            </Flex>
                        </Col>
                    </Row>
                    <Form.Item name="subjectClassToFixedClass" hidden />
                    <Col span={24}>
                        <Table
                            rowKey="subjectVersionId"
                            data={data}
                            onRow={(record) => {
                                return {
                                    className: cn(
                                        subjectClassNumber?.[record.subjectVersionId]?.count
                                            ? ''
                                            : 'bg-red-100',
                                        subjectClassNumber?.[record.subjectVersionId]?.count ===
                                            subjectClassNumber?.[record.subjectVersionId]?.countOld
                                            ? ''
                                            : 'bg-yellow-100'
                                    ),
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
                                    dataIndex: ['subjectVersion', 'name'],
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
                                    title: 'Ghép lớp',
                                    align: 'center',
                                    hidden: !isLayering,
                                    render: (_, record) => {
                                        return (
                                            <DndProvider backend={HTML5Backend}>
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="flex h-fit">
                                                        {record?.subjectVersion?.subjectClass.map(
                                                            (e: SubjectClass) => (
                                                                <SubjectClassDropItem
                                                                    subjectVersionId={
                                                                        record.subjectVersionId
                                                                    }
                                                                    item={e}
                                                                    key={e.id}
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex h-fit">
                                                        {record?.fixedClasses.map(
                                                            (e: FixedClass) => (
                                                                <FixedClassDragItem
                                                                    subjectVersionId={
                                                                        record.subjectVersionId
                                                                    }
                                                                    item={e}
                                                                    key={e.id}
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </DndProvider>
                                        )
                                    },
                                },
                                {
                                    title: 'Danh sách lớp MH',
                                    dataIndex: 'subjectClass',
                                    align: 'center',
                                    hidden: isLayering,
                                    render: (__, record) => {
                                        return record?.subjectVersion?.subjectClass?.length ? (
                                            <TextTruncate
                                                arr={record?.subjectVersion?.subjectClass.map(
                                                    (i: any) => {
                                                        return {
                                                            key: i?.id,
                                                            label: `${i?.code}`,
                                                        }
                                                    }
                                                )}
                                                key="subjectClass"
                                            />
                                        ) : (
                                            ''
                                        )
                                    },
                                },
                                {
                                    title: 'Danh sách lớp quản lý',
                                    dataIndex: 'fixedClass',
                                    align: 'center',
                                    hidden: isLayering,
                                    render: (__, record) => {
                                        return record?.fixedClasses?.length ? (
                                            <TextTruncate
                                                arr={record?.fixedClasses.map((i: any) => {
                                                    return {
                                                        key: i?.id,
                                                        label: `${i?.code} (${i?._count?.students || 0})`,
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
                                    title: 'Tổng SV',
                                    width: 80,
                                    align: 'center',
                                    render: (__, record) =>
                                        record?.fixedClasses?.reduce(
                                            (sum: number, fc: any) =>
                                                sum + (fc._count?.students ?? 0),
                                            0
                                        ) || 0,
                                },
                                {
                                    title: 'Đơn vị phụ trách',
                                    dataIndex: ['subjectVersion', 'managementOrganization', 'sMa'],
                                    width: 150,
                                    align: 'center',
                                },
                                {
                                    title: 'Số SV max',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record, idx) => (
                                        <>
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'maxStudent',
                                                ]}
                                                required
                                            >
                                                <InputNumber
                                                    step={0}
                                                    id={`svmax-${record?.subjectVersionId}`}
                                                    controls={false}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === 'ArrowUp' ||
                                                            e.key === 'ArrowDown'
                                                        ) {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            if (!data) return
                                                            const nextId =
                                                                data[
                                                                    idx +
                                                                        (e.key === 'ArrowUp'
                                                                            ? -1
                                                                            : 1)
                                                                ]?.subjectVersionId
                                                            document
                                                                .getElementById(`svmax-${nextId}`)
                                                                ?.focus()
                                                            return
                                                            // Handle the logic for ArrowUp key press
                                                        }

                                                        const allowedKeys = [
                                                            'Backspace',
                                                            'Delete',
                                                            'ArrowLeft',
                                                            'ArrowRight',
                                                            'Tab',
                                                            'Meta',
                                                            'Control',
                                                        ]
                                                        if (
                                                            !/[0-9]/.test(e.key) &&
                                                            !allowedKeys.includes(e.key)
                                                        ) {
                                                            e.preventDefault()
                                                        }
                                                    }}
                                                />
                                            </Form.Item>
                                        </>
                                    ),
                                },
                                {
                                    title: 'Khu vực',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record) => (
                                        <>
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'trainingLocationId',
                                                ]}
                                                required
                                            >
                                                <Select
                                                    allowClear
                                                    showSearch
                                                    dropdownStyle={{
                                                        maxHeight: 400,
                                                        minWidth: 300,
                                                    }}
                                                    filterOption={(input, option) =>
                                                        String(option?.label ?? '')
                                                            ?.toLowerCase()
                                                            ?.includes(input?.toLowerCase())
                                                    }
                                                    options={trainingLocationData.map((e) => ({
                                                        label: e.name,
                                                        value: e.id,
                                                    }))}
                                                />
                                            </Form.Item>
                                        </>
                                    ),
                                },
                                {
                                    title: 'Số lớp MH',
                                    width: 80,
                                    align: 'center',
                                    render: (__, record, idx) => (
                                        <>
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'count',
                                                ]}
                                                required
                                            >
                                                <InputNumber
                                                    step={0}
                                                    id={`lmh-${record?.subjectVersionId}`}
                                                    controls={false}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === 'ArrowUp' ||
                                                            e.key === 'ArrowDown'
                                                        ) {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            if (!data) return
                                                            const nextId =
                                                                data[
                                                                    idx +
                                                                        (e.key === 'ArrowUp'
                                                                            ? -1
                                                                            : 1)
                                                                ]?.subjectVersionId
                                                            document
                                                                .getElementById(`lmh-${nextId}`)
                                                                ?.focus()
                                                            return
                                                            // Handle the logic for ArrowUp key press
                                                        }

                                                        const allowedKeys = [
                                                            'Backspace',
                                                            'Delete',
                                                            'ArrowLeft',
                                                            'ArrowRight',
                                                            'Tab',
                                                            'Meta',
                                                            'Control',
                                                        ]
                                                        if (
                                                            !/[0-9]/.test(e.key) &&
                                                            !allowedKeys.includes(e.key)
                                                        ) {
                                                            e.preventDefault()
                                                        }
                                                    }}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'name',
                                                ]}
                                                hidden
                                            />
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'code',
                                                ]}
                                                hidden
                                            />
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'maxStudent',
                                                ]}
                                                hidden
                                            />
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'countOld',
                                                ]}
                                                hidden
                                            />{' '}
                                            <Form.Item
                                                name={[
                                                    'subjectClassNumber',
                                                    record?.subjectVersionId,
                                                    'examType',
                                                ]}
                                                hidden
                                            />
                                        </>
                                    ),
                                },
                                // {
                                //     title: 'Thao tác',
                                //     width: 100,
                                //     align: 'center',
                                //     fixed: 'right',
                                //     hidden: !canSome(
                                //         QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_KE_HOACH_MO_LOP_MON_HOC,
                                //         'THEM'
                                //     ),
                                //     render: (record) => {
                                //         if (record?.id) {
                                //             return (
                                //                 <Row
                                //                     className="flex justify-center items-center gap-2 text-[#028850]"
                                //                     onClick={onOpen.bind(null, {
                                //                         ...record,
                                //                         semester: semesterId,
                                //                     })}
                                //                 >
                                //                     <CalendarPlus size={16} strokeWidth={2} />
                                //                     Mở Lớp
                                //                 </Row>
                                //             )
                                //         }
                                //         return ''
                                //     },
                                // },
                            ]}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                total: res?._count?.planTrainingSubjects ?? 0,
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

KeHoachMoLopMonHoc.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
