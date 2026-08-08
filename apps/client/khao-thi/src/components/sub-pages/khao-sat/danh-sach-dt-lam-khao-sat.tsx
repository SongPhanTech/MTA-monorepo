import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import type { FilterProps } from "@components/commons/typeFilter"
import ExportObjectInSurvey from "@components/modal/export-list-object-in-survey"
import { DEFAULT_PAGINATE_SIZE, SURVEY_STUDENT_OBJECT_TYPES } from "@constants/constants"
import { useSession } from "@workspace/auth/react"
import type { Survey, SurveyObjectType, SurveyObject } from "@workspace/db"
import { useFindManyFixedClass, useFindManyTrainingCourse } from "@workspace/db/hooks"
import { useGetSurveyObjects } from "@workspace/libs/api/exam"
import { useAbility } from "@workspace/permissions/hooks"
import { KHAO_THI_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Dropdown, Flex, Row, Tag, Tooltip } from "antd"
import { Document, Table as DocxTable, Packer, Paragraph, TableCell, TableRow, TextRun } from "docx"
import { saveAs } from "file-saver"
import { Eye } from "lucide-react"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

// Survey kèm relation surveyObjectType (runtime data có sẵn nhưng scalar type không include)
type SurveyWithObjectType = Survey & {
  surveyObjectType?: (SurveyObjectType & { type: SurveyObject[] })[]
}

