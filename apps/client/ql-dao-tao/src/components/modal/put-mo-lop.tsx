import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { TrainingCourse, TrainingObjectType } from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindUniqueTrainingCourse,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Flex,
    Form,
    Input,
    message,
    Table,
    TreeSelect,
} from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutTrainingCourse = TrainingCourse
import 'dayjs/locale/vi'
dayjs.locale('vi')

const PutOpenClassModal = () => {
    const [form] = Form.useForm<PutTrainingCourse>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutOpenClassModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function onOk(output?: PutTrainingCourse) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        trainingTypeId: output.trainingTypeId,
                        trainingFormId: output.trainingFormId,
                        trainingLevelId: output.trainingLevelId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        trainingTypeId: output.trainingTypeId,
                        trainingFormId: output.trainingFormId,
                        trainingLevelId: output.trainingLevelId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingCourse({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                startDate: dayjs(level.startDate),
                endDate: level.endDate ? dayjs(level.endDate) : undefined,
            })
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Mở lớp môn học'}
            className="w-[60vw]"
        >
            <Col span={6}>
                <div>Mã HK: 242</div>
            </Col>
            <Col span={6}>Học kỳ 2 năm 2024-2025</Col>
            <Col span={6}>Đơn vị phụ trách:</Col>
            <Col span={6}>Bộ môn...</Col>
            <Col span={6}>Mã MH: ...</Col>
            <Col span={6}>Tên MH: ...</Col>
            <Col span={6}>Tổng SV: 80</Col>
            <Col span={6}>Tổng SV nợ môn: 0</Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Kíp học">
                    <Select
                        placeholder="Chọn kíp học"
                        options={[
                            { label: 'Sáng', value: 'sang' },
                            { label: 'Chiều', value: 'chieu' },
                        ]}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingTypeId" label="Địa điểm">
                    <Select
                        placeholder="Chọn địa điểm"
                        options={[
                            { label: '1', value: '1' },
                            { label: '2', value: '2' },
                        ]}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTypeId"
                    label="Số lớp môn học"
                >
                    <Flex gap={8}>
                        <Input placeholder="" />
                        <Button type="primary" className="h-[32px]">
                            Thêm LMH theo số lớp
                        </Button>
                    </Flex>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTypeId"
                    label="Số sinh viên tối đa"
                >
                    <Flex gap={8}>
                        <Input placeholder="" />
                        <Button type="primary" className="h-[32px]">
                            Thêm LMH theo số SV tối đa
                        </Button>
                    </Flex>
                </FormItem>
            </Col>
            <Table
                rowKey="id"
                id="training-category"
                columns={[
                    {
                        title: 'Tên môn học',
                        dataIndex: 'tenMonHoc',
                        width: 150,
                    },
                    {
                        title: 'Mã LMH',
                        dataIndex: 'maLMH',
                        width: 150,
                    },
                    {
                        title: 'Số tín chỉ',
                        dataIndex: 'stc',
                        width: 150,
                        align: 'center',
                    },
                    {
                        title: 'SV nợ',
                        dataIndex: 'svNo',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Số tiết TKB',
                        dataIndex: 'soTietTKB',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Số SV max',
                        dataIndex: 'max',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Phòng học',
                        dataIndex: 'phongHoc',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Ngày thi',
                        dataIndex: 'ngayThi',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Hình thức thi',
                        dataIndex: 'thi',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Kíp học',
                        dataIndex: 'kipHoc',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Địa điểm',
                        dataIndex: 'diaDiem',
                        width: 100,
                        align: 'center',
                    },
                ]}
            />
        </PutFormModal>
    )
}

export default PutOpenClassModal
