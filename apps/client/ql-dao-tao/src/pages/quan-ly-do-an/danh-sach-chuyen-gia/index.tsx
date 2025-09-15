import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountExpertProfile,
    useFindManyExpertProfile,
    useUpdateExpertProfile,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import { BookPlus } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function ExpertProfile() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: undefined,
        name: undefined,
        academicRank: undefined,
        academicDegree: undefined,
        specialization: undefined,
        workplace: undefined,
        phone: undefined,
        email: undefined,
    })

    const where = useMemo(
        () => ({
            ...(filters.code
                ? { code: { contains: filters.code, mode: 'insensitive' as const } }
                : {}),
            ...(filters.name
                ? { name: { contains: filters.name, mode: 'insensitive' as const } }
                : {}),
            ...(filters.academicRank
                ? { academicRank: { contains: filters.academicRank, mode: 'insensitive' as const } }
                : {}),
            ...(filters.academicDegree
                ? {
                      academicDegree: {
                          contains: filters.academicDegree,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.specialization
                ? {
                      specialization: {
                          contains: filters.specialization,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.workplace
                ? { workplace: { contains: filters.workplace, mode: 'insensitive' as const } }
                : {}),
            ...(filters.phone
                ? { phone: { contains: filters.phone, mode: 'insensitive' as const } }
                : {}),
            ...(filters.email
                ? { email: { contains: filters.email, mode: 'insensitive' as const } }
                : {}),
        }),
        [
            filters.code,
            filters.name,
            filters.academicRank,
            filters.academicDegree,
            filters.specialization,
            filters.workplace,
            filters.phone,
            filters.email,
        ]
    )

    const { data: expertProfileData } = useFindManyExpertProfile({
        where,
        include: { lecturer: { include: { userProfile: true } } },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountExpertProfile({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { onOpen } = useDisclosure<string>({
        tag: 'PutExpertProfile',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateExpertProfile } = useUpdateExpertProfile()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateExpertProfile({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
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
                        id="expert-profile"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
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
                                title: 'Tên chuyên gia',
                                dataIndex: 'name',
                                width: 150,
                                type: 'input',
                                align: 'center',
                            },
                            {
                                title: 'Học hàm',
                                dataIndex: 'academicRank',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Hàm vị',
                                dataIndex: 'academicDegree',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Chuyên ngành',
                                dataIndex: 'specialization',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Đơn vị công tác',
                                dataIndex: 'workplace',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phone',
                                width: 150,
                                align: 'center',
                                type: 'input',
                            },
                            {
                                title: 'Email',
                                dataIndex: 'email',
                                width: 150,
                                align: 'center',
                                type: 'input',
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
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
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
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                        }}
                        data={expertProfileData}
                    />
                </Col>
            </Row>
        </div>
    )
}

ExpertProfile.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
