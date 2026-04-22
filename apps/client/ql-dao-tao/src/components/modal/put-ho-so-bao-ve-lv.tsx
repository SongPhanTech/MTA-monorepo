import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { ThesisType } from "@workspace/db/client"
import {
  useCreateStudentThesisRegistration,
  useCreateThesisProject,
  useFindManyExpertProfile,
  useFindManyStudent,
  useFindUniqueStudent,
  useUpdateThesisProject,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Select } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type PutHoSoBaoVeLvForm = {
  studentId?: string
  title?: string
  type?: string
  supervisorId?: string
  CHUTICH?: string
  UYVIEN3?: string
}

const PutHoSoBaoVeLv = () => {
  const [form] = Form.useForm<PutHoSoBaoVeLvForm>()
  const [searchExpert, setSearchExpert] = useState("")
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: createThesisProject } = useCreateThesisProject()
  const { mutateAsync: createStudentThesisRegistration } = useCreateStudentThesisRegistration()
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject()

  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    mode?: "create" | "edit"
    thesisSessionId?: string
    organizationId?: string
    fixedClassIds?: string[]
  }>({
    tag: "PutHoSoBaoVeLv",
    onClose: form.resetFields,
  })

  const studentId = input?.id
  const isCreateMode = input?.mode === "create"

  const { data: studentData } = useFindUniqueStudent(
    {
      where: { id: studentId },
      include: {
        userProfile: true,
        thesisRegistrations: {
          where: {
            thesisProject: {
              thesisType: ThesisType.THESIS,
              thesisSessionId: input?.thesisSessionId || undefined,
              organizationId: input?.organizationId || undefined,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            thesisProject: {
              include: {
                supervisor: {
                  include: {
                    lecturer: {
                      include: {
                        userProfile: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!studentId,
    }
  )

  const thesisProject = studentData?.thesisRegistrations?.[0]?.thesisProject

  const { data: candidateStudents = [] } = useFindManyStudent(
    {
      where: {
        ...(input?.thesisSessionId
          ? {
              fixedClassId: {
                in: input.fixedClassIds?.length ? input.fixedClassIds : undefined,
              },
              thesisRegistrations: {
                some: {
                  thesisProject: {
                    thesisSessionId: input.thesisSessionId,
                    thesisType: ThesisType.THESIS,
                    organizationId: input.organizationId || undefined,
                  },
                },
              },
            }
          : {}),
      },
      include: {
        userProfile: true,
      },
    },
    {
      enabled: isCreateMode && !!input?.thesisSessionId,
    }
  )

  const { data: expertProfiles = [] } = useFindManyExpertProfile({
    where: {
      ...(searchExpert
        ? {
            OR: [
              {
                name: { contains: searchExpert, mode: "insensitive" },
              },
              {
                lecturer: {
                  userProfile: {
                    fullname: { contains: searchExpert, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      lecturer: {
        include: {
          userProfile: {
            include: {
              academicRankType: true,
              academicDegreeType: true,
            },
          },
        },
      },
    },
  })

  useEffect(() => {
    if (!isOpen) return

    if (isCreateMode) {
      form.resetFields()
      return
    }

    if (!thesisProject) return

    form.setFieldsValue({
      studentId,
      title: thesisProject.title ?? undefined,
      type: thesisProject.type ?? undefined,
      supervisorId: thesisProject.supervisorId ?? undefined,
      CHUTICH: thesisProject.CHUTICH ?? undefined,
      UYVIEN3: thesisProject.UYVIEN3 ?? undefined,
    })
  }, [form, isCreateMode, isOpen, studentId, thesisProject])

  const onOk = async (values?: PutHoSoBaoVeLvForm) => {
    if (!values) {
      message.warning("Không tìm thấy dữ liệu để cập nhật")
      return
    }

    try {
      showSpinner()

      if (isCreateMode) {
        if (!values.studentId) {
          message.warning("Vui lòng chọn sinh viên")
          return
        }

        const thesisProjectResponse = await createThesisProject({
          data: {
            title: values.title?.trim() || null,
            type: values.type?.trim() || null,
            thesisType: ThesisType.THESIS,
            thesisSessionId: input?.thesisSessionId || null,
            organizationId: input?.organizationId || null,
            supervisorId: values.supervisorId || null,
            CHUTICH: values.CHUTICH,
            UYVIEN3: values.UYVIEN3,
          },
        })

        await createStudentThesisRegistration({
          data: {
            studentId: values.studentId,
            thesisProjectId: thesisProjectResponse?.id ?? "",
          },
        })

        message.success("Tạo mới thành công")
      } else {
        if (!studentId || !thesisProject?.id) {
          message.warning("Không tìm thấy dữ liệu để cập nhật")
          return
        }

        await updateThesisProject({
          where: {
            id: thesisProject.id,
          },
          data: {
            title: values.title?.trim() || null,
            type: values.type?.trim() || null,
            supervisorId: values.supervisorId || null,
            CHUTICH: values.CHUTICH,
            UYVIEN3: values.UYVIEN3,
          },
        })

        message.success("Cập nhật thông tin thành công")
      }

      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error.info.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable
      title={isCreateMode ? "Tạo mới để xuất hội đồng" : "Sửa để xuất hội đồng"}
      className="w-[720px]"
    >
      <Col span={24} className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="font-medium text-slate-800">
          {isCreateMode &&
            `${studentData?.code ? `${studentData.code} - ` : ""}${studentData?.userProfile?.fullname || ""}`}
        </div>
        <div className="mt-1">
          {isCreateMode
            ? "Chọn sinh viên."
            : thesisProject?.title
              ? `Đề tài hiện tại: ${thesisProject.title}`
              : "Chưa có tên đề tài"}
        </div>
      </Col>

      {isCreateMode && (
        <Col span={24}>
          <FormItem form={form} name="studentId" label="Sinh viên" required>
            <Select
              placeholder="Chọn sinh viên"
              showSearch
              filterOption={false}
              allowClear
              options={candidateStudents.map((item) => ({
                label: `${item.code ? `${item.code} -` : ""} ${item.userProfile?.fullname || ""}`,
                value: item.id,
              }))}
            />
          </FormItem>
        </Col>
      )}

      <Col span={24}>
        <FormItem form={form} name="title" label="Tên đề tài" required>
          <Input placeholder="Nhập tên đề tài" />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="type" label="Loại" required>
          <Select
            placeholder="Chọn loại"
            options={[
              { label: "Luận văn", value: "Luận văn" },
              { label: "Đồ án", value: "Đồ án" },
            ]}
            allowClear
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="supervisorId" label="Cán bộ hướng dẫn">
          <Select
            placeholder="Chọn cán bộ hướng dẫn"
            showSearch
            filterOption={false}
            onSearch={setSearchExpert}
            onClear={() => setSearchExpert("")}
            allowClear
            options={expertProfiles.map((item) => ({
              label: `${item.code ? `${item.code} -` : ""} ${
                item.lecturer?.userProfile?.fullname || item.name || ""
              }`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="CHUTICH" label="Chủ tịch">
          <Select
            placeholder="Chọn chủ tịch hội đồng"
            showSearch
            filterOption={false}
            onSearch={setSearchExpert}
            onClear={() => setSearchExpert("")}
            allowClear
            options={expertProfiles.map((item) => ({
              label: `${item.code ? `${item.code} -` : ""} ${
                item.lecturer?.userProfile?.fullname || item.name || ""
              }`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="UYVIEN3" label="Ủy viên 3">
          <Select
            placeholder="Chọn ủy viên 3"
            showSearch
            filterOption={false}
            onSearch={setSearchExpert}
            onClear={() => setSearchExpert("")}
            allowClear
            options={expertProfiles.map((item) => ({
              label: `${item.code ? `${item.code} -` : ""} ${
                item.lecturer?.userProfile?.fullname || item.name || ""
              }`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutHoSoBaoVeLv
