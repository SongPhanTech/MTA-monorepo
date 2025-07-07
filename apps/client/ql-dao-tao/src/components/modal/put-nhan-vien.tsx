import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { $Enums } from '@workspace/db'
import {
    useCreateStaff,
    useCreateUserProfile,
    useFindManyUserProfile,
    useFindUniqueStaff,
    useUpdateStaff,
    useUpdateUserProfile,
    useUpsertUserProfile,
} from '@workspace/db/hooks'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import { Col, Form, message, Row, Tabs, type UploadFile } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { getMinioUrl } from '@workspace/constant'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import KeKhaiTaiSanTab from './quan-ly-ho-so/tabs/ke-khai-tai-san'
import KhenThuongKyLuatTab from './quan-ly-ho-so/tabs/khen-thuong-ky-luat'
import ThanNhanTab from './quan-ly-ho-so/tabs/tab-danh-sach-than-nhan'
import DoiTuongChinhSachTab from './quan-ly-ho-so/tabs/tab-doi-tuong-chinh-sach'
import HocHamHocViTab from './quan-ly-ho-so/tabs/tab-hoc-ham-hoc-vi'
import QuaTrinhCongTacTab from './quan-ly-ho-so/tabs/tab-qua-trinh-cong-tac'
import ThongTinCaNhanTab from './quan-ly-ho-so/tabs/tab-thong-tin-ca-nhan'
import TrinhDoChungChiTab from './quan-ly-ho-so/tabs/tab-trinh-do-chung-chi'
// import SidebarMenu from './quan-ly-ho-so/sidebar-menu'
// import TabQuanLyHoSo from './quan-ly-ho-so/tabs'
import type { PutStaffProfile, StaffProfileType, UserProfileType } from './quan-ly-ho-so/type'

dayjs.locale('vi')
// export type PutUserProfile = UserProfile;
export interface PutUserProfileLectureProps {
    id: string | null
}

const PutUserProfileStaffModal = () => {
    const [form] = Form.useForm<PutStaffProfile>()

    const [activeKey, setActiveKey] = useState<string>('1')
    const [avatar, setAvatar] = useState<UploadFile[]>([])

    const { isOpen, onClose, input } = useDisclosure<PutUserProfileLectureProps>({
        tag: PutUserProfileStaffModal.name,
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

    const { data: staffData } = useFindUniqueStaff(
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
                staffType: true,
                staffPosition: true,
                fixedClass: true,
            },
        },
        {
            enabled: !!id,
        }
    )

    const { mutateAsync: updateStaff } = useUpdateStaff()
    const { mutateAsync: createStaff } = useCreateStaff()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    const { mutateAsync: createUserProfile } = useCreateUserProfile()
    const { mutateAsync: upsertUserProfile } = useUpsertUserProfile()
    const { data = [] } = useFindManyUserProfile({
        where: {
            userType: $Enums.UserType.STAFF,
            staffs: {
                deletedAt: null, // Staff chưa bị xóa
            },
        },
        select: {
            idCardNumber: true,
        },
    })

    const buildUserProfileUpdateData = (output: UserProfileType, fileName?: string) => ({
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
        userType: $Enums.UserType.STAFF,

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

    const buildUserProfileCreateData = (output: UserProfileType, fileName?: string) => ({
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
        userType: $Enums.UserType.STAFF,

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

    const buildStaffUpdateData = (output: StaffProfileType) => ({
        code: output.code,
        organizationId: output.organizationId,
        staffTypeId: output.staffTypeId,
        staffPositionId: output.staffPositionId,
    })

    const buildStaffCreateData = (output: StaffProfileType, userProfileId: string) => ({
        ...buildStaffUpdateData(output),
        userProfileId,
    })

    async function onOk(output?: PutStaffProfile) {
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
            const staffUpdateData = buildStaffUpdateData(output)

            if (id) {
                const promises = []

                if (staffData?.userProfile?.id) {
                    promises.push(
                        updateUserProfile({
                            data: userProfileData,
                            where: {
                                id: staffData?.userProfile?.id,
                            },
                        })
                    )
                }

                promises.push(
                    updateStaff({
                        data: staffUpdateData,
                        where: {
                            id,
                        },
                    })
                )

                message.success('Cập nhật cán bộ thành công')
            } else {
                if (data.some((item) => item.idCardNumber === output.idCardNumber)) {
                    const userProfile = await upsertUserProfile({
                        where: {
                            idCardNumber: output.idCardNumber,
                        },
                        create: userProfileCreateData,
                        update: userProfileData,
                    })

                    await updateStaff({
                        data: staffUpdateData,
                        where: {
                            userProfileId: userProfile?.id,
                        },
                    })

                    message.success('Cập nhật nhân viên thành công')
                } else {
                    const userProfile = await createUserProfile({
                        data: userProfileCreateData,
                    })

                    if (!userProfile?.id) {
                        throw new Error('Tạo hồ sơ người dùng thất bại')
                    }

                    const staffCreateData = buildStaffCreateData(output, userProfile?.id)

                    await createStaff({ data: staffCreateData })

                    message.success('Thêm mới cán bộ thành công')
                }
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Staff'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const tabsData = useMemo(() => {
        return [
            {
                key: '1',
                label: 'Thông tin cán bộ',
                children: (
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <ThongTinCaNhanTab
                                avatar={avatar}
                                setAvatar={setAvatar}
                                id={id}
                                type={'LECTURER'}
                            />
                        </Col>
                    </Row>
                ),
            },
            {
                key: '2',
                label: 'Học hàm, học vị',
                children: <HocHamHocViTab />,
                forceRender: true,
            },
            {
                key: '3',
                label: 'Trình độ, chứng chỉ',
                children: <TrinhDoChungChiTab />,
                forceRender: true,
            },
            {
                key: '4',
                label: 'Quá trình công tác',
                children: <QuaTrinhCongTacTab />,
                forceRender: true,
            },
            {
                key: '6',
                label: 'Khen thưởng - kỷ luật',
                children: <KhenThuongKyLuatTab />,
                forceRender: true,
            },
            {
                key: '7',
                label: 'Đối tượng chính sách',
                children: <DoiTuongChinhSachTab />,
                forceRender: true,
            },
            {
                key: '8',
                label: 'Kê khai tài sản',
                children: <KeKhaiTaiSanTab />,
                forceRender: true,
            },
            {
                key: '9',
                label: 'Thân nhân',
                children: <ThanNhanTab />,
                forceRender: true,
            },
        ]
    }, [avatar, id])

    // const difference = (
    //     object: Record<PropertyKey, unknown>,
    //     base: Record<PropertyKey, unknown>
    // ) => _.pickBy(object, (v, k) => !_.isEqual(base[k], v))

    // SỬA: Cập nhật useEffect để fill đầy đủ các trường
    useEffect(() => {
        if (staffData?.userProfile && id) {
            const userProfile = staffData.userProfile
            const staff = staffData
            const formData = {
                code: staff.code ?? undefined,
                organizationId: staff.organizationId,
                staffTypeId: staff.staffTypeId,
                staffPositionId: staff.staffPositionId,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                healthInsuranceNumber: userProfile.healthInsuranceNumber,
                bankAccountNumber: userProfile.bankAccountNumber,
                bankName: userProfile.bankName,

                dateOfBirth: userProfile.dateOfBirth ? dayjs(userProfile.dateOfBirth) : undefined,

                placeOfBirth: userProfile.placeOfBirth,
                avatar: userProfile.avatar,
                homeTown: userProfile.homeTown,
                idCardNumber: userProfile.idCardNumber,

                idCardDate: userProfile.idCardDate ? dayjs(userProfile.idCardDate) : undefined,

                officerNumber: userProfile.officerNumber,
                gender: userProfile.gender,
                permanentAddress: userProfile.permanentAddress,
                temporaryAddress: userProfile.temporaryAddress,
                contactAddress: userProfile.contactAddress,
                phoneNumber: userProfile.phoneNumber,
                email: userProfile.email,
                familyPhone: userProfile.familyPhone,
                familyName: userProfile.familyName,

                unionDate: userProfile.unionDate ? dayjs(userProfile.unionDate) : undefined,

                unionPlace: userProfile.unionPlace,

                CPVJoinDate: userProfile.CPVJoinDate ? dayjs(userProfile.CPVJoinDate) : undefined,

                officialCPVDate: userProfile.officialCPVDate
                    ? dayjs(userProfile.officialCPVDate)
                    : undefined,

                CPVJoinPlace: userProfile.CPVJoinPlace,

                tenureDate: userProfile.tenureDate ? dayjs(userProfile.tenureDate) : undefined,

                enlistmentDate: userProfile.enlistmentDate
                    ? dayjs(userProfile.enlistmentDate)
                    : undefined,

                dischargeDate: userProfile.dischargeDate
                    ? dayjs(userProfile.dischargeDate)
                    : undefined,

                // Relations IDs
                nationalityId: userProfile.nationality?.Id,
                religionId: userProfile.religion?.Id,
                ethnicityId: userProfile.ethnicity?.Id,
                rankId: userProfile.rank?.Id,
                levelId: userProfile.level?.Id,
                academicDegreeTypeId: userProfile.academicDegreeType?.Id,
                academicRankTypeId: userProfile.academicRankType?.Id,

                rankDate: userProfile.rankDate ? dayjs(userProfile.rankDate) : undefined,

                academicRankDate: userProfile.academicRankDate
                    ? dayjs(userProfile.academicRankDate)
                    : undefined,

                academicDegreeDate: userProfile.academicDegreeDate
                    ? dayjs(userProfile.academicDegreeDate)
                    : undefined,
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
    }, [staffData, form, id])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa cán bộ' : 'Thêm mới cán bộ'}
            className="w-[90vw]"
            layout="vertical"
            // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
            // wrapperCol={{ span: 16 }} // input chiếm 18 cột
        >
            <Col span={24}>
                <Tabs className="w-full" items={tabsData} />
            </Col>
        </PutFormModal>
    )
}

export default PutUserProfileStaffModal
