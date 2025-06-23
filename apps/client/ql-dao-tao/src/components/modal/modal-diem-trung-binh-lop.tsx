import PutFormModal from '@components/commons/put-modal'
import DeleteIcon from '@components/icons/delete'
import { Form, Row } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import TableCollapse from '@components/commons/tableCollapse'
import EditIcon from '@components/icons/edit'
dayjs.locale('vi')

const ModalGPASemester = () => {
    const [form] = Form.useForm<any>()
    const { isOpen, onClose, input } = useDisclosure<string>({
        tag: ModalGPASemester.name,
    })

    async function onOk(output?: any) {
        if (!output) return
    }

    const fakeData = [
        {
            id: '1',
            code: 'lql_1',
            name: 'lớp quản lý 1',
            children: [
                {
                    id: '2',
                    code: 'sv_1',
                    name: 'sinh viên 1',
                    gpa: 3.32,
                    totalCredit: 15,
                    credit: 15,
                },
                {
                    id: '3',
                    code: 'sv_2',
                    name: 'sinh viên 2',
                    gpa: 3.05,
                    totalCredit: 15,
                    credit: 10,
                },
            ],
        },
        {
            id: '12',
            code: 'lql_2',
            name: 'lớp quản lý 2',
            children: [
                {
                    id: '22',
                    code: 'sv_3',
                    name: 'sinh viên 3',
                    gpa: 3.32,
                    totalCredit: 15,
                },
                {
                    id: '32',
                    code: 'sv_4',
                    name: 'sinh viên 4',
                    gpa: 3.05,
                    totalCredit: 15,
                },
            ],
        },
    ]

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Điểm trung bình kỳ - kỳ I 2025'}
            className="w-[80vw]"
        >
            <TableCollapse
                rowKey="key"
                headerTitleKey="name"
                childrenFieldName="children"
                defaultExpandAll
                className="w-full"
                data={fakeData}
                columns={[
                    {
                        title: 'Mã sinh viên',
                        dataIndex: 'code',
                        width: 120,
                        align: 'center',
                    },
                    {
                        title: 'Tên sinh viên',
                        dataIndex: 'name',
                        width: 200,
                    },
                    {
                        title: 'Tổng số tín chỉ đăng ký',
                        dataIndex: 'totalCredit',
                        width: 150,
                        align: 'center',
                    },
                    {
                        title: 'Số tín chỉ đã đạt',
                        dataIndex: 'credit',
                        width: 150,
                        align: 'center',
                    },
                    {
                        title: 'GPA',
                        dataIndex: 'gpa',
                        width: 120,
                        align: 'center',
                    },
                    {
                        title: 'Thao tác',
                        width: 100,
                        align: 'center',
                        fixed: 'right',
                        render: (_, record) => {
                            const { id: subjectVersionId, subjectId } = record
                            return subjectVersionId ? (
                                <Row className="justify-center gap-2">
                                    <EditIcon
                                        // onClick={() =>
                                        //     onOpenSubjectVersion({
                                        //         subjectId,
                                        //         subjectVersionId,
                                        //     })
                                        // }
                                        className="text-sm text-blue-700 cursor-pointer"
                                    />
                                    <DeleteIcon
                                    // popConfirm={{
                                    //     onConfirm: () =>
                                    //         handleDelete(
                                    //             subjectVersionId
                                    //         ),
                                    // }}
                                    />
                                </Row>
                            ) : null
                        },
                    },
                ]}
            />
        </PutFormModal>
    )
}

export default ModalGPASemester
