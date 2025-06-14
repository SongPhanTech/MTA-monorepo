import { queryClient } from '@api/index'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { PutOpenClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { SchoolYear, Semester, TrainingObjectType } from '@workspace/db'
import {
    useFindManySchoolYear,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import {
    openSubjectClass,
    useOpenSubjectClass,
} from '@workspace/libs/api/training'
import { Button, Col, Flex, Form, Input, Row, message } from 'antd'
import { useForm } from 'antd/es/form/Form'
import _ from 'lodash'
import { CalendarPlus, Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText?: string
    trainingCourseId?: string
    schoolYearId?: string
    semesterId?: string
}

export default function SubjectOpeningPlan() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const [form] = useForm<FilterProps>()

    const { data: schoolYears } = useFindManySchoolYear({
        include: { semesters: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
    })

    const schoolYearId = Form.useWatch('schoolYearId', form)

    const { data: res, refetch } = useOpenSubjectClass(
        {
            page: '1',
            pageSize: '10',
            semesterId: form.getFieldValue('semesterId'),
            trainingCourseId: form.getFieldValue('trainingCourseId'),
            search: form.getFieldValue('searchText'),
        },
        {},
        queryClient
    )

    console.log(res?.data)

    const data = useMemo(
        () =>
            res?.status === 200
                ? res.data.data.map((subjectVersion) => ({
                      id: subjectVersion.subjectVersionId,
                      ...subjectVersion,
                  }))
                : [],
        [res]
    )

    // const data = []

    useEffect(() => {
        if (schoolYears?.length) {
            const lastSchoolYear = schoolYears[schoolYears.length - 1]
            form.setFieldValue('schoolYearId', lastSchoolYear.id)

            if (lastSchoolYear.semesters.length) {
                const lastSemester =
                    lastSchoolYear.semesters[
                        lastSchoolYear.semesters.length - 1
                    ]
                form.setFieldValue('semesterId', lastSemester.id)
            }
        }
    }, [schoolYears, form])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingCourse({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Form
                                form={form}
                                onValuesChange={(filter: FilterProps) => {
                                    if (filter.schoolYearId) {
                                        const schoolYear = schoolYears?.find(
                                            (item) =>
                                                item.id === filter.schoolYearId
                                        )
                                        const lastSemester =
                                            schoolYear?.semesters?.[
                                                schoolYear.semesters.length - 1
                                            ]

                                        if (lastSemester) {
                                            form.setFieldValue(
                                                'semesterId',
                                                lastSemester.id
                                            )
                                            debouncedRefetch()
                                            form.focusField('semesterId')
                                        }
                                    } else {
                                        debouncedRefetch()
                                    }
                                }}
                            >
                                <Flex>
                                    <Col span={6}>
                                        <Form.Item name="searchText">
                                            <Input
                                                id="search"
                                                placeholder="Nhập tên lớp..."
                                                style={{ height: 40 }}
                                                prefix={
                                                    <Search
                                                        size={15}
                                                        style={{
                                                            color: 'rgba(0, 0, 0, 0.25)',
                                                        }}
                                                    />
                                                }
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            className="mb-0"
                                            name="schoolYearId"
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            labelAlign="left"
                                        >
                                            <Select
                                                placeholder="Chọn năm học"
                                                options={schoolYears?.map(
                                                    (i: SchoolYear) => ({
                                                        value: i.id,
                                                        label: i.name,
                                                    })
                                                )}
                                                style={{ height: 40 }}
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            className="mb-0"
                                            name="semesterId"
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            labelAlign="left"
                                        >
                                            <Select
                                                placeholder="Chọn học kỳ"
                                                options={schoolYears
                                                    ?.find(
                                                        ({ id }) =>
                                                            id === schoolYearId
                                                    )
                                                    ?.semesters.map(
                                                        ({
                                                            id,
                                                            code,
                                                        }: Semester) => ({
                                                            value: id,
                                                            label: code,
                                                        })
                                                    )}
                                                style={{ height: 40 }}
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            className="mb-0"
                                            name="trainingObjectId"
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            labelAlign="left"
                                        >
                                            <Select
                                                placeholder="Chọn đối tượng đào tạo"
                                                options={trainingObjectTypeData.map(
                                                    (
                                                        i: TrainingObjectType
                                                    ) => ({
                                                        value: i.id,
                                                        label: i.name,
                                                    })
                                                )}
                                                style={{ height: 40 }}
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
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
                                                    (
                                                        i: TrainingObjectType
                                                    ) => ({
                                                        value: i.id,
                                                        label: i.name,
                                                    })
                                                )}
                                                style={{ height: 40 }}
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Col>
                                </Flex>
                            </Form>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file TKB
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (selectedKeys) =>
                                setSelectedRowKeys(selectedKeys),
                        }}
                        data={data}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã môn học',
                                // TODO: dataIndex: 'code'
                                dataIndex: 'subjectVersionId',
                                align: 'center',
                                width: 150,
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'subjectVersionName',
                                width: 150,
                            },
                            {
                                title: 'Danh sách lớp môn học',
                                dataIndex: 'subjectClass',
                                width: 200,
                                render: (
                                    values: {
                                        subjectClassName: string
                                        subjectClassCode: string
                                    }[]
                                ) => (
                                    <ul
                                        style={{
                                            paddingLeft: 16,
                                            margin: 0,
                                        }}
                                    >
                                        {values?.map((val) => (
                                            <li key={val.subjectClassName}>
                                                {`${val.subjectClassName} ${val.subjectClassCode}`}
                                            </li>
                                        ))}
                                    </ul>
                                ),
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'subjectVersionCredit',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'curriculumVersion',
                                width: 200,
                                render: (
                                    values: {
                                        curriculumVersionName: string
                                    }[]
                                ) => (
                                    <ul
                                        style={{
                                            paddingLeft: 16,
                                            margin: 0,
                                            listStyleType: 'disc',
                                        }}
                                    >
                                        {values?.map((val) => (
                                            <li key={val.curriculumVersionName}>
                                                {val.curriculumVersionName}
                                            </li>
                                        ))}
                                    </ul>
                                ),
                            },
                            // {
                            //     title: 'Các lớp có môn',
                            //     dataIndex: 'cacLopCoMon',
                            //     width: 200,
                            //     render: (classes: { name: string }[]) => (
                            //         <ul
                            //             style={{
                            //                 paddingLeft: 16,
                            //                 margin: 0,
                            //                 listStyleType: 'disc',
                            //             }}
                            //         >
                            //             {classes.map((cls) => (
                            //                 <li key={cls.name}>{cls.name}</li>
                            //             ))}
                            //         </ul>
                            //     ),
                            // },
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
                                title: 'Số lớp môn học',
                                dataIndex: ['subjectClass', 'length'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                // TODO:
                                dataIndex: ['managementOrganization', 'name'],
                                width: 200,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row
                                                className="flex justify-center items-center gap-2 text-[#028850]"
                                                onClick={handleModal}
                                            >
                                                <CalendarPlus
                                                    size={16}
                                                    strokeWidth={2}
                                                />
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
                            // total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
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
