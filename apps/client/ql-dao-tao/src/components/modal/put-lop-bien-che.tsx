import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { FixedClass, TrainingCourse, TrainingMajor, TrainingObjectType } from '@workspace/db'
import {
    useCreateFixedClass,
    useFindManyCurriculum,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManyStaff,
    useFindManyTrainingCourse,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
    useFindUniqueCurriculumVersion,
    useFindUniqueFixedClass,
    useUpdateFixedClass,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
export type PutFixedClass = FixedClass & {
    trainingObjectTypeId: string | null
    trainingMajorId: string | null
}
dayjs.locale('vi')
const PutFixedClassModal = () => {
    const [form] = Form.useForm<PutFixedClass>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: manageOrgData = [], refetch: refetchManageOrg } = useFindManyDM_DonVi()
    const TrainingCourseForm = Form.useWatch('trainingCourseId', form)

    // const managementOrganizationForm = Form.useWatch(
    //     'managementOrganizationId',
    //     form
    // )

    const trainingObjectTypeForm = Form.useWatch('trainingObjectTypeId', form)
    const curriculumVersionIdForm = Form.useWatch('curriculumVersionId', form)

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
            where: trainingObjectTypeForm
                ? {
                      trainingObjectTypeId: trainingObjectTypeForm || '',
                  }
                : {},
            orderBy: { name: 'asc' },
        })
    // const trainingMajorForm = Form.useWatch('trainingMajorId', form)
    const { data: curriculumData = [], refetch: refetchCurriculum } = useFindManyCurriculum({
        where: {},
        include: {
            curriculumVersion: {
                include: {
                    curriculum: {
                        include: {
                            trainingMajor: true,
                            managementOrganization: true,
                        },
                    },
                    fixedClasses: {
                        include: {
                            trainingCourse: true,
                        },
                    },
                    trainingObjectType: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    })
    const { data: lecturerData = [], refetch: refetchLecturer } = useFindManyLecturer({
        include: {
            userProfile: true,
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
    })

    const { data: staffData = [], refetch: refetchStaff } = useFindManyStaff({
        include: {
            userProfile: true,
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
    })

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType({
            where: {
                curriculumVersion: curriculumVersionIdForm
                    ? {
                          some: {
                              id: curriculumVersionIdForm ?? undefined,
                          },
                      }
                    : {},
            },
        })

    const { data: trainingMajorData = [], refetch: refetchManyTrainingField } =
        useFindManyTrainingMajor({
            where: {
                curriculum: {
                    some: {
                        curriculumVersion: {
                            some: {
                                id: curriculumVersionIdForm ?? undefined,
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        })
    const { data: curriculumVersionData } = useFindUniqueCurriculumVersion(
        {
            where: { id: curriculumVersionIdForm ?? undefined },
            include: {
                curriculum: {
                    include: {
                        trainingMajor: true,
                        managementOrganization: true,
                    },
                },
            },
        },
        {
            enabled: !!curriculumVersionIdForm,
        }
    )

    const { mutateAsync: createFixedClass } = useCreateFixedClass()
    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function onOk(output?: PutFixedClass) {
        if (!output) return
        try {
            showSpinner()
            const payload = {
                code: output.code,
                name: output.name,
                description: output.description,
                startYear: output.startYear,
                graduated: output.graduated,
                active: output.active,
                summary: output.summary,
                initSize: output.initSize,
            }
            if (id) {
                await updateFixedClass({
                    data: {
                        ...payload,
                        trainingCourse: output.trainingCourseId
                            ? {
                                  connect: {
                                      id: output.trainingCourseId,
                                  },
                              }
                            : { disconnect: true },
                        managementOrganization: output.managementOrganizationId
                            ? {
                                  connect: {
                                      Id: output.managementOrganizationId,
                                  },
                              }
                            : { disconnect: true },
                        curriculumVersion: output.curriculumVersionId
                            ? {
                                  connect: {
                                      id: output.curriculumVersionId,
                                  },
                              }
                            : { disconnect: true },
                        staffManagement: output.staffManagementId
                            ? {
                                  connect: {
                                      id: output.staffManagementId,
                                  },
                              }
                            : { disconnect: true },
                        lecturerManagement: output.lecturerManagementId
                            ? {
                                  connect: {
                                      id: output.lecturerManagementId,
                                  },
                              }
                            : { disconnect: true },
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createFixedClass({
                    data: {
                        ...payload,
                        trainingCourse: output.trainingCourseId
                            ? {
                                  connect: {
                                      id: output.trainingCourseId,
                                  },
                              }
                            : undefined,
                        managementOrganization: output.managementOrganizationId
                            ? {
                                  connect: {
                                      Id: output.managementOrganizationId,
                                  },
                              }
                            : undefined,
                        curriculumVersion: output.curriculumVersionId
                            ? {
                                  connect: {
                                      id: output.curriculumVersionId,
                                  },
                              }
                            : undefined,
                        staffManagement: output.staffManagementId
                            ? {
                                  connect: {
                                      id: output.staffManagementId,
                                  },
                              }
                            : undefined,
                        lecturerManagement: output.lecturerManagementId
                            ? {
                                  connect: {
                                      id: output.lecturerManagementId,
                                  },
                              }
                            : undefined,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['FixedClass'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const handleChangeField = async (field: string, val: string) => {
        try {
            form.setFieldsValue({
                [field]: null,
            })
        } catch (err) {
            message.error('Lỗi khi tải đối tượng đào tạo')
        }
    }

    const handleChangeFieldOrganization = async (field: string[], val: string) => {
        try {
            let newValue = {}
            for (const i of field) {
                newValue = { ...newValue, [i]: null }
            }
            form.setFieldsValue({
                ...newValue,
            })
        } catch (err) {
            message.error('Lỗi khi tải đối tượng đào tạo')
        }
    }

    const curriculumTreeData = curriculumData.map((i) => {
        return {
            ...i,
            children: i?.curriculumVersion.map((t) => ({
                ...t,
                title: t?.code ? `${t?.code} - ${t?.name}` : t?.name,
                value: t?.id,
            })),
            title: i?.code ? `${i?.code} - ${i?.name}` : i?.name,
            value: i?.id,
            selectable: false,
        }
    })
    const treeData = buildOrgTree(manageOrgData)

    const { data: level } = useFindUniqueFixedClass(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (curriculumVersionData) {
            form.setFieldsValue({
                managementOrganizationId:
                    curriculumVersionData?.curriculum?.managementOrganization?.Id,
                trainingMajorId: curriculumVersionData?.curriculum?.trainingMajor?.id,
                trainingObjectTypeId: curriculumVersionData?.trainingObjectTypeId,
            })
        }
    }, [curriculumVersionData])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({ ...level })
        } else {
            form.setFieldsValue({
                graduated: false,
                active: true,
            })
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa lớp biên chế' : 'Thêm mới lớp biên chế'}
            className="w-[45vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="curriculumVersionId"
                    label="Chương trình đào tạo"
                    required
                >
                    <TreeSelect
                        allowClear
                        showSearch
                        placeholder="Chọn chương trình đào tạo"
                        treeDefaultExpandAll
                        treeData={curriculumTreeData}
                        filterTreeNode={(input, node) =>
                            (node.title as string).toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingObjectTypeId" label="Đối tượng đào tạo">
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map((i: TrainingObjectType) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        onChange={(val) => handleChangeField('trainingCourseId', val)}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingCourseId" label="Khóa">
                    <Select
                        placeholder="Chọn khóa"
                        options={trainingCourseData.map((i: TrainingCourse) => {
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
                    name="managementOrganizationId"
                    label="Khoa phụ trách"
                    className="mb-2"
                >
                    <TreeSelect
                        allowClear
                        showSearch
                        placeholder="Chọn đơn vị phụ trách"
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node.title as string).toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(val) =>
                            handleChangeFieldOrganization(
                                ['trainingMajorId', 'curriculumVersionId'],
                                val
                            )
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingMajorId" label="Chuyên ngành" required>
                    <Select
                        placeholder="Chọn chuyên ngành"
                        options={trainingMajorData.map((i: TrainingMajor) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        onChange={(val) => handleChangeField('curriculumVersionId', val)}
                    />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="lecturerManagementId" label="GVCN">
                    <Select
                        placeholder="Chọn giáo viên chủ nhiệm"
                        options={lecturerData.map((i) => {
                            return {
                                value: i?.id,
                                label: `${i.userProfile?.code} - ${i?.userProfile?.fullname}`,
                            }
                        })}
                        // onChange={(val) =>handleMajorChange(val)}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="staffManagementId" label="CBQL">
                    <Select
                        placeholder="Chọn cán bộ quản lý"
                        options={staffData.map((i) => {
                            return {
                                value: i?.id,
                                label: `${i.userProfile?.code} - ${i?.userProfile?.fullname}`,
                            }
                        })}
                        // onChange={(val) =>handleMajorChange(val)}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã lớp biên chế" required>
                    <Input placeholder="Nhập mã lớp biên chế" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="name" label="Tên lớp biên chế" required>
                    <Input placeholder="Nhập tên lớp biên chế" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="summary" label="Tên viết tắt">
                    <Input placeholder="Nhập tên viết tắt" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startYear" label="Năm bắt đầu">
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={1}
                        placeholder="Nhập năm bắt đầu"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="initSize" label="Sĩ số">
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={1}
                        placeholder="Nhập sĩ số"
                    />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'active'} label="Trạng thái" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'graduated'} label="Tình trạng tốt nghiệp" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đã tốt nghiệp</Radio>
                        <Radio value={false}>Chưa tốt nghiệp</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutFixedClassModal
