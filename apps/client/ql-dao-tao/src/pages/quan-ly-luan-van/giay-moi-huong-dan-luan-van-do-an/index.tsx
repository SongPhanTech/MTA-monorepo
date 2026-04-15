import Select from "@components/commons/select"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import { ThesisType } from "@workspace/db/client"
import {
  useFindManyDM_DonVi,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyThesisSession,
} from "@workspace/db/hooks"
import { whereOrganization } from "@workspace/libs/constants"
import { dayjs, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Form, Input, message, Modal, Radio, Row, Space } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import TreeSelect from "@/components/commons/tree-select"
import { exportGiayMoiHdlv } from "@/utils/thesis-excel"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import EditIcon from "@components/icons/edit"
import { useAbility } from "@workspace/permissions"
import PutEditGiayMoiHuongDanLVDA from "@components/modal/put-giay-moi-huong-dan-lv-da"

interface ThesisProjectForm {
  thesisSessionId: string
  fixedClassId: string[]
  organizationId: string
}

export interface DanhMucLuanVanProps {
  role?: "P7" | "Khoa"
}

interface SignerPayload {
  signerName: string
  isChief: boolean
}

function getSupervisorName(record: any) {
  const expert = record
  if (!expert) return ""

  const profile = expert?.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || expert?.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || expert?.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = expert?.name || profile?.fullname || ""
  const workplace = expert?.workplace || ""

  return [title, fullname].filter(Boolean).join(" ").trim() + (workplace ? `, ${workplace}` : "")
}

