import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type {
    SchoolYear,
    TrainingCourse,
    TrainingCourseRegulation,
    TrainingObjectType,
} from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindManySchoolYear,
    useFindManySemester,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useFindUniqueTrainingCourse,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import { Button, Col, Form, Input, InputNumber, message, Radio, Row } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Table from '@components/commons/table'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Trash2 } from 'lucide-react'
export type PutTrainingCourse = TrainingCourse & {
    schoolYearId: string | undefined
    trainingCourseClone: string | null
    trainingCourseRegulation: TrainingCourseRegulation[]
}
dayjs.locale('vi')
const PutTrainingCourseModal = () => {
    const [form] = Form.useForm<PutTrainingCourse>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutTrainingCourseModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
    const [isValidating, setIsValidating] = useState(false)
    const [trainingCourseRegulationDelete, setTrainingCourseRegulation] = useState<
        TrainingCourseRegulation[]
    >([])
    const { data: trainingCourse = [] } = useFindManyTrainingCourse()

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

    const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function onOk(output?: PutTrainingCourse) {
        if (!output) return
        const {
            trainingObjectTypeId,
            semesterStartId,
            trainingCourseClone,
            schoolYearId,
            trainingCourseRegulation,
            ...rest
        } = output
        try {
            showSpinner()
            const data = {
                trainingObjectType: { connect: { id: trainingObjectTypeId } },
                semesterStart: { connect: { id: semesterStartId } },
                ...rest,
            }
            console.log(data, 'data')

            if (id) {
                const listUpdate = trainingCourseRegulation.filter((i) => i?.id)
                const listCreate = trainingCourseRegulation.filter((i) => !i?.id)

                let listSqlTransaction: any = [
                    {
                        model: 'TrainingCourse',
                        operation: 'update',
                        data: {
                            where: {
                                id: id,
                            },
                            data,
                        },
                    },
                ]

                if (listUpdate?.length) {
                    listSqlTransaction = [
                        ...listSqlTransaction,
                        ...listUpdate.map((i) => {
                            return {
                                model: 'TrainingCourseRegulation',
                                operation: 'update',
                                data: {
                                    where: {
                                        id: i?.id,
                                    },
                                    data: {
                                        ...i,
                                        trainingCourseId: id,
                                    },
                                },
                            }
                        }),
                    ]
                }
                if (listCreate?.length) {
                    listSqlTransaction = [
                        ...listSqlTransaction,
                        ...listCreate.map((i) => {
                            return {
                                model: 'TrainingCourseRegulation',
                                operation: 'create',
                                data: {
                                    data: {
                                        ...i,
                                        trainingCourseId: id,
                                    },
                                },
                            }
                        }),
                    ]
                }

                if (trainingCourseRegulationDelete?.length) {
                    listSqlTransaction = [
                        ...listSqlTransaction,
                        ...trainingCourseRegulationDelete.map((i) => {
                            return {
                                model: 'TrainingCourseRegulation',
                                operation: 'delete',
                                data: {
                                    where: {
                                        id: i?.id,
                                    },
                                },
                            }
                        }),
                    ]
                }

                const res = await sqlTransaction(listSqlTransaction)
                if (res) {
                    message.success('Cập nhật thành công')
                }
            } else {
                await createTrainingCourse({
                    data: {
                        ...data,
                        trainingCourseRegulation: {
                            createMany: {
                                data: trainingCourseRegulation.map((i) => ({
                                    ...i,
                                })),
                            },
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const schoolYearIdForm = Form.useWatch('schoolYearId', form)

    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } = useFindManySchoolYear()
    const { data: semesterData = [], refetch: refetchSemesters } = useFindManySemester({
        where: schoolYearIdForm
            ? {
                  schoolYearId: schoolYearIdForm,
              }
            : undefined,
        include: {
            schoolYear: true,
        },
    })
    const { data: level } = useFindUniqueTrainingCourse(
        {
            where: { id },
            include: {
                semesterStart: true,
                trainingCourseRegulation: true,
            },
        },
        {
            enabled: !!id,
        }
    )

    const { data: selectedTraniningCourse } = useFindUniqueTrainingCourse(
        {
            where: {
                id: selectedId,
            },
            include: {
                trainingCourseRegulation: true,
            },
        },
        { enabled: !!selectedId }
    )

    const handleSelectChange = async (value: string) => {
        setSelectedId(value)
    }
    const validateCoefficientSum = useCallback(
        (_: any, value: any) => {
            const coef1 = form.getFieldValue('coef_1') || 0
            const coef2 = form.getFieldValue('coef_2') || 0
            const coef3 = form.getFieldValue('coef_3') || 0

            const sum =
                Number.parseFloat(coef1) + Number.parseFloat(coef2) + Number.parseFloat(coef3)

            const roundedSum = Math.round(sum * 10) / 10

            if (roundedSum !== 1) {
                return Promise.reject(new Error('Tổng các hệ số phải bằng 1'))
            }

            return Promise.resolve()
        },
        [form]
    )

    const validateCoefficient = useCallback(
        (fieldName: string) => (_: any, value: any) => {
            if (value === undefined || value === null) {
                return Promise.resolve()
            }
            const numValue = Number.parseFloat(value)
            if (Number.isNaN(numValue) || numValue < 0 || numValue > 1) {
                return Promise.reject(new Error('Hệ số phải nằm trong khoảng 0 đến 1'))
            }

            return Promise.resolve()
        },
        []
    )

    // Hàm debounce để tránh gọi validate quá nhiều lần
    const debouncedValidate = useCallback(
        (fields: string[]) => {
            if (isValidating) return

            setIsValidating(true)
            form.validateFields(fields).finally(() => {
                setIsValidating(false)
            })
        },
        [form, isValidating]
    )
    const listForm = Form.useWatch('trainingCourseRegulation', form) ?? []
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                schoolYearId: level.semesterStart?.schoolYearId,
            })
        } else if (selectedTraniningCourse) {
            //TODO: clone trainingCourse
            form.setFieldsValue({
                coef_1: selectedTraniningCourse.coef_1,
                coef_2: selectedTraniningCourse.coef_2,
                coef_3: selectedTraniningCourse.coef_3,
                scoreToTakeExam: selectedTraniningCourse.scoreToTakeExam,
                scoreToPass: selectedTraniningCourse.scoreToPass,
                scoreToPassConditional: selectedTraniningCourse.scoreToPassConditional,
                scoreToTakeGraduation: selectedTraniningCourse.scoreToTakeGraduation,
                scoreToPassGraduation: selectedTraniningCourse.scoreToPassGraduation,
                admissionQuota: selectedTraniningCourse.admissionQuota,
                maxTrainingTime: selectedTraniningCourse.maxTrainingTime,
                trainingCourseRegulation: selectedTraniningCourse.trainingCourseRegulation,
            })
        } else {
            form.setFieldsValue({
                active: true,
                trainingCourseRegulation: [
                    { name: '', value: undefined, id: undefined, code: undefined },
                ],
            })
        }
    }, [level, selectedTraniningCourse])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa khóa' : 'Thêm mới khóa'}
            className="w-[1000px]"
        >
            <Col span={8}>
                <FormItem
                    form={form}
                    name="trainingObjectTypeId"
                    label="Đối tượng đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map((i: TrainingObjectType) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="code" label="Mã khoá học" required>
                    <Input placeholder="Nhập mã khoá học" />
                </FormItem>
            </Col>

            <Col span={8}>
                <FormItem form={form} name="name" label="Tên khoá học" required>
                    <Input placeholder="Nhập tên khoá học" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="schoolYearId"
                    label="Năm học bắt đầu"
                    // required
                >
                    <Select
                        placeholder="Chọn năm học bắt đầu"
                        options={dataSchoolYear.map((i: SchoolYear) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="semesterStartId" label="Kỳ học bắt đầu" required>
                    <Select
                        placeholder="Chọn kỳ học bắt đầu"
                        options={semesterData.map((i) => {
                            return {
                                value: i.id,
                                label: [i?.name, i?.schoolYear?.name].filter(Boolean).join(' - '),
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="trainingCourseClone" label="Sao chép quy chế">
                    <Select
                        placeholder="Chọn khóa để sao chép"
                        options={trainingCourse.map((i) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        onChange={handleSelectChange}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="baseScore" label="Hệ số điểm" required>
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={[
                            {
                                label: 'Hệ 10',
                                value: 'Base10',
                            },
                            {
                                label: 'Hệ 4',
                                value: 'Base4',
                            },
                        ]}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="scoreToTakeExam"
                    label="Điểm tối thiểu được thi"
                    required
                >
                    <InputNumber
                        min={0}
                        type="number"
                        placeholder="Nhập điểm tối thiểu được thi"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="scoreToPass" label="Điểm tối thiểu để qua" required>
                    <InputNumber
                        min={0}
                        type="number"
                        placeholder="Nhập điểm tối thiểu để qua"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="scoreToPassConditional"
                    label="Điểm tối thiểu để qua môn điều kiện"
                >
                    <InputNumber
                        min={0}
                        type="number"
                        placeholder="Nhập điểm tối thiểu để qua môn điều kiện"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="scoreToTakeGraduation" label="Điểm liệt môn tốt nghiệp">
                    <InputNumber
                        min={0}
                        type="number"
                        placeholder="Nhập điểm liệt môn tốt nghiệp"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="scoreToPassGraduation"
                    label="Điểm để qua môn tốt nghiệp"
                >
                    <InputNumber
                        min={0}
                        type="number"
                        placeholder="Nhập điểm để qua môn tốt nghiệp"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="coef_1"
                    label="Hệ số điểm chuyên cần"
                    rules={[
                        {
                            validator: validateCoefficient('coef_1'),
                        },
                    ]}
                >
                    <InputNumber
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        placeholder="Nhập hệ số điểm chuyên cần"
                        className="w-full"
                        onChange={() => {
                            setTimeout(() => debouncedValidate(['coef_2', 'coef_3']), 300)
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="coef_2"
                    label="Hệ số điểm thường xuyên"
                    rules={[
                        {
                            validator: validateCoefficient('coef_2'),
                        },
                    ]}
                >
                    <InputNumber
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        placeholder="Nhập hệ số điểm thường xuyên"
                        className="w-full"
                        onChange={() => {
                            setTimeout(() => debouncedValidate(['coef_1', 'coef_3']), 300)
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="coef_3"
                    label="Hệ số điểm điểm thi"
                    rules={[
                        {
                            validator: validateCoefficient('coef_3'),
                        },
                        {
                            validator: validateCoefficientSum,
                        },
                    ]}
                >
                    <InputNumber
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        placeholder="Nhập hệ số điểm điểm thi"
                        className="w-full"
                        onChange={() => {
                            setTimeout(() => debouncedValidate(['coef_1', 'coef_2']), 300)
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="academicYear" label="Niên khoá">
                    <Input placeholder="Nhập niên khoá" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="maxTrainingTime" label="Thời gian đào tạo Max">
                    <InputNumber
                        type="number"
                        style={{ width: '100%' }}
                        min={0}
                        step={1}
                        placeholder="Nhập thời gian đào tạo"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="admissionQuota" label="Chỉ tiêu tuyển sinh">
                    <InputNumber
                        type="number"
                        style={{ width: '100%' }}
                        min={0}
                        step={1}
                        placeholder="Nhập chỉ tiêu tuyển sinh"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name={'active'} label="Trạng thái" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={24}>
                <div className="flex items-center justify-between">
                    <div>Tiêu chí bổ sung</div>
                    <Button
                        size="small"
                        onClick={() => {
                            form.setFieldsValue({
                                trainingCourseRegulation: [
                                    ...form.getFieldValue('trainingCourseRegulation'),
                                    {
                                        code: '',
                                        name: '',
                                    },
                                ],
                            })
                        }}
                    >
                        Thêm tiêu chí
                    </Button>
                </div>
                <FormItem form={form} name="trainingCourseRegulation">
                    <Table
                        rowKey="id"
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã tiêu chí',
                                dataIndex: 'code',
                                width: 200,
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['trainingCourseRegulation', index, 'code']}
                                        label=""
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Vui lồng nhập mã tiêu chí',
                                            },
                                        ]}
                                    >
                                        <Input placeholder="Nhập mã tiêu chí" />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Tên tiêu chí',
                                dataIndex: 'name',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['trainingCourseRegulation', index, 'name']}
                                        label=""
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Vui lồng nhập tên tiêu chí',
                                            },
                                        ]}
                                    >
                                        <Input placeholder="Nhập mã tiêu chí" />
                                    </Form.Item>
                                ),
                            },

                            {
                                title: 'Giá trị',
                                dataIndex: 'value',
                                width: 200,
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['trainingCourseRegulation', index, 'value']}
                                        label=""
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Vui lồng nhập giá trị',
                                            },
                                        ]}
                                    >
                                        <InputNumber
                                            className="w-full"
                                            min={0}
                                            max={10}
                                            placeholder="Nhập mã giá trị"
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (__, record, index: number) => {
                                    return (
                                        <Row className="justify-center gap-2">
                                            <Trash2
                                                size={16}
                                                strokeWidth={1.5}
                                                className={'text-red-600 cursor-pointer'}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    const result = listForm.splice(index, 1)
                                                    if (record?.id) {
                                                        setTrainingCourseRegulation([
                                                            ...trainingCourseRegulationDelete,
                                                            ...result,
                                                        ])
                                                    }
                                                    form.setFieldsValue({
                                                        trainingCourseRegulation: listForm,
                                                    })
                                                }}
                                            />
                                        </Row>
                                    )
                                },
                            },
                        ]}
                        dataSource={form.getFieldValue('trainingCourseRegulation')}
                        bordered
                        data={listForm}
                        pagination={false}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingCourseModal
