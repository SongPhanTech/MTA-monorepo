// import { EXPORT_MAP, type ExportKey } from "@/types/sheet_excel";
import {
  useFindManyBuilding,
  useFindManyDM_DonVi,
  useFindManyExam,
  useFindManyExamList,
  useFindManyExamRoom,
  useFindManyRoom,
  useFindManySchoolYear,
  useFindManySemester,
  useFindManySubject,
  useFindManySubjectVersion,
  useFindManyTrainingLocation,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Checkbox, Modal, message } from "antd"
import { saveAs } from "file-saver"
import { useDisclosure } from "react-hook-disclosure-modal"
import * as XLSX from "xlsx"
import { EXPORT_MAP, type ExportKey } from "@/types/sheet_excel"
import { whereActiveOrganization } from "@workspace/libs/org-tree"

type ExportInput = {
  selectedItems: string[]
}

function getValidExportKeys(selectedItems: string[]): ExportKey[] {
  return selectedItems.filter((key): key is ExportKey => key in EXPORT_MAP)
}

export default function ExportExcelModal() {
  const { isOpen, onClose, input } = useDisclosure<ExportInput>({
    tag: "ExportExcelModal",
  })

  const { data: donVis = [] } = useFindManyDM_DonVi({
    where: whereActiveOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: subjects = [] } = useFindManySubject({
    where: {
      subjectVersion: {
        some: { trainingObjectTypeId },
      },
    },
  })
  const { data: subjectVersions = [] } = useFindManySubjectVersion({
    where: { trainingObjectTypeId },
  })
  const { data: schoolYears = [] } = useFindManySchoolYear()
  const { data: semesters = [] } = useFindManySemester()
  const { data: trainingLocations = [] } = useFindManyTrainingLocation()
  const { data: buildings = [] } = useFindManyBuilding()
  const { data: rooms = [] } = useFindManyRoom()
  const { data: exams = [] } = useFindManyExam()
  const { data: examRooms = [] } = useFindManyExamRoom()
  const { data: examLists = [] } = useFindManyExamList()

  const DATA_SOURCE: Record<ExportKey, unknown[]> = {
    "du-lieu-goc-DM_DonVi": donVis,
    "du-lieu-goc-Subject": subjects,
    "du-lieu-goc-SubjectVersion": subjectVersions,

    "du-lieu-thay-doi-SchoolYear": schoolYears,
    "du-lieu-thay-doi-Semester": semesters,
    "du-lieu-thay-doi-TrainingLocation": trainingLocations,
    "du-lieu-thay-doi-Building": buildings,
    "du-lieu-thay-doi-Room": rooms,
    "du-lieu-thay-doi-Exam": exams,
    "du-lieu-thay-doi-ExamRoom": examRooms,
    "du-lieu-thay-doi-ExamList": examLists,
  }

  const handleExport = async () => {
    if (!input?.selectedItems?.length) {
      message.warning("Chưa chọn dữ liệu để xuất")
      return
    }

    const validKeys = getValidExportKeys(input.selectedItems)

    if (validKeys.length === 0) {
      message.warning("Các mục đã chọn chưa hỗ trợ xuất Excel")
      return
    }

    const wb = XLSX.utils.book_new()

    for (const key of validKeys) {
      const config = EXPORT_MAP[key]
      const rows = DATA_SOURCE[key] ?? []

      if (!config) continue

      const headers = Object.values(config.columns)
      const keys = Object.keys(config.columns)

      const aoa = [
        headers,
        ...rows.map((row) =>
          keys.map((k) => {
            const value = (row as Record<string, unknown>)[k]
            if (value instanceof Date) return value.toISOString()
            if (typeof value === "boolean") return value ? "Có" : "Không"
            return value ?? ""
          })
        ),
      ]

      const ws = XLSX.utils.aoa_to_sheet(aoa)

      ws["!freeze"] = { ySplit: 1 }
      ws["!cols"] = headers.map(() => ({ wch: 20 }))

      XLSX.utils.book_append_sheet(wb, ws, config.sheet)
    }

    const fileName = `export_${Date.now()}.xlsx`
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    })

    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    )

    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="Xuất dữ liệu ra Excel"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="export" type="primary" className="!bg-green-700" onClick={handleExport}>
          Xuất file
        </Button>,
      ]}
    >
      <div className="flex flex-col gap-2">
        {input?.selectedItems?.map((id) => {
          const supported = getValidExportKeys([id]).length === 1
          return (
            <div key={id} className="flex items-start">
              <Checkbox checked disabled={!supported}>
                <span className="break-all">{id}</span>
                {!supported && (
                  <span className="ml-2 text-xs text-red-500">(Chưa hỗ trợ xuất)</span>
                )}
              </Checkbox>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
