// import { Table, Divider, Row, Col } from 'antd'
// import { PutFormModal } from '@workspace/ui'
// import { useDisclosure } from 'react-hook-disclosure-modal'
// import { Form } from 'antd'
// import { useFindUniqueStudentSubjectScore } from '@workspace/db/hooks'

// const ModalScoreDetail = () => {
//     const [form] = Form.useForm()

//     const { isOpen, onClose, input } = useDisclosure<{
//         id: string
//     }>({
//         tag: 'ModalScoreDetail',
//         onClose: () => form.resetFields(),
//     })

//     const id = input?.id

//     const { data } = useFindUniqueStudentSubjectScore(
//         {
//             where: { id },
//             include: {
//                 student: {
//                     include: {
//                         userProfile: true,
//                     },
//                 },
//                 subjectClass: {
//                     include: {
//                         semester: {
//                             include: {
//                                 schoolYear: true,
//                             },
//                         },
//                     },
//                 },
//                 awards: {
//                     include: {
//                         archivedAward: true,
//                     },
//                 },
//                 studentSubjectScoreHistory: {
//                     include: {
//                         updatedBy: {
//                             include: {
//                                 userProfile: true,
//                             },
//                         },
//                     },
//                     orderBy: {
//                         createdAt: 'desc',
//                     },
//                 },
//             },
//         },
//         {
//             enabled: isOpen && !!id,
//         }
//     )

//     if (!data) return null

//     const bonus =
//         data?.awards?.reduce(
//             (sum: number, a: any) => sum + (a?.archivedAward?.bonusScore || 0),
//             0
//         ) || 0

//     const columns = [
//         {
//             title: 'Thời gian',
//             dataIndex: 'createdAt',
//             render: (v: string) => new Date(v).toLocaleString(),
//         },
//         { title: 'TX', dataIndex: 'attendanceScore' },
//         { title: 'GK', dataIndex: 'midtermScore' },
//         { title: 'Thi', dataIndex: 'examScore' },
//         { title: 'Tổng', dataIndex: 'finalScore' },
//         {
//             title: 'Người sửa',
//             render: (_: any, r: any) => r?.updatedBy?.userProfile?.fullname || '-',
//         },
//     ]

//     return (
//         <PutFormModal
//             open={isOpen}
//             form={form}
//             title="Chi tiết điểm học phần"
//             onCancel={onClose}
//             onFinish={onClose}
//             okText="Đóng"
//             cancelButtonProps={{ className: 'hidden' }}
//         >
//             {/* LỚP + KỲ */}
//             <Row gutter={16}>
//                 <Col span={12}>
//                     <b>Lớp:</b> {data?.subjectClass?.name} ({data?.subjectClass?.code})
//                 </Col>
//                 <Col span={12}>
//                     <b>Kỳ:</b> {data?.subjectClass?.semester?.name} -{' '}
//                     {data?.subjectClass?.semester?.schoolYear?.name}
//                 </Col>
//             </Row>

//             {/* SV */}
//             <Row className="mt-2">
//                 <Col span={12}>
//                     <b>Sinh viên:</b> {data?.student?.userProfile?.fullname}
//                 </Col>
//                 <Col span={12}>
//                     <b>Mã SV:</b> {data?.student?.code}
//                 </Col>
//             </Row>

//             <Divider />

//             {/* Điểm */}
//             <Row gutter={16}>
//                 <Col span={6}>TX: {data?.attendanceScore ?? '-'}</Col>
//                 <Col span={6}>GK: {data?.midtermScore ?? '-'}</Col>
//                 <Col span={6}>Thi: {data?.examScore ?? '-'}</Col>
//                 <Col span={6}>
//                     <b>Tổng:</b> {data?.finalScore ?? '-'}
//                 </Col>
//             </Row>

//             <Row className="mt-2">
//                 <Col span={24}>
//                     <b>Điểm cộng:</b> {bonus}
//                 </Col>
//             </Row>

//             <Divider />

//             {/* Lịch sử */}
//             <Table
//                 size="small"
//                 rowKey="id"
//                 columns={columns}
//                 dataSource={data?.studentSubjectScoreHistory || []}
//                 pagination={false}
//             />
//         </PutFormModal>
//     )
// }

// export default ModalScoreDetail
