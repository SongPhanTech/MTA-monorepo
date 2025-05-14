import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingTypeModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingType,
    useFindManyTrainingType,
    useUpdateTrainingType,
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

export default function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data = [], refetch } = useFindManyTrainingType({
        where: {
            name: {
                contains: searchText,
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingType()

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutTrainingTypeModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateAcademicDegreeType } = useUpdateTrainingType()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateAcademicDegreeType({
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
                Danh mục loại hình đào tạo
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
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
                        {/* row button */}
                        <Col span={18}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
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
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã loại hình đào tạo',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên loại hình đào tạo',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={onOpen.bind(null, id)}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
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
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
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
