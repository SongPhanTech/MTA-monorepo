import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingCourse, TrainingMajor } from '@workspace/db'
import {
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
    useFindUniqueSemester,
} from '@workspace/db/hooks'
import { useOpenSubjectClass } from '@workspace/libs/api/training'
import { exportFromTemplate } from '@workspace/libs/template-excel'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, Row } from 'antd'
import _ from 'lodash'
import { CalendarPlus } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
}

export default function SubjectOpeningPlan() {
    const { canSome } = useAbility()
    const [form] = Form.useForm<FilterProps>()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { id: semesterId } = useSemesterStore()
    const searchText = Form.useWatch('searchText', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const trainingMajorId = Form.useWatch('trainingMajorId', form)

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
        { query: { enabled: !!semesterId } }
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

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { onOpen } = useDisclosure<string>({
        tag: 'PutOpenClassModal',
        onClose: refetch,
    })

    const { onOpen: onOpenXuatFileMoLop } = useDisclosure<string>({
        tag: 'ModalExportFileSubjectClass',
    })

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Form
                                form={form}
                                onValuesChange={(filter: FilterProps) => {
                                    debouncedRefetch()
                                }}
                            >
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
                                                options={trainingCourseData.map(
                                                    (i: TrainingCourse) => ({
                                                        value: i.id,
                                                        label: i.name,
                                                    })
                                                )}
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Col>
                                </Flex>
                            </Form>
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
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã MH',
                                // TODO: dataIndex: 'code'
                                dataIndex: 'subjectVersionCode',
                                align: 'center',
                                width: 100,
                                fixed: 'left',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'subjectVersionName',
                                width: 150,
                                align: 'center',
                                fixed: 'left',
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
                                width: 150,
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
                                width: 180,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.fixedClass.length ? (
                                        <TextTruncate
                                            arr={record?.fixedClass.map((i: any) => {
                                                return {
                                                    key: i?.fixedClassId,
                                                    label: `Kì ${i.fixedClassSemester} - ${i.fixedClassCode} (${i.fixedClassCount})`,
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
                                width: 200,
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
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Tổng SV',
                                dataIndex: 'countStudent',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số lớp MH',
                                dataIndex: ['subjectClass', 'length'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'managementOrganizationCode',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_KE_HOACH_MO_LOP_MON_HOC,
                                    'THEM'
                                ),
                                render: (record) => {
                                    if (record?.id) {
                                        return (
                                            <Row
                                                className="flex justify-center items-center gap-2 text-[#028850]"
                                                onClick={onOpen.bind(null, {
                                                    ...record,
                                                    semester: semesterId,
                                                })}
                                            >
                                                <CalendarPlus size={16} strokeWidth={2} />
                                                Mở Lớp
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
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
            </Row>
        </div>
    )
}

SubjectOpeningPlan.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