function DanhSachDoiTuong({ selectedId }: { selectedId: Survey | null }) {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || ""
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [filters, setFilters] = useState<FilterProps>({
    fullname: undefined,
    studentCode: undefined,
    lecturerCode: undefined,
    idCardNumber: undefined,
    phoneNumber: undefined,
    taken: undefined,
    fixedClassIds: undefined,
    trainingCourseIds: undefined,
    organization: undefined,
    isStudent: "all",
  })

  const STUDENT_TYPES: SurveyObject[] = SURVEY_STUDENT_OBJECT_TYPES
  const LECTURER_TYPES: SurveyObject[] = ["LECTURER", "STAFF"]

  // Kiểm tra từng loại đối tượng trong đợt khảo sát
  const { hasLecturer, hasStudent } = useMemo(() => {
    const objectTypes = (selectedId as SurveyWithObjectType)?.surveyObjectType
    if (!objectTypes?.length) return { hasLecturer: false, hasStudent: false }
    const allTypes: SurveyObject[] = objectTypes.flatMap((o) =>
      Array.isArray(o.type) ? o.type : []
    )
    return {
      hasLecturer: allTypes.some((t) => LECTURER_TYPES.includes(t)),
      hasStudent: allTypes.some((t) => STUDENT_TYPES.includes(t)),
    }
  }, [selectedId])

  // Chỉ giảng viên (không có học viên)
  const isLecturerOnly = hasLecturer && !hasStudent
  // Có cả giảng viên lẫn học viên
  const isMixed = hasLecturer && hasStudent

  // Tiêu đề cột mã theo từng trường hợp
  const codeColumnTitle = isLecturerOnly ? "Mã GV" : isMixed ? "Mã HV/GV" : "Mã HV"

  // Tự động set bộ lọc isStudent khi đổi đợt khảo sát
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      isStudent: isLecturerOnly ? "lecturer" : "all",
    }))
  }, [isLecturerOnly, selectedId?.id])
  const router = useRouter()
  const { onOpen: openPrint } = useDisclosure({
    tag: "ModalPrintDanhSachDoiTuong",
  })
  const { data: fixedClasses = [] } = useFindManyFixedClass({
    where: {
      trainingCourse: {
        trainingObjectTypeId,
      },
    },
    orderBy: { name: "asc" },
  })
  const { data: trainingCourses = [], isLoading: trainingCoursesLoading } =
    useFindManyTrainingCourse({
      where: {
        trainingObjectTypeId,
      },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    })

  const { data: res } = useGetSurveyObjects({
    limit: numberOfPages || DEFAULT_PAGINATE_SIZE,
    page: currentPage || 1,
    id: selectedId?.id || "",
    fullname: filters.fullname,
    lecturerCode: filters.lecturerCode,
    studentCode: filters.studentCode,
    fixedClassIds: filters.fixedClassIds,
    trainingCourseIds: filters.trainingCourseIds,
    organizationId: filters.organization,
    taken: filters?.taken && filters?.taken?.length === 1 ? filters.taken[0] : undefined,
    isStudent: filters?.isStudent,
  })

  const data = useMemo(() => {
    if (res?.status === 200) {
      return res?.data
    }
    return
  }, [res])

  const { onOpen } = useDisclosure<{ userId: string; surveyId: string; userName?: string }>({
    tag: "ReviewSurveyModal",
  })

  const exportWord = async () => {
    if (!data?.data?.length) return

    const centerCell = (text = "") =>
      new TableCell({
        children: [
          new Paragraph({
            alignment: "center",
            text,
          }),
        ],
      })

    const rows = [
      // ===== HEADER =====
      new TableRow({
        children: [
          centerCell("STT"),
          centerCell("Mã HV/GV"),
          centerCell("Họ tên"),
          centerCell("CCCD"),
          centerCell("SĐT"),
          centerCell("ĐVQL"),
          centerCell("Lớp QL"),
          centerCell("Khoá"),
          centerCell("Trạng thái KS"),
        ],
      }),

      // ===== DATA =====
      ...data.data.map(
        (record, index) =>
          new TableRow({
            children: [
              centerCell(String(index + 1)),
              centerCell(record?.educationAndTraining?.[0]?.code || record?.lecturer?.code || ""),
              centerCell(`${record?.lastName || ""} ${record?.firstName || ""}`),
              centerCell(record?.idCardNumber || ""),
              centerCell(record?.phoneNumber || ""),
              centerCell(record?.lecturer?.organization?.sMa || ""),
              centerCell(record?.educationAndTraining?.[0]?.fixedClass?.code || ""),
              centerCell(
                (record?.educationAndTraining?.[0]?.fixedClass as any)?.trainingCourse?.name || ""
              ),
              centerCell(record?.surveySession ? "Đã làm" : "Chưa làm"),
            ],
          })
      ),
    ]

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { orientation: "landscape" },
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children: [
            new Paragraph({
              alignment: "center",
              spacing: { after: 300 },
              children: [
                new TextRun({
                  text: `Danh sách đối tượng khảo sát: ${selectedId?.name || ""}`,
                  bold: true,
                }),
              ],
            }),
            new DocxTable({
              width: { size: 100, type: "pct" },
              rows,
            }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, "danh-sach-doi-tuong-khao-sat.docx")
  }

  return (
    <div>
      <Row gutter={[16, 4]}>
        <Col span={24}>
          <Flex justify="end" gap={8} align="center">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "print",
                    label: "In danh sách",
                    icon: <PrinterOutlined />,
                    onClick: () =>
                      openPrint({
                        surveyName: selectedId?.name,
                        data: data?.data,
                      }),
                  },
                  {
                    key: "word",
                    label: "Xuất Word",
                    icon: <DownloadOutlined />,
                    onClick: exportWord,
                  },
                  {
                    key: "excel",
                    label: (
                      <ExportObjectInSurvey
                        query={{
                          limit: data?.count || 10,
                          page: 1,
                          id: selectedId?.id,
                          fullname: filters.fullname,
                          lecturerCode: filters.lecturerCode,
                          studentCode: filters.studentCode,
                          fixedClassIds: filters.fixedClassIds,
                          trainingCourseIds: filters.trainingCourseIds,
                          organizationId: filters.organization,
                          taken:
                            filters?.taken && filters?.taken?.length === 1
                              ? filters.taken[0]
                              : undefined,
                          isStudent: filters?.isStudent,
                        }}
                        surveyName={selectedId?.name || ""}
                      />
                    ),
                  },
                ],
              }}
            >
              <Button type="primary" size="small">
                Xuất dữ liệu
              </Button>
            </Dropdown>

            {!isLecturerOnly && (
              <>
                <Button
                  color="primary"
                  onClick={() => {
                    setFilters({ ...filters, isStudent: "all" })
                  }}
                  variant="solid"
                  size="small"
                >
                  Tất cả
                </Button>
                <Button
                  color="primary"
                  onClick={() => {
                    setFilters({ ...filters, isStudent: "student" })
                  }}
                  variant="solid"
                  size="small"
                >
                  Học viên
                </Button>
              </>
            )}
            <Button
              color="primary"
              onClick={() => {
                setFilters({ ...filters, isStudent: "lecturer" })
              }}
              variant="solid"
              size="small"
            >
              Giảng viên
            </Button>
          </Flex>
        </Col>
        <Col span={24}>
          <Table
            className="h-[calc(100vh-230px)]"
            rowKey={"id"}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: codeColumnTitle,
                dataIndex: "studentCode",
                type: "input",
                width: 125,
                render: (_, record) =>
                  record?.educationAndTraining?.length > 0
                    ? record?.educationAndTraining[0]?.code
                    : record?.lecturer?.code
                      ? record?.lecturer?.code
                      : "",
              },
              // {
              //     title: 'Mã GV',
              //     dataIndex: 'lecturerCode',
              //     type: 'input',
              //     width: 125,
              //     render: (_, record) => record?.lecturer?.code || '',
              // },
              {
                title: "Người làm khảo sát",
                dataIndex: "fullname",
                type: "input",
                width: 250,
                render: (_, record) => {
                  return `${record?.lastName || ""} ${record?.firstName || ""}`
                },
              },
              {
                title: "CCCD",
                dataIndex: "idCardNumber",
                type: "input",
                align: "center",
                width: 100,
                render: (_, record) => record?.idCardNumber || "",
              },
              {
                title: "SĐT",
                dataIndex: "phoneNumber",
                type: "input",
                align: "center",
                width: 100,
                render: (_, record) => record?.phoneNumber || "",
              },
              {
                title: "ĐVQL",
                dataIndex: "organizationId",
                type: "input",
                width: 100,
                align: "center",
                render: (_, record) => record?.lecturer?.organization?.sMa || "",
              },
              {
                title: "Lớp QL",
                dataIndex: "fixedClassIds",
                width: 100,
                type: "select",
                align: "center",
                hidden: isLecturerOnly,
                options: fixedClasses?.map((fc) => ({ value: fc.id, label: fc.name })) || [],
                render: (_, record) =>
                  record?.educationAndTraining?.length > 0
                    ? `${record?.educationAndTraining[0]?.fixedClass?.code || ""}`
                    : "",
              },
              {
                title: "Khoá",
                dataIndex: "trainingCourseIds",
                type: "select",
                align: "center",
                width: 100,
                hidden: isLecturerOnly,
                options:
                  trainingCourses?.map((tc) => ({
                    value: tc.id,
                    label: tc.name,
                  })) || [],
                render: (_, record) =>
                  record?.educationAndTraining?.length > 0
                    ? `${record?.educationAndTraining[0]?.fixedClass?.trainingCourse?.name || ""}`
                    : "",
              },
              {
                title: "Trạng thái KS",
                dataIndex: "taken",
                align: "center",
                type: "select",
                width: 120,
                options: [
                  {
                    value: true,
                    label: "Đã làm",
                  },
                  {
                    value: false,
                    label: "Chưa làm",
                  },
                ],
                render: (_, record) => {
                  return (
                    <Tag color={record?.surveySession ? "green" : "red"}>
                      {record?.surveySession ? "Đã làm" : "Chưa làm"}
                    </Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                align: "center",
                width: 80,
                hidden: !can(
                  KHAO_THI_PERMISSION.KHAO_THI_BAO_CAO_KHAO_SAT_GIANG_VIEN,
                  "XEM_CHI_TIET"
                ),
                render: (_, record) => (
                  <Row className="justify-center gap-0">
                    {can(
                      KHAO_THI_PERMISSION.KHAO_THI_BAO_CAO_KHAO_SAT_GIANG_VIEN,
                      "XEM_CHI_TIET"
                    ) && (
                      <Tooltip title="Xem khảo sát" placement="top">
                        <Eye
                          className="m-0"
                          size={14}
                          onClick={() => {
                            onOpen({
                              userId: record?.id,
                              surveyId: selectedId?.id || "",
                              userName: `${record?.lastName || ""} ${record?.firstName || ""}`,
                            })
                          }}
                        />
                      </Tooltip>
                    )}
                  </Row>
                ),
              },
            ]}
            data={data?.data || []}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: data?.count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

export default DanhSachDoiTuong
