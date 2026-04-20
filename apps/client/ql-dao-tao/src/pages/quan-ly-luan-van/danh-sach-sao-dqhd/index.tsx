"use client"

import { useState, useMemo } from "react"
import { Row, Col, Form, Button, message, Typography, Space } from "antd"
import { useFindManyExpertProfile, useFindManyDecision } from "@workspace/db/hooks"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import DefaultLayout from "@layouts/default-layout"
import { Printer, FileCheck } from "lucide-react"
import dayjs from "dayjs"
import useSpinner from "@hooks/spinner"
import { exportSaoQDHDLV } from "@/utils/thesis-excel"

const { Title, Text } = Typography

export default function SaoQuyetDinhHoiDongPage() {
  const { showSpinner, hideSpinner } = useSpinner()
  const [selectedExpertId, setSelectedExpertId] = useState<string>()
  const [selectedDecisionKeys, setSelectedDecisionKeys] = useState<React.Key[]>([])
  const { data: experts = [], isLoading: isLoadingExperts } = useFindManyExpertProfile({
    where: { active: true, deletedAt: null },
  })
  const getNameByExpertId = (id: string | null | undefined) => {
    if (!id) return null
    const found = experts.find((e) => String(e.id) === String(id))
    return found?.name || "N/A"
  }
  const selectedExpert = useMemo(() => {
    return experts.find((e) => String(e.id) === String(selectedExpertId))
  }, [experts, selectedExpertId])
  const { data, isFetching } = useFindManyDecision({
    where: {
      deletedAt: null,
      thesisProject: {
        ...(selectedExpertId
          ? {
              OR: [
                { CHUTICH: selectedExpertId },
                { THUKY: selectedExpertId },
                { PHANBIEN1: selectedExpertId },
                { PHANBIEN2: selectedExpertId },
                { UYVIEN3: selectedExpertId },
              ],
            }
          : {}),
        deletedAt: null,
      },
    },
    include: {
      thesisProject: {
        include: {
          organization: true,
          council: {
            include: {
              studentThesisRegistration: {
                include: {
                  student: { include: { userProfile: true, fixedClass: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  const handleExportCertifiedCopy = async () => {
    if (!selectedExpert) {
      return message.warning("Vui lòng chọn giảng viên .")
    }

    const selectedRecords = (data || []).filter((d) => selectedDecisionKeys.includes(d.id))

    showSpinner()
    try {
      const mockedDataForExport = selectedRecords.map((d: any) => {
        const tp = d.thesisProject
        const studentData = tp?.council?.studentThesisRegistration?.student
        const profile = studentData?.userProfile
        const fullName = [profile?.lastName, profile?.firstName].filter(Boolean).join(" ")

        return {
          thesisRegistrations: [
            {
              thesisProject: {
                ...tp,
                supervisor: {
                  userProfile: {
                    fullname: getNameByExpertId(tp?.CHUTICH) || "N/A",
                  },
                },
                coSupervisor: tp?.THUKY
                  ? {
                      userProfile: {
                        fullname: getNameByExpertId(tp?.THUKY) || "",
                      },
                    }
                  : null,

                title: tp?.title || "",
              },
            },
          ],
          userProfile: {
            ...profile,
            fullname: fullName || "N/A",
          },
          fixedClass: studentData?.fixedClass || { code: "N/A" },
        }
      })

      await exportSaoQDHDLV({
        allStudentsInClasses: mockedDataForExport,
        signerName: selectedExpert.name || "",
        isChief: true,
        showSpinner,
        hideSpinner,
        message,
      })
    } catch (error) {
      console.error(error)
      message.error("Lỗi đổ dữ liệu vào template")
    } finally {
      hideSpinner()
    }
  }
  const columns = [
    {
      title: "Mã QĐ",
      dataIndex: "code",
      width: 140,
      render: (text: string) => <Text code>{text || "N/A"}</Text>,
    },
    {
      title: "Tên đề tài",
      dataIndex: ["thesisProject", "title"],
      width: "30%",
    },
    {
      title: "GVHD",
      key: "council_members",
      render: (_: any, record: any) => {
        const tp = record.thesisProject
        if (!tp) return "-"

        const roles = [
          { id: tp.CHUTICH },
          { id: tp.THUKY },
          { id: tp.PHANBIEN1 },
          { id: tp.PHANBIEN2 },
          { id: tp.UYVIEN3 },
        ].filter((r) => !!r.id)

        return (
          <div className="bg-gray-50 p-2 rounded border border-gray-100 min-w-[200px]">
            {roles.length > 0 ? (
              <Space direction="vertical" size={0}>
                {roles.map((role, idx) => (
                  <div key={idx} className="text-[11px] leading-5">
                    <span className="font-semibold text-gray-700">
                      {getNameByExpertId(role.id) || "Chưa cập nhật"}
                    </span>
                  </div>
                ))}
              </Space>
            ) : (
              <Text type="secondary" italic>
                Chưa phân GVHD
              </Text>
            )}
          </div>
        )
      },
    },
    {
      title: "Sinh viên",
      key: "student",
      render: (_: any, record: any) => {
        const student = record.thesisProject?.council?.studentThesisRegistration?.student
        const profile = student?.userProfile

        const fullNameDisplay = [profile?.lastName, profile?.firstName].filter(Boolean).join(" ")

        return student ? (
          <div className="text-xs">
            <div className="font-medium text-blue-600">{fullNameDisplay || "N/A"}</div>
            <div className="text-gray-400">{student.fixedClass?.code}</div>
          </div>
        ) : (
          "-"
        )
      },
    },
  ]

  return (
    <DefaultLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={4}>Sao y Quyết định hướng dẫn Luận văn/Đồ án</Title>
          <Button
            type="primary"
            icon={<Printer size={18} />}
            disabled={selectedDecisionKeys.length === 0}
            onClick={handleExportCertifiedCopy}
          >
            Sao y & Xuất file
          </Button>
        </div>

        <div className="mb-6">
          <Text strong className="text-gray-500 block mb-2">
            Danh sách GVHD:
          </Text>
          <Select
            showSearch
            allowClear
            className="w-full"
            placeholder="Chọn GVHD"
            optionFilterProp="label"
            options={experts.map((e) => ({
              label: e.name,
              value: e.id,
            }))}
            onChange={(val) => {
              setSelectedExpertId(val)
              setSelectedDecisionKeys([])
            }}
          />
        </div>

        <Table
          rowKey="id"
          loading={isFetching || isLoadingExperts}
          data={data || []}
          columns={columns}
          rowSelection={{
            selectedRowKeys: selectedDecisionKeys,
            onChange: (keys) => setSelectedDecisionKeys(keys),
          }}
        />
      </div>
    </DefaultLayout>
  )
}
