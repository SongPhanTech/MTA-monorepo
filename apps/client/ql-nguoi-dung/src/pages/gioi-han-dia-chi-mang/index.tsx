import { EyeOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import type { PutGioiHanDiaChiMangFormType } from '@components/modal/put-gioi-han-dia-chi-mang'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { Can } from '@lib/casl/can'
import { formatDateReadable } from '@lib/utils'
import type { Prisma } from '@workspace/db'
import {
    useCountBlockedIp,
    useCreateBlockedIp,
    useFindManyBlockedIp,
    useUpdateBlockedIp,
} from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, Form, Input, message, Row, Tooltip } from 'antd'
import _ from 'lodash'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const where: Prisma.BlockedIpWhereInput = {
        OR: [
            {
                ipAddress: {
                    contains: searchText,
                },
            },
            {
                reason: {
                    contains: searchText,
                },
            },
        ],
    }

    const { data = [], refetch } = useFindManyBlockedIp({
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
        where,
    })

    const { data: count } = useCountBlockedIp({
        where,
    })
    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string, PutGioiHanDiaChiMangFormType>({
        tag: 'PutGioiHanDiaChiMangDungModal',
        onOk,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createBlockedIP } = useCreateBlockedIp()
    const { mutateAsync: updateBlockedIP } = useUpdateBlockedIp()

    async function onOk(output?: PutGioiHanDiaChiMangFormType) {
        if (!output) return
        const { id, ...rest } = output
        try {
            showSpinner()
            if (output.id) {
                await updateBlockedIP({
                    where: {
                        id,
                    },
                    data: rest,
                })
                message.success('Cập nhật thành công')
            } else {
                await createBlockedIP({
                    data: rest,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['zenstack', 'BlockedIp'],
            })
            onClose()
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

    const handleModal = () => {
        onOpen()
    }
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateBlockedIP({
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

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Danh sách địa chỉ mạng giới hạn truy cập vào hệ thống
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {/* row button */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Can I={'GIOI_HAN_DIA_CHI_MANG'} a="CREATE">
                                    <Button onClick={handleModal} type="primary">
                                        Thêm mới
                                    </Button>
                                </Can>
                            </Flex>
                        </Col>
                        {/* row filter */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) => debouncedSearchText(e.target.value)}
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Lý do',
                                dataIndex: 'reason',
                            },
                            {
                                title: 'Địa chỉ IP',
                                dataIndex: 'ipAddress',
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Ngày tạo',
                                dataIndex: 'createdAt',
                                render: (_, { createdAt }) =>
                                    createdAt ? formatDateReadable(createdAt) : '',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Xem chi tiết" placement="leftTop">
                                            <EyeOutlined
                                                onClick={onOpen.bind(null, id)}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip>
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () => handleDelete(id),
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
