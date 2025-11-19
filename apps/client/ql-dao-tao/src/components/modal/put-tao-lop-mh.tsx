import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import type { Room, SubjectClass } from '@workspace/db/client'
import {
    useCreateManySubjectClass,
    useFindManyRoom,
    useFindManySchoolYear,
    useFindManySubjectVersion,
} from '@workspace/db/hooks'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, DatePicker, Flex, Form, InputNumber, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/vi'
import { useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

export type PutSubjectClass = {
    list?: (SubjectClass & { id: string | undefined | null })[] | []
    schedule: string
    trainingLocationId: string | null
    subjectVersionId: string
    totalStudent: number | null
    maxStudent: number | null
    numberOfClass: number | null
}

const PutOpenSubjectClassModal = () => {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [form] = Form.useForm<PutSubjectClass>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutOpenSubjectClassModal',
        onClose: form.resetFields,
    })
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: createMany } = useCreateManySubjectClass()
    const { id: semesterId } = useSemesterStore()

    const { data: subjectVersionData = [] } = useFindManySubjectVersion({
        where: semesterId
            ? {
                  subjectClass: {
                      none: { semesterId },
                  },
              }
            : {},
    })

    async function onOk(output?: PutSubjectClass) {
        if (!output) return
        try {
            showSpinner()
            console.log(form.getFieldsValue())
            await createMany({
                data: form.getFieldValue('list').map((i: SubjectClass) => ({
                    name: i.name,
                    startDate: i.startDate,
                    subjectId: i.subjectId,
                    schedule: i.schedule,
                    semesterId: i.semesterId,
                    code: i?.code,
                    roomId: i?.roomId,
                    maxStudent: i?.maxStudent,
                    examDate: i.examDate,
                    examScoreDeadline: i.examScoreDeadline,
                    lecturerAssignmentDeadline: i.lecturerAssignmentDeadline,
                    scoreDeadline: i.scoreDeadline,
                    examType: i.examType,
                    trainingObjectTypeId,
                })),
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

    const handleCreateTableForClass = () => {
        const numberOfClass = Number(form.getFieldValue('numberOfClass'))
        if (numberOfClass > 0) {
            const count = Math.ceil(
                Number(form.getFieldValue('totalStudent')) / Number(numberOfClass)
            )
            const result = []
            const subjectVersion = subjectVersionData.find(
                (i) => i.id === form.getFieldValue('subjectVersionId')
            )
            for (let i = 0; i < Number(numberOfClass); i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersion?.code} 0${i + 1}`,
                    name: subjectVersion?.name,
                    maxStudent: Number(count),
                    startDate: new Date(),
                    semesterId: semesterId,
                    subjectId: form.getFieldValue('subjectVersionId'),
                    subject: subjectVersion,
                    examType: subjectVersion?.examType,
                })
            }
            form.setFieldsValue({ list: result, maxStudent: null })
        }
    }
    const handleCreateTableForMaxStudent = () => {
        const maxStudent = Number(form.getFieldValue('maxStudent'))
        if (Number(maxStudent) > 0) {
            const count = Math.ceil(Number(form.getFieldValue('totalStudent')) / Number(maxStudent))
            const result = []
            const subjectVersion = subjectVersionData.find(
                (i) => i.id === form.getFieldValue('subjectVersionId')
            )
            for (let i = 0; i < count; i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersion?.code} 0${i + 1}`,
                    name: subjectVersion?.name ? subjectVersion?.name : '',
                    maxStudent: Number(maxStudent),
                    startDate: new Date(),
                    semesterId: semesterId,
                    subjectId: form.getFieldValue('subjectVersionId'),
                    subject: subjectVersion,
                    examType: subjectVersion?.examType,
                })
            }
            form.setFieldsValue({ list: result, numberOfClass: null })
        }
    }

    const handleChangeDateExam = (date: Dayjs, key: number) => {
        const result = form.getFieldValue('list').map((i: SubjectClass, index: number) => {
            if (key === index) {
                return {
                    ...i,
                    examDate: date,
                    scoreDeadline: date.add(-10, 'day'),
                    examScoreDeadline: date.add(10, 'day'),
                }
            }
            return i
        })
        form.setFieldsValue({ list: result })
    }

    const handleChangeLocation = (value: string, key: string) => {}

    const { data: schoolYears = [] } = useFindManySchoolYear({
        include: { semesters: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
    })

    const treeData = useMemo(() => {
        return schoolYears.map((i) => ({
            title: i?.name,
            key: i?.id,
            value: i?.id,
            selectable: false,
            code: i?.code,
            children: i?.semesters?.length
                ? i?.semesters.map((j) => ({
                      title: `${j?.name} năm ${i?.name}`,
                      key: j?.id,
                      value: j?.id,
                      code: j?.code,
                  }))
                : [],
        }))
    }, [schoolYears])

    const TrainingLocationForm = Form.useWatch('trainingLocationId', form)

    const { data: roomData = [], refetch: refetchRoomData } = useFindManyRoom({
        where: {
            trainingRoom: true,
            building: {
                trainingLocationId: TrainingLocationForm,
            },
        },
    })
    const listForm = Form.useWatch('list', form)?.filter((i) => i?.name) ?? []
    const disableMaxStudent = Form.useWatch('totalStudent', form)
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Mở lớp môn học'}
            className="w-[80vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="subjectVersionId" label="Môn học" required>
                    <Select
                        {...(!semesterId
                            ? {
                                  showSearch: false,
                                  allowClear: false,
                                  showArrow: false,
                                  open: false,
                              }
                            : {})}
                        placeholder="Chọn môn học"
                        options={subjectVersionData.map((item) => {
                            return {
                                ...item,
                                label: item?.code ? `${item?.code} - ${item?.name}` : item?.name,
                                value: item.id,
                            }
                        })}
                        allowClear
                    />
                </FormItem>
            </Col>

            {/* <Col span={12}>
                <FormItem form={form} name="schedule" label="Kíp học" required>
                    <Select
                        placeholder="Chọn kíp học"
                        options={Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(
                            ([key, value_]) => {
                                return {
                                    label: value_,
                                    value: key,
                                }
                            }
                        )}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingLocationId" label="Địa điểm" required>
                    <Select
                        placeholder="Chọn địa điểm"
                        options={trainingLocationData.map((item) => {
                            return {
                                label: item.name,
                                value: item.id,
                            }
                        })}
                        allowClear
                    />
                </FormItem>
            </Col> */}
            <Col span={12}>
                <FormItem form={form} name="totalStudent" label="Tổng SV" required>
                    <InputNumber
                        type="number"
                        placeholder="Nhập tổng số sinh viên"
                        className="w-full"
                        min={0}
                        step={1}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số LMH</span>
                    <FormItem form={form} name="numberOfClass" label="" className="mb-0">
                        <InputNumber
                            type="number"
                            className="w-full"
                            placeholder="Nhập số lớp cần tạo"
                            step={1}
                            min={0}
                            disabled={Number(disableMaxStudent || 0) <= 0}
                        />
                    </FormItem>

                    <Button
                        onClick={handleCreateTableForClass}
                        type="primary"
                        className="h-[32px]"
                        disabled={Number(disableMaxStudent || 0) <= 0}
                    >
                        Thêm LMH theo số lớp
                    </Button>
                </Flex>
            </Col>
            <Col span={12}>
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số SV tối đa</span>
                    <FormItem form={form} name="maxStudent" label="" className="mb-0">
                        <InputNumber
                            type="number"
                            className="w-full"
                            placeholder="Nhập số SV tối đa"
                            step={1}
                            min={0}
                            disabled={Number(disableMaxStudent || 0) <= 0}
                        />
                    </FormItem>

                    <Button
                        onClick={handleCreateTableForMaxStudent}
                        type="primary"
                        className="h-[32px]"
                        disabled={Number(disableMaxStudent || 0) <= 0}
                    >
                        Thêm LMH theo số SV tối đa
                    </Button>
                </Flex>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="list">
                    <Table
                        className="mt-2 custom-scrollbar"
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã LMH',
                                dataIndex: 'code',
                                width: 150,
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                width: 200,
                            },
                            {
                                title: 'Số tín chỉ',
                                width: 100,
                                dataIndex: 'subject',
                                align: 'center',
                                render: (value) => <>{value?.credit}</>,
                            },
                            {
                                title: 'Số SV tối đa',
                                dataIndex: 'maxStudent',
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
                                width: 100,
                                align: 'center',
                                dataIndex: 'subject',
                                render: (value) => <>{value?.period}</>,
                            },
                            {
                                title: 'Số SV max',
                                width: 100,
                                align: 'center',
                                render: (record) => <>{record?.maxStudent}</>,
                            },

                            {
                                title: 'Kíp học',
                                dataIndex: 'schedule',
                                width: 200,
                                align: 'center',
                                render: (_, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'schedule']}
                                        label=""
                                    >
                                        <Select
                                            placeholder="Chọn kíp học"
                                            options={Object.entries(
                                                SUBJECT_CLASS_SCHEDULE_TYPE
                                            ).map(([key, value_]) => {
                                                return {
                                                    label: value_,
                                                    value: key,
                                                }
                                            })}
                                            allowClear
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hạn PCGD',
                                width: 150,
                                align: 'center',
                                render: (_, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'lecturerAssignmentDeadline']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                            placeholder="Chọn ngày hạn PCGD"
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Ngày thi',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'examDate']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                            onChange={(date) => handleChangeDateExam(date, index)}
                                            placeholder="Chọn ngày thi"
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hạn nhập điểm CC/TX',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'scoreDeadline']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                            placeholder="Chọn ngày hạn nhập điểm CC/TX"
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hạn nhập điểm',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'examScoreDeadline']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                            placeholder="Chọn ngày hạn nhập điểm"
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hình thức thi',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'examType']}
                                        label=""
                                    >
                                        <Select
                                            placeholder="Chọn hình thức thi"
                                            options={options}
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Phòng học',
                                width: 200,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'roomId']}
                                        label=""
                                    >
                                        <Select
                                            placeholder="Chọn phòng học"
                                            options={roomData.map((i: Room) => {
                                                return {
                                                    value: i.id,
                                                    label: i.name,
                                                }
                                            })}
                                            className="w-full"
                                            onChange={(value) =>
                                                handleChangeLocation(value, record)
                                            }
                                        />
                                    </Form.Item>
                                ),
                            },
                            // {
                            //     title: 'Địa điểm',
                            //     width: 200,
                            //     align: 'center',
                            //     render: (value) =>
                            //         trainingLocationData.find(
                            //             (item) =>
                            //                 item.id === form.getFieldValue('trainingLocationId')
                            //         )?.name || '',
                            // },
                        ]}
                        data={listForm}
                        pagination={false}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutOpenSubjectClassModal
