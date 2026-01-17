import { useDisclosure } from 'react-hook-disclosure-modal'
import { Col, Form, Input, InputNumber, message, Row } from 'antd'
import  { type ExamBank, PrismaClient} from '../../../../prisma/client'
import PutFormModal from '../put-modal'
import FormItem from '../../commoms/form-item'
import { useFindManyExamFramework, useFindManyExamMatrix, useFindUniqueExam } from '@/hooks/zenstack'
import { useStore } from '@tanstack/react-store'
import { store } from '@/pages/main'
import Select from '../select'
import DatePicker from '../date-picker'
import dayjs from 'dayjs'
import { useMemo } from 'react'

const prisma = new PrismaClient()
type PutMaTranDeInputType = ExamBank & {
    quantity: number
    examFrameworkId: string
    examMatrixId: string
    sort: string
    codeFrom: number
}

const SinhDeModal = () => {
    const [form] = Form.useForm<PutMaTranDeInputType>()

    const { isOpen, onClose, input } = useDisclosure<{
        id?: string
    }>({
        tag: 'SinhDeModal',
        onClose: form.resetFields,
    })
    const selectedExamId = useStore(store, (state) => state['selectedExamId'])
    const subjectVersionId = useStore(store, (state) => state['subjectVersionId'])
      const {data: dataExam}=useFindUniqueExam(
        {
          where: { id: selectedExamId },
        },{
          enabled: !!selectedExamId
        }
      )
    
      const dataOption = useMemo(() => {
        return !!dataExam?.subjectClasses ? dataExam?.subjectClasses.split(',').map((item) => {
          return {
            value: item,
            label: item,
          };
        }):[];
      }, [dataExam]);

    const { data: examFrameworkData = [] } = useFindManyExamFramework(
        {
            where: {
                subjectVersionId: subjectVersionId,
            },
            include: {
                subjectVersion: true,
                examMatrixs: true,
            },
        },
        { enabled: !!subjectVersionId }
    )

    const examFrameworkId = Form.useWatch('examFrameworkId', form)

    const { data: ExamMatrixData = [] } = useFindManyExamMatrix(
        {
            where: {
                examFrameworkId: examFrameworkId,
            },
            include: {
                examFramework: true,
            },
        },
        { enabled: !!examFrameworkId }
    )

    const onOk = async (values: PutMaTranDeInputType) => {
        try {
            if (!values) return
            // const matrixData:any = await prisma.knowledgeBlock.findMany({
            //     where: {
            //        examMatrixId: values?.examMatrixId,
            //     },
            //     include: {
            //         questions: true,
            //         configExams: true,
            //     },
            // })
            const matrixData= await fetch('http://localhost:3030/sinh-de', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({...values,examId:selectedExamId}),
            })
            const res=await matrixData.json();
            if(res?.status==='200'){
                message.success('Tạo đề thành cong!')
                onClose()
            }else {
                message.error(res?.message)
            }
           
            // onClose()
        } catch (error) {
            console.log(error)
            message.error('Tạo đề thất bại!')
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            title="Thông tin tạo đề"
            onCancel={onClose}
            onFinish={onOk}
            className="w-[500px]"
        >
            <Col span={24}>
                <Row gutter={[16, 0]}>
                    <Col span={12}>
                        <FormItem form={form} name="examCode" label="Mã đề">
                            <Input placeholder="Nhập mã đề" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="codeFrom" label="Từ">
                            <InputNumber className="w-full" placeholder="Nhập mã đề" />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem form={form} name="quantity" label="Số đề cần tạo" required>
                            <InputNumber
                                className="w-full"
                                placeholder="Nhập tên ma trận đề"
                                min={1}
                            />
                        </FormItem>
                    </Col>
                         <Col span={24}>
                            <FormItem form={form} name="examType" label="Hình thức thi" required>
                                <Select
                                    options={[
                                        {
                                            label: 'Thi viết',
                                            value: 'OfflineWritten',
                                        },
                                        {
                                            label: 'Thi vấn đáp',
                                            value: 'Oral',
                                        },
                                    ]}
                                    placeholder="Chọn hình thức thi"
                                />
                            </FormItem>
                        </Col>
                    <Col span={24}>
                        <FormItem form={form} name="examFrameworkId" label="Khung đề" required>
                            <Select
                                options={examFrameworkData.map((i) => {
                                    return {
                                        label: i.name,
                                        value: i.id,
                                    }
                                })}
                                placeholder="Chọn khung đề"
                            />
                        </FormItem>
                    </Col>
                    <Col span={24}>
                        <FormItem form={form} name="examMatrixId" label="Ma trận đề" required>
                            <Select
                                options={ExamMatrixData.map((i) => {
                                    return {
                                        label: i.name,
                                        value: i.id,
                                    }
                                })}
                                placeholder="Chọn ma trận đề"
                            />
                        </FormItem>
                    </Col>
                    {/* <Col span={24}>
                        <FormItem form={form} name="sort" label="Cấu hình" required>
                            <Radio.Group>
                                <Radio value="khung">Sắp xếp theo chuẩn đầu ra</Radio>
                                <Radio value="kho">Sắp xếp theo độ khó</Radio>
                            </Radio.Group>
                        </FormItem>
                    </Col> */}
                     <Col span={24}>
                            <FormItem form={form} name="examDay" label="Ngày thi" required>
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
                            </FormItem>
                        </Col>
                                <Col span={24}>
                                <FormItem
                                    form={form}
                                    name="subjectClass"
                                    label="Dùng cho lớp"
                                >
                                    <Select
                                    options={dataOption}
                                    placeholder="Chọn lớp môn học"
                                    />
                                </FormItem>
                                </Col>
                        <Col span={24}>
                            <FormItem form={form} name="explain" label="Chú thích">
                                <Input.TextArea placeholder="Nhập chú thích" />
                            </FormItem>
                        </Col>
                </Row>
            </Col>
        </PutFormModal>
    )
}

export default SinhDeModal
