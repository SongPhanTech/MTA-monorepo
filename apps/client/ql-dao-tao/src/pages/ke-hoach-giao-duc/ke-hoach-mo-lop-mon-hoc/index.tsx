import { FileDoneOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import EditIcon from '@components/icons/edit'
import { ModalExportFileSubjectClass, PutOpenClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Semester, TrainingCourse, TrainingObjectType } from '@workspace/db'
import {
    useFindManySchoolYear,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import { useOpenSubjectClass } from '@workspace/libs/api/training'
import { Button, Col, Flex, Form, Input, message, Row, TreeSelect } from 'antd'
import _ from 'lodash'
import { CalendarPlus } from 'lucide-react'
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
    const [form] = Form.useForm<FilterProps>()

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedSemester, setSelectedSemester] = useState({})

    const { data: schoolYears = [] } = useFindManySchoolYear({
        include: { semesters: { orderBy: { startDate: 'asc' } } },
        orderBy: { startDate: 'asc' },
    })
    const semesterId = Form.useWatch('semesterId', form)
    const { data: res, refetch } = useOpenSubjectClass(
        {
            page: '1',
            pageSize: '10',
            semesterId: semesterId as string,
            trainingCourseId: form.getFieldValue('trainingCourseId'),
            search: form.getFieldValue('searchText'),
        },
        { query: { enabled: !!semesterId } },
        queryClient
    )
    const treeData = useMemo(() => {
        return schoolYears.map((i) => ({
            title: i?.name,
            key: i?.id,
            value: i?.id,
            selectable: false,
            code: i?.code,
            children: i?.semesters?.length
                ? i?.semesters.map((j: Semester) => ({
                      title: `${j?.name} năm ${i?.name}`,
                      key: j?.id,
                      value: j?.id,
                      code: j?.code,
                  }))
                : [],
        }))
    }, [schoolYears])

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

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (schoolYears?.length) {
            const lastSchoolYear = schoolYears[schoolYears.length - 1]

            if (lastSchoolYear.semesters.length) {
                const lastSemester = lastSchoolYear.semesters[lastSchoolYear.semesters.length - 1]
                form.setFieldValue('semesterId', lastSemester.id)
                setSelectedSemester({
                    id: lastSemester?.id,
                    label: lastSemester.name,
                    code: lastSemester.code,
                    key: lastSemester.id,
                })
            }
        }
    }, [schoolYears])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
        onClose: refetch,
    })

    const _handleModal = () => {
        onOpen()
    }

    const { onOpen: onOpenXuatFileMoLop } = useDisclosure<string>({
        tag: ModalExportFileSubjectClass.name,
    })

    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function _handleDelete(id: string) {
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
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
                                    if (filter.schoolYearId) {
                                        const schoolYear = schoolYears?.find(
                                            (item) => item.id === filter.schoolYearId
                                        )
                                        const lastSemester =
                                            schoolYear?.semesters?.[schoolYear.semesters.length - 1]

                                        if (lastSemester) {
                                            form.setFieldValue('semesterId', lastSemester.id)
                                            debouncedRefetch()
                                            form.focusField('semesterId')
                                        }
                                    } else {
                                        debouncedRefetch()
                                    }
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
                                            name="semesterId"
                                            labelCol={{ span: 24 }}
                                            wrapperCol={{ span: 24 }}
                                            labelAlign="left"
                                        >
                                            <TreeSelect
                                                placeholder="Chọn học kỳ"
                                                showSearch
                                                treeDefaultExpandAll
                                                treeData={treeData}
                                                style={{ width: '100%' }}
                                                filterTreeNode={(input, node) =>
                                                    (node?.label as string)
                                                        ?.toLowerCase()
                                                        ?.includes(input?.toLowerCase())
                                                }
                                                onSelect={(value, node) =>
                                                    setSelectedSemester({
                                                        ...node,
                                                        id: node.value,
                                                    })
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
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
                                                    (i: TrainingObjectType) => ({
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
                                {/* <Button type="primary">Thêm mới</Button> */}
                                <Button
                                    type="primary"
                                    onClick={() => onOpenXuatFileMoLop(semesterId)}
                                >
                                    <FileDoneOutlined />
                                    Xuất file mẫu
                                </Button>
                                <Button type="primary">
                                    <EditIcon stroke="white" />
                                    Nhập từ file TKB
                                </Button>
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
                                title: 'Mã môn học',
                                // TODO: dataIndex: 'code'
                                dataIndex: 'subjectVersionCode',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'subjectVersionName',
                                width: 150,
                                align: 'center',
                                fixed: 'left',
                            },
                            {
                                title: 'Danh sách lớp MH',
                                dataIndex: 'subjectClass',
                                width: 200,
                                align: 'center',
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
                                        {values?.map((val, index) => (
                                            // biome-ignore lint/suspicious/noArrayIndexKey: <>
                                            <li key={index}>
                                                {`${val.subjectClassName} ${val.subjectClassCode}`}
                                            </li>
                                        ))}
                                    </ul>
                                ),
                            },
                            {
                                title: 'Danh sách lớp niên chế',
                                dataIndex: 'fixedClass',
                                width: 200,
                                align: 'center',
                                render: (
                                    values: {
                                        fixedClassId: string
                                        fixedClassName: string
                                        fixedClassCount: number
                                    }[]
                                ) => (
                                    <ul
                                        style={{
                                            paddingLeft: 16,
                                            margin: 0,
                                        }}
                                    >
                                        {values?.map((val, index) => (
                                            // biome-ignore lint/suspicious/noArrayIndexKey: <>
                                            <li key={index}>{`${val.fixedClassName}`}</li>
                                        ))}
                                    </ul>
                                ),
                            },

                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'curriculumVersion',
                                width: 200,
                                align: 'center',
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
                                        {values?.map((val, index) => (
                                            // biome-ignore lint/suspicious/noArrayIndexKey: <>
                                            <li key={index}>{val.curriculumVersionName}</li>
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
                                title: 'Số lớp MH',
                                dataIndex: ['subjectClass', 'length'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                // TODO:
                                dataIndex: ['managementOrganization', 'sTen'],
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (record) => {
                                    if (record?.id) {
                                        return (
                                            <Row
                                                className="flex justify-center items-center gap-2 text-[#028850]"
                                                onClick={onOpen.bind(null, {
                                                    ...record,
                                                    semester: selectedSemester,
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
                            // total: count,
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
