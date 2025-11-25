import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { $Enums, Prisma } from '@workspace/db/client'
import { useFindFirstPlanTraining } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingCourseStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { cn } from '@workspace/ui/lib/utils'
import { Button, Col, Flex, Form, Input, InputNumber, message, Popover, Row, Switch } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
            isEdit?: boolean
        }
    >
    // SubjectVersionId -> SubjectClassId
}

type MoLMHNhanhForm = {
    count: number
    isOverride: boolean
}

export default function KeHoachMoLopMonHoc({ hocLai = false }: { hocLai?: boolean }) {
    const { canSome } = useAbility()
    const [form] = Form.useForm<OpenSubjectClassForm>()
    const [formMoLMHNhanh] = Form.useForm<MoLMHNhanhForm>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { id: semesterId } = useSemesterStore()

    const searchText = Form.useWatch('searchText', form)
    const { id: trainingCourseId } = useTrainingCourseStore()
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const subjectVersions = Form.useWatch('subjectVersions', form) || {}

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
                                          trainingCourseId,
                                          curriculumVersion: {
                                              curriculum: {
                                                  trainingMajorId,
                                              },
                                          },
                                      },
                                  },
                                  subjectClassType: hocLai
                                      ? $Enums.SubjectClassType.RETAKE
                                      : $Enums.SubjectClassType.NORMAL,
                              },
                          },
                      }
                    : {}),
            },
            include: {
                planTrainingSubjects: {
                    where: {
                        subjectClassType: hocLai
                            ? $Enums.SubjectClassType.RETAKE
                            : $Enums.SubjectClassType.NORMAL,
                        ...(hocLai
                            ? {}
                            : {
                                  fixedClasses: {
                                      some: {
                                          trainingCourseId,
                                          curriculumVersion: {
                                              curriculum: {
                                                  trainingMajorId,
                                              },
                                          },
                                      },
                                  },
                              }),
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
                    },
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
                    take: numberOfPages,
                    skip: (currentPage - 1) * numberOfPages,
                },
                _count: {
                    select: {
                        planTrainingSubjects: {
                            where: {
                                subjectClassType: hocLai
                                    ? $Enums.SubjectClassType.RETAKE
                                    : $Enums.SubjectClassType.NORMAL,
                                ...(hocLai
                                    ? {}
                                    : {
                                          fixedClasses: {
                                              some: {
                                                  trainingCourseId,
                                                  curriculumVersion: {
                                                      curriculum: {
                                                          trainingMajorId,
                                                      },
                                                  },
                                              },
                                          },
                                      }),
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
            resetData()
        }
    }, [data])

    const resetData = () => {
        if (!data) return
        form.setFieldValue(
            'subjectVersions',
            data.reduce(
                (acc, cur) => {
                    if (!acc) {
                        return {}
                    }
                    acc[cur.subjectVersionId] = {
                        count: cur.subjectVersion.subjectClass.length ?? 0,
                        name: cur.subjectVersion?.name,
                        code: cur.subjectVersion?.code,
                        maxStudent:
                            cur.studentCount ??
                            cur.subjectVersion.subjectClass?.[0]?.maxStudent ??
                            cur.fixedClasses.reduce(
                                (sum, fc) => sum + (fc._count?.students ?? 0),
                                0
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
        }, 500),
        []
    )

    const { hideSpinner, showSpinner } = useSpinner()

    return (
        <div>
            <Row gutter={[0, 0]}>
                <Form
                    className="w-full"
                    form={form}
                    onValuesChange={(filter: OpenSubjectClassForm) => {
                        if (!filter.subjectVersions) {
                            debouncedRefetch()
                        } else {
                            const subjectVersionId = Object.keys(filter.subjectVersions || {})?.[0]
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
                                <Popover
                                    content={
                                        <Form
                                            form={formMoLMHNhanh}
                                            initialValues={{ isOverride: false }}
                                            onFinish={async (values: MoLMHNhanhForm) => {
                                                try {
                                                    if (!semesterId || !trainingObjectTypeId) return
                                                    showSpinner()
                                                    const resList = await sqlTransaction([
                                                        ...(values.isOverride
                                                            ? [
                                                                  {
                                                                      model: 'SubjectClass' as const,
                                                                      operation: 'deleteMany',
                                                                      data: {
                                                                          where: {
                                                                              semesterId,
                                                                              trainingObjectTypeId,
                                                                              status: 'DRAFT',
                                                                              cancelled: false,
                                                                              type: hocLai
                                                                                  ? $Enums
                                                                                        .SubjectClassType
                                                                                        .RETAKE
                                                                                  : $Enums
                                                                                        .SubjectClassType
                                                                                        .NORMAL,
                                                                          },
                                                                      },
                                                                  },
                                                              ]
                                                            : []),
                                                        {
                                                            model: 'PlanTraining',
                                                            operation: 'findFirst',
                                                            data: {
                                                                where: {
                                                                    semesterId,
                                                                    trainingObjectTypeId,
                                                                    planTrainingSubjects: {
                                                                        some: {
                                                                            subjectClassType: hocLai
                                                                                ? $Enums
                                                                                      .SubjectClassType
                                                                                      .RETAKE
                                                                                : $Enums
                                                                                      .SubjectClassType
                                                                                      .NORMAL,
                                                                        },
                                                                    },
                                                                },
                                                                select: {
                                                                    planTrainingSubjects: {
                                                                        select: {
                                                                            subjectVersion: {
                                                                                select: {
                                                                                    id: true,
                                                                                    code: true,
                                                                                    name: true,
                                                                                },
                                                                            },
                                                                        },
                                                                        where: {
                                                                            subjectClassType: hocLai
                                                                                ? $Enums
                                                                                      .SubjectClassType
                                                                                      .RETAKE
                                                                                : $Enums
                                                                                      .SubjectClassType
                                                                                      .NORMAL,
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                        {
                                                            model: 'SubjectClass',
                                                            operation: 'findMany',
                                                            data: {
                                                                where: {
                                                                    semesterId,
                                                                    trainingObjectTypeId,
                                                                    status: 'DRAFT',
                                                                    cancelled: false,
                                                                    type: hocLai
                                                                        ? $Enums.SubjectClassType
                                                                              .RETAKE
                                                                        : $Enums.SubjectClassType
                                                                              .NORMAL,
                                                                },
                                                            },
                                                        },
                                                    ])
                                                    if (resList.status !== 200) {
                                                        throw new Error('Lỗi khi lấy dữ liệu')
                                                    }

                                                    const listSubjectVersionIds = (
                                                        values.isOverride
                                                            ? resList.data[1]
                                                            : resList.data[0]
                                                    ) as Prisma.PlanTrainingGetPayload<{
                                                        select: {
                                                            planTrainingSubjects: {
                                                                select: {
                                                                    subjectVersion: {
                                                                        select: {
                                                                            id: true
                                                                            code: true
                                                                            name: true
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }>

                                                    const alreadySubjectIds = (
                                                        values.isOverride
                                                            ? resList.data[2]
                                                            : resList.data[1]
                                                    ) as Prisma.SubjectClassGetPayload<{}>[]

                                                    const res = await sqlTransaction([
                                                        ...listSubjectVersionIds.planTrainingSubjects
                                                            .filter(
                                                                (pts) =>
                                                                    !alreadySubjectIds.some(
                                                                        (asc) =>
                                                                            asc.subjectId ===
                                                                            pts.subjectVersion.id
                                                                    )
                                                            )
                                                            .flatMap((e) =>
                                                                new Array(values.count)
                                                                    .fill(1)
                                                                    .map((_, idx) => ({
                                                                        model: 'SubjectClass' as const,
                                                                        operation: 'create',
                                                                        data: {
                                                                            data: {
                                                                                semesterId,
                                                                                trainingObjectTypeId,
                                                                                type: hocLai
                                                                                    ? $Enums
                                                                                          .SubjectClassType
                                                                                          .RETAKE
                                                                                    : $Enums
                                                                                          .SubjectClassType
                                                                                          .NORMAL,
                                                                                subjectId:
                                                                                    e.subjectVersion
                                                                                        .id,
                                                                                code: `${e.subjectVersion.code} ${String(idx + 1)}`,
                                                                                name: e
                                                                                    .subjectVersion
                                                                                    .name,
                                                                                maxStudent:
                                                                                    subjectVersions[
                                                                                        e
                                                                                            .subjectVersion
                                                                                            .id
                                                                                    ]?.maxStudent ||
                                                                                    0,
                                                                            },
                                                                        },
                                                                    }))
                                                            ),
                                                    ])
                                                    if (res.status !== 200) {
                                                        throw new Error('Lỗi khi mở LMH')
                                                    }
                                                    debouncedRefetch()
                                                    message.success('Mở LMH thành công')
                                                } catch (error: any) {
                                                    message.error(
                                                        'Đã xảy ra lỗi, vui lòng kiểm tra lại'
                                                    )
                                                } finally {
                                                    hideSpinner()
                                                }
                                            }}
                                        >
                                            <FormItem
                                                form={formMoLMHNhanh}
                                                name={'count'}
                                                required
                                                label="Số LMH"
                                            >
                                                <InputNumber min={0} />
                                            </FormItem>
                                            <FormItem
                                                form={formMoLMHNhanh}
                                                name={'isOverride'}
                                                label="Ghi đè LMH đã mở"
                                                className="mt-2"
                                            >
                                                <Switch />
                                            </FormItem>
                                            <Col span={24} className="text-right mt-4">
                                                <Button type="primary" htmlType="submit">
                                                    Mở LMH
                                                </Button>
                                            </Col>
                                        </Form>
                                    }
                                    title="Mở LMH nhanh"
                                    trigger="click"
                                    placement="bottomRight"
                                >
                                    <Button type={'dashed'}>Mở LMH (nhanh)</Button>
                                </Popover>
                                <Button
                                    onClick={async () => {
                                        try {
                                            if (!semesterId || !trainingObjectTypeId) return
                                            showSpinner()
                                            const values = await form.validateFields()
                                            const subjectIds = Object.entries(
                                                values.subjectVersions || {}
                                            )
                                                .filter(([_, v]) => v.isEdit)
                                                .map(([k, _]) => k)
                                            const res = await sqlTransaction([
                                                {
                                                    model: 'SubjectClass' as const,
                                                    operation: 'deleteMany',
                                                    data: {
                                                        where: {
                                                            semesterId,
                                                            trainingObjectTypeId,
                                                            status: 'DRAFT',
                                                            cancelled: false,
                                                            type: hocLai
                                                                ? $Enums.SubjectClassType.RETAKE
                                                                : $Enums.SubjectClassType.NORMAL,
                                                            subjectId: {
                                                                in: subjectIds,
                                                            },
                                                        },
                                                    },
                                                },
                                                ...Object.entries(values.subjectVersions || {})
                                                    .filter(([_, v]) => v.isEdit)
                                                    .flatMap(([subjectId, v]) =>
                                                        new Array(v.count)
                                                            .fill(1)
                                                            .map((_, idx) => ({
                                                                model: 'SubjectClass' as const,
                                                                operation: 'create',
                                                                data: {
                                                                    data: {
                                                                        semesterId,
                                                                        trainingObjectTypeId,
                                                                        type: hocLai
                                                                            ? $Enums
                                                                                  .SubjectClassType
                                                                                  .RETAKE
                                                                            : $Enums
                                                                                  .SubjectClassType
                                                                                  .NORMAL,
                                                                        subjectId,
                                                                        code: `${v.code} ${String(idx + 1)}`,
                                                                        name: v.name,
                                                                        maxStudent:
                                                                            v.maxStudent || 0,
                                                                    },
                                                                },
                                                            }))
                                                    ),
                                            ])
                                            if (res.status !== 200) {
                                                throw new Error('Lỗi khi mở LMH')
                                            }
                                            debouncedRefetch()
                                            message.success('Mở LMH thành công')
                                        } catch (error: any) {
                                            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
                                        } finally {
                                            hideSpinner()
                                        }
                                    }}
                                    type={'primary'}
                                >
                                    Lưu
                                </Button>
                                <Button
                                    onClick={() => {
                                        resetData()
                                    }}
                                    type={'primary'}
                                    danger
                                >
                                    Huỷ
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                    <Form.Item name="subjectVersions" hidden />
                    <Col span={24}>
                        <Table
                            rowKey="subjectVersionId"
                            data={data}
                            onRow={(record) => {
                                return {
                                    className: cn(
                                        subjectVersions?.[record.subjectVersionId]?.count === 0 &&
                                            'bg-red-100',
                                        subjectVersions?.[record.subjectVersionId]?.isEdit &&
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
                                    title: 'Danh sách lớp MH',
                                    dataIndex: 'subjectClass',
                                    align: 'center',
                                    hidden: hocLai,
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
                                    hidden: hocLai,
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
                                    render: (_, record) =>
                                        record?.studentCount ||
                                        record?.fixedClasses?.reduce(
                                            (sum: number, fc: any) =>
                                                sum + (fc._count?.students ?? 0),
                                            0
                                        ) ||
                                        0,
                                },
                                {
                                    title: 'Đơn vị phụ trách',
                                    dataIndex: ['subjectVersion', 'managementOrganization', 'sMa'],
                                    width: 150,
                                    align: 'center',
                                },
                                {
                                    title: 'Số LMH',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record, idx) => (
                                        <>
                                            <Form.Item
                                                name={[
                                                    'subjectVersions',
                                                    record?.subjectVersionId,
                                                    'count',
                                                ]}
                                                className={'m-0'}
                                                required
                                            >
                                                <InputNumber
                                                    step={0}
                                                    id={`subjectClassCount-${record?.subjectVersionId}`}
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
                                                                .getElementById(
                                                                    `subjectClassCount-${nextId}`
                                                                )
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
                                    title: 'Số SV tối đa / LMH',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record, idx) => (
                                        <>
                                            <Form.Item
                                                name={[
                                                    'subjectVersions',
                                                    record?.subjectVersionId,
                                                    'maxStudent',
                                                ]}
                                                required
                                                className={'m-0'}
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
