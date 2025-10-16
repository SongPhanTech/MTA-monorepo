import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import {
    useCountCertificate,
    useFindManyCertificate,
    useUpdateCertificate,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { Button, Col, Flex, message, Row } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function Certificate() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [_selectedRowKeys, _setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        finalScore: undefined,
        count: undefined,
        subjects: undefined,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutCertificateScoreModal',
    })

    const handleModal = () => {
        onOpen()
    }

    // const { convertScore } = useScoreConverter(
    //     data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts
    // )

    const { mutateAsync: updateCertificate } = useUpdateCertificate()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateCertificate({
                where: {
                    id,
                },
                data: {
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

        const where = useMemo(() => {
            return {
                ...(filters.name && filters.name !== ''
                    ? {
                          name: {
                              contains: filters.name,
                              mode: 'insensitive' as const,
                          },
                      }
                    : {}),
            }
        }, [filters])

    const { data: dataTable = [], refetch } = useFindManyCertificate({
        where,
        include: { subjects:true,_count: true },
        orderBy: [
            // ...emptyObjectIf(
            //     [
            //         {
            //             finalScore: filters.finalScore,
            //         },
            //     ],
            //     !!filters.finalScore
            // ),
            {
                createdAt: 'desc',
            },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountCertificate({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24} className="mt-3">
                            <Flex justify="end">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CONG,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>

                        {/* <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file danh sách
                                </Button>
                            </Flex>
                        </Col> */}
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 30,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên chứng chỉ',
                                dataIndex: 'name',
                                align: 'center',
                                width: 200,
                                type: 'input',
                            },
                            {
                                title: 'Thao tác',
                                width: 60,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CONG,
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id, _count }) => {
                                    if (!_count?.studentSubjectScore) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CONG,
                                                    'SUA'
                                                ) && (
                                                    <EditIcon
                                                        onClick={onOpen.bind(null, id)}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_DIEM_CONG,
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
                        data={dataTable}
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
