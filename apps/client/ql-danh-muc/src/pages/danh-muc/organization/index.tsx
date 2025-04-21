import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutOrganizationModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountOrganization,
    useFindManyOrganization,
    useUpdateOrganization,
    useUpdateUser,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tooltip,
    message,
} from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import {
    convertToTree,
    searchTree,
    searchTree2,
} from '@/utils/convertOrganizationToTree'

export default function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data = [], refetch } = useFindManyOrganization({
        where: {
            // name: {
            //     contains: searchText,
            // },
            // parentId: null
        },
        include: {
            type: true,
        },
        take: 10000,
        skip: (currentPage - 1) * 10000,
    })

    // const filteredData = searchTree2(data, searchText);
    // const convert_data = convertToTree(filteredData)
    const convert_data1 = convertToTree(data)
    const convert_data = searchTree(convert_data1, searchText)

    const { data: count } = useCountOrganization()

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutOrganizationModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateOrganization } = useUpdateOrganization()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateOrganization({
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

    async function handleLockAcc(id: string, accountLocked: boolean) {
        if (!id) return
        try {
            showSpinner()
            await fetchUpdateUser({
                pathParams: {
                    id: id,
                },
                body: {
                    accountLocked: !accountLocked,
                },
            })
            message.success('Cập nhật thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
        refetch()
        onClose()
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Danh mục đơn vị
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {/* row button */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                        {/* row filter */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        debouncedSearchText(e.target.value)
                                    }
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            // {
                            //     title: 'STT',
                            //     width: 20,
                            //     align: 'center',
                            //     render: (_, __, index) =>
                            //         index +
                            //         1 +
                            //         (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            // },
                            {
                                title: 'Mã đơn vị',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên đơn vị',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Loại đơn vị',
                                dataIndex: 'type',
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Địa chỉ',
                                dataIndex: 'address',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip
                                            title="Xem chi tiết"
                                            placement="leftTop"
                                        >
                                            <EyeOutlined
                                                onClick={onOpen.bind(null, id)}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip>
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () =>
                                                    handleDelete(id),
                                            }}
                                        />
                                    </Row>
                                ),
                            },
                        ]}
                        data={convert_data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            // onShowSizeChange: setNumberOfPages,
                            showSizeChanger: false,
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
