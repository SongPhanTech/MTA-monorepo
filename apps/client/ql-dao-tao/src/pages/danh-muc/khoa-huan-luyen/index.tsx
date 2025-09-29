import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountTrainingCourse,
    useFindManySchoolYear,
    useFindManyTrainingCourse,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function TrainingCoursePage() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        admissionQuota: undefined,
        semesterStart: undefined,
    })

    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const where = useMemo(
        () => ({
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.semesterStart
                ? {
                      semesterStartId: filters.semesterStart,
                  }
                : {}),
            trainingObjectTypeId,
            deletedAt: null,
        }),
        [filters.code, filters.name, filters.semesterStart, trainingObjectTypeId]
    )

    const { data = [] } = useFindManyTrainingCourse({
        where: {
            ...where,
        },
        include: {
            trainingObjectType: true,
            semesterStart: {
                include: {
                    schoolYear: true,
                },
            },
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        admissionQuota: filters.admissionQuota,
                    },
                ],
                !!filters.admissionQuota
            ),
            { name: 'asc' },
        ],

        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingCourse({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen } = useDisclosure<string>({
        tag: 'PutTrainingCourseModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

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
                    code: id,
                    deletedAt: new Date(),
                },
            })
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
    const { data: schoolYearData = [] } = useFindManySchoolYear({
        orderBy: {
            createdAt: 'desc',
        },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            {/* <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm"
                                            style={{
                                                marginRight: 8,
                                                height: 32,
                                            }}
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
                                <Col span={8}>
                                    <Form.Item
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
                                            style={{
                                                marginRight: 8,
                                            }}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectTypeId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex> */}
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-course"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, record, index) =>
                                    index + (currentPage - 1) * DEFAULT_PAGINATE_SIZE + 1,
                            },
                            {
                                title: 'Mã khóa',
                                dataIndex: 'code',
                                width: 150,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Tên khóa',
                                dataIndex: 'name',
                                width: 200,
                                fixed: 'left',
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'trainingObjectTypes',
                                align: 'center',
                                width: 175,
                                render: (__, record) =>
                                    record?.trainingObjectType?.name
                                        ? record?.trainingObjectType?.name
                                        : '',
                            },
                            {
                                title: 'Năm bắt đầu',
                                align: 'center',
                                dataIndex: 'semesterStart',
                                width: 150,
                                type: 'select',
                                options: schoolYearData.map((i) => {
                                    return {
                                        value: i.id,
                                        label: i.name,
                                    }
                                }),
                                render: (value) =>
                                    value?.schoolYear?.name ? value?.schoolYear?.name : '',
                            },
                            {
                                title: 'Niên khoá',
                                align: 'center',
                                dataIndex: 'academicYear',
                                width: 150,
                            },
                            {
                                title: 'Chỉ tiêu tuyển sinh',
                                align: 'center',
                                dataIndex: 'admissionQuota',
                                width: 150,
                                type: 'order',
                            },
                            {
                                title: 'Mô tả',
                                width: 100,
                                align: 'center',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 175,
                                render: (value, record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={onOpen.bind(null, id)}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN,
                                                    'XOA'
                                                ) && (
                                                    <DeleteIcon
                                                        popConfirm={{
                                                            onConfirm: () => handleDelete(id),
                                                        }}
                                                    />
                                                )}
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
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

TrainingCoursePage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
