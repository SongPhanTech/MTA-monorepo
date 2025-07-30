import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import { buildOrgTree } from '@lib/utils'
import type { $Enums } from '@workspace/db'
import {
    useFindManyDM_DonVi,
    useFindManyLecturerType,
    useFindManyStaffPosition,
    useFindManyStaffType,
    useFindManyUserProfile,
    useFindUniqueUserProfile,
} from '@workspace/db/hooks'
import { Col, Collapse, Form, Input, Row, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo } from 'react'
import type { PutModalType } from '../type'

const { Panel } = Collapse

export default function ThongTinCaNhanTab({
    id,
    type,
}: {
    id?: string | null
    type: $Enums.UserType
}) {
    const form = Form.useFormInstance<PutModalType>()

    // Hook để lấy danh sách UserProfile để làm options cho AutoComplete
    const { data: userProfileOptions = [] } = useFindManyUserProfile({
        where: {
            educationAndTraining: type.includes('STUDENT')
                ? {
                      some: {
                          deletedAt: null, // Thêm điều kiện không bị xóa
                          trainingObjectType: {
                              type: type.includes('CIVILIAN')
                                  ? {
                                        in: ['CIVILIAN'],
                                    }
                                  : {
                                        notIn: ['CIVILIAN'],
                                    },
                          },
                      },
                  }
                : undefined,
            // LECTURER type - kiểm tra lecturer không bị xóa
            lecturer:
                type === 'LECTURER'
                    ? {
                          deletedAt: null, // Thêm điều kiện không bị xóa
                      }
                    : undefined,

            // STAFF type - kiểm tra staffs không bị xóa
            staffs:
                type === 'STAFF'
                    ? {
                          deletedAt: null, // Thêm điều kiện không bị xóa
                      }
                    : undefined,
        },
        select: {
            firstName: true,
            lastName: true,
            idCardNumber: true,
        },
    })

    // Tạo options cho AutoComplete
    const idCardOptions = useMemo(() => {
        return userProfileOptions.map((profile) => ({
            value: profile.idCardNumber,
            label: `${profile.idCardNumber} - ${profile.lastName} ${profile.firstName}`,
        }))
    }, [userProfileOptions])

    const { data: staffPositionData = [] } = useFindManyStaffPosition()

    const { data: staffTypeData = [] } = useFindManyStaffType()

    const { data: manageOrgData = [] } = useFindManyDM_DonVi()

    const { data: lecturerTypeData = [] } = useFindManyLecturerType()

    const treeData = buildOrgTree(manageOrgData)
    // Thêm useMemo và watch fields
    const idCardNumber = Form.useWatch('idCardNumber', form)

    const { data: cccdUserProfileData } = useFindUniqueUserProfile(
        {
            where: {
                idCardNumber: idCardNumber,
            },
            include: {
                provinceCurrentAddress: true,
                communeCurrentAddress: true,
                provinceOfBirth: true,
                communeOfBirth: true,
                provinceHometown: true,
                communeHometown: true,
                nationality: true,
                religion: true,
                ethnicity: true,
                rank: true,
                academicDegreeType: true,
                academicRankType: true,
                level: true,
                educationAndTraining: type.includes('STUDENT')
                    ? {
                          include: {
                              fixedClass: {
                                  include: {
                                      trainingCourse: true,
                                      curriculumVersion: {
                                          include: {
                                              curriculum: {
                                                  include: {
                                                      trainingMajor: true,
                                                  },
                                              },
                                          },
                                      },
                                  },
                              },
                          },
                      }
                    : false,
                staffs:
                    type === 'STAFF'
                        ? {
                              include: {
                                  organization: true,
                                  staffType: true,
                                  staffPosition: true,
                              },
                          }
                        : false,
                lecturer:
                    type === 'LECTURER'
                        ? {
                              include: {
                                  organization: true,
                                  lecturerType: true,
                              },
                          }
                        : false,
            },
        },
        {
            enabled: !!idCardNumber,
        }
    )

    // Hàm fill thông tin từ dữ liệu cccdUserProfileData
    const fillUserInfo = useCallback(
        (userData: any) => {
            if (!userData) return

            // Fill thông tin cơ bản từ UserProfile
            form.setFieldsValue({
                firstName: userData.firstName,
                lastName: userData.lastName,
                dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : null,
                // gender: userData.gender,
                phoneNumber: userData.phoneNumber,
                email: userData.email,
                idCardDate: userData.idCardDate ? dayjs(userData.idCardDate) : null,
                officerNumber: userData.officerNumber,
                healthInsuranceNumber: userData.healthInsuranceNumber,
                bankAccountNumber: userData.bankAccountNumber,
                bankName: userData.bankName,
                currentAddress: userData.currentAddress,

                // Địa chỉ
                provinceCurrentAddressId: userData.provinceCurrentAddressId,
                communeCurrentAddressId: userData.communeCurrentAddressId,
                provinceOfBirthId: userData.provinceOfBirthId,
                communeOfBirthId: userData.communeOfBirthId,
                provincePermanentAddressId: userData.provincePermanentAddressId,
                communePermanentAddressId: userData.communePermanentAddressId,
                provinceHometownId: userData.provinceHometownId,
                communeHometownId: userData.communeHometownId,

                // Thông tin cá nhân khác
                nationalityId: userData.nationalityId,
                religionId: userData.religionId,
                ethnicityId: userData.ethnicityId,
                unionDate: userData.unionDate ? dayjs(userData.unionDate) : null,
                unionPlace: userData.unionPlace,
                CPVJoinDate: userData.CPVJoinDate ? dayjs(userData.CPVJoinDate) : null,
                officialCPVDate: userData.officialCPVDate ? dayjs(userData.officialCPVDate) : null,
                CPVJoinPlace: userData.CPVJoinPlace,
                tenureDate: userData.tenureDate ? dayjs(userData.tenureDate) : null,
            })

            // Fill thông tin Lecturer
            if (type === 'LECTURER' && userData.lecturer) {
                const lecturer = userData.lecturer
                form.setFieldsValue({
                    organizationId: lecturer.organizationId,
                })
            }

            // Fill thông tin Staff
            if (type === 'STAFF' && userData.staffs) {
                const staff = userData.staffs
                form.setFieldsValue({
                    organizationId: staff.organizationId,
                })
            }
        },
        [form, type]
    )

    // Effect để fill thông tin khi có dữ liệu từ API
    useEffect(() => {
        if (cccdUserProfileData && !id) {
            fillUserInfo(cccdUserProfileData)
            // setUserSelected?.(cccdUserProfileData)
        }
    }, [cccdUserProfileData, fillUserInfo, id])

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Row gutter={[10, 10]}>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="idCardNumber"
                            label="Số CCCD"
                            className="mb-0"
                            required
                        >
                            <Select
                                maxTagCount={'responsive'}
                                placeholder="Chọn phiên bản ngân hàng câu hỏi"
                                options={idCardOptions}
                            />
                        </FormItem>
                    </Col>
                    {type === 'LECTURER' && (
                        <Col sm={12} lg={12}>
                            <FormItem
                                form={form}
                                name="code"
                                label="Mã giảng viên"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mã giảng viên',
                                    },
                                ]}
                                className="mb-0"
                            >
                                <Input placeholder="Nhập mã giảng viên" />
                            </FormItem>
                        </Col>
                    )}

                    {type === 'STAFF' && (
                        <Col sm={12} lg={12}>
                            <FormItem
                                form={form}
                                name="code"
                                label="Mã cán bộ"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mã cán bộ',
                                    },
                                ]}
                                className="mb-0"
                            >
                                <Input placeholder="Nhập mã cán bộ" />
                            </FormItem>
                        </Col>
                    )}

                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="lastName"
                            label="Họ và tên đệm"
                            required
                            className="mb-0"
                        >
                            <Input disabled placeholder="Nhập họ và tên đệm" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem
                            form={form}
                            name="firstName"
                            label="Tên"
                            required
                            className="mb-0"
                        >
                            <Input disabled placeholder="Nhập tên" />
                        </FormItem>
                    </Col>
                </Row>
            </Col>
            {type === 'LECTURER' && (
                <>
                    <Col span={12}>
                        <FormItem form={form} name="organizationId" label="Đơn vị" className="mb-0">
                            <TreeSelect
                                disabled
                                allowClear
                                showSearch
                                placeholder="Chọn đơn vị quản lý"
                                treeDefaultExpandAll
                                treeData={treeData}
                                filterTreeNode={(input, node) =>
                                    (node.label as string)
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="lecturerTypeId"
                            label="Loại giảng viên"
                            className="mb-0"
                        >
                            <Select
                                placeholder="Chọn loại giảng viên"
                                options={lecturerTypeData.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                </>
            )}

            {type === 'STAFF' && (
                <>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="staffTypeId"
                            label="Loại cán bộ"
                            className="mb-0"
                        >
                            <Select
                                placeholder="Chọn loại cán bộ"
                                options={staffTypeData.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="staffPositionId"
                            label="Chức vụ cán bộ"
                            className="mb-0"
                        >
                            <Select
                                placeholder="Chọn loại cán bộ"
                                options={staffPositionData.map((i) => ({
                                    value: i.id,
                                    label: i.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                </>
            )}
        </Row>
    )
}
