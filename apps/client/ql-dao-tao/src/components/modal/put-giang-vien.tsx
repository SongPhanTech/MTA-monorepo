import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { $Enums, type Prisma, type UserProfile } from '@workspace/db'
import {
    useCreateLecturer,
    useCreateUserProfile,
    useFindManyUserProfile,
    useFindUniqueLecturer,
    useUpdateLecturer,
    useUpdateUserProfile,
    useUpsertUserProfile,
} from '@workspace/db/hooks'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import { Col, Form, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { getMinioUrl } from '@workspace/constant'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import SidebarMenu from './quan-ly-ho-so/sidebar-menu'
import TabQuanLyHoSo from './quan-ly-ho-so/tabs'
import type { LecturerProfileType, PutLecturerProfile, UserProfileType } from './quan-ly-ho-so/type'
import { tabs } from './quan-ly-ho-so/type'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

dayjs.locale('vi')
// export type PutUserProfile = UserProfile;
export type PutUserProfile = UserProfile & {
    file: FileType
    organizationId?: string
    lecturerTypeId?: string
}
export interface PutUserProfileLectureProps {
    id: string | null
}

const PutUserProfileLectureModal = () => {
    const [form] = Form.useForm<PutLecturerProfile>()

    const [activeKey, setActiveKey] = useState<string>('1')
    const [avatar, setAvatar] = useState<UploadFile[]>([])

    const { isOpen, onClose, input } = useDisclosure<PutUserProfileLectureProps>({
        tag: PutUserProfileLectureModal.name,
        onClose: form.resetFields,
    })

    // const {
    //     onOpen: onOpenModalOganizationUser,
    //     onClose: onCloseModalOganizationUser,
    // } = useDisclosure<PutOrganizationUserProps>({
    //     tag: PutOrganizationUser.name,
    // })

    const { id } = input ?? { id: null }
    const { showSpinner, hideSpinner } = useSpinner()

    // const { data: lecturerTypeData = [] } = useFindManyLecturerType()

    const { data: lecturerData } = useFindUniqueLecturer(
        {
            where: {
                id: id ?? undefined,
            },
            include: {
                userProfile: {
                    include: {
                        academicDegreeType: true,
                        academicRankType: true,
                        rank: true,
                        nationality: true,
                        religion: true,
                        ethnicity: true,
                        level: true,
                    },
                },
                organization: true,
                lecturerType: true,
            },
        },
        {
            enabled: !!id,
        }
    )

    // const {
    //     data: organizationUserData = [],
    //     refetch: refetchOrganizationUser,
    // } = useFindManyDM_DonViUser({
    //     where: {
    //         userProfileId: id || undefined,
    //     },
    // })

    const { mutateAsync: updateLecturer } = useUpdateLecturer()
    const { mutateAsync: createLecturer } = useCreateLecturer()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    const { mutateAsync: createUserProfile } = useCreateUserProfile()
    const { mutateAsync: upsertUserProfile } = useUpsertUserProfile()
    const { data = [] } = useFindManyUserProfile({
        where: {
            userType: $Enums.UserType.LECTURER,
            lecturer: {
                deletedAt: null, // Lecturer chưa bị xóa
            },
        },
        select: {
            idCardNumber: true,
        },
    })

    const buildUserProfileUpdateData = (
        output: UserProfileType,
        fileName?: string
    ): Prisma.UserProfileUpdateInput => ({
        code: output.code,
        avatar: fileName || undefined,
        firstName: output.firstName,
        lastName: output.lastName,
        dateOfBirth: output.dateOfBirth,
        placeOfBirth: output.placeOfBirth,
        homeTown: output.homeTown,
        idCardNumber: output.idCardNumber,
        idCardDate: output.idCardDate,
        officerNumber: output.officerNumber,
        gender: output.gender,
        permanentAddress: output.permanentAddress,
        temporaryAddress: output.temporaryAddress,
        contactAddress: output.contactAddress,
        phoneNumber: output.phoneNumber,
        email: output.email,
        familyPhone: output.familyPhone,
        familyName: output.familyName,
        unionDate: output.unionDate,
        unionPlace: output.unionPlace,
        CPVJoinDate: output.CPVJoinDate,
        officialCPVDate: output.officialCPVDate,
        CPVJoinPlace: output.CPVJoinPlace,
        tenureDate: output.tenureDate,
        enlistmentDate: output.enlistmentDate,
        dischargeDate: output.dischargeDate,
        rankDate: output.rankDate,
        academicRankDate: output.academicRankDate,
        academicDegreeDate: output.academicDegreeDate,
        bankAccountNumber: output.bankAccountNumber,
        bankName: output.bankName,
        healthInsuranceNumber: output.healthInsuranceNumber,
        userType: $Enums.UserType.LECTURER,

        // Quan hệ dạng connect
        ...(output.nationalityId && {
            nationality: { connect: { Id: output.nationalityId } },
        }),
        ...(output.religionId && {
            religion: { connect: { Id: output.religionId } },
        }),
        ...(output.ethnicityId && {
            ethnicity: { connect: { Id: output.ethnicityId } },
        }),
        ...(output.rankId && {
            rank: { connect: { Id: output.rankId } },
        }),
        ...(output.levelId && {
            level: { connect: { Id: output.levelId } },
        }),
        ...(output.academicDegreeTypeId && {
            academicDegreeType: {
                connect: { Id: output.academicDegreeTypeId },
            },
        }),
        ...(output.academicRankTypeId && {
            academicRankType: { connect: { Id: output.academicRankTypeId } },
        }),
    })

    const buildUserProfileCreateData = (
        output: UserProfileType,
        fileName?: string
    ): Prisma.UserProfileCreateInput => ({
        code: output.code,
        avatar: fileName || undefined,
        firstName: output.firstName,
        lastName: output.lastName,
        dateOfBirth: output.dateOfBirth,
        placeOfBirth: output.placeOfBirth,
        homeTown: output.homeTown,
        idCardNumber: output.idCardNumber,
        idCardDate: output.idCardDate,
        officerNumber: output.officerNumber,
        gender: output.gender,
        permanentAddress: output.permanentAddress,
        temporaryAddress: output.temporaryAddress,
        contactAddress: output.contactAddress,
        phoneNumber: output.phoneNumber,
        email: output.email,
        familyPhone: output.familyPhone,
        familyName: output.familyName,
        unionDate: output.unionDate,
        unionPlace: output.unionPlace,
        CPVJoinDate: output.CPVJoinDate,
        officialCPVDate: output.officialCPVDate,
        CPVJoinPlace: output.CPVJoinPlace,
        tenureDate: output.tenureDate,
        enlistmentDate: output.enlistmentDate,
        dischargeDate: output.dischargeDate,
        rankDate: output.rankDate,
        academicRankDate: output.academicRankDate,
        academicDegreeDate: output.academicDegreeDate,
        bankAccountNumber: output.bankAccountNumber,
        bankName: output.bankName,
        healthInsuranceNumber: output.healthInsuranceNumber,
        userType: $Enums.UserType.LECTURER,

        // Quan hệ dạng connect
        ...(output.nationalityId && {
            nationality: { connect: { Id: output.nationalityId } },
        }),
        ...(output.religionId && {
            religion: { connect: { Id: output.religionId } },
        }),
        ...(output.ethnicityId && {
            ethnicity: { connect: { Id: output.ethnicityId } },
        }),
        ...(output.rankId && {
            rank: { connect: { Id: output.rankId } },
        }),
        ...(output.levelId && {
            level: { connect: { Id: output.levelId } },
        }),
        ...(output.academicDegreeTypeId && {
            academicDegreeType: {
                connect: { Id: output.academicDegreeTypeId },
            },
        }),
        ...(output.academicRankTypeId && {
            academicRankType: { connect: { Id: output.academicRankTypeId } },
        }),
    })

    const buildLecturerUpdateData = (output: LecturerProfileType): Prisma.LecturerUpdateInput => ({
        code: output.code,
        ...(output.organizationId && {
            organization: { connect: { Id: output.organizationId } },
        }),
        ...(output.lecturerTypeId && {
            lecturerType: { connect: { id: output.lecturerTypeId } },
        }),
    })

    const buildLecturerCreateData = (
        output: LecturerProfileType,
        userProfileId: string
    ): Prisma.LecturerCreateInput => ({
        code: output.code,
        userProfile: { connect: { id: userProfileId } },
        organization: { connect: { Id: output.organizationId } },
        lecturerType: { connect: { id: output.lecturerTypeId } },
    })

    async function onOk(output?: PutLecturerProfile) {
        if (!output) return
        let fileName = output.avatar
        if (output.file) {
            const resPresignedUrl = await generatePresignedUrl({
                path: 'avatar',
                extension: output.file.fileList?.[0]?.name?.split('.').pop() ?? '',
            })

            await fetch(resPresignedUrl.data.url, {
                method: 'PUT',
                body: output.file.fileList?.[0]?.originFileObj,
            })

            fileName = resPresignedUrl.data.fileName
        }

        try {
            showSpinner()

            const userProfileData = buildUserProfileUpdateData(output, fileName ?? undefined)

            const userProfileCreateData = buildUserProfileCreateData(output, fileName ?? undefined)

            const lecturerDataUpdate = buildLecturerUpdateData(output)

            if (id) {
                // UPDATE MODE
                const promises = []

                if (lecturerData?.userProfile?.id) {
                    promises.push(
                        updateUserProfile({
                            data: userProfileData,
                            where: {
                                id: lecturerData.userProfile.id,
                            },
                        })
                    )
                }

                promises.push(
                    updateLecturer({
                        data: lecturerDataUpdate,
                        where: { id },
                    })
                )

                await Promise.all(promises)
                message.success('Cập nhật giảng viên thành công')
            } else {
                // CREATE MODE - sử dụng upsert
                if (data.some((item) => item.idCardNumber === output.idCardNumber)) {
                    // Sử dụng upsert để create hoặc update UserProfile
                    const userProfile = await upsertUserProfile({
                        where: {
                            idCardNumber: output.idCardNumber,
                        },
                        create: userProfileCreateData,
                        update: userProfileData,
                    })

                    const lecturerUpdateData = buildLecturerUpdateData(output)

                    await updateLecturer({
                        data: lecturerUpdateData,
                        where: {
                            userProfileId: userProfile?.id,
                        },
                    })

                    message.success('Cập nhật giảng viên thành công')
                } else {
                    // Nếu không có CCCD thì tạo mới
                    const userProfile = await createUserProfile({
                        data: userProfileCreateData,
                    })

                    if (!userProfile?.id) {
                        throw new Error('Tạo hồ sơ người dùng thất bại')
                    }

                    const lecturerCreateData = buildLecturerCreateData(output, userProfile.id)

                    await createLecturer({ data: lecturerCreateData })

                    message.success('Thêm mới giảng viên thành công')
                }
            }

            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Lecturer'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    // const difference = (
    //     object: Record<PropertyKey, unknown>,
    //     base: Record<PropertyKey, unknown>
    // ) => _.pickBy(object, (v, k) => !_.isEqual(base[k], v))

    // SỬA: Cập nhật useEffect để fill đầy đủ các trường
    useEffect(() => {
        if (lecturerData?.userProfile && id) {
            const userProfile = lecturerData.userProfile
            const lecturer = lecturerData

            const formData = {
                // Thông tin từ Lecturer
                code: lecturer.code,
                organizationId: lecturer.organizationId,
                lecturerTypeId: lecturer.lecturerTypeId,

                // Thông tin cơ bản từ UserProfile
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                dateOfBirth: userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth) : null,
                placeOfBirth: userProfile.placeOfBirth,
                homeTown: userProfile.homeTown,
                idCardNumber: userProfile.idCardNumber,
                idCardDate: userProfile.idCardDate ? dayjs(userProfile.idCardDate) : null,
                officerNumber: userProfile.officerNumber,
                healthInsuranceNumber: userProfile.healthInsuranceNumber,
                bankAccountNumber: userProfile.bankAccountNumber,
                bankName: userProfile.bankName,
                gender: userProfile.gender,
                permanentAddress: userProfile.permanentAddress,
                temporaryAddress: userProfile.temporaryAddress,
                contactAddress: userProfile.contactAddress,
                phoneNumber: userProfile.phoneNumber,
                email: userProfile.email,
                familyPhone: userProfile.familyPhone,
                familyName: userProfile.familyName,

                // Thông tin Đoàn/Đảng/Nhập ngũ
                unionDate: userProfile.unionDate ? dayjs(userProfile.unionDate) : null,
                unionPlace: userProfile.unionPlace,
                CPVJoinDate: userProfile.CPVJoinDate ? dayjs(userProfile.CPVJoinDate) : null,
                officialCPVDate: userProfile.officialCPVDate
                    ? dayjs(userProfile.officialCPVDate)
                    : null,
                CPVJoinPlace: userProfile.CPVJoinPlace,
                tenureDate: userProfile.tenureDate ? dayjs(userProfile.tenureDate) : null,
                enlistmentDate: userProfile.enlistmentDate
                    ? dayjs(userProfile.enlistmentDate)
                    : null,
                dischargeDate: userProfile.dischargeDate ? dayjs(userProfile.dischargeDate) : null,

                // Relations IDs
                nationalityId: userProfile.nationalityId,
                religionId: userProfile.religionId,
                ethnicityId: userProfile.ethnicityId,
                rankId: userProfile.rankId,
                levelId: userProfile.levelId,
                academicDegreeTypeId: userProfile.academicDegreeTypeId,
                academicRankTypeId: userProfile.academicRankTypeId,

                // Lịch sử - Dates
                rankDate: userProfile.rankDate ? dayjs(userProfile.rankDate) : null,
                academicRankDate: userProfile.academicRankDate
                    ? dayjs(userProfile.academicRankDate)
                    : null,
                academicDegreeDate: userProfile.academicDegreeDate
                    ? dayjs(userProfile.academicDegreeDate)
                    : null,
            }

            form.setFieldsValue(formData)

            if (userProfile?.avatar) {
                setAvatar([
                    {
                        uid: '-1',
                        name: 'avatar.png',
                        status: 'done',
                        url: getMinioUrl(userProfile.avatar),
                    },
                ])
            }
        }
    }, [lecturerData, form, id])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa giảng viên' : 'Thêm mới giảng viên'}
            className="w-[90vw]"
            layout="vertical"
            // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
            // wrapperCol={{ span: 16 }} // input chiếm 18 cột
        >
            <Col xs={24} md={5}>
                <SidebarMenu tabs={tabs} activeKey={activeKey} setActiveKey={setActiveKey} />
            </Col>

            <Col xs={24} md={19}>
                <TabQuanLyHoSo
                    activeKey={activeKey}
                    setActiveKey={setActiveKey}
                    type="LECTURER"
                    avatar={avatar}
                    setAvatar={setAvatar}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutUserProfileLectureModal
