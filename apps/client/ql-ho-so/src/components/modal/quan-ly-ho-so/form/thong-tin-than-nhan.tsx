import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import PutThongTinThanNhan from '@components/modal/quan-ly-ho-so/modals/put-thong-tin-than-nhan'
import { RELATIONSHIP_TYPE } from '@constants/constants'
import type { DomProps } from '@constants/type'
import type { SubmitForm } from '@pages/quan-ly-ho-so/tao-moi'
import type { Relative } from '@workspace/db'
import { Button, Col, Collapse, Form, Row, Typography } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const { Title, Text } = Typography

export default function ThongTinThanNhanForm({ expland, setExpland }: DomProps) {
    const form = Form.useFormInstance<SubmitForm>()
    const thanNhanList: Relative[] = Form.useWatch('relatives', form)

    const { onOpen } = useDisclosure<Partial<Relative> & { onSave: (val: Relative) => void }>({
        tag: PutThongTinThanNhan.name,
    })

    const handleSave = (data: Relative) => {
        const currentList = form.getFieldValue('relatives') || []
        const newList = [...currentList, { ...data }]
        form.setFieldValue('relatives', newList)
    }

    const handleUpdate = (data: Relative, index: number) => {
        const currentList = form.getFieldValue('relatives') || []
        const newList = [...currentList]
        newList[index] = { ...data }
        form.setFieldValue('relatives', newList)
    }

    const handleDelete = (index: number) => {
        const currentList = form.getFieldValue('relatives') || []
        const newList = currentList.filter((_: any, i: number) => i !== index)
        form.setFieldValue('relatives', newList)
    }

    const handleModal = () => {
        onOpen({ onSave: handleSave })
    }

    const handleEdit = (data: Relative, index: number) => {
        onOpen({
            ...data,
            onSave: (data: Relative) => handleUpdate(data, index),
        })
    }

    const hasData = thanNhanList && thanNhanList.length > 0

    const renderContent = () => {
        if (!hasData) {
            return (
                <Row justify="space-between" align="middle">
                    <Col>
                        <Text type="secondary">Không có dữ liệu</Text>
                    </Col>
                    <Col>
                        <Button
                            onClick={handleModal}
                            icon={<PlusOutlined />}
                            className="border-green-700 text-green-700 hover:bg-green-50"
                        >
                            Thêm mới
                        </Button>
                    </Col>
                </Row>
            )
        }

        return (
            <div>
                <Row justify="end">
                    <Col>
                        <Button
                            onClick={handleModal}
                            icon={<PlusOutlined />}
                            className="border-green-700 text-green-700 hover:bg-green-50"
                        >
                            Thêm mới
                        </Button>
                    </Col>
                </Row>

                <Table
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Tên thân nhân',
                            align: 'center',
                            width: 180,
                            fixed: 'left',
                            render: (_, record) => record?.name || '',
                        },
                        {
                            title: 'Tên mối quan hệ',
                            align: 'center',
                            width: 160,
                            render: (_, record) =>
                                RELATIONSHIP_TYPE[record?.type as keyof typeof RELATIONSHIP_TYPE] ||
                                '',
                        },
                        {
                            title: 'Năm sinh',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.birthYear || '',
                        },
                        {
                            title: 'Nghề nghiệp',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.job || '',
                        },
                        {
                            title: 'Thông tin khác',
                            align: 'center',
                            width: 140,
                            render: (_, record) => record?.information || '',
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record, index) => (
                                <Row className="justify-center gap-2">
                                    <EditIcon
                                        className="text-sm text-blue-700 cursor-pointer"
                                        onClick={() => handleEdit(record as any, index)}
                                    />
                                    <DeleteIcon
                                        popConfirm={{
                                            onConfirm: () => handleDelete(index),
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Row>
                            ),
                        },
                    ]}
                    dataSource={thanNhanList}
                    pagination={false}
                />
            </div>
        )
    }

    return (
        <div>
            <Collapse
                items={[
                    {
                        key: 'thongTinThanNhan',
                        label: (
                            <Title level={4} className="mb-0">
                                Thông tin thân nhân
                            </Title>
                        ),
                        children: renderContent(),
                    },
                ]}
                bordered={false}
                expandIconPosition="end"
                className="bg-transparent"
                activeKey={expland}
                onChange={(value) => {
                    setExpland([...value])
                }}
            />
        </div>
    )
}
