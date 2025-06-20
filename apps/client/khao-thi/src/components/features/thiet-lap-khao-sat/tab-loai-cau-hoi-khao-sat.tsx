import { EyeOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutSurveyQuestionTypeModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import {
    useCountSurveyQuestionType,
    useFindManySurveyQuestionType,
    useUpdateSurveyQuestionType,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    Tooltip,
    message,
} from 'antd'
import _ from 'lodash'
import { EditIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

function TabLoaiCauHoiKhaoSat() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data = [], refetch } = useFindManySurveyQuestionType({
        where: {
            name: {
                contains: searchText,
            },
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSurveyQuestionType()

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutSurveyQuestionTypeModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSurveyObjectType } =
        useUpdateSurveyQuestionType()

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
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Flex
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap="16px"
                    >
                        <Form.Item
                            label="Tìm kiếm"
                            name="search"
                            style={{ marginBottom: 0 }}
                        >
                            <Input
                                id="search"
                                style={{ width: 300 }}
                                onChange={(e) =>
                                    debouncedSearchText(e.target.value)
                                }
                                placeholder="Tìm kiếm ..."
                            />
                        </Form.Item>

                        <Button onClick={handleModal} type="primary">
                            Thêm mới
                        </Button>
                    </Flex>
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
                                title: 'Mã loại câu hỏi khảo sát',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên loại câu hỏi khảo sát',
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

export default TabLoaiCauHoiKhaoSat
