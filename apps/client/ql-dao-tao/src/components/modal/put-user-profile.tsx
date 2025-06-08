import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { GENDER_LIST } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { UserProfile } from '@workspace/db'
import {
    useCreateCurriculum,
    useCreateStudent,
    useCreateUserProfile,
    useFindManyCurriculum,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
    useFindUniqueUserProfile,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutUserProfile = UserProfile & {
    trainingObjectTypeId?: string
    fixedClassId?: string
    trainingCourseId?: string
}
dayjs.locale('vi')
const PutUserProfileModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const { isOpen, onClose, input } = useDisclosure<any>({
        tag: PutUserProfileModal.name,
        onClose: form.resetFields,
    })
    const { id, code } = input ?? {}
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: fixedClassData = [], refetch: refetchFixedClassData } =
        useFindManyFixedClass()

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse()

    const { data: trainingObjectTypeData } = useFindManyTrainingObjectType()

    const { mutateAsync: createStudent } = useCreateStudent()

    async function onOk(output?: PutUserProfile) {
        if (!output) return
        try {
            showSpinner()

            await createStudent({
                data: {
                    userProfile: {
                        create: {
                            code: output.code,
                            firstName: output.firstName,
                            lastName: output.lastName,
                            gender: output.gender,
                            dateOfBirth: output.dateOfBirth,
                        },
                    },
                    trainingObjectType: {
                        connect: {
                            id: output.trainingObjectTypeId,
                        },
                    },
                    fixedClass: {
                        connect: {
                            id: output.fixedClassId,
                        },
                    },
                },
            })

            message.success('Thêm mới thành công')

            queryClient.invalidateQueries({
                queryKey: ['Student'],
            })

            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
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
                    ? code === 'SV'
                        ? 'Chỉnh sửa sinh viên'
                        : 'Chỉnh sửa học viên'
                    : code === 'SV'
                      ? 'Thêm mới sinh viên'
                      : 'Thêm mới học viên'
            }
            className="w-[50vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã" required>
                    <Input placeholder="Nhập mã" />
                </FormItem>
            </Col>
            {/* <Col span={12}>
                <FormItem
                    form={form}
                    name="userTypeId"
                    label="Đối tượng"
                    required
                >
                    <Select
                        placeholder="Chọn đối tượng"
                        options={userTypeData.map((i: UserType) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col> */}
            <Col span={12}>
                <FormItem
                    form={form}
                    name="lastName"
                    label="Họ và tên đệm"
                    required
                >
                    <Input placeholder="Nhập họ và tên đệm" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="firstName" label="Tên" required>
                    <Input placeholder="Nhập tên" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="dateOfBirth"
                    label="Ngày sinh"
                    required
                >
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="gender" label="Giới tính" required>
                    <Select
                        placeholder="Chọn giới tính"
                        options={GENDER_LIST.map((i: any) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingObjectTypeId"
                    label="Đối tượng đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData?.map((value) => {
                            return {
                                value: value.id,
                                label: value.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="fixedClassId" label="Lớp" required>
                    <Select
                        placeholder="Chọn lớp"
                        options={fixedClassData?.map((value) => {
                            return {
                                value: value.id,
                                label: value.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingCourseId"
                    label="Khóa"
                    required
                >
                    <Select
                        placeholder="Chọn khóa học"
                        options={trainingCourseData?.map((value) => {
                            return {
                                value: value.id,
                                label: value.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutUserProfileModal
