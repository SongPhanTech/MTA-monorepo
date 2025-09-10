import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useQuyenCoBan from '@hooks/quyen-co-ban'
import DefaultLayout from '@layouts/default-layout'
import { Button, Col, Divider, Flex, Form, Input, Row } from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function Page() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data: quyenCoBan, count } = useQuyenCoBan({
        description: searchText,
        id: searchText,
        label: searchText,
        subSystem: searchText,
    })
    const _router = useRouter()
    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen } = useDisclosure({
        tag: 'PutQuyenCoBanModal',
    })

    const handleModal = () => {
        onOpen()
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Quyền cơ bản
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {/* row button */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button type="primary" onClick={handleModal}>
                                    Thêm mới
                                </Button>
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
                        rowKey={(record) => record.id}
                        columns={[
                            {
                                title: '',
                                width: 20,
                                className: 'pr-1',
                            },
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: ({ index }, __) => index,
                            },
                            {
                                title: 'Tên quyền cơ bản',
                                dataIndex: 'label',
                                key: 'label',
                            },
                            {
                                title: 'Mã quyền',
                                dataIndex: 'id',
                                key: 'id',
                            },
                            {
                                title: 'Phân hệ',
                                dataIndex: 'subSystem',
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                            },
                        ]}
                        data={quyenCoBan}
                        pagination={{
                            current: currentPage,
                            total: count,
                            pageSize: numberOfPages,
                            onChange: (page, pageSize) => {
                                setCurrentPage(page)
                                setNumberOfPages(pageSize)
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
