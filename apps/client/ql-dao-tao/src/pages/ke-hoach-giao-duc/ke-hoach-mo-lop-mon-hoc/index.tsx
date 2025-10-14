import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { type TrainingMajor } from '@workspace/db'
import {
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
    useFindUniqueSemester,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useOpenSubjectClass } from '@workspace/libs/api/training'
import { exportFromTemplate } from '@workspace/libs/template-excel'
import { useAbility } from '@workspace/permissions/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { cn } from '@workspace/ui/lib/utils'
import { Button, Col, Flex, Form, Input, InputNumber, message, Popconfirm, Row } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface OpenSubjectClassForm {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
    subjectClassNumber?: Record<
        string,
        {
            count: number
            name: string
            code: string
            maxStudent: number
            countOld: number
        }
    >
}

export default function SubjectOpeningPlan() {
    const { canSome } = useAbility()
    const [form] = Form.useForm<OpenSubjectClassForm>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { id: semesterId } = useSemesterStore()
    const searchText = Form.useWatch('searchText', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const subjectClassNumber = Form.useWatch('subjectClassNumber', form) || {}

    const { data: semesterData } = useFindUniqueSemester(
        {
            where: { id: semesterId },
            select: {
                id: true,
                name: true,
                schoolYear: {
                    select: { id: true, name: true },
                },
            },
        },
        {
            enabled: !!semesterId,
            refetchOnWindowFocus: false,
        }
    )
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: res, refetch } = useOpenSubjectClass(
        {
            page: `${currentPage}`,
            pageSize: `${numberOfPages}`,
            semesterId: semesterId as string,
            search: searchText,
            trainingCourseId,
            trainingMajorId,
            trainingObjectTypeId: trainingObjectTypeId || '',
        },
        { query: { enabled: !!semesterId && !!trainingObjectTypeId, refetchOnWindowFocus: false } }
    )

    const data = useMemo(
        () =>
            res?.status === 200
                ? res?.data?.data.map((subjectVersion) => ({
                      id: subjectVersion.subjectVersionId,
                      ...subjectVersion,
                  }))
                : [],
        [res]
    )

    useEffect(() => {
        if (data) {
            form.setFieldValue(
                'subjectClassNumber',
                data.reduce(
                    (acc, cur) => {
                        if (!acc) {
                            return {
                                [cur.subjectVersionId]: {
                                    count: cur.subjectClass.length ?? 0,
                                    name: cur.subjectVersionName,
                                    code: cur.subjectVersionCode,
                                    maxStudent: cur.countStudent,
                                    countOld: cur.subjectClass.length ?? 0,
                                },
                            }
                        }
                        acc[cur.subjectVersionId] = {
                            count: cur.subjectClass.length ?? 0,
                            name: cur.subjectVersionName,
                            code: cur.subjectVersionCode,
                            maxStudent: cur.countStudent,
                            countOld: cur.subjectClass.length ?? 0,
                        }
                        return acc
                    },
                    {} as OpenSubjectClassForm['subjectClassNumber']
                )
            )
        }
    }, [data, form])

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

    const onSubmit = async () => {
        try {
            if (!semesterId || !trainingObjectTypeId) return
            const listSubjectVersionIds = Object.entries(subjectClassNumber)
                .filter(([, subjectVersion]) => subjectVersion.count !== subjectVersion.countOld)
                .map(([key]) => key)

            await sqlTransaction([
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
                                    maxStudent: Math.ceil(
                                        subjectVersion.maxStudent / subjectVersion.count
                                    ),
                                }))
                            ),
                    },
                },
            ])
            message.success('Lưu kế hoạch mở lớp thành công')
            form.resetFields()
            debouncedRefetch()
        } catch (error) {
            message.error('Lưu kế hoạch mở lớp thất bại')
            console.error(error)
        }
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
                        } else {
                            console.log(filter.subjectClassNumber)
                        }
                    }}
                >
                    <Col span={24}>
                        <Row gutter={[16, 16]} align="top" justify="space-between">
                            <Col span={12}>
                                <Flex>
                                    <Col span={8}>
                                        <Form.Item name="searchText">
                                            <Input id="search" placeholder="Tìm kiếm" allowClear />
                                        </Form.Item>
                                    </Col>

                                    <Col span={8}>
                                        <Form.Item
                                            className="mb-0"
                                            name="trainingMajorId"
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            labelAlign="left"
                                        >
                                            <Select
                                                placeholder="Chọn chuyên ngành đào tạo"
                                                options={trainingMajorData.map(
                                                    (i: TrainingMajor) => ({
                                                        value: i.id,
                                                        label: i.name,
                                                    })
                                                )}
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            className="mb-0"
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
                            <Col span={6}>
                                <Flex justify="end" gap={4}>
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            exportFromTemplate({
                                                templateUrl: '/lms/templates/ke-hoach-mo-lop.xlsx',
                                                data: {
                                                    hoc_ky: semesterData?.name ?? '',
                                                    nam_hoc: semesterData?.schoolYear?.name ?? '',
                                                },
                                                tableStartCell: { row: 7, col: 1 },
                                                rows: data.flatMap((item, index) =>
                                                    item.fixedClass.map((fc, idx) => {
                                                        const rowSpan =
                                                            idx === 0 ? item.fixedClass.length : 1
                                                        return {
                                                            cells: [
                                                                {
                                                                    value: index + 1,
                                                                    align: 'center',
                                                                    rowSpan,
                                                                },
                                                                {
                                                                    value: item.subjectVersionCode,
                                                                    align: 'center',
                                                                    rowSpan,
                                                                },
                                                                {
                                                                    value: item.subjectVersionName,
                                                                    rowSpan,
                                                                },
                                                                {
                                                                    value: item.subjectVersionCredit,
                                                                    align: 'center',
                                                                    rowSpan,
                                                                },
                                                                {
                                                                    value: `${fc.fixedClassCode}`,
                                                                    align: 'center',
                                                                },
                                                                {
                                                                    value: `${fc.fixedClassSemester}`,
                                                                    align: 'center',
                                                                },
                                                                {
                                                                    value: `${fc.fixedClassCount}`,
                                                                    align: 'center',
                                                                },
                                                                {
                                                                    value: '',
                                                                    align: 'center',
                                                                    rowSpan,
                                                                },
                                                                {
                                                                    value: item.countStudent,
                                                                    align: 'center',
                                                                    rowSpan,
                                                                },
                                                                {
                                                                    value:
                                                                        item.managementOrganizationCode ??
                                                                        '',
                                                                    align: 'center',
                                                                    rowSpan,
                                                                },
                                                            ],
                                                        }
                                                    })
                                                ),
                                                fileName: `ke-hoach-mo-lop-mon-hoc-${semesterData?.name}.xlsx`,
                                            })
                                        }
                                    >
                                        Xuất kế hoạch môn dự kiến
                                    </Button>
                                    <Popconfirm
                                        onConfirm={onSubmit}
                                        title="Xác nhận lưu kế hoạch mở lớp?"
                                        okText="Xác nhận"
                                        cancelText="Hủy"
                                        description={
                                            'Sau khi lưu kế hoạch mở lớp, các môn học sẽ được tạo mới lại hoàn toàn theo kế hoạch.\nCác lớp học và lịch học đã được tạo trước đó sẽ bị xoá.\nBạn có chắc chắn muốn tiếp tục?'
                                        }
                                    >
                                        <Button type="primary">Lưu kế hoạch</Button>
                                    </Popconfirm>
                                    {/* <Button type="primary">Thêm mới</Button> */}
                                    {/* {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_KE_HOACH_MO_LOP_MON_HOC,
                                    'XUAT_EXCEL'
                                ) && (
                                    <Button
                                        type="primary"
                                        onClick={() => onOpenXuatFileMoLop(selectedSemesterId)}
                                    >
                                        <FileDoneOutlined />
                                        Xuất file mẫu
                                    </Button>
                                )} */}
                                    {/* {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_KE_HOACH_MO_LOP_MON_HOC,
                                    'NHAP_EXCEL'
                                ) && (
                                    <Button
                                        type="primary"
                                        onClick={() => onOpenModalNhapTKB(selectedSemesterId)}
                                    >
                                        <EditIcon stroke="white" />
                                        Nhập từ file TKB
                                    </Button>
                                )} */}
                                </Flex>
                            </Col>
                        </Row>
                    </Col>
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
                                    dataIndex: 'subjectVersionCode',
                                    align: 'center',
                                    width: 100,
                                },
                                {
                                    title: 'Tên môn học',
                                    dataIndex: 'subjectVersionName',
                                    align: 'center',
                                    render: (__, record) => {
                                        return (
                                            `${record?.subjectVersionName} (${record?.subjectVersionCredit})` ||
                                            ''
                                        )
                                    },
                                },
                                {
                                    title: 'Danh sách lớp MH',
                                    dataIndex: 'subjectClass',
                                    align: 'center',
                                    render: (__, record) => {
                                        return record?.subjectClass.length ? (
                                            <TextTruncate
                                                arr={record?.subjectClass.map((i: any) => {
                                                    return {
                                                        key: i?.subjectClassId,
                                                        label: `${i?.subjectClassCode}`,
                                                    }
                                                })}
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
                                    render: (__, record) => {
                                        return record?.fixedClass.length ? (
                                            <TextTruncate
                                                arr={record?.fixedClass.map((i: any) => {
                                                    return {
                                                        key: i?.fixedClassId,
                                                        label: `Kỳ ${i.fixedClassSemester} - ${i.fixedClassCode} (${i.fixedClassCount})`,
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
                                    title: 'CTĐT',
                                    dataIndex: 'curriculumVersion',
                                    align: 'center',
                                    render: (__, record) => {
                                        return record?.curriculumVersion.length ? (
                                            <TextTruncate
                                                arr={record?.curriculumVersion.map((i: any) => {
                                                    return {
                                                        key: i?.curriculumVersionId,
                                                        label: `${i?.curriculumVersionCode} - ${i?.curriculumVersionName}`,
                                                    }
                                                })}
                                                key="curriculumVersion"
                                            />
                                        ) : (
                                            ''
                                        )
                                    },
                                },
                                {
                                    title: 'SV nợ',
                                    dataIndex: 'svNo',
                                    width: 80,
                                    align: 'center',
                                },
                                {
                                    title: 'Tổng SV',
                                    dataIndex: 'countStudent',
                                    width: 80,
                                    align: 'center',
                                },
                                {
                                    title: 'Đơn vị phụ trách',
                                    dataIndex: 'managementOrganizationCode',
                                    width: 150,
                                    align: 'center',
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
                                total: res?.data?.count ?? 0,
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

SubjectOpeningPlan.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
