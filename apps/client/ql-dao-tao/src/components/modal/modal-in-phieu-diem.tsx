import { PrinterOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import useScoreToWords from "@hooks/useScoreToWords"
import { useSession } from "@workspace/auth/react"
import type { Prisma, SubjectClass } from "@workspace/db/client"
import { useFindUniqueSubjectClass, useUpdateSubjectClass } from "@workspace/db/hooks"
import { getScoreStatistics } from "@workspace/libs/utils"
import { Button, Col, Modal, message, Row } from "antd"
import dayjs from "dayjs"
import { useMemo, useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
export type PutSubjectClass = SubjectClass

dayjs.locale("vi")

export enum EnumInPhieuDiem {
  PHIEU_DIEM_NHAP = 0, // In phiếu điểm nháp
  PHIEU_DIEM_KHOA = 1, // Khoá và in phiếu điểm
}

type ModalPrintToKQHTInput = {
  dataTable: DataTable[]
  type?: EnumInPhieuDiem // 1: Khoá và in phiếu điểm, 0: In phiếu điểm nháp
}

export type DataTable = Prisma.StudentSubjectScoreGetPayload<{
  include: {
    student: {
      include: {
        userProfile: true
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                scoreConverts: true
              }
            }
          }
        }
      }
    }
    subjectClass: {
      include: {
        subject: true
        semester: {
          include: {
            schoolYear: true
          }
        }
        mainLecturer: {
          include: {
            userProfile: true
          }
        }
        extraLecturer: {
          include: {
            userProfile: true
          }
        }
        enterGradeLecturer: {
          include: {
            userProfile: true
          }
        }
      }
    }
    awards: {
      include: {
        archivedAward: true
      }
    }
    certificates: {
      include: {
        archivedCertificate: true
      }
    }
  }
}>

