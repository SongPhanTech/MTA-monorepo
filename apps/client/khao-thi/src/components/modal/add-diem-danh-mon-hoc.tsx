import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useFindUniqueSubjectClassAttendance,useUpdateSubjectClassAttendance } from '@workspace/db/hooks'
import { Col, DatePicker, Form,message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
import { sqlTransaction } from '@workspace/libs/api/model';
import { useSession } from '@workspace/auth/react';
export type PutSubjectClassAttendance = {
    time: Date | null
}

const AddSubjectClassAttendanceStudent = () => {
    const [form] = Form.useForm<PutSubjectClassAttendance>()
    const { data: sessionData } = useSession()

    const id = sessionData?.sDM_NhanVienId || '266369db-fbaa-453e-b5fc-147ed06f959d'
    const {
        isOpen,
        onClose,
        input,
    } = useDisclosure<{id?:string,subjectClassId?:string}>({
        tag: 'AddSubjectClassAttendanceStudent',
        onClose: form.resetFields,
    })
    const { data: initialValue } = useFindUniqueSubjectClassAttendance(
        {
            where: { id: input?.id },
            include:{
                subjectClassAttendanceStudent:true,
                subjectClass:{
                    include:{
                        subjectClassStudent:true
                    }
                }
            }
        },
        {
            refetchOnWindowFocus: false,
            enabled: !!input?.id,
        }
    )
    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: updateSubjectClassAttendance } = useUpdateSubjectClassAttendance()
    async function onOk(output?: PutSubjectClassAttendance) {
        if (!output ||!input?.subjectClassId) return
       
        try {
            showSpinner()
            if (input?.id) {
                let res= await updateSubjectClassAttendance({
                    where: {
                        id:input?.id,
                    },
                    data: {
                        time: output.time ? output.time : new Date(),

                    },
                })
                if(res){
                    message.success('Cập nhật thành công')
                    onClose()
                    return
                }
            }else {
                 if(!initialValue?.subjectClass?.subjectClassStudent||(initialValue?.subjectClass?.subjectClassStudent&&initialValue?.subjectClass?.subjectClassStudent?.length<=0)){
                    message.error('Chưa có học viên')
                    return
                }
                let listTransaction:any=[]
                initialValue?.subjectClass?.subjectClassStudent?.forEach((item)=>{
                    listTransaction.push({
                        model: 'subjectClassAttendanceStudent',
                        operation: 'create',
                        data:{
                            data:{
                                time: output.time ? output.time : new Date(),
                                subjectClassId:input?.subjectClassId,
                                studentId:item.studentId,
                                profileId:id
                            }
                        }
                    })
                })
                let res= await sqlTransaction(listTransaction)
                
                if(res){
                     message.success('Tạo thành công')
                    onClose()
                    return
                }
                
            }
        } catch (error: any) {
        } finally {
            hideSpinner()
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                time: initialValue.time ? dayjs(initialValue.time) : null,
            })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id?'Chỉnh sửa phiếu điểm danh':'Tạo phiếu điểm danh'}
            className="w-[700px]"
        >
            <Col span={24}>
                <Form.Item name="time" label="Ngày điểm danh" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        placeholder="Chọn ngày thi"
                        disabledDate={(current) => {
                            return current && current < dayjs().subtract(1, 'd')
                        }}
                    />
                </Form.Item>
            </Col>
        </PutFormModal>
    )
}

export default AddSubjectClassAttendanceStudent
