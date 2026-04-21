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
  useUpdateThesisSession,
} from "@workspace/db/hooks"
import { dayjs } from "@workspace/ui"
import type { Dayjs } from "dayjs"
import { Col, DatePicker, Form, Input, message, Select } from "antd"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type PutEditQuanLyLuanVanForm = {
  studentId?: string
  title?: string
  type?: string
  supervisorId?: string
  coSupervisorId?: string
  soQd?: string
  ngayQd?: Dayjs
  tenChuTich?: string
  toChucChuTich?: string
  tenThuKy?: string
  toChucThuKy?: string
  tenUyVien?: string
  toChucUyVien?: string
  tenPb1?: string
  toChucPb1?: string
  tenPb2?: string
  toChucPb2?: string
}

export type PutEditQuanLyLuanVanProps = {
  disclosureTag?: "PutEditGiayMoiHuongDanLVDA" | "PutEditQuyetDinhHDDG"
}

const PutEditQuanLyLuanVan = ({
  disclosureTag = "PutEditGiayMoiHuongDanLVDA",
}: PutEditQuanLyLuanVanProps) => {
  const [form] = Form.useForm<PutEditQuanLyLuanVanForm>()
  const [searchExpert, setSearchExpert] = useState("")
  const { showSpinner, hideSpinner } = useSpinner()
  const [appendix, setAppendix] = useState(false)
  const { mutateAsync: createThesisProject } = useCreateThesisProject()
  const { mutateAsync: createStudentThesisRegistration } = useCreateStudentThesisRegistration()
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
  const { mutateAsync: updateThesisSession } = useUpdateThesisSession()

  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    mode?: "create" | "edit"
    thesisSessionId?: string
    organizationId?: string
    fixedClassIds?: string[]
  }>({
    tag: disclosureTag,
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
                coSupervisor: {
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
                thesisSession: true,
                council: {
                  include: {
                    members: {
                      include: {
                        expert: {
                          include: {
                            lecturer: {
                              include: {
                                userProfile: true,
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
      },
    },
    {
      enabled: !!studentId,
    }
  )

  const thesisProject = studentData?.thesisRegistrations?.[0]?.thesisProject
  const thesisSession = thesisProject?.thesisSession
  const councilMembers = thesisProject?.council?.members || []
  const getCouncilMemberByRole = (role: string) =>
    councilMembers.find((m: any) => m?.role === role)?.expert

  const getCouncilMemberName = (role: string) => {
    const expert = getCouncilMemberByRole(role)
    return expert?.name || expert?.lecturer?.userProfile?.fullname || ""
  }

  const getCouncilMemberOrganization = (role: string) => {
    const expert = getCouncilMemberByRole(role)
    return expert?.organization || ""
  }

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

    const chairman = getCouncilMemberByRole("CHAIRMAN")
    const secretary = getCouncilMemberByRole("SECRETARY")
    const member = getCouncilMemberByRole("MEMBER")
    const reviewer1 = getCouncilMemberByRole("REVIEWER_1")
    const reviewer2 = getCouncilMemberByRole("REVIEWER_2")

    form.setFieldsValue({
      studentId,
      title: thesisProject.title ?? undefined,
      type: thesisProject.type ?? undefined,
      supervisorId: thesisProject.supervisorId ?? undefined,
      coSupervisorId: thesisProject.coSupervisorId ?? undefined,
      soQd: thesisSession?.defenseDecisionNumber ?? undefined,
      ngayQd: thesisSession?.defenseDecisionDate
        ? dayjs(thesisSession.defenseDecisionDate)
        : undefined,
      tenChuTich: thesisProject?.CHUTICH ?? undefined,
      toChucChuTich: getCouncilMemberOrganization("CHAIRMAN") || undefined,
      tenThuKy: thesisProject?.THUKY ?? undefined,
      toChucThuKy: getCouncilMemberOrganization("SECRETARY") || undefined,
      tenUyVien: thesisProject?.UYVIEN3 ?? undefined,
      toChucUyVien: getCouncilMemberOrganization("MEMBER") || undefined,
      tenPb1: thesisProject?.PHANBIEN1 ?? undefined,
      toChucPb1: getCouncilMemberOrganization("REVIEWER_1") || undefined,
      tenPb2: thesisProject?.PHANBIEN2 ?? undefined,
      toChucPb2: getCouncilMemberOrganization("REVIEWER_2") || undefined,
    })
  }, [form, isCreateMode, isOpen, studentId, thesisProject, thesisSession])

  const onOk = async (values?: PutEditQuanLyLuanVanForm) => {
    if (!values) {
      message.warning("Không tìm thấy dữ liệu để cập nhật")
      return
    }

    // Check if phụ lục fields were changed
    const phulucFieldsChanged =
      disclosureTag === "PutEditQuyetDinhHDDG" &&
      (values.soQd !== thesisSession?.defenseDecisionNumber ||
        values.tenChuTich ||
        values.tenThuKy ||
        values.tenUyVien ||
        values.tenPb1 ||
        values.tenPb2)

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
            coSupervisorId: values.coSupervisorId || null,
            CHUTICH: values.tenChuTich || null,
            THUKY: values.tenThuKy || null,
            UYVIEN3: values.tenUyVien || null,
            PHANBIEN1: values.tenPb1 || null,
            PHANBIEN2: values.tenPb2 || null,
          },
        })

        await createStudentThesisRegistration({
          data: {
            studentId: values.studentId,
            thesisProjectId: thesisProjectResponse?.id ?? "",
          },
        })

        if (phulucFieldsChanged) {
          message.info(
            "Lưu ý: Để cập nhật thông tin hội đồng và quyết định, vui lòng sử dụng trang quản lý phụ lục"
          )
        } else {
          message.success("Tạo mới giấy mời hướng dẫn thành công")
        }
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
            coSupervisorId: values.coSupervisorId || null,
            CHUTICH: values.tenChuTich || null,
            THUKY: values.tenThuKy || null,
            UYVIEN3: values.tenUyVien || null,
            PHANBIEN1: values.tenPb1 || null,
            PHANBIEN2: values.tenPb2 || null,
          },
        })

        await updateThesisSession({
          where: { id: thesisSession?.id || "" },
          data: {
            defenseDecisionNumber: values.soQd || null,
            defenseDecisionDate: values.ngayQd ? values.ngayQd.toDate() : null,
          },
        })

        if (phulucFieldsChanged) {
          message.success("Cập nhật thông tin luận văn thành công")
        } else {
          message.success("Cập nhật thông tin giấy mời hướng dẫn thành công")
        }
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

  const documentLabel =
    disclosureTag === "PutEditGiayMoiHuongDanLVDA" ? "giấy mời hướng dẫn" : "phụ lục"

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable
      title={isCreateMode ? `Tạo mới ${documentLabel}` : `Sửa ${documentLabel}`}
      className="w-[720px]"
    >
      {!isCreateMode && (
        <Col span={24} className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="font-medium text-slate-800">
            {`${studentData?.code ? `${studentData.code} - ` : ""}${studentData?.userProfile?.fullname || ""}`}
          </div>
          {/* <div className="mt-1">
          {isCreateMode
            ? "Chọn sinh viên và nhập thông tin đề tài cần tạo."
            : thesisProject?.title
              ? `Đề tài hiện tại: ${thesisProject.title}`
              : "Chưa có tên đề tài"}
        </div> */}
        </Col>
      )}

      {isCreateMode && (
        <Col span={24}>
          <FormItem form={form} name="studentId" label="Sinh viên" required>
            <Select
              placeholder="Chọn sinh viên"
              showSearch
              optionFilterProp="label"
              allowClear
              options={candidateStudents.map((item) => ({
                label: `${item.code ? `${item.code} -` : ""} ${item.userProfile?.fullname || ""}`,
                value: item.id,
              }))}
            />
          </FormItem>
        </Col>
      )}

      <Col span={16}>
        <FormItem form={form} name="title" label="Tên đề tài" required>
          <Input placeholder="Nhập tên đề tài" />
        </FormItem>
      </Col>

      <Col span={8}>
        <FormItem form={form} name="type" label="Loại" required>
          <Select
            placeholder="Chọn loại"
            options={[
              { label: "Luận văn", value: "Luận văn" },
              { label: "Đề án", value: "Đề án" },
            ]}
            allowClear
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="supervisorId" label="Giảng viên hướng dẫn">
          <Select
            placeholder="Chọn giảng viên hướng dẫn"
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
      {disclosureTag === "PutEditQuyetDinhHDDG" && (
        <Col span={12}>
          <FormItem form={form} name="coSupervisorId" label="Giảng viên hướng dẫn 2">
            <Select
              placeholder="Chọn giảng viên hướng dẫn"
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
      )}

      {disclosureTag === "PutEditQuyetDinhHDDG" && (
        <>
          {!appendix && (
            <>
              <Col span={24} className="mt-4 border-t pt-4">
                <div className="font-semibold text-slate-700">Thông tin phụ lục</div>
              </Col>

              <Col span={12}>
                <FormItem form={form} name="soQd" label="Số quyết định">
                  <Input placeholder="Nhập số quyết định" />
                </FormItem>
              </Col>

              <Col span={12}>
                <FormItem form={form} name="ngayQd" label="Ngày quyết định">
                  <DatePicker className="w-full" placeholder="Chọn ngày quyết định" />
                </FormItem>
              </Col>
            </>
          )}

          <Col span={24} className="mt-3 border-t pt-4">
            <div className="font-semibold text-slate-700">Hội đồng</div>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="tenChuTich" label="Tên chủ tịch">
              <Select
                placeholder="Chọn chủ tịch"
                showSearch
                filterOption={false}
                onSearch={setSearchExpert}
                onClear={() => setSearchExpert("")}
                allowClear
                options={expertProfiles.map((item) => ({
                  label: `${item.code ? `${item.code} -` : ""} ${
                    item.lecturer?.userProfile?.fullname || item.name || ""
                  }`,
                  value: item.lecturer?.userProfile?.fullname || item.name || item.id,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12} hidden>
            <FormItem form={form} name="toChucChuTich" label="Tổ chức chủ tịch">
              <Input placeholder="Nhập tổ chức" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="tenThuKy" label="Tên thư ký">
              <Select
                placeholder="Chọn thư ký"
                showSearch
                filterOption={false}
                onSearch={setSearchExpert}
                onClear={() => setSearchExpert("")}
                allowClear
                options={expertProfiles.map((item) => ({
                  label: `${item.code ? `${item.code} -` : ""} ${
                    item.lecturer?.userProfile?.fullname || item.name || ""
                  }`,
                  value: item.lecturer?.userProfile?.fullname || item.name || item.id,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12} hidden>
            <FormItem form={form} name="toChucThuKy" label="Tổ chức thư ký">
              <Input placeholder="Nhập tổ chức" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="tenUyVien" label="Tên ủy viên">
              <Select
                placeholder="Chọn ủy viên"
                showSearch
                filterOption={false}
                onSearch={setSearchExpert}
                onClear={() => setSearchExpert("")}
                allowClear
                options={expertProfiles.map((item) => ({
                  label: `${item.code ? `${item.code} -` : ""} ${
                    item.lecturer?.userProfile?.fullname || item.name || ""
                  }`,
                  value: item.lecturer?.userProfile?.fullname || item.name || item.id,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12} hidden>
            <FormItem form={form} name="toChucUyVien" label="Tổ chức ủy viên">
              <Input placeholder="Nhập tổ chức" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="tenPb1" label="Tên phản biện 1">
              <Select
                placeholder="Chọn phản biện 1"
                showSearch
                filterOption={false}
                onSearch={setSearchExpert}
                onClear={() => setSearchExpert("")}
                allowClear
                options={expertProfiles.map((item) => ({
                  label: `${item.code ? `${item.code} -` : ""} ${
                    item.lecturer?.userProfile?.fullname || item.name || ""
                  }`,
                  value: item.lecturer?.userProfile?.fullname || item.name || item.id,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12} hidden>
            <FormItem form={form} name="toChucPb1" label="Tổ chức phản biện 1">
              <Input placeholder="Nhập tổ chức" />
            </FormItem>
          </Col>

          <Col span={12}>
            <FormItem form={form} name="tenPb2" label="Tên phản biện 2">
              <Select
                placeholder="Chọn phản biện 2"
                showSearch
                filterOption={false}
                onSearch={setSearchExpert}
                onClear={() => setSearchExpert("")}
                allowClear
                options={expertProfiles.map((item) => ({
                  label: `${item.code ? `${item.code} -` : ""} ${
                    item.lecturer?.userProfile?.fullname || item.name || ""
                  }`,
                  value: item.lecturer?.userProfile?.fullname || item.name || item.id,
                }))}
              />
            </FormItem>
          </Col>

          <Col span={12} hidden>
            <FormItem form={form} name="toChucPb2" label="Tổ chức phản biện 2">
              <Input placeholder="Nhập tổ chức" />
            </FormItem>
          </Col>
        </>
      )}
    </PutFormModal>
  )
}

export default PutEditQuanLyLuanVan
