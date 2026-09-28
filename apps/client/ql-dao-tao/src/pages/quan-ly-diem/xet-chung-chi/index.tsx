import DefaultLayout from "@layouts/default-layout"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import {
  useFindManyCertificate,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
  useCreateManyArchivedCertificate,
} from "@workspace/db/hooks"
import { queryClient } from "@api/index"
import { Col, Form, Row, Button, message, Modal, Tooltip } from "antd"
import { useState, useMemo } from "react"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import ExcelJS from "exceljs"

export default function AutoCheckCertificate() {
  const [form] = Form.useForm()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const certificateId = Form.useWatch("certificateId", form)
  const trainingCourseId = Form.useWatch("trainingCourseId", form)
  const fixedClassIds = Form.useWatch("fixedClassIds", form)

  const [hasSearched, setHasSearched] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const { mutateAsync: createManyArchivedCertificate } = useCreateManyArchivedCertificate()

  const { data: certificates = [] } = useFindManyCertificate({
    where: { subjectVersions: { some: {} } },
    include: { subjectVersions: true },
    orderBy: { name: "asc" },
  })

  const selectedCertificate = useMemo(() => {
    return certificates.find((c) => c.id === certificateId)
  }, [certificates, certificateId])

  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId },
      orderBy: { semesterStart: { startDate: "desc" } },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: fixedClasses = [] } = useFindManyFixedClass(
    {
      where: { trainingCourseId, trainingCourse: { trainingObjectTypeId } },
      orderBy: { name: "asc" },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const whereStudent = useMemo(() => {
    if (!trainingCourseId || !selectedCertificate) return undefined
    return {
      fixedClass: {
        trainingCourseId,
        ...(fixedClassIds && fixedClassIds.length > 0 ? { id: { in: fixedClassIds } } : {}),
      },
    }
  }, [trainingCourseId, fixedClassIds, selectedCertificate])

  const { data: students = [], isFetching } = useFindManyStudent(
    {
      where: whereStudent!,
      include: {
        userProfile: true,
        fixedClass: true,
        subjectClassStudent: {
          where: {
            subjectVersionId: {
              in: selectedCertificate?.subjectVersions?.map((sv) => sv.id) || [],
            },
          },
          include: { subjectVersion: true },
          orderBy: { finalScore: "desc" },
          distinct: ["subjectVersionId"],
        },
        archivedCertificate: {
          where: {
            certificateId: selectedCertificate?.id,
          },
        },
      },
      orderBy: [{ userProfile: { firstName: "asc" } }, { userProfile: { lastName: "asc" } }],
    },
    { enabled: !!whereStudent && hasSearched }
  )

  const getStudentResult = (record: any) => {
    let totalScore = 0
    let totalCredit = 0
    let hasFailedSubject = false

    selectedCertificate?.subjectVersions?.forEach((sv) => {
      const scoreRecord = record.subjectClassStudent?.find((s: any) => s.subjectVersionId === sv.id)
      const scoreVal = scoreRecord?.manualFinalScore ?? scoreRecord?.finalScore
      const score =
        scoreVal != null
          ? Number(
              typeof scoreVal === "object" && typeof scoreVal.toNumber === "function"
                ? scoreVal.toNumber()
                : scoreVal
            )
          : 0

      if (score < 4) hasFailedSubject = true
      totalScore += score * sv.credit
      totalCredit += sv.credit
    })

    if (totalCredit === 0) return { tbc: 0, isPassed: false }

    const tbc = totalScore / totalCredit
    const threshold = selectedCertificate?.scoreThreshold ?? 5
    const isPassed = tbc >= threshold && !hasFailedSubject
    return { tbc, isPassed }
  }

  const handleSearch = () => {
    if (!certificateId) {
      return message.warning("Vui lòng chọn chứng chỉ!")
    }
    if (!trainingCourseId) {
      return message.warning("Vui lòng chọn khóa học!")
    }
    setHasSearched(true)
    setSelectedRowKeys([])
  }

  const handleApprove = () => {
    const targetStudents =
      selectedRowKeys.length > 0 ? students.filter((s) => selectedRowKeys.includes(s.id)) : students

    const passedStudentsToApprove = targetStudents.filter((s) => {
      const { isPassed } = getStudentResult(s)
      const alreadyHas = s.archivedCertificate && s.archivedCertificate.length > 0
      return isPassed && !alreadyHas
    })

    if (passedStudentsToApprove.length === 0) {
      return message.warning("Không có sinh viên nào đủ điều kiện để phê duyệt!")
    }

    Modal.confirm({
      title: "Xác nhận phê duyệt",
      content: `Bạn có chắc chắn muốn phê duyệt chứng chỉ cho ${passedStudentsToApprove.length} sinh viên?`,
      onOk: async () => {
        try {
          await createManyArchivedCertificate({
            data: passedStudentsToApprove.map((s) => {
              const { tbc } = getStudentResult(s)
              return {
                studentId: s.id,
                certificateId: selectedCertificate!.id,
                status: "APPROVED",
                finalScore: tbc,
              }
            }),
          })
          message.success("Phê duyệt thành công!")
          // Invalidate to refetch
          queryClient.invalidateQueries({ queryKey: ["Student"] })
          setSelectedRowKeys([])
        } catch (error) {
          message.error("Có lỗi xảy ra khi phê duyệt!")
        }
      },
    })
  }

  const handleExport = async () => {
    if (!certificateId || !trainingCourseId) {
      return message.warning("Vui lòng chọn chứng chỉ và khóa học!")
    }

    if (!selectedCertificate || students.length === 0) {
      return message.warning("Không có dữ liệu để xuất!")
    }

    try {
      message.loading({ content: "Đang xuất file...", key: "export-excel" })

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("Danh Sach")

      const centerStyle = {
        alignment: { horizontal: "center" as const, vertical: "middle" as const },
      }

      const svCols =
        selectedCertificate.subjectVersions?.map((sv) => ({
          header: `${sv.code} (${sv.credit} TC)`,
          key: `sub_${sv.id}`,
          width: 15,
          style: centerStyle,
        })) || []

      const allCols = [
        { header: "STT", key: "stt", width: 10, style: centerStyle },
        { header: "Mã định danh", key: "code", width: 15 },
        { header: "Họ và tên", key: "fullname", width: 25 },
        { header: "Ngày sinh", key: "dob", width: 15 },
        { header: "CCCD/CMND", key: "cccd", width: 20 },
        { header: "Lớp", key: "classCode", width: 15, style: centerStyle },
        ...svCols,
        { header: "Điểm TBC", key: "tbc", width: 15, style: centerStyle },
        { header: "Kết quả", key: "result", width: 15, style: centerStyle },
      ]

      sheet.columns = allCols

      const headerRow = sheet.getRow(1)
      allCols.forEach((col, index) => {
        headerRow.getCell(index + 1).value = col.header
      })
      headerRow.font = { bold: true, size: 12, name: "Times New Roman" }
      headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true }

      students.forEach((record, index) => {
        const { tbc, isPassed } = getStudentResult(record)

        const rowData: any = {
          stt: index + 1,
          code: record.userProfile?.code,
          fullname: record.userProfile?.fullname || "",
          dob: record.userProfile?.dateOfBirth
            ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
            : "",
          cccd: record.userProfile?.idCardNumber || "",
          classCode: record.fixedClass?.code || "",
          tbc: tbc ? tbc.toFixed(2) : "",
        }

        selectedCertificate.subjectVersions?.forEach((sv) => {
          const scoreRecord = record.subjectClassStudent?.find(
            (s: any) => s.subjectVersionId === sv.id
          )
          const rawScore = scoreRecord?.manualFinalScore ?? scoreRecord?.finalScore
          const score =
            rawScore != null
              ? typeof rawScore === "object" && typeof rawScore.toNumber === "function"
                ? rawScore.toNumber()
                : rawScore
              : null
          rowData[`sub_${sv.id}`] = score ?? ""
        })

        if (record.archivedCertificate && record.archivedCertificate.length > 0) {
          rowData.result = "Đã cấp"
        } else {
          rowData.result = isPassed ? "Đạt" : "Không đạt"
        }

        const row = sheet.addRow(rowData)

        const resultCell = row.getCell("result")
        resultCell.font = {
          name: "Times New Roman",
          bold: true,
          color: {
            argb: rowData.result === "Đạt" || rowData.result === "Đã cấp" ? "FF008000" : "FFFF0000",
          },
        }
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      saveAs(blob, "DANH_SACH_XET_CHUNG_CHI.xlsx")

      message.success({ content: "Xuất file thành công!", key: "export-excel" })
    } catch (error) {
      console.error(error)
      message.error({ content: "Có lỗi xảy ra khi xuất file", key: "export-excel" })
    }
  }

  const columns = useMemo(() => {
    const baseCols = [
      {
        title: "STT",
        dataIndex: "stt",
        key: "stt",
        width: 60,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Mã định danh",
        dataIndex: "code",
        align: "center",
        key: "code",
        width: 120,
        render: (_: any, record: any) => record.userProfile?.code || "",
      },
      {
        title: "Họ và tên",
        dataIndex: "fullname",
        key: "fullname",
        render: (_: any, record: any) => record.userProfile?.fullname,
      },
      {
        title: "Ngày sinh",
        key: "dateOfBirth",
        width: 120,
        align: "center" as const,
        render: (_: any, record: any) =>
          record.userProfile?.dateOfBirth
            ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
            : "-",
      },
      {
        title: "CCCD/CMND",
        key: "idCardNumber",
        width: 140,
        align: "center" as const,
        render: (_: any, record: any) => record.userProfile?.idCardNumber || "-",
      },
      {
        title: "Lớp",
        dataIndex: "classCode",
        align: "center",
        key: "classCode",
        width: 120,
        render: (_: any, record: any) => (
          <Tooltip title={record.fixedClass?.name}>
            <div className="truncate max-w-[100px]">{record.fixedClass?.code}</div>
          </Tooltip>
        ),
      },
    ]

    const subjectCols =
      selectedCertificate?.subjectVersions?.map((sv) => ({
        title: (
          <Tooltip title={sv.name}>
            <span>
              {sv.code} ({sv.credit} TC)
            </span>
          </Tooltip>
        ),
        key: sv.id,
        align: "center" as const,
        width: 150,
        render: (_: any, record: any) => {
          const scoreRecord = record.subjectClassStudent?.find(
            (s: any) => s.subjectVersionId === sv.id
          )

          const rawScore = scoreRecord?.manualFinalScore ?? scoreRecord?.finalScore
          const score =
            rawScore != null
              ? typeof rawScore === "object" && typeof rawScore.toNumber === "function"
                ? rawScore.toNumber()
                : rawScore
              : null
          return score ?? "-"
        },
      })) || []

    const resultCols = [
      {
        title: "Điểm TBC",
        key: "accumulatedScore",
        align: "center" as const,
        width: 120,
        render: (_: any, record: any) => {
          const { tbc } = getStudentResult(record)
          return <span className="font-semibold">{tbc ? tbc.toFixed(2) : "-"}</span>
        },
      },
      {
        title: "ĐK Điểm",
        key: "scoreThreshold",
        align: "center" as const,
        width: 100,
        render: () => (
          <span className="font-medium text-gray-600">
            {selectedCertificate?.scoreThreshold ?? 5}
          </span>
        ),
      },
      {
        title: "Kết quả",
        key: "result",
        align: "center" as const,
        width: 120,
        render: (_: any, record: any) => {
          if (record.archivedCertificate && record.archivedCertificate.length > 0) {
            return <span className="text-blue-600 font-bold">Đã cấp</span>
          }

          const { isPassed } = getStudentResult(record)
          return (
            <span className={isPassed ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
              {isPassed ? "Đạt" : "Không đạt"}
            </span>
          )
        },
      },
    ]

    return [...baseCols, ...subjectCols, ...resultCols]
  }, [selectedCertificate])

  return (
    <div className=" bg-white rounded-md flex flex-col h-full">
      <Form form={form} layout="vertical">
        <Row gutter={[8, 8]}>
          <Col span={6}>
            <Form.Item name="certificateId" label="Chứng chỉ" className="mb-4">
              <Select
                options={certificates.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="Chọn chứng chỉ"
                onChange={() => setHasSearched(false)}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="trainingCourseId" label="Khóa học" className="mb-4">
              <Select
                options={trainingCourses.map((tc) => ({
                  value: tc.id,
                  label: tc.name,
                }))}
                placeholder="Chọn khóa học"
                onChange={() => {
                  form.setFieldValue("fixedClassIds", undefined)
                  setHasSearched(false)
                }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="fixedClassIds" label="Lớp quản lý" className="mb-4">
              <Select
                mode="multiple"
                options={fixedClasses.map((fc) => ({
                  value: fc.id,
                  label: fc.code + " - " + fc.name,
                }))}
                placeholder="Tất cả lớp"
                onChange={() => setHasSearched(false)}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6} className="flex items-end mb-4 gap-2">
            <Button
              type="default"
              onClick={handleSearch}
              disabled={!certificateId || !trainingCourseId}
            >
              Kiểm tra
            </Button>
            <Button
              type="primary"
              onClick={handleApprove}
              disabled={!hasSearched || students.length === 0}
            >
              Phê duyệt
            </Button>
            <Button
              type="primary"
              onClick={handleExport}
              disabled={!hasSearched || students.length === 0}
            >
              Xuất Excel
            </Button>
          </Col>
        </Row>
      </Form>
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns as any}
          dataSource={students}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: any) => {
              const alreadyHas = record.archivedCertificate && record.archivedCertificate.length > 0
              const { isPassed } = getStudentResult(record)
              return {
                disabled: alreadyHas || !isPassed,
              }
            },
          }}
          loading={isFetching}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          bordered
        />
      </div>
    </div>
  )
}

AutoCheckCertificate.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