export default function GiayMoiHuongDanLuanVanDoAn({ role = "P7" }: DanhMucLuanVanProps) {
  const orgId = window.contextData?.organizationId
  const { can } = useAbility()
  const [form] = Form.useForm<ThesisProjectForm>()
  const [searchParams, setSearchParams] = useState<Partial<ThesisProjectForm>>({})
  const [trainingCourseId, setTrainingCourseId] = useState<string | null>(null)
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [signRole, setSignRole] = useState<"chief" | "deputy">("chief")
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()

  const { data: sDm_Donvi = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeOrgData = buildOrgTree(sDm_Donvi ?? [], "0")

  const { data: thesisSessionData = [] } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    where: { trainingObjectTypeId: trainingObjectId },
    include: {
      trainingCourse: true,
    },
  })

  const selectedThesisSession = useMemo(
    () => thesisSessionData.find((s) => s.id === searchParams.thesisSessionId),
    [thesisSessionData, searchParams.thesisSessionId]
  )

  const trainingCourse = selectedThesisSession?.trainingCourse

  const { data: fixedClasses = [] } = useFindManyFixedClass(
    {
      where: {
        trainingCourseId: trainingCourseId ?? "",
      },
    },
    {
      enabled: !!trainingCourseId,
    }
  )

  useEffect(() => {
    if (role !== "Khoa" || !orgId) return
    form.setFieldValue("organizationId", orgId)
    setSearchParams((prev) => ({
      ...prev,
      organizationId: orgId,
    }))
  }, [role, orgId, form])

  const where = useMemo(() => {
    if (!searchParams.thesisSessionId) {
      return { id: { in: [] } }
    }

    return {
      fixedClassId: {
        in:
          searchParams.fixedClassId && searchParams.fixedClassId.length > 0
            ? searchParams.fixedClassId
            : fixedClasses.map((f) => f.id),
      },
      thesisRegistrations: {
        some: {
          thesisProject: {
            thesisSessionId: searchParams.thesisSessionId,
            thesisType: ThesisType.THESIS,
            organizationId: searchParams.organizationId || undefined,
          },
        },
      },
    }
  }, [searchParams, fixedClasses])

  const { data: students = [] } = useFindManyStudent(
    {
      where,
      include: {
        userProfile: {
          include: {
            academicRankType: true,
            academicDegreeType: true,
          },
        },
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
        thesisRegistrations: {
          where: {
            thesisProject: {
              thesisSessionId: searchParams.thesisSessionId,
              thesisType: ThesisType.THESIS,
              organizationId: searchParams.organizationId || undefined,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
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
    { enabled: !!searchParams.thesisSessionId }
  )

  const handleOpenExport = () => {
    if (!searchParams.thesisSessionId) {
      message.warning("Vui lòng chọn đợt xét trước khi xuất Excel.")
      return
    }

    if (!selectedThesisSession) {
      message.warning("Không tìm thấy thông tin đợt xét.")
      return
    }

    setSignRole(selectedThesisSession.chief?.trim() ? "chief" : "deputy")
    setSignModalOpen(true)
  }

  const handleConfirmExport = async () => {
    if (!selectedThesisSession) {
      message.warning("Không tìm thấy thông tin đợt xét.")
      return
    }

    const chiefName = (selectedThesisSession.chief ?? "").trim()
    const deputyName = (selectedThesisSession.deputy ?? "").trim()
    const signer: SignerPayload = {
      signerName: signRole === "chief" ? chiefName : deputyName,
      isChief: signRole === "chief",
    }

    if (!signer.signerName) {
      message.warning(
        `Chưa có họ tên ${signRole === "chief" ? "Trưởng phòng" : "Phó phòng"} sau đại học trong đợt xét.`
      )
      return
    }

    setSignModalOpen(false)

    await exportGiayMoiHdlv({
      allStudentsInClasses: students,
      showSpinner,
      hideSpinner,
      message,
      signerName: signer.signerName,
      isChief: signer.isChief,
    })
  }

  const chiefDisplay = selectedThesisSession?.chief?.trim() || "(chưa nhập)"
  const deputyDisplay = selectedThesisSession?.deputy?.trim() || "(chưa nhập)"

  const { onOpen: onOpenPutGiayMoiHuongDanLVDA } = useDisclosure<{
    id?: string
    mode?: "create" | "edit"
    thesisSessionId?: string
    organizationId?: string
    fixedClassIds?: string[]
  }>({
    tag: "PutEditGiayMoiHuongDanLVDA",
  })

  const handleOpenCreateGiayMoi = () => {
    if (!searchParams.thesisSessionId) {
      message.warning("Vui lòng chọn đợt xét trước khi thêm mới giấy mời.")
      return
    }

    onOpenPutGiayMoiHuongDanLVDA({
      mode: "create",
      thesisSessionId: searchParams.thesisSessionId,
      organizationId: searchParams.organizationId,
      fixedClassIds: searchParams.fixedClassId,
    })
  }

  return (
    <div>
      <PutEditGiayMoiHuongDanLVDA />
      <Modal
        title="Chọn người ký"
        open={signModalOpen}
        onCancel={() => setSignModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setSignModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={() => void handleConfirmExport()}>
            Xác nhận
          </Button>,
        ]}
        destroyOnClose
        maskClosable={false}
      >
        <p className="mb-3 text-gray-600">
          Đợt xét hiện tại: {selectedThesisSession?.name ?? "—"}.
        </p>
        <Radio.Group
          value={signRole}
          onChange={(e) => setSignRole(e.target.value)}
          className="flex flex-col gap-3"
        >
          <Radio value="chief">
            Trưởng phòng sau đại học: <strong>{chiefDisplay}</strong>
          </Radio>
          <Radio value="deputy">
            Phó phòng sau đại học: <strong>{deputyDisplay}</strong>
          </Radio>
        </Radio.Group>
      </Modal>

      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Form form={form} layout="horizontal" className="w-full">
            <Flex gap={12} className="flex flex-wrap items-end gap-2">
              <Form.Item name="thesisSessionId" label="Đợt xét" required>
                <Select
                  className="w-40"
                  options={thesisSessionData.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  placeholder="Chọn đợt xét"
                  onChange={(value) => {
                    const selectedId = value as string
                    setSearchParams((prev) => ({ ...prev, thesisSessionId: selectedId }))
                    setTrainingCourseId(
                      thesisSessionData.find((x) => x.id === selectedId)?.trainingCourse?.id || null
                    )
                  }}
                />
              </Form.Item>

              <Form.Item label="Khóa học" required>
                <Input className="w-48" value={trainingCourse?.name || ""} readOnly />
              </Form.Item>

              <Form.Item name="fixedClassId" label="Lớp học">
                <Select
                  mode="multiple"
                  className="w-72"
                  maxTagCount="responsive"
                  options={fixedClasses.map((x) => ({
                    label: x.name,
                    value: x.id,
                  }))}
                  placeholder="Chọn lớp học"
                  onChange={(value) => {
                    setSearchParams((prev) => ({ ...prev, fixedClassId: value as string[] }))
                  }}
                />
              </Form.Item>

              <Form.Item name="organizationId" label="Khoa quản lí">
                <TreeSelect
                  className="w-80"
                  placeholder="Chọn khoa quản lý"
                  allowClear={role !== "Khoa"}
                  disabled={role === "Khoa"}
                  showSearch
                  treeDefaultExpandAll
                  treeData={treeOrgData}
                  onChange={(value) => {
                    setSearchParams((prev) => ({ ...prev, organizationId: value as string }))
                  }}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" onClick={handleOpenExport}>
                    Xuất giấy mời hướng dẫn
                  </Button>
                  <Button type="primary" onClick={handleOpenCreateGiayMoi}>
                    Thêm mới giấy mời
                  </Button>
                </Space>
              </Form.Item>
            </Flex>
          </Form>
        </Col>

        <Col span={24}>
          <Table
            bordered
            rowKey="id"
            scroll={{ x: "max-content" }}
            data={students}
            columns={[
              {
                title: "Mã sinh viên",
                width: 120,
                fixed: "left",
                render: (_, record) => record?.code || "",
              },
              {
                title: "Họ tên",
                width: 220,
                fixed: "left",
                render: (_, record) => record?.userProfile?.fullname || "",
              },
              {
                title: "Cán bộ hướng dẫn",
                width: 280,
                render: (_, record) =>
                  getSupervisorName(record?.thesisRegistrations?.[0]?.thesisProject?.supervisor),
              },
              {
                title: "Khóa",
                width: 220,
                render: (_, record) => {
                  const tc = record?.fixedClass?.trainingCourse
                  return tc ? `${tc.name || ""} (${tc.academicYear || ""})` : ""
                },
              },
              {
                title: "Chuyên ngành",
                width: 220,
                render: (_, record) =>
                  record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || "",
              },
              {
                title: "Tên đề tài",
                width: 360,
                render: (_, record) => record?.thesisRegistrations?.[0]?.thesisProject?.title || "",
              },
              {
                title: "Loại",
                width: 120,
                align: "center",
                render: (_, record) =>
                  record?.thesisRegistrations?.[0]?.thesisProject?.type
                    ? String(record.thesisRegistrations[0].thesisProject.type)
                    : "",
              },
              {
                title: "Ngày sinh",
                width: 120,
                align: "center",
                render: (_, record) =>
                  record?.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Thao tác",
                align: "center",
                fixed: "right",
                width: 80,
                render: (_, record) => {
                  if (record?.id) {
                    return (
                      <Row className="justify-center gap-2 px-3">
                        {can(
                          QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_GIAY_MOI_HUONG_DAN_LUAN_VAN_DO_AN,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenPutGiayMoiHuongDanLVDA({
                                mode: "edit",
                                id: record?.id,
                                thesisSessionId: searchParams.thesisSessionId,
                                organizationId: searchParams.organizationId,
                              })
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                      </Row>
                    )
                  }
                  return ""
                },
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  )
}

GiayMoiHuongDanLuanVanDoAn.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
