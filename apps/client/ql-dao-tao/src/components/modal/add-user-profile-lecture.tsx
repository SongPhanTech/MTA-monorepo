import { convertToTreeSelect } from '@/utils/convertOrganizationToTree'
import { queryClient } from '@api/index'
import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import TreeSelect from '@components/commons/tree-select/TreeSelect'
import { GENDER_LIST } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { type UserProfile, $Enums } from '@workspace/db'
import {
    useCreateLecturer,
    useCreateUserProfile,
    useFindManyAcademicDegreeType,
    useFindManyAcademicRankType,
    useFindManyLecturerType,
    useFindManyOrganization,
    useFindManyRank,
    useFindManyStaffPosition,
    useFindUniqueUserProfile,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import {
    Col,
    Form,
    Input,
    Row,
    Upload,
    type UploadFile,
    type UploadProps,
    message,
} from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutUserProfile = UserProfile & {
    organizationId: string
    lecturerTypeId: string
    staffPositionId: string
}
export interface AddUserProfileLectureProps {
    userType: string
}
dayjs.locale('vi')
const AddUserProfileLecture = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const { isOpen, onClose, input } =
        useDisclosure<AddUserProfileLectureProps>({
            tag: AddUserProfileLecture.name,
            onClose: form.resetFields,
        })
    const { userType } = input ?? {}
    const { showSpinner, hideSpinner } = useSpinner()

    const userTypeData = $Enums.UserType
    const { data: organizations = [], refetch: refetchOrganization } =
        useFindManyOrganization()
    const { data: staffPositions = [] } = useFindManyStaffPosition({
        include: {
            lecturerType: true,
        },
    })

    const { data: academicDegreeTypes = [] } = useFindManyAcademicDegreeType()
    const { data: academicRankTypes = [] } = useFindManyAcademicRankType()
    const { data: ranks = [] } = useFindManyRank()

    const { mutateAsync: createLecturer } = useCreateLecturer()

    async function onOk(output?: PutUserProfile) {
        // console.log(userTypeData?.find((type: any) => type.code === code))
        if (!output) return

        try {
            showSpinner()
            let fileName
            if (fileList.length > 0) {
                const resPresignedUrl = await fetchGeneratePresignedUrl({
                    body: {
                        path: 'avatar',
                        extension: fileList[0].name.split('.').pop() ?? '',
                    },
                })
                await fetch(resPresignedUrl.url, {
                    method: 'PUT',
                    body: fileList[0].originFileObj,
                })
                fileName = resPresignedUrl.fileName
            }

            // Tìm staffPosition được chọn để lấy lecturerTypeId
            const selectedStaffPosition = staffPositions.find(
                (pos) => pos.id === output.staffPositionId
            )
            if (!selectedStaffPosition) {
                message.error('Chức vụ được chọn không tồn tại!')
                return
            }

            // TODO: create lecturer profile
            await createLecturer({
                data: {
                    userProfile: {
                        create: {
                            firstName: output.firstName,
                            lastName: output.lastName,
                            gender: output.gender,
                            avatar: fileName ? fileName : undefined,
                            academicDegreeDate: output.academicDegreeDate,
                            academicRankDate: output.academicRankDate,
                            rankDate: output.rankDate,
                            dateOfBirth: output.dateOfBirth,
                            homeTown: output.homeTown,
                            officerNumber: output.officerNumber,
                            userType: $Enums.UserType.LECTURER,
                            // Connect các relation fields
                            academicRankType: output.academicRankTypeId
                                ? {
                                      connect: {
                                          id: output.academicRankTypeId,
                                      },
                                  }
                                : undefined,
                            academicDegreeType: output.academicDegreeTypeId
                                ? {
                                      connect: {
                                          id: output.academicDegreeTypeId,
                                      },
                                  }
                                : undefined,
                            rank: output.rankId
                                ? {
                                      connect: { id: output.rankId },
                                  }
                                : undefined,
                        },
                    },
                    organization: {
                        connect: {
                            id: output.organizationId,
                        },
                    },
                    lecturerType: {
                        connect: {
                            id: selectedStaffPosition.lecturerTypeId,
                        },
                    },
                    code: output.code,
                },
            })

            message.success('Thêm mới thành công')

            queryClient.invalidateQueries({
                queryKey: ['Lecturer'],
            })
            onClose()
        } catch (error) {
            console.log('error', error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    // const { data: level } = useFindUniqueUserProfile(
    //     id
    //         ? {
    //               where: {
    //                   id: id,
    //               },
    //           }
    //         : {
    //               where: {
    //                   id: '',
    //               },
    //           }
    // )
    // useEffect(() => {
    //     if (level) {
    //         form.setFieldsValue({
    //             ...level,
    //             dateOfBirth: dayjs(level.dateOfBirth),
    //         })
    //     }
    // }, [level])

    //upload file
    const [fileList, setFileList] = useState<UploadFile[]>([])

    const beforeUpload = (file: File) => {
        const fileURL = URL.createObjectURL(file)

        const newFile: UploadFile = {
            uid: Date.now().toString(),
            name: file.name,
            status: 'done',
            url: fileURL,
            originFileObj: file as any,
        }
        setFileList([newFile])
        return false
    }

    const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1))
    }

    // function chuyển URL thàng File object
    // const url = getMinioUrl("mta/avatar/2025-04-25/AZZrsTrpcAC/tYMsebjNMw==.jpg");
    // console.log("url", url);
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm mới giảng viên'}
            className="w-[50vw]"
        >
            <Row gutter={[40, 0]}>
                <Col span={8}>
                    <div
                        style={{
                            transform: 'scale(1.5)',
                            transformOrigin: 'top left',
                            fontSize: '0.65rem',
                        }}
                    >
                        <Form.Item name={'file'} className="mb-0">
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onChange={onChange}
                                beforeUpload={beforeUpload}
                                onRemove={() => {
                                    setFileList([])
                                    return true
                                }}
                            >
                                {fileList.length < 1 && (
                                    <p style={{ fontSize: '0.65rem' }}>
                                        + Tải ảnh lên
                                    </p>
                                )}
                            </Upload>
                        </Form.Item>
                    </div>
                </Col>
                <Col span={16}>
                    <Row gutter={[10, 0]}>
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
                            <FormItem
                                form={form}
                                name="firstName"
                                label="Tên"
                                required
                            >
                                <Input placeholder="Nhập tên" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="code"
                                label="Mã"
                                required
                            >
                                <Input placeholder="Nhập mã" />
                            </FormItem>
                        </Col>

                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="dateOfBirth"
                                label="Ngày sinh"
                                required
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date > dayjs().endOf('day')
                                    }
                                />
                            </FormItem>
                        </Col>
                    </Row>
                </Col>
            </Row>

            <Col span={12}>
                <FormItem
                    form={form}
                    name="officerNumber"
                    label="SHSQ/SHQN"
                    required
                >
                    <Input placeholder="Nhập số hiệu sĩ quan / số hiệu quân nhân" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="homeTown" label="Quê quán" required>
                    <Input placeholder="Nhập quê quán" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    name="organizationId"
                    label="Chọn đơn vị"
                    required
                >
                    {/* <TreeSelect
                        placeholder="Chọn đơn vị"
                        treeData={convertToTreeSelect(organizations || [])}
                    /> */}
                    <Select
                        placeholder="Chọn đơn vị"
                        options={organizations.map((value) => {
                            return {
                                label: value.name,
                                value: value.id,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="gender" label="Giới tính" required>
                    <Select
                        placeholder="Chọn giới tính"
                        options={GENDER_LIST.map((i) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>

            <Col span={8}>
                <FormItem
                    form={form}
                    name="academicRankTypeId"
                    label="Học hàm"
                    required
                >
                    <Select
                        placeholder="Chọn học hàm"
                        options={academicRankTypes.map((item) => ({
                            value: item.id,
                            label: item.name,
                        }))}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="academicRankDate"
                    label="Năm học hàm"
                    required
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        className="w-full"
                        disabledDate={(date) =>
                            date && date > dayjs().endOf('day')
                        }
                    />
                </FormItem>
            </Col>

            <Col span={8}>
                <FormItem
                    form={form}
                    name="academicDegreeTypeId"
                    label="Học vị"
                    required
                >
                    <Select
                        placeholder="Chọn học vị"
                        options={academicDegreeTypes.map((item) => ({
                            value: item.id,
                            label: item.name,
                        }))}
                    />
                </FormItem>
            </Col>

            <Col span={8}>
                <FormItem
                    form={form}
                    name="academicDegreeDate"
                    label="Năm học vị"
                    required
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        className="w-full"
                        disabledDate={(date) =>
                            date && date > dayjs().endOf('day')
                        }
                    />
                </FormItem>
            </Col>

            <Col span={8}>
                <FormItem
                    form={form}
                    name="staffPositionId"
                    label="Chức vụ"
                    required
                >
                    <Select
                        placeholder="Chọn chức vụ"
                        options={staffPositions.map((position) => ({
                            value: position.id, // Lấy id của staffPosition
                            label: position.name, // Hiển thị tên chức vụ
                        }))}
                    />
                </FormItem>
            </Col>

            {/* <Col span={8}>
                <FormItem
                    form={form}
                    name="positionName"
                    label="Năm chức vụ"
                    required
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        className="w-full"
                        disabledDate={(date) =>
                            date && date > dayjs().endOf('day')
                        }
                    />
                </FormItem>
            </Col> */}

            <Col span={8}>
                <FormItem
                    form={form}
                    name="rankId"
                    label="Cấp bậc hàm"
                    required
                >
                    <Select
                        placeholder="Chọn cấp bậc hàm"
                        options={ranks.map((item) => ({
                            value: item.id,
                            label: item.name,
                        }))}
                    />
                </FormItem>
            </Col>

            <Col span={8}>
                <FormItem
                    form={form}
                    name="rankDate"
                    label="Năm cấp bậc"
                    required
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        className="w-full"
                        disabledDate={(date) =>
                            date && date > dayjs().endOf('day')
                        }
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default AddUserProfileLecture
