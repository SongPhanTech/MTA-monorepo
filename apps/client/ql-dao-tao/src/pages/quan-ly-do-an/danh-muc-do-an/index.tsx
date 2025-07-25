import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutThesisProject } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import { useThesisProjectStatusOptions } from '@hooks/thesisProjectStatus'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import {
    useCountThesisProject,
    useFindManyDM_DonVi,
    useFindManyThesisProject,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import dayjs from 'dayjs'
import { BookPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type FilterPropsThesis = FilterProps & {
    title?: string
    status?: string[]
    titleEN?: string
    supervisor?: string
    organization?: string[]
    currentStudents?: 'asc' | 'desc'
    maxStudents?: 'asc' | 'desc'
}

export default function ThesisProject() {
    const router = useRouter()
    const { getThesisProjectStatusColor, getThesisProjectStatusLabel, thesisProjectStatusOptions } =
        useThesisProjectStatusOptions()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterPropsThesis>({
        code: undefined,
        title: undefined,
        titleEN: undefined,
        supervisor: undefined,
        organization: undefined,
        maxStudents: undefined,
    })
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    const treeData = buildOrgTree(manageOrgData)

    const { data: thesisProjectData } = useFindManyThesisProject({
        where: {
            ...(filters.code ? { code: { contains: filters.code, mode: 'insensitive' } } : {}),
            ...(filters.title ? { title: { contains: filters.title, mode: 'insensitive' } } : {}),
            ...(filters.titleEN
                ? { titleEN: { contains: filters.titleEN, mode: 'insensitive' } }
                : {}),
            ...(filters.supervisor
                ? {
                      supervisor: { name: { contains: filters.supervisor, mode: 'insensitive' } },
                  }
                : {}),
            ...emptyObjectIf(
                {
                    organizationId: {
                        in: filters.organization,
                    },
                },
                !!filters.organization
            ),
        },
        include: {
            organization: true,
            supervisor: {
                include: { lecturer: { include: { userProfile: true } } },
            },
        },
        orderBy: [
            ...emptyObjectIf(
                [{ currentStudents: filters.currentStudents }],
                !!filters.currentStudents
            ),
            ...emptyObjectIf([{ maxStudents: filters.maxStudents }], !!filters.maxStudents),
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountThesisProject({
        where: {
            ...(filters.code ? { code: { contains: filters.code, mode: 'insensitive' } } : {}),
            ...(filters.title ? { title: { contains: filters.title, mode: 'insensitive' } } : {}),
        },
    })

    const { onOpen } = useDisclosure<string>({
        tag: PutThesisProject.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateThesisProject({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleNavigate = (record: { id?: string }) => {
        if (record?.id) {
            router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DO_AN_DANH_MUC_DO_AN}/${record.id}`)
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    <BookPlus />
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-block"
                        filters={filters}
                        setFilters={setFilters}
                        onRowClick={(record) => handleNavigate(record)}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên đồ án',
                                dataIndex: 'title',
                                width: 150,
                                type: 'input',
                            },
                            {
                                title: 'Tên đồ án(Tiếng Anh)',
                                dataIndex: 'titleEN',
                                width: 180,
                                type: 'input',
                            },
                            {
                                title: 'Tóm tắt đồ án',
                                dataIndex: 'summary',
                                width: 150,
                            },
                            {
                                title: 'Chuyên gia hướng dẫn',
                                dataIndex: 'supervisor',
                                width: 200,
                                type: 'input',
                                render: (record) => record?.name,
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organization',
                                width: 150,
                                type: 'tree_select',
                                options: treeData,
                                render: (record) => record.sTen,
                            },
                            {
                                title: 'Số lượng học viên',
                                dataIndex: 'currentStudents',
                                align: 'center',
                                width: 150,
                                type: 'order',
                            },
                            {
                                title: 'Số lượng học viên tối đa',
                                dataIndex: 'maxStudents',
                                align: 'center',
                                width: 180,
                                type: 'order',
                            },
                            {
                                title: 'Thời gian mở đăng ký',
                                dataIndex: 'registrationStart',
                                align: 'center',
                                width: 180,
                                render: (record) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Thời gian đóng đăng ký',
                                dataIndex: 'registrationEnd',
                                align: 'center',
                                width: 180,
                                render: (record) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'statusGraduationSession',
                                align: 'center',
                                width: 160,
                                fixed: 'right',
                                type: 'select',
                                options: thesisProjectStatusOptions,
                                render: (_, record) => {
                                    const label = getThesisProjectStatusLabel(record?.status)
                                    const color = getThesisProjectStatusColor(record?.status)
                                    return <Tag color={color}>{label}</Tag>
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        onOpen(id)
                                                        e.stopPropagation()
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: (e) => {
                                                            handleDelete(id)
                                                            e?.stopPropagation()
                                                        },
                                                        onCancel: (e) => e?.stopPropagation(),
                                                    }}
                                                />
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
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                        data={thesisProjectData}
                    />
                </Col>
            </Row>
        </div>
    )
}

ThesisProject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
