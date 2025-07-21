import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useFindManySubjectVersion } from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useState } from 'react'

type Props = {
    curriculumVersionSubjectId: string
}

// TODO: fix this page
export default function MonHocSongHanhPage({ curriculumVersionSubjectId }: Props) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [_searchText, setSearchText] = useState<string>('')

    const { data = [], refetch } = useFindManySubjectVersion({
        where: {
            // name: {
            //     contains: searchText,
            // },
        },
        include: {
            subject: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const count = 0

    const debouncedSearchText = _.debounce(setSearchText, 500)
    // const { onOpen, onClose } = useDisclosure<{
    //     curriculumVersionSubjectId?: string | null | undefined // môn học chương trình
    //     id?: string | null
    // }>({
    //     tag: PutMonHocSongHanhModal.name,
    // })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        // onOpen({
        //     curriculumVersionSubjectId,
        // })
    }
    // const { mutateAsync: updateCoRequisiteSubject } =
    //     useUpdateCoRequisiteSubject()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            // await updateCoRequisiteSubject({
            //     where: {
            //         id,
            //     },
            //     data: {
            //         deletedAt: new Date(),
            //     },
            // })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Môn học song hành
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top">
                        {/* Tìm kiếm */}
                        <Col span={12}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) => debouncedSearchText(e.target.value)}
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>

                        {/* Thêm mới */}
                        <Col span={12}>
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
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên môn học song hành',
                                dataIndex: 'subject',
                                render: (value) => (value?.name ? value?.name : ''),
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {/* <Tooltip
                                            title="Xem chi tiết"
                                            placement="leftTop"
                                        >
                                            <EyeOutlined
                                                onClick={onOpen.bind(
                                                    curriculumVersionSubjectId,
                                                    id
                                                )}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip> */}
                                        <EditIcon
                                            // onClick={onOpen.bind(
                                            //     curriculumVersionSubjectId,
                                            //     id
                                            // )}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

MonHocSongHanhPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
