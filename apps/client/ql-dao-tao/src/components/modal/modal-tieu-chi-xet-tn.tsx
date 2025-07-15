import PutFormModal from '@components/commons/put-modal'
import type { Student } from '@workspace/db'
import {
    useFindManyGraduationRankDowngradeRule,
    useFindManyRankingCondition,
} from '@workspace/db/hooks'
import { Col, Form } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
// import TableCollapse from '@components/commons/tableCollapse'
export type Student1 = Student
dayjs.locale('vi')

const ModalGraduationCriteria = () => {
    const [form] = Form.useForm<Student1>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: ModalGraduationCriteria.name,
        onClose: form.resetFields,
    })

    const { data: rankingCondition } = useFindManyRankingCondition({
        where: { id },
    })
    const { data: rankingCondition2 } = useFindManyGraduationRankDowngradeRule({
        where: { initialRankId: id },
        include: {
            conditions: true,
        },
    })

    console.log(id, rankingCondition2)

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onClose}
            onCancel={onClose}
            maskClosable={true}
            title="Tiêu chí xét tốt nghiệp"
            className="w-[60vw]"
        >
            <Col span={24}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, margin: 12 }}>
                    BỘ QUY TẮC HẠ BẬC
                </div>
                {/* <TableCollapse
                    rowKey="key"
                    id="learning-result"
                    headerTitleKey="name"
                    defaultExpandAll
                    data={subjectsInCurriculumByBlock}
                    scroll={{ y: 500 }}
                    childrenFieldName="subjectsInCurriculum"
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Mã môn học',
                            dataIndex: 'code',
                            width: 145,
                            align: 'center',
                            fixed: 'left',
                        },
                        {
                            title: 'Tên môn học',
                            dataIndex: 'name',
                            width: 200,
                            fixed: 'left',
                        },
                        {
                            title: 'Số TC',
                            dataIndex: 'credit',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm chuyên cần',
                            dataIndex: 'attendanceScore',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm thường xuyên',
                            dataIndex: 'midtermScore',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm thi',
                            dataIndex: 'examScore',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm học phần',
                            dataIndex: 'finalScore',
                            width: 80,
                            align: 'center',
                        },
                    ]}
                    pagination={{
                        hideOnSinglePage: true,
                    }}
                /> */}
            </Col>

            <Col span={24}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, margin: 12 }}>
                    ĐIỀU KIỆN ĐẠT XẾP LOẠI
                </div>
                {/* <Table
                    rowKey="key"
                    id="learning-result"
                    scroll={{ y: 500 }}
                    dataSource={electiveSubjects}
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Mã môn học',
                            dataIndex: 'code',
                            width: 145,
                            align: 'center',
                            fixed: 'left',
                        },
                        {
                            title: 'Tên môn học',
                            dataIndex: 'name',
                            width: 200,
                            fixed: 'left',
                        },
                        {
                            title: 'Số TC',
                            dataIndex: 'credit',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm chuyên cần',
                            dataIndex: 'attendanceScore',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm thường xuyên',
                            dataIndex: 'midtermScore',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm thi',
                            dataIndex: 'examScore',
                            width: 80,
                            align: 'center',
                        },
                        {
                            title: 'Điểm học phần',
                            dataIndex: 'finalScore',
                            width: 80,
                            align: 'center',
                        },
                    ]}
                    pagination={{
                        hideOnSinglePage: true,
                    }}
                /> */}
            </Col>
        </PutFormModal>
    )
}

export default ModalGraduationCriteria