const ModalPrintStudentSubjectScore = () => {
  const formattedDate = "..., ngày ... tháng ... năm ..."
  const printRef = useRef<HTMLDivElement>(null)
  const { getExamTypeLabel } = useExamTypeOptions()
  const { convert } = useScoreToWords()

  const { isOpen, onClose, input } = useDisclosure<ModalPrintToKQHTInput>({
    tag: "ModalPrintStudentSubjectScore",
  })

  const { data: session } = useSession()
  const profileName = session?.fullName
  const { data } = useFindUniqueSubjectClass(
    {
      where: { id: input?.dataTable?.[0]?.subjectClass?.id || "" },
      include: {
        subject: {
          include: {
            managementOrganization: true,
          },
        },
        semester: {
          include: {
            schoolYear: true,
          },
        },
        mainLecturer: {
          include: {
            userProfile: true,
          },
        },
        extraLecturer: {
          include: {
            userProfile: true,
          },
        },
        subjectClassStudent: {
          include: {
            student: {
              include: {
                fixedClass: {
                  include: {
                    trainingCourse: {
                      include: {
                        scoreConverts: true,
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
    { enabled: !!input?.dataTable?.[0]?.subjectClass?.id }
  )
  const statistics = getScoreStatistics(input?.dataTable || [])
  const firstTrainingCourse = useMemo(() => {
    return data?.subjectClassStudent.find(({ student }) =>
      Boolean(student.fixedClass?.trainingCourse)
    )?.student?.fixedClass?.trainingCourse
  }, [data?.subjectClassStudent])

  const trainingCourseSame = useMemo(() => {
    if (!data?.subjectClassStudent) return null

    const uniqTrainingCourse = new Set(
      data.subjectClassStudent.map(({ student }) => student.fixedClass?.trainingCourse?.code)
    )

    return uniqTrainingCourse.size === 1 ? [...uniqTrainingCourse][0] : null
  }, [data?.subjectClassStudent])

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

  const lockExam = async () => {
    if (data?.id) {
      await updateSubjectClass({
        where: { id: data.id },
        data: { isLockScore: true, isLockExamScore: true },
      })
      message.success("Cập nhật thành công")
    }
  }

  async function onOk({ ...rest }: PutSubjectClass) {
    try {
      showSpinner()
      if (input?.type === EnumInPhieuDiem.PHIEU_DIEM_KHOA) {
        await lockExam()
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["SubjectClass"],
      })
      handlePrint()
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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
        @page {
            size: A4;
            margin: 1cm;
        }
        @media print {
            .page-break {
                page-break-after: always;
            }
            .blank-page {
                height: 100vh;
                visibility: hidden;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
            }
        }
      `,
  })

  const basicInfoCol1 = [
    {
      title: "Mã lớp môn học:",
      value: <span className="font-medium">{data?.code || "-"}</span>,
    },
    {
      title: "Khoá:",
      value: <span>{trainingCourseSame || "-"}</span>,
    },
    {
      title: "Giảng viên:",
      value: (
        <span>
          {data?.mainLecturer?.userProfile?.fullname ||
            data?.extraLecturer?.userProfile?.fullname ||
            "-"}
        </span>
      ),
    },
    {
      title: "Khoa:",
      value: <span>{data?.subject?.managementOrganization?.sTen || "-"}</span>,
    },
    {
      title: "Hình thức thi:",
      value: <span>{getExamTypeLabel(data?.examType)}</span>,
    },
  ]

  const basicInfoCol2 = [
    {
      title: "Tên lớp môn học:",
      value: <span>{data?.name || "-"}</span>,
    },
    {
      title: "Số tín chỉ:",
      value: <span>{data?.subject?.credit || "-"}</span>,
    },
    {
      title: "Ngày thi:",
      value: <span>{data?.examDate ? dayjs(data?.examDate).format("DD/MM/YYYY") : "-"}</span>,
    },
    {
      title: "Quân số:",
      value: <span>{data?.subjectClassStudent?.length || "-"}</span>,
    },
  ]

  const scoreCoefs = useMemo(
    () => [
      {
        title: "Hệ số điểm thường xuyên:",
        value: firstTrainingCourse?.coef_1 ?? "-",
      },
      {
        title: "Hệ số điểm định kỳ:",
        value: firstTrainingCourse?.coef_2 ?? "-",
      },
      {
        title: "Hệ số điểm thi:",
        value: firstTrainingCourse?.coef_3 ?? "-",
      },
    ],
    [firstTrainingCourse]
  )

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>
            {input?.type === EnumInPhieuDiem.PHIEU_DIEM_NHAP
              ? "In phiếu điểm nháp"
              : "Khoá và in phiếu điểm"}
          </span>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => {
              if (input?.type === EnumInPhieuDiem.PHIEU_DIEM_KHOA) {
                Modal.confirm({
                  title: "Xác nhận khoá điểm",
                  content: "Bạn có chắc chắn muốn khoá điểm lớp môn học này không?",
                  okText: "Xác nhận",
                  cancelText: "Hủy",
                  onOk: () => onOk(data as PutSubjectClass),
                })
              } else {
                handlePrint()
              }
            }}
            size="small"
            type="primary"
          >
            In
          </Button>
        </div>
      }
    >
      <div
        ref={printRef}
        className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman !text-black"
      >
        <div className="text-center font-bold uppercase">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-normal">BỘ QUỐC PHÒNG</span>
              <span>HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
              <hr className="text-black border-[1px] mx-14" />
            </div>
            <div className="flex flex-col">
              <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
              <span className="normal-case">Độc lập - Tự do - Hạnh phúc</span>
              <hr className="text-black border-[1px] mx-14" />
            </div>
          </div>
          {input?.type === EnumInPhieuDiem.PHIEU_DIEM_NHAP ? (
            <div className="font-normal border max-w-32 ml-10 mt-5 text-[18px] border-black">
              Bản nháp
            </div>
          ) : (
            ""
          )}
          <div className="mt-4 uppercase text-[20px]">Phiếu điểm</div>
          <div className="text-sm normal-case font-normal italic">
            {`(${data?.semester?.name})`}
          </div>
        </div>
        <div className="flex justify-between gap-5 mt-6">
          <div className="flex flex-col gap-2.5 w-[50%]">
            {basicInfoCol1?.filter(Boolean).map((item, index) => (
              <div key={item?.title || index} className="flex gap-2 w-full">
                <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                <span className="text-sm font-semibold">{item?.value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 w-[50%]">
            {basicInfoCol2?.filter(Boolean).map((item, index) => (
              <div key={item?.title || index} className="flex gap-2 w-full">
                <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                <span className="text-sm font-semibold">{item?.value}</span>
              </div>
            ))}
          </div>
        </div>
        <Row gutter={[16, 8]} className="pt-2.5">
          {scoreCoefs.map((item) => (
            <Col span={8} key={item.title}>
              <div className="flex gap-1 items-center">
                <span className="text-[#656565] text-sm font-time-news-roman">{item.title}</span>
                <span className="text-sm font-semibold font-time-news-roman">
                  {item.value.toString()}
                </span>
              </div>
            </Col>
          ))}
        </Row>
        <div className="overflow-x-auto text-sm mt-6">
          <table className="w-full border border-black border-collapse">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-black px-1 py-1 w-[40px] text-center">
                  TT
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 text-center w-[100px]">
                  Mã định danh
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 text-center w-[200px]">
                  Họ tên
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 text-center w-[100px]">
                  Ngày sinh
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 text-center w-[100px]">
                  Lớp
                </th>
                <th colSpan={2} className="border border-black px-1 py-1 text-center">
                  Điểm
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 text-center w-[60px]">
                  Điểm thi
                </th>
                <th colSpan={3} className="border border-black px-1 py-1 text-center">
                  Điểm học phần
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 text-center w-[100px]">
                  Ghi chú
                </th>
              </tr>
              <tr>
                <th className="border border-black px-1 py-1 w-[60px] text-center">C.cần</th>
                <th className="border border-black px-1 py-1 w-[60px] text-center">T.xuyên</th>
                <th className="border border-black px-1 py-1 w-[60px] text-center">Số</th>
                <th className="border border-black px-1 py-1 w-[60px] text-center">TC</th>
                <th className="border border-black px-1 py-1 w-[100px] text-center">Bằng chữ</th>
              </tr>
            </thead>
            <tbody>
              {input?.dataTable?.map((item, index: number) => (
                <tr key={item.id}>
                  <td className="border border-black text-center">{index + 1}</td>
                  <td className="border border-black text-center">{item?.student?.userProfile?.code}</td>
                  <td className="border border-black text-left px-1">
                    {item?.student?.userProfile?.fullname}
                  </td>
                  <td className="border border-black text-center">
                    {item?.student?.userProfile?.dateOfBirth
                      ? dayjs(item?.student?.userProfile?.dateOfBirth).format("DD/MM/YYYY")
                      : ""}
                  </td>
                  <td className="border border-black text-center">
                    {item?.student?.fixedClass?.code}
                  </td>
                  <td className="border border-black text-center">{item?.attendanceScore}</td>
                  <td className="border border-black text-center">{item?.midtermScore}</td>
                  <td className="border border-black text-center">{item?.examScore}</td>
                  <td className="border border-black text-center">
                    {item?.manualFinalScore || item?.finalScore?.toString()}
                  </td>
                  <td className="border border-black text-center">{""}</td>
                  <td className="border border-black text-left">
                    {((item?.attendanceScore && item?.midtermScore && item?.examScore) ||
                      item?.manualFinalScore ||
                      item?.finalScore) &&
                      convert(item?.manualFinalScore || item?.finalScore?.toNumber() || 0)}
                  </td>
                  <td className="border border-black text-left">
                    {(() => {
                      const statusTexts = []

                      if (item.examPostponed) statusTexts.push("Hoãn thi")
                      if (item.exempted) statusTexts.push("Miễn học")
                      if (item.withdrew) statusTexts.push("Rút khỏi")
                      if (item.examBanned) statusTexts.push("Cấm thi")
                      if (item.suspended) statusTexts.push("Đình chỉ")

                      return statusTexts.length > 0 ? statusTexts.join(", ") : null
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <div className="flex gap-2 flex-wrap">
            <span className="font-bold">Tổng hợp kết quả thi:</span>
            {Object.entries(statistics).map(([type, { count, percentage }]) => (
              <span key={type} className={type.includes("Không đạt") ? "text-red-600" : ""}>
                {type}: {count}= {percentage}%
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3">Người in: {profileName}</div>

        <Row gutter={[16, 0]} className="mt-6 text-center">
          <Col span={8} className="flex flex-col items-center justify-center">
            <div className="italic text-left">{formattedDate}</div>
            <div className="uppercase font-bold">
              <span>Phòng khảo thí & dbcl gd-đt</span>
              <br />
              <span>(hoặc chủ nhiệm bộ môn)</span>
            </div>
            <span>(Ký và ghi rõ họ tên)</span>
          </Col>

          <Col span={8}>
            <div className="uppercase font-bold mt-6">
              <span>Giảng viên chấm thi</span>
            </div>
            <span>(Ký và ghi rõ họ tên)</span>
          </Col>

          <Col span={8}>
            <div className="uppercase font-bold mt-6">
              <span>cơ quan đào tạo</span>
            </div>
            <span>(Ký và ghi rõ họ tên)</span>
          </Col>
        </Row>
      </div>
      <style>
        {`
            @media print {
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    page-break-after: auto;
                    background: white;
                    overflow: visible;
                }
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            @page {
                size: A4;
            }
            @media screen {
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    margin: 10px auto;
                    padding: 20mm;
                    background: white;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
            }
            `}
      </style>
    </Modal>
  )
}

export default ModalPrintStudentSubjectScore
