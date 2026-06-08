import { Typography } from "antd"
import { useFindManySurvey, useFindManyDM_DonVi } from "@workspace/db/hooks"
import React, { useMemo } from "react"

const { Title } = Typography

interface ProgressRow {
  key: string
  type: "faculty" | "department" | "lecturer" | "total"
  name: string
  completed: number
  total: number
  indent: number
}

export function SurveyProgressTable({ selectedId }: { selectedId: string }) {
  const { data: surveys = [], isLoading: isSurveysLoading } = useFindManySurvey(
    {
      where: { clusterSurveyId: selectedId },
      include: {
        lecture: {
          include: {
            userProfile: true,
          },
        },
        surveySessions: true,
        subjectClass: {
          include: {
            subjectClassStudent: true,
          },
        },
      },
    },
    {
      enabled: !!selectedId,
    }
  )

  const { data: organizations = [], isLoading: isOrgLoading } = useFindManyDM_DonVi(
    {
      where: {
        iLoaiDonVi: {
          in: [5, 6, 7],
        },
      },
    },
    {
      enabled: !!selectedId,
    }
  )

  const progressData = useMemo(() => {
    if (!surveys.length || !organizations.length) return []

    const lecturerMap: Record<
      string,
      {
        lecturerId: string
        fullName: string
        code: string | null
        organizationId: string | null
        completed: number
        total: number
      }
    > = {}

    surveys.forEach((survey) => {
      if (!survey.lecture) return
      const lecId = survey.lecture.id
      const userProfile = survey.lecture.userProfile
      const fullName =
        `${userProfile?.lastName ?? ""} ${userProfile?.firstName ?? ""}`.trim() ||
        "Giảng viên không tên"

      const completedCount = survey.surveySessions?.length || 0
      const studentCount = survey.subjectClass?.subjectClassStudent?.length || 0

      if (!lecturerMap[lecId]) {
        lecturerMap[lecId] = {
          lecturerId: lecId,
          fullName,
          code: survey.lecture.code,
          organizationId: survey.lecture.organizationId,
          completed: 0,
          total: 0,
        }
      }
      lecturerMap[lecId].completed += completedCount
      lecturerMap[lecId].total += studentCount
    })

    const departments = organizations.filter((o) => o.iLoaiDonVi === 7)
    const faculties = organizations.filter((o) => o.iLoaiDonVi === 5 || o.iLoaiDonVi === 6)

    console.log("===== SURVEY REPORT DEBUG =====")
    console.log("surveys", surveys)
    console.log("organizations", organizations)
    console.log("Survey count:", surveys.length)
    console.log("Organization count:", organizations.length)
    console.log("Faculties:", faculties)
    console.log("Departments:", departments)

    const resultRows: ProgressRow[] = []

    faculties.forEach((fac) => {
      const facDepts = departments.filter((d) => d.sParentId === fac.Id)

      let facCompleted = 0
      let facTotal = 0
      const deptRows: ProgressRow[] = []

      facDepts.forEach((dept) => {
        const deptLecturers = Object.values(lecturerMap).filter((l) => l.organizationId === dept.Id)

        console.log("Department:", dept.sTen)
        console.log("Lecturers:", deptLecturers)

        let deptCompleted = 0
        let deptTotal = 0
        const lecRows: ProgressRow[] = []

        deptLecturers.forEach((lec) => {
          deptCompleted += lec.completed
          deptTotal += lec.total

          lecRows.push({
            key: `lec_${lec.lecturerId}`,
            type: "lecturer",
            name: lec.fullName,
            completed: lec.completed,
            total: lec.total,
            indent: 2,
          })
        })

        if (deptTotal > 0) {
          facCompleted += deptCompleted
          facTotal += deptTotal

          deptRows.push({
            key: `dept_${dept.Id}`,
            type: "department",
            name: `${dept.sMa ? dept.sMa + " - " : ""}${dept.sTen}`,
            completed: deptCompleted,
            total: deptTotal,
            indent: 1,
          })
          deptRows.push(...lecRows)
        }
      })

      // Add lecturers who are directly under the faculty (not inside a department)
      const facDirectLecturers = Object.values(lecturerMap).filter(
        (l) => l.organizationId === fac.Id
      )
      const facDirectLecRows: ProgressRow[] = []
      facDirectLecturers.forEach((lec) => {
        facCompleted += lec.completed
        facTotal += lec.total

        facDirectLecRows.push({
          key: `lec_${lec.lecturerId}`,
          type: "lecturer",
          name: lec.fullName,
          completed: lec.completed,
          total: lec.total,
          indent: 1, // indent level 1 for direct lecturers
        })
      })

      console.log("Faculty Total:", {
        faculty: fac.sTen,
        completed: facCompleted,
        total: facTotal,
      })

      if (facTotal > 0) {
        resultRows.push({
          key: `fac_${fac.Id}`,
          type: "faculty",
          name: `${fac.sMa ? fac.sMa + " - " : ""}${fac.sTen}`,
          completed: facCompleted,
          total: facTotal,
          indent: 0,
        })
        resultRows.push(...deptRows)
        resultRows.push(...facDirectLecRows)
      }
    })

    // Calculate overall total
    let totalCompleted = 0
    let totalTotal = 0
    resultRows.forEach((row) => {
      if (row.type === "faculty") {
        totalCompleted += row.completed
        totalTotal += row.total
      }
    })

    if (resultRows.length > 0) {
      resultRows.push({
        key: "total_summary",
        type: "total",
        name: "Tổng:",
        completed: totalCompleted,
        total: totalTotal,
        indent: 0,
      })
    }

    console.log("lecturerMap", lecturerMap)
    console.log("progressData", resultRows)
    console.log("resultRows", resultRows)
    console.log("===== END DEBUG =====")

    return resultRows
  }, [surveys, organizations])

  const isLoading = isSurveysLoading || isOrgLoading

  if (isLoading) {
    return <div className="text-center py-4 text-primary">Đang tải bảng thống kê...</div>
  }
  if (progressData.length === 0) {
    return null
  }

  return (
    <div style={{ padding: "24px 0", marginTop: "24px" }}>
      <Title level={4} style={{ color: "#333333", marginBottom: "16px" }}>
        Tiến độ lấy ý kiến phản hồi của người học
      </Title>
      <div
        style={{
          backgroundColor: "#1e1e1e",
          padding: "24px",
          borderRadius: "8px",
          color: "#ffffff",
          fontFamily: '"Times New Roman", Times, serif',
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ffffff",
            color: "#ffffff",
            fontSize: "15px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ffffff",
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  backgroundColor: "#2d2d2d",
                  width: "70%",
                }}
              >
                Đơn vị
              </th>
              <th
                style={{
                  border: "1px solid #ffffff",
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  backgroundColor: "#2d2d2d",
                  width: "30%",
                }}
              >
                Ý kiến
              </th>
            </tr>
          </thead>
          <tbody>
            {progressData.map((row: ProgressRow) => {
              const isFaculty = row.type === "faculty"
              const isDept = row.type === "department"
              const isTotal = row.type === "total"
              const isLec = row.type === "lecturer"

              // Determine row background
              let rowBg = "#1e1e1e"
              if (isFaculty || isTotal) {
                rowBg = "#2d2d2d"
              } else if (isDept) {
                rowBg = "#252526"
              }

              // Determine text style for name
              let nameStyle: React.CSSProperties = {
                padding: "10px 16px",
                border: "1px solid #ffffff",
                textAlign: "left",
              }

              if (isFaculty || isDept || isTotal) {
                nameStyle.fontWeight = "bold"
              }

              if (isLec) {
                nameStyle.paddingLeft = `${16 + row.indent * 16}px`
                if (row.completed < row.total) {
                  nameStyle.fontStyle = "italic"
                  nameStyle.color = "#f87171"
                }
              }

              // Determine text style for opinion count
              let valueStyle: React.CSSProperties = {
                padding: "10px 16px",
                border: "1px solid #ffffff",
                textAlign: "center",
                fontWeight: isFaculty || isDept || isTotal ? "bold" : "normal",
              }

              const isCompleted = row.completed === row.total && row.total > 0
              if (isCompleted) {
                valueStyle.color = "#4ade80"
              } else if (row.total > 0) {
                valueStyle.color = "#f87171"
                if (isLec) {
                  valueStyle.fontStyle = "italic"
                }
              } else {
                valueStyle.color = "#a1a1aa"
              }

              return (
                <tr key={row.key} style={{ backgroundColor: rowBg }}>
                  <td style={nameStyle}>{row.name}</td>
                  <td style={valueStyle}>
                    {row.completed}/{row.total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
