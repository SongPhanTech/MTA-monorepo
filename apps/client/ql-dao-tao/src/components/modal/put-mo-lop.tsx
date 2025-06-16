import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
// import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import {
    $Enums,
    type ExamType,
    type Room,
    type Semester,
    type SubjectClassSchedule,
    type TrainingCourse,
    type TrainingObjectType,
} from '@workspace/db'
import {
    useCreateManySubjectClass,
    useCreateSubjectClass,
    useCreateSubjectVersion,
    useCreateTrainingCourse,
    useFindManyRoom,
    useFindManyTrainingLocation,
    useFindUniqueSubjectVersion,
    useFindUniqueTrainingCourse,
    useUpdateSubjectClass,
    useUpdateSubjectVersion,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    DatePicker,
    Empty,
    Flex,
    Form,
    Input,
    InputNumber,
    Table,
    TreeSelect,
    message,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import type { OpenSubjectClass } from '@workspace/libs/api/schemas/openSubjectClass'
dayjs.locale('vi')

export type PutOpenSubjectClassType = {
    subjectClassScheduleId: string
    trainingLocationId: string
}

export type OpenSubjectClassType = OpenSubjectClass & {
    studentCount: number
    semeter: {
        id: string
        name: string
        value:string
        key:string
        code:string
    }
    subjectClassScheduleId:SubjectClassSchedule
    schedule: SubjectClassSchedule
    startDate?:Date
    subjectVersionCode: string
}

const PutOpenClassModal = () => {
    const [form] = Form.useForm<PutOpenSubjectClassType>()
    const {
        isOpen,
        onClose,
        input: dataClass,
    } = useDisclosure<
       OpenSubjectClassType
    >({
        tag: PutOpenClassModal.name,
        onClose: form.resetFields,
    })
    const { getExamTypeLabel } = useExamTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [dataSubmit, setDataSubmit] = useState<OpenSubjectClassType[]>([])
    const [numberOfClass, setNumberOfClass] = useState<number | null>(null)
    const [maxStudent, setMaxStudent] = useState<number | null>(null)
    const { mutateAsync: createMany } = useCreateManySubjectClass()
    // const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    async function onOk(output?: PutOpenSubjectClassType) {
        if (!output) return
        try {
            showSpinner()
            if (dataClass?.subjectClass?.length) {
                //    await updateSubjectClass({
                //                     data: {
                //                         ...rest,
                //                         trainingObjectTypes: {
                //                             createMany: {
                //                                 data: trainingObjectTypeIds.map(
                //                                     (trainingObjectTypeId) => ({
                //                                         trainingObjectTypeId,
                //                                     })
                //                                 ),
                //                                 skipDuplicates: true,
                //                             },
                //                             deleteMany: {
                //                                 trainingMajorId: id,
                //                                 trainingObjectTypeId: {
                //                                     notIn: trainingObjectTypeIds,
                //                                 },
                //                             },
                //                         },
                //                     },
                //                     where: { id },
                //                 })
            } else {
                console.log(dataSubmit)
                    await createMany({
                        data: dataSubmit.map((i) => ({
                            name: i.subjectVersionName,
                            startDate: new Date(),
                            subjectId: i.subjectVersionId,
                            schedule:  i.subjectClassScheduleId,
                            semesterId: i.semeter.id,
                            code:  i?.subjectVersionCode
                        })),
                    })
             
            }

            // // refetch() lại danh sách level
            // queryClient.invalidateQueries({
            //     queryKey: ['TrainingCourse'],
            // })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleCreateTableForClass = () => {
        setMaxStudent(null)
        if (Number(numberOfClass) > 0) {
            const cout = Math.ceil(100 / Number(numberOfClass))
            const result = []
            for (let i = 0; i < Number(numberOfClass); i++) {
                result.push({
                    ...dataClass,
                    key: i + 1,
                    subjectVersionCode: `${dataClass.subjectVersionCode} 0${i + 1}`,
                    maxStudent: cout,
                    subjectClassScheduleId: form.getFieldValue(
                        'subjectClassScheduleId'
                    ),
                    trainingLocationId:
                        form.getFieldValue('trainingLocationId'),
                })
            }
            setDataSubmit(result)
        }
    }

    const handleCreateTableForMaxStudent = () => {
        setNumberOfClass(null)
        if (Number(maxStudent) > 0) {
            const cout = Math.ceil(100 / Number(maxStudent))
            const result = []
            for (let i = 0; i < cout; i++) {
                result.push({
                    ...dataClass,
                    key: i + 1,
                    subjectVersionCode: `${dataClass.subjectVersionCode} 0${i + 1}`,
                    maxStudent: maxStudent,
                    subjectClassScheduleId: form.getFieldValue(
                        'subjectClassScheduleId'
                    ),
                    trainingLocationId:
                        form.getFieldValue('trainingLocationId'),
                })
            }
            setDataSubmit(result)
        }
    }

    const {
        data: trainingLocationData = [],
        refetch: refetchTrainingLocationData,
    } = useFindManyTrainingLocation()

    const TrainingLocationForm = Form.useWatch('trainingLocationId', form)

    const { data: roomData = [], refetch: refetchRoomData } = useFindManyRoom({
        where: {
            trainingRoom: true,
            building: {
                trainingLocationId: TrainingLocationForm,
            },
        },
    })

    const { data: subjectVersionData } = useFindUniqueSubjectVersion({
        where: { id: dataClass?.subjectVersionId },
        include: {
            subjectClass: true,
        },
    })

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
            <Col span={6}>
                <div>Mã HK: {dataClass?.semeter?.code}</div>
            </Col>
            <Col span={6}>{dataClass?.semeter?.name}</Col>
            <Col span={6}>Đơn vị phụ trách:</Col>
            <Col span={6}>Bộ môn: </Col>
            <Col span={6}>Mã MH: {dataClass?.subjectVersionId}</Col>
            <Col span={6}>Tên MH: {dataClass?.subjectVersionName}</Col>
            <Col span={6}>Tổng SV: {dataClass?.studentCount}</Col>
            <Col span={6}>Tổng SV nợ môn: 0</Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="subjectClassScheduleId"
                    label="Kíp học"
                    required
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
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingLocationId"
                    label="Địa điểm"
                    required
                >
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
            </Col>
            <Col span={12}>
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số LMH</span>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập số lớp cần tạo"
                        step={1}
                        min={0}
                        value={numberOfClass}
                        onChange={(value) => setNumberOfClass(value || 0)}
                    />
                    <Button
                        onClick={handleCreateTableForClass}
                        type="primary"
                        className="h-[32px]"
                    >
                        Thêm LMH theo số lớp
                    </Button>
                </Flex>
            </Col>
            <Col span={12}>
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số SV tối đa</span>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập số SV tối đa"
                        step={1}
                        min={0}
                        value={maxStudent}
                        onChange={(value) => setMaxStudent(value || 0)}
                    />
                    <Button
                        onClick={handleCreateTableForMaxStudent}
                        type="primary"
                        className="h-[32px]"
                    >
                        Thêm LMH theo số SV tối đa
                    </Button>
                </Flex>
            </Col>
            <Col span={24}>
                <Table
                    rowKey="key"
                    className="mt-6 custom-scrollbar"
                    id="open-subject-class"
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
                            dataIndex: 'subjectVersionCode',
                            width: 150,
                        },
                        {
                            title: 'Tên môn học',
                            dataIndex: 'subjectVersionName',
                            width: 200,
                        },
                        {
                            title: 'Số tín chỉ',
                            dataIndex: 'subjectVersionCredit',
                            width: 100,
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
                            dataIndex: 'subjectVersionData',
                            width: 100,
                            align: 'center',
                            render: () => subjectVersionData?.period,
                        },
                        {
                            title: 'Số SV max',
                            dataIndex: 'maxStudent',
                            width: 100,
                            align: 'center',
                        },

                        {
                            title: 'Kíp học',
                            dataIndex: 'subjectClassScheduleId',
                            width: 200,
                            align: 'center',
                            render: (value: SubjectClassSchedule) =>
                                SUBJECT_CLASS_SCHEDULE_TYPE[
                                    value as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE
                                ],
                        },
                        {
                            title: 'Ngày thi',
                            dataIndex: 'examDate',
                            width: 150,
                            align: 'center',
                            render: (value) => (
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date < dayjs().startOf('day')
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Hình thức thi',
                            dataIndex: 'ExamType',
                            width: 150,
                            align: 'center',
                            render: () =>
                                getExamTypeLabel(subjectVersionData?.examType),
                        },
                        {
                            title: 'Phòng học',
                            dataIndex: 'phongHoc',
                            width: 200,
                            align: 'center',
                            render: () => (
                                <Select
                                    placeholder="Chọn chủ đề khảo sát"
                                    options={roomData.map((i: Room) => {
                                        return {
                                            value: i.id,
                                            label: i.name,
                                        }
                                    })}
                                    style={{ width: '100%' }}
                                />
                            ),
                        },
                        {
                            title: 'Địa điểm',
                            dataIndex: 'trainingLocationId',
                            width: 200,
                            align: 'center',
                            render: (value) =>
                                trainingLocationData.find(
                                    (item) => item.id === value
                                )?.name || '',
                        },
                    ]}
                    dataSource={dataSubmit}
                    bordered
                    locale={{
                        emptyText: <Empty description="Không có dữ liệu" />,
                    }}
                    scroll={{ x: '100%', y: undefined }}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutOpenClassModal
