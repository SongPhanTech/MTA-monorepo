import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { UserProfile, TrainingCourse, Organization, UserType } from '@workspace/db'
import {
    useCreateUserProfile,
    useFindUniqueUserProfile,
    useUpdateUserProfile,
    useFindManyTrainingCourse,
    useFindManyFixedClass,
    useFindManyUserType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
import { GENDER_LIST } from '@constants/constants'
export type PutUserProfile = UserProfile
const PutUserProfileModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutUserProfileModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: fixedClassData = [], refetch: refetchFixedClassData } = useFindManyFixedClass({
        take: 1000,
        skip: 0,
    });

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } = useFindManyTrainingCourse({
        take: 1000,
        skip: 0,
    });
    const { data: userTypeData = [], refetch: refetchUserType } = useFindManyUserType({
        take: 1000,
        skip: 0,
    });

    const { mutateAsync: createUserProfile } = useCreateUserProfile()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    async function onOk(output?: PutUserProfile) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateUserProfile({
                    data: {
                        code: output.code,
                        firstName: output.firstName,
                        lastName: output.lastName,
                        gender: output.gender,
                        dateOfBirth: output.dateOfBirth,
                        homeTown: output.homeTown,
                        idCardNumber: output.idCardNumber,
                        phoneNumber: output.phoneNumber,
                        userTypeId: output.userTypeId
                        // fixedClass: output.fixedClass
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createUserProfile({
                    data: {
                        code: output.code,
                        firstName: output.firstName,
                        lastName: output.lastName,
                        gender: output.gender,
                        dateOfBirth: output.dateOfBirth,
                        homeTown: output.homeTown,
                        idCardNumber: output.idCardNumber,
                        phoneNumber: output.phoneNumber,
                        userTypeId: output.userTypeId
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['UserProfile'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueUserProfile({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa học viên'
                    : 'Thêm mới học viên'
            }
            className="w-[30vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã học viên"
                    required
                >
                    <Input placeholder='Nhập mã học viên' />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="userTypeId"
                    label="Đối tượng"
                    required
                >
                    <Select placeholder='Chọn đối tượng' options={userTypeData.map((i: UserType) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="firstName"
                    label="Họ và tên đệm"
                    required
                >
                    <Input placeholder="Nhập họ và tên đệm" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="lastName"
                    label="Tên"
                    required
                >
                    <Input placeholder="Nhập tên" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="dateOfBirth" label="Ngày sinh">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="gender"
                    label="Giới tính"
                // required
                >
                    <Select placeholder="Chọn giới tính" options={GENDER_LIST.map((i: any) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="idCardNumber"
                    label="Số CCCD"

                >
                    <Input placeholder="Nhập số CCCD" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="phoneNumber"
                    label="Số điện thoại"
                // required
                >
                    <Input placeholder="Nhập số điện thoại" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="homeTown" label="Quê quán">
                    <Input.TextArea placeholder="Nhập quê quán" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutUserProfileModal
