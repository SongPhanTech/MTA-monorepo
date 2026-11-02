import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type {
  FixedClass,
  TrainingCourse,
  TrainingMajor,
  TrainingObjectType,
} from "@workspace/db/client"
import {
  useCreateFixedClass,
  useFindManyCurriculum,
  useFindManyDM_DonVi,
  useFindManyStaff,
  useFindManyTrainingCourse,
  useFindManyTrainingMajor,
  useFindUniqueCurriculumVersion,
  useFindUniqueFixedClass,
  useUpdateFixedClass,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import { syncStudentDonViFromFixedClass } from "@lib/sync-student-don-vi"
import TreeSelectDepartment from "@components/commons/department-select/TreeSelectDepartment"
import LectureTreeSelect from "@components/commons/lecture-select-multi/TreeSelectLecture"
import { buildOrgTree } from "@lib/utils"
import { whereActiveOrganization } from "@workspace/libs/org-tree"
import { normalizeVietnamese } from "@workspace/libs/utils"
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from "@workspace/ui"
import TreeSelect from "@/components/commons/tree-select"
import { useFixedClassTypeOptions } from "@hooks/fixedClassType"
export type PutFixedClass = FixedClass & {
  trainingObjectTypeId: string | null
  trainingMajorId: string | null
}
dayjs.locale("vi")
const PutFixedClassModal = () => {
  const [form] = Form.useForm<PutFixedClass>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutFixedClassModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const [dataOutput, setDataOutput] = useState<PutFixedClass>()
  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const { onOpen: onOpenModalConfirm } = useDisclosure<string>({
    tag: "ConfirmModal",
    onOk: (value: any) => {
      updateFixedClassWithStudent()
    },
  })

  const trainingMajorIdForm = Form.useWatch("trainingMajorId", form)
  const curriculumVersionIdForm = Form.useWatch("curriculumVersionId", form)

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    where: trainingObjectTypeId ? { trainingObjectTypeId } : {},
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
    include: {
      semesterStart: { include: { schoolYear: true } },
    },
  })
  const { options: fixedClassTypeOptions } = useFixedClassTypeOptions()
  const { data: curriculumData = [] } = useFindManyCurriculum({
    where: {
      ...(trainingMajorIdForm ? { trainingMajorId: trainingMajorIdForm } : {}),
      curriculumVersion: {
        some: {
          trainingObjectTypeId,
          OR: [
            {
              fixedClasses: { none: {} },
            },
            {
              fixedClasses: { some: { id: id ?? undefined } },
            },
          ],
        },
      },
    },
    include: {
      curriculumVersion: {
        where: {
          trainingObjectTypeId,
          OR: [
            {
              fixedClasses: { none: {} },
            },
            {
              fixedClasses: { some: { id: id ?? undefined } },
            },
          ],
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const { data: staffData = [] } = useFindManyStaff({
    include: { userProfile: true },
    orderBy: { userProfile: { firstName: "asc" } },
  })
  // const { data: lecturerData = [] } = useFindManyLecturer({
  //     include: {
  //         userProfile: true,
  //     },
  //     orderBy: {
  //         userProfile: {
  //             firstName: 'asc',
  //         },
  //     },
  // })
  const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission({
    where: {
      curriculumVersion: curriculumVersionIdForm ? { some: { id: curriculumVersionIdForm } } : {},
    },
  })

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    where: {
      active: true,
      trainingObjectTypes: { some: { trainingObjectTypeId } },
    },
    orderBy: { name: "asc" },
  })
  const { data: curriculumVersionData } = useFindUniqueCurriculumVersion(
    {
      where: { id: curriculumVersionIdForm ?? undefined },
      include: { curriculum: { include: { trainingMajor: true } } },
    },
    { enabled: !!curriculumVersionIdForm }
  )

  const { mutateAsync: createFixedClass } = useCreateFixedClass()
  const { mutateAsync: updateFixedClass } = useUpdateFixedClass()

  const updateFixedClassWithStudent = async () => {
    if (!dataOutput) return
    const payload = {
      code: dataOutput.code,
      name: dataOutput.name,
      description: dataOutput.description,
      graduated: dataOutput.graduated,
      active: dataOutput.active,
      summary: dataOutput.summary,
      classType: dataOutput.classType,
    }
    await updateFixedClass({
      data: {
        ...payload,
        trainingCourseId: dataOutput.trainingCourseId,
        managementOrganizationId: dataOutput.managementOrganizationId,
        curriculumVersionId: dataOutput.curriculumVersionId,
        staffManagementId: dataOutput.staffManagementId,
        lecturerManagementId: dataOutput.lecturerManagementId,
        students: {
          updateMany: {
            where: {
              fixedClassId: id,
            },
            data: {
              curriculumVersionId: dataOutput?.curriculumVersionId,
            },
          },
        },
      },
      where: {
        id,
      },
    })
    if (id && dataOutput.managementOrganizationId !== oldFixedClass?.managementOrganizationId) {
      await syncStudentDonViFromFixedClass({ fixedClassId: id })
    }
    message.success("Cập nhật thành công")
    queryClient.invalidateQueries({
      queryKey: ["FixedClass"],
    })
    onClose()
  }

  async function onOk(output?: PutFixedClass) {
    if (!output) return
    try {
      showSpinner()
      const payload = {
        code: output.code,
        name: output.name.trim(),
        description: output.description,
        // startYear: output.startYear,
        graduated: output.graduated,
        active: output.active,
        summary: output.summary,
        classType: output.classType,
      }
      if (id) {
        if (
          oldFixedClass &&
          output.curriculumVersionId !== oldFixedClass.curriculumVersionId &&
          oldFixedClass._count.students > 0
        ) {
          onOpenModalConfirm("Thay đổi CTĐT cho tất cả các sinh viên trong lớp?")
          setDataOutput(output)
        } else {
          await updateFixedClass({
            data: {
              ...payload,
              trainingCourseId: output.trainingCourseId,
              managementOrganizationId: output.managementOrganizationId,
              curriculumVersionId: output.curriculumVersionId,
              staffManagementId: output.staffManagementId,
              lecturerManagementId: output.lecturerManagementId,
            },
            where: {
              id,
            },
          })
          if (output.managementOrganizationId !== oldFixedClass?.managementOrganizationId) {
            await syncStudentDonViFromFixedClass({ fixedClassId: id })
          }
          message.success("Cập nhật thành công")
          queryClient.invalidateQueries({
            queryKey: ["FixedClass"],
          })
          onClose()
        }
      } else {
        await createFixedClass({
          data: {
            ...payload,
            trainingCourseId: output.trainingCourseId,
            managementOrganizationId: output.managementOrganizationId,
            curriculumVersionId: output.curriculumVersionId,
            staffManagementId: output.staffManagementId,
            lecturerManagementId: output.lecturerManagementId,
          },
        })
        message.success("Thêm mới thành công")
        queryClient.invalidateQueries({
          queryKey: ["FixedClass"],
        })
        onClose()
      }
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const curriculumTreeData = useMemo(() => {
    const seenVersionIds = new Set<string>()
    return curriculumData.flatMap((curriculum) => {
      const children = (curriculum.curriculumVersion ?? []).flatMap((version) => {
        if (!version.id || seenVersionIds.has(version.id)) return []
        seenVersionIds.add(version.id)
        return [
          {
            key: version.id,
            value: version.id,
            title: version.code ? `${version.code} - ${version.name}` : version.name,
          },
        ]
      })
      if (children.length === 0) return []
      return [
        {
          key: `curriculum-${curriculum.id}`,
          value: `curriculum-${curriculum.id}`,
          title: curriculum.code ? `${curriculum.code} - ${curriculum.name}` : curriculum.name,
          selectable: false,
          children,
        },
      ]
    })
  }, [curriculumData])
  const treeData = buildOrgTree(manageOrgData)

  const { data: oldFixedClass } = useFindUniqueFixedClass(
    {
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    },
    {
      enabled: !!id,
    }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (curriculumVersionData) {
      form.setFieldsValue({
        trainingMajorId: curriculumVersionData?.curriculum?.trainingMajor?.id,
      })
    }
  }, [curriculumVersionData])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (oldFixedClass) {
      form.setFieldsValue({ ...oldFixedClass })
    } else {
      form.setFieldsValue({
        graduated: false,
        active: true,
      })
    }
  }, [oldFixedClass])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa lớp quản lý" : "Thêm mới lớp quản lý"}
      className="w-[45vw]"
      formProps={{
        initialValues: {
          trainingObjectTypeId,
        },
      }}
    >
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
            disabled
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="trainingCourseId" label="Khoá" required>
          <Select
            placeholder="Chọn khoá"
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
        <FormItem form={form} name="trainingMajorId" label="Chuyên ngành">
          <Select
            placeholder="Chọn chuyên ngành"
            options={trainingMajorData.map((i: TrainingMajor) => {
              return {
                value: i.id,
                label: i.name,
              }
            })}
            onChange={() => {
              form.setFieldsValue({
                curriculumVersionId: null,
              })
            }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="curriculumVersionId" label="Chương trình đào tạo">
          <TreeSelect
            allowClear
            showSearch
            virtual={false}
            placeholder="Chọn chương trình đào tạo"
            treeDefaultExpandAll
            treeNodeFilterProp="title"
            treeData={curriculumTreeData}
            filterTreeNode={(input, treeNode) => {
              // Nhóm cha không được tính là khớp. Nếu cha khớp, antd giữ mọi phiên bản con
              // kể cả phiên bản không chứa keyword, nên danh sách bị trùng và lọc sai.
              if (treeNode?.selectable === false) return false
              const title = typeof treeNode?.title === "string" ? treeNode.title : ""
              return normalizeVietnamese(title).includes(normalizeVietnamese(input))
            }}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="code" label="Mã lớp quản lý" required>
          <Input placeholder="Nhập mã lớp quản lý" />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="name" label="Tên lớp quản lý" required>
          <Input placeholder="Nhập tên lớp quản lý" />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem
          form={form}
          name="managementOrganizationId"
          label="Đơn vị quản lý"
          className="mb-2"
        >
          <TreeSelectDepartment treeCheckable={false} multiple={false} />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="lecturerManagementId" label="GVCN">
          <LectureTreeSelect />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="staffManagementId" label="CBQL">
          <Select
            placeholder="Chọn cán bộ quản lý"
            options={staffData.map((i) => {
              return {
                value: i?.id,
                label: `${i.userProfile?.code} - ${i?.userProfile?.fullname ? i?.userProfile?.fullname : `${i?.userProfile?.firstName} ${i?.userProfile?.lastName}`}`,
              }
            })}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="summary" label="Tên viết tắt">
          <Input placeholder="Nhập tên viết tắt" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="classType" label="Loại lớp">
          <Select
            placeholder="Chọn loại lớp"
            options={fixedClassTypeOptions.map((i) => {
              return {
                value: i.value,
                label: i.label,
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name={"graduated"} label="Tình trạng tốt nghiệp">
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
