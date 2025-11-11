import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import type {
    DM_DonVi,
    FixedClass,
    SubjectClass,
    TrainingCourse,
    TrainingField,
    TrainingMajor,
} from '@workspace/db'
import {
    useCountSurveyObjectType,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManySubjectClass,
    useFindManySurveyObjectType,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useUpdateSurveyObjectType,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { KHAO_THI_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row } from 'antd'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function TabDoiTuongKhaoSat() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        organization: undefined,
        trainingField: undefined,
        trainingMajors: undefined,
        trainingCourse: undefined,
        fixedClass: undefined,
        subjectClass: undefined,
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)
    const { data: trainingFieldData = [] } = useFindManyTrainingField({
        orderBy: { name: 'asc' },
    })
    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourses = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    const { data: fixedClasses = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
    })

    const { data: subjectClassData = [] } = useFindManySubjectClass({
        orderBy: { name: 'asc' },
        where: {
            active: true,
            deletedAt: null,
            cancelled: false,
            status: 'OFFICIAL',
        },
    })

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
            ...(filters.organization
                ? {
                      organizations: {
                          some: {
                              Id: {
                                  in: filters.organization,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingField
                ? {
                      trainingFields: {
                          some: {
                              id: {
                                  in: filters.trainingField,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingMajors
                ? {
                      trainingMajors: {
                          some: {
                              id: {
                                  in: filters.trainingMajors,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingCourse
                ? {
                      trainingCourses: {
                          some: {
                              id: {
                                  in: filters.trainingCourse,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.fixedClass
                ? {
                      fixedClasses: {
                          some: {
                              id: {
                                  in: filters.fixedClass,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.subjectClass
                ? {
                      subjectClasses: {
                          some: {
                              id: {
                                  in: filters.subjectClass,
                              },
                          },
                      },
                  }
                : {}),
        }),
        [
            filters.code,
            filters.name,
            filters.trainingCourse,
            filters.organization,
            filters.trainingField,
            filters.trainingMajors,
            filters.subjectClass,
            filters.fixedClass,
        ]
    )

    const { data = [], refetch } = useFindManySurveyObjectType({
        where,
        include: {
            organizations: true,
            trainingFields: true,
            trainingMajors: true,
            trainingCourses: true,
            fixedClasses: true,
            subjectClasses: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSurveyObjectType({ where: { ...where, deletedAt: null } })

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutSurveyObjectTypeModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSurveyObjectType } = useUpdateSurveyObjectType()

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSurveyObjectType({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            refetch()
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

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Flex justify="end">
                        {can(
                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                            'THEM'
                        ) && (
                            <Button onClick={handleModal} type="primary">
                                Thêm mới
                            </Button>
                        )}
                    </Flex>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
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
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã ĐTKS',
                                dataIndex: 'code',
                                type: 'input',
                                width: 150,
                                fixed: 'left',
                            },
                            {
                                title: 'Tên đối tượng làm KS',
                                dataIndex: 'name',
                                type: 'input',
                                width: 200,
                                fixed: 'left',
                            },

                            {
                                title: 'Đơn vị',
                                dataIndex: 'organization',
                                type: 'tree_select',
                                options: treeData,
                                width: 150,
                                render: (_, record) =>
                                    record?.organizations?.length
                                        ? record?.organizations
                                              .map((i: DM_DonVi) => i.sTen)
                                              .join(',')
                                        : '',
                            },

                            {
                                title: 'Ngành',
                                dataIndex: 'trainingField',
                                type: 'select',
                                width: 150,
                                options: trainingFieldData,
                                render: (_, record) =>
                                    record?.trainingFields?.length
                                        ? record?.trainingFields
                                              .map((i: TrainingField) => i.name)
                                              .join(',')
                                        : '',
                            },
                            {
                                title: 'Chuyên ngành',
                                dataIndex: 'trainingMajors',
                                type: 'select',
                                width: 150,
                                options: trainingMajorData,
                                render: (_, record) =>
                                    record?.trainingMajors?.length
                                        ? record?.trainingMajors
                                              .map((i: TrainingMajor) => i.name)
                                              .join(',')
                                        : '',
                            },
                            {
                                title: 'Khoá',
                                dataIndex: 'trainingCourse',
                                type: 'select',
                                width: 150,
                                options: trainingCourses,
                                render: (_, record) =>
                                    record?.trainingCourses?.length
                                        ? record?.trainingCourses
                                              .map((i: TrainingCourse) => i.name)
                                              .join(',')
                                        : '',
                            },
                            {
                                title: 'Lớp niên chế',
                                dataIndex: 'fixedClass',
                                type: 'select',
                                width: 150,
                                options: fixedClasses,
                                render: (_, record) =>
                                    record?.fixedClasses?.length
                                        ? record?.fixedClasses
                                              .map((i: FixedClass) => i.name)
                                              .join(',')
                                        : '',
                            },
                            {
                                title: 'Lớp môn học',
                                dataIndex: 'subjectClass',
                                type: 'select',
                                width: 150,
                                options: subjectClassData,
                                render: (_, record) =>
                                    record?.subjectClasses?.length
                                        ? record?.subjectClasses
                                              .map((i: SubjectClass) => i.name)
                                              .join(',')
                                        : '',
                            },

                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                hidden: !canSome(
                                    KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                                            'SUA'
                                        ) && (
                                            <EditIcon
                                                onClick={onOpen.bind(null, id)}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        )}
                                        {can(
                                            KHAO_THI_PERMISSION.KHAO_THI_THIET_LAP_KHAO_SAT_THIET_LAP_CHUNG,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () => handleDelete(id),
                                                }}
                                            />
                                        )}
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default TabDoiTuongKhaoSat
