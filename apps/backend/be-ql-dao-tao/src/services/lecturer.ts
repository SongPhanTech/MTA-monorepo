import { type ExamType, SubjectClassSchedule } from "@workspace/db"
import { examTypeOptions } from "@workspace/libs/constants"

const getExamTypeVietNamese = (examType: ExamType) => {
  const label = examTypeOptions.find((o) => o.value === examType)?.label
  return label
}

const getScheduleVietNamese = (schedule: SubjectClassSchedule) => {
  // Chuyển đổi lịch học sang tiếng Việt
  switch (schedule) {
    case SubjectClassSchedule.MORNING:
      return "Sáng"
    case SubjectClassSchedule.AFTERNOON:
      return "Chiều"
    case SubjectClassSchedule.EVENING:
      return "Tối"
    default:
      return ""
  }
}

export const getDataForExportEachSheetTable = async (
  organizationId: string,
  semesterId: string,
  subjectClassList: any[]
) => {
  let rowIndex = 10
  const dataResult: { cell: string; text: string }[] = []
  const merges: string[] = [] // Mảng riêng để lưu các lệnh gộp ô

  const groupedBySubject = new Map<string, any[]>()

  subjectClassList.forEach((subjectClass) => {
    const subjectName = subjectClass.subject.name
    if (!groupedBySubject.has(subjectName)) {
      groupedBySubject.set(subjectName, [])
    }
    groupedBySubject.get(subjectName)?.push(subjectClass)
  })

  console.log(`Grouped by subject: ${groupedBySubject.size} subjects found`)
  let stt = 0
  for (const subjectGroup of groupedBySubject.values()) {
    stt++
    const startRow = rowIndex // Ghi nhớ dòng bắt đầu của nhóm
    const groupSize = subjectGroup.length // Tổng số lớp trong nhóm
    const firstClassInGroup = subjectGroup[0] // Lấy thông tin chung từ lớp đầu tiên

    dataResult.push({ cell: `A${startRow}`, text: stt.toString() })
    dataResult.push({ cell: `B${startRow}`, text: firstClassInGroup.subject.code || "" })
    dataResult.push({ cell: `C${startRow}`, text: firstClassInGroup.subject.name || "" })
    dataResult.push({
      cell: `D${startRow}`,
      text: firstClassInGroup.subject.credit.toString() || "",
    })
    dataResult.push({
      cell: `E${startRow}`,
      text: (firstClassInGroup.subject.period / 15).toString() || "",
    })
    dataResult.push({
      cell: `F${startRow}`,
      text: firstClassInGroup.subject.period.toString() || "",
    })
    dataResult.push({ cell: `G${startRow}`, text: groupSize.toString() })

    if (groupSize > 1) {
      const endRow = startRow + groupSize - 1
      merges.push(`A${startRow}:A${endRow}`) // Gộp cột STT
      merges.push(`B${startRow}:B${endRow}`) // Gộp cột Mã HP
      merges.push(`C${startRow}:C${endRow}`) // Gộp cột Tên HP
      merges.push(`D${startRow}:D${endRow}`) // Gộp cột Tín chỉ
      merges.push(`E${startRow}:E${endRow}`) // Gộp cột ĐVHT
      merges.push(`F${startRow}:F${endRow}`) // Gộp cột Số tiết
      merges.push(`G${startRow}:G${endRow}`) // Gộp cột Số lớp
      // console.log(`Merged cells in sheet ${merges}`);
    }

    subjectGroup.forEach((subjectClass) => {
      dataResult.push({
        cell: `H${rowIndex}`,
        text: getScheduleVietNamese(subjectClass.schedule) || "",
      })
      dataResult.push({
        cell: `I${rowIndex}`,
        text: (subjectClass.subjectClassStudent?.length || 0).toString(),
      })
      dataResult.push({ cell: `J${rowIndex}`, text: subjectClass.code || "code" })
      const classNames = subjectClass.fixedClasses.map((fc: { name: any }) => fc.name).join(", ")
      dataResult.push({ cell: `K${rowIndex}`, text: classNames || "" })
      dataResult.push({
        cell: `L${rowIndex}`,
        text: subjectClass.room?.building?.trainingLocation?.name || "",
      })
      dataResult.push({
        cell: `M${rowIndex}`,
        text: subjectClass.mainLecturer?.userProfile?.fullname || "",
      })
      dataResult.push({
        cell: `N${rowIndex}`,
        text: subjectClass.extraLecturer?.userProfile?.fullname || "",
      })
      dataResult.push({ cell: `O${rowIndex}`, text: subjectClass.room?.name || "" })
      dataResult.push({
        cell: `P${rowIndex}`,
        text: getExamTypeVietNamese(subjectClass.examType as ExamType) || "",
      })

      rowIndex++
    })
  }
  return { data: dataResult, merges: merges }
}
