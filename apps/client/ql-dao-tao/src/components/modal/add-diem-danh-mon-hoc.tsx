import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useFindManySubjectClassAttendanceStudent } from '@workspace/db/hooks'
import { Checkbox, Form, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useSession } from '@workspace/auth/react'
import { Table } from '@components/commons/table'
import { queryClient } from '@api/index'
export type PutSubjectClassAttendance = {
    list: any[]
}

const AddSubjectClassAttendanceStudent = () => {
    const [form] = Form.useForm<PutSubjectClassAttendance>()
    const { data: sessionData } = useSession()

    const id = sessionData?.sDM_NhanVienId || '266369db-fbaa-453e-b5fc-147ed06f959d'
    const { isOpen, onClose, input } = useDisclosure<{ id?: string; subjectClassId?: string }>({
        tag: 'AddSubjectClassAttendanceStudent',
        onClose: form.resetFields,
    })
    // const { data: initialValue } = useFindUniqueSubjectClassAttendance(
    //     {
    //         where: { id: input?.id },
    //         include:{
    //             subjectClassAttendanceStudent:true,
    //             subjectClass:{
    //                 include:{
    //                     subjectClassStudent:true
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         refetchOnWindowFocus: false,
    //         enabled: !!input?.id,
    //     }
    // )
    const { data: dataStudent = [] } = useFindManySubjectClassAttendanceStudent(
        {
            where: { subjectClassAttendanceId: input?.id },
            include: {
                subjectClassAttendance: true,
                student: {
                    include: {
                        userProfile: true,
                    },
                },
            },
        },
        {
            refetchOnWindowFocus: false,
            enabled: !!input?.id,
        }
    )
    const { showSpinner, hideSpinner } = useSpinner()
    async function onOk(output?: PutSubjectClassAttendance) {
        if (!output || !input?.subjectClassId) return

        try {
            showSpinner()
            let listTransacyion: any = []
            dataStudent.forEach((opt, index) => {
                listTransacyion.push({
                    model: 'SubjectClassAttendanceStudent',
                    operation: 'update',
                    data: {
                        where: { id: opt.id },
                        data: {
                            attendanceStatus: output.list[index].attendanceStatus,
                        },
                    },
                })
            })
            let res = await sqlTransaction(listTransacyion)
            if (res.status === 200) {
                message.success('Điểm danh thành công')
                queryClient.invalidateQueries({
                    queryKey: ['zenstack', 'SubjectClassAttendance'],
                })
                onClose()
            }
        } catch (error: any) {
            message.error('Điểm danh thất bại')
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (dataStudent) {
            form.setFieldsValue({
                list: dataStudent,
            })
        }
    }, [dataStudent])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Điểm danh' : 'Điểm danh'}
            className="w-[700px]"
        >
            <Table
                rowKey="id"
                dataSource={dataStudent}
                columns={[
                    {
                        title: 'STT',
                        width: 40,
                        align: 'center',
                        fixed: 'left',
                        render: (_, __, index) => index + 1,
                    },
                    {
                        title: 'Tên sinh viên',
                        width: 250,
                        align: 'center',
                        render: (_, record) => record?.student?.userProfile?.fullname || '',
                    },
                    {
                        title: 'Điểm danh',
                        width: 50,
                        align: 'center',
                        render: (_, record, index) => {
                            return (
                                <Form.Item
                                    className="w-full mb-0"
                                    name={['list', index, 'attendanceStatus']}
                                    label=""
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng nhập giá trị',
                                        },
                                    ]}
                                    valuePropName="checked"
                                >
                                    <Checkbox className="w-full flex justify-center"/>
                                </Form.Item>
                            )
                        },
                    },
                ]}
                pagination={{
                    hideOnSinglePage: true,
                }}
            />
        </PutFormModal>
    )
}

export default AddSubjectClassAttendanceStudent
