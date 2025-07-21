import { CheckOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutFixedClassModal } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type { TrainingCourse } from '@workspace/db'
import {
    useCountFixedClass,
    useFindManyCurriculumVersion,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingLevel,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
    useUpdateFixedClass,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import _ from 'lodash'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function FixedClassPage({ trainingCourse }: { trainingCourse?: TrainingCourse }) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [_searchText, _setSearchText] = useState<string>('')
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        trainingObjectTypes: undefined,
        managementOrganization: undefined,
        trainingCourses: undefined,
        curriculumVersion: undefined,
        trainingMajors: undefined,
        trainingLevel: undefined,
        startYear: undefined,
    })

    const router = useRouter()
    const { data = [], refetch } = useFindManyFixedClass({
        where: {
            OR: [
                { name: { contains: filters.name, mode: 'insensitive' } },
                { code: { contains: filters.code, mode: 'insensitive' } },
            ],
            ...(filters.managementOrganization
                ? {
                      managementOrganizationId: {
                          in: filters.managementOrganization,
                      },
                  }
                : {}),
            ...(filters.trainingCourses
                ? {
                      trainingCourseId: {
                          in: filters.trainingCourses,
                      },
                  }
                : {}),
            ...(filters.curriculumVersion
                ? {
                      curriculumVersionId: {
                          in: filters.curriculumVersion,
                      },
                  }
                : {}),

            curriculumVersion: {
                ...(filters.trainingMajors
                    ? {
                          curriculum: {
                              trainingMajorId: {
                                  in: filters.trainingMajors,
                              },
                          },
                      }
                    : {}),
                ...(filters.trainingObjectTypes
                    ? {
                          trainingObjectTypeId: {
                              in: filters.trainingObjectTypes,
                          },
                      }
                    : {}),
                ...(filters.trainingLevel
                    ? {
                          trainingLevelId: {
                              in: filters.trainingLevel,
                          },
                      }
                    : {}),
            },
        },
        include: {
            students: {
                include: {
                    userProfile: true,
                },
            },
            lecturerManagement: {
                include: {
                    userProfile: true,
                },
            },
            managementOrganization: true,
            trainingCourse: {
                include: {
                    trainingObjectType: true,
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                    trainingLevel: true,
                },
            },
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        startYear: filters.startYear,
                    },
                ],
                !!filters.startYear
            ),
            { name: 'asc' },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })
    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
        orderBy: { name: 'asc' },
    })

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingLevelData = [] } = useFindManyTrainingLevel({
        orderBy: { name: 'asc' },
    })

    const { data: count } = useCountFixedClass({
        where: {
            OR: [
                { name: { contains: filters.name, mode: 'insensitive' } },
                { code: { contains: filters.code, mode: 'insensitive' } },
            ],
            ...(filters.trainingObjectTypes
                ? {
                      trainingObjectTypeId: {
                          in: filters.trainingObjectTypes,
                      },
                  }
                : {}),
            ...(filters.managementOrganization
                ? {
                      managementOrganizationId: {
                          in: filters.managementOrganization,
                      },
                  }
                : {}),
            ...(filters.trainingCourses
                ? {
                      trainingCourseId: {
                          in: filters.trainingCourses,
                      },
                  }
                : {}),
            ...(filters.curriculumVersion
                ? {
                      curriculumVersionId: {
                          in: filters.curriculumVersion,
                      },
                  }
                : {}),
        },
    })

    const { data: manageOrgData = [], refetch: refetchManageOrg } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(manageOrgData)
    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
    })
    // const { onOpen: onOpenFixedClass } = useDisclosure<string>({
    //     tag: PutUploadFixedClassModal.name,
    // })
    // const { onOpen: onOpenDivision } = useDisclosure<string>({
    //     tag: PutUploadDivisionModal.name,
    // })
    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateFixedClass({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify={'end'}>
                        <Col span={4}>
                            <Flex justify="end" gap={4}>
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="fixed-class"
                        filters={filters}
                        setFilters={setFilters}
                        onRowClick={(record) => {
                            router.push(
                                ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace(
                                    '[id]',
                                    String(record.id)
                                )
                            )
                        }}
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
                                title: 'Mã lớp niên chế',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                                dataIndex: 'code',
                                type: 'input',
                            },
                            {
                                title: 'Tên lớp niên chế',
                                align: 'center',
                                width: 200,
                                fixed: 'left',
                                dataIndex: 'name',
                                type: 'input',
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'managementOrganization',
                                align: 'center',
                                width: 200,
                                type: 'tree_select',
                                options: treeData,
                                render: (value) => (value?.sTen ? value?.sTen : ''),
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 200,
                                type: 'select',
                                options: trainingMajorData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                dataIndex: 'trainingMajors',
                                render: (_, record) =>
                                    record?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                                    '',
                            },
                            {
                                title: 'Khóa',
                                dataIndex: 'trainingCourse',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: trainingCourseData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (value) => (value?.name ? value?.name : ''),
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                align: 'center',
                                dataIndex: 'trainingObjectTypes',
                                width: 180,
                                type: 'select',
                                options: trainingObjectTypeData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) =>
                                    record?.trainingCourse?.trainingObjectType?.name || '',
                            },

                            {
                                title: 'Trình độ đào tạo',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: trainingLevelData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                dataIndex: 'trainingLevel',
                                render: (__, record) =>
                                    record?.curriculumVersion?.trainingLevel?.name || '',
                            },
                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'curriculumVersion',
                                align: 'center',
                                width: 250,
                                type: 'select',
                                options: curriculumVersionData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (value) => (value?.name ? value?.name : ''),
                            },

                            {
                                title: 'Đã tốt nghiệp',
                                align: 'center',
                                width: 150,
                                dataIndex: 'graduated',
                                type: 'select',
                                options: [
                                    { value: true, label: 'Đã tốt nghiệp' },
                                    { value: false, label: 'Chưa tốt nghiệp' },
                                ],
                                render: (value) =>
                                    value ? <CheckOutlined className="text-[#028850]" /> : '',
                            },
                            {
                                title: 'Giáo viên chủ nhiệm',
                                dataIndex: 'lecturerManagement',
                                align: 'center',
                                width: 200,
                                type: 'input',
                                render: (value) =>
                                    value?.userProfile?.fullname
                                        ? value?.userProfile?.fullname
                                        : '',
                            },
                            {
                                title: 'Cán bộ quản lý',
                                dataIndex: 'staffManagement',
                                align: 'center',
                                width: 200,
                                type: 'input',
                                render: (value) =>
                                    value?.userProfile?.fullname
                                        ? value?.userProfile?.fullname
                                        : '',
                            },
                            {
                                title: 'Năm bắt đầu',
                                dataIndex: 'startYear',
                                width: 150,
                                type: 'order',
                                align: 'center',
                            },
                            // {
                            //     title: 'Trạng thái',
                            //     align: 'center',
                            //     fixed: 'right',
                            //     width: 130,
                            //     render: (value, record) => {
                            //         return !record?.active ? (
                            //             <Tag color="error">Không hoạt động</Tag>
                            //         ) : (
                            //             <Tag color="success">Đang hoạt động</Tag>
                            //         )
                            //     },
                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                fixed: 'right',
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Xem chi tiết" placement="top">
                                            <Eye
                                                size={16}
                                                strokeWidth={1.5}
                                                className="text-base cursor-pointer"
                                            />
                                        </Tooltip>
                                        <EditIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpen(id)
                                            }}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: (e) => {
                                                    handleDelete(id)
                                                    e?.stopPropagation()
                                                },
                                            }}
                                        />
                                    </Row>
                                ),
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

FixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
