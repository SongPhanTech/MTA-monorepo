import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useCreateTrainingBlock, useFindManyCurriculumVersion, useFindUniqueTrainingBlock, useUpdateTrainingBlock } from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Select } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import type { TrainingBlock } from '@workspace/db'
import dayjs from 'dayjs'
export type PutTrainingBlock = TrainingBlock
import 'dayjs/locale/vi'
import { useEffect } from 'react'
dayjs.locale('vi')
const PutTrainingBlock = () => {
    const [form] = Form.useForm<PutTrainingBlock>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingBlock.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    
    const { data: trainingBlock } = useFindUniqueTrainingBlock(
        { where: { id } },
        { enabled: !!id }
    );

    const { data: curriculumVersion = [] } = useFindManyCurriculumVersion();

    useEffect(() => {
        if (trainingBlock) {
            form.setFieldsValue({
            ...trainingBlock,
            });
        }
    }, [ trainingBlock, form ]);

    const { mutateAsync: createTrainingBlock } = useCreateTrainingBlock()
    const { mutateAsync: updateTrainingBlock } = useUpdateTrainingBlock()
    async function onOk(output?: PutTrainingBlock) {
        if (!output) return;

        try {
            showSpinner();
            const payload = {
                code: output.code,
                name: output.name,
                priority: output.priority,
                active: output.active,
                curriculumVersionId: output.curriculumVersionId,
            };

            if (id) {
                await updateTrainingBlock({
                    data: payload,
                    where: { id },
                });
                message.success('Cập nhật thành công');
            } else {
                await createTrainingBlock({
                    data: payload,
                });
                message.success('Thêm mới thành công');
            }

            queryClient.invalidateQueries({
                queryKey: ['TrainingBlock'],
            });
            onClose();
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại');
        }

        hideSpinner();
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa khối kiến thức CTDT'
                    : 'Thêm mới khối kiến thức CTDT'
            }
            className="min-w-[400px] w-[500px]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã khối kiến thức"
                    required
                >
                    <Input placeholder="Nhập mã khối kiến thức" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên khối kiến thức"
                    required
                >
                    <Input placeholder="Nhập tên khối kiến thức" />
                </FormItem>
            </Col>
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="totalCredits"
                    label="Tổng tín chỉ"
                >
                    <Input placeholder="Tổng tín chỉ" />
                </FormItem>
            </Col> */}
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="totalRequiredCredits"
                    label="Tổng tín chỉ bắt buộc"
                >
                    <Input placeholder="Tổng tín chỉ bắt buộc" />
                </FormItem>
            </Col> */}
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="electiveCredits"
                    label="Số tín chỉ tự chọn"
                >
                    <Input placeholder="Số tín chỉ tự chọn" />
                </FormItem>
            </Col> */}
            {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="specializedCredits"
                    label="Số tín chỉ chuyên ngành"
                >
                    <Input placeholder="Số tín chỉ chuyên ngành" />
                </FormItem>
            </Col> */}
            <Col span={24}>
                <FormItem form={form} name="priority" label="Thứ tự" required >
                    <InputNumber placeholder="Thứ tự" className='w-full'/>
                </FormItem>
            </Col>
            {id && (
                <Col span={24}>
                    <FormItem
                        form={form}
                        name="active"
                        label="Trạng thái"
                    >
                        <Select
                            placeholder="Chọn trạng thái"
                            options={[
                                { label: 'Đang hoạt động', value: true },
                                { label: 'Ngừng đào tạo', value: false },
                            ]}
                            allowClear
                        />
                    </FormItem>
                </Col>
            )}
            <Col span={24}>
                <FormItem
                    form={form}
                    name="curriculumVersionId"
                    label="Phiên bản chương trình đào tạo"
                >
                    <Select
                        placeholder="Chọn phiên bản chương trình đào tạo"
                        options={curriculumVersion.map(item => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingBlock
