import { formatDateInSlash, formatThangIn } from "@workspace/libs/timezone"
import { PrinterOutlined } from "@ant-design/icons"
import { useFindManyInvitation } from "@workspace/db/hooks"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

const ModalPrintInvitation = () => {
  const printRef = useRef<HTMLDivElement>(null)
  const { isOpen, onClose, input } = useDisclosure<{
    councilMemberIds: string[]
  }>({
    tag: "ModalPrintInvitation",
  })

  const { data: invitationData = [] } = useFindManyInvitation(
    {
      where: {
        councilMemberId: { in: input?.councilMemberIds },
      },
      include: {
        councilMember: {
          include: {
            expertProfileVersion: true,
            expert: {
              include: {
                currentVersion: true,
                lecturer: { include: { userProfile: true } },
              },
            },
            council: {
              include: {
                thesis: {
                  include: {
                    registrations: {
                      include: {
                        student: {
                          include: {
                            userProfile: true,
                            fixedClass: {
                              include: { trainingCourse: true },
                            },
                          },
                        },
                      },
                    },
                    room: true,
                    defenseSession: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    { enabled: !!input?.councilMemberIds }
  )

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

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>Danh sách giấy mời</span>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman">
        {invitationData.map((invitation, index: number) => (
          <div key={invitation.id}>
            <div className="text-center font-bold uppercase">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-normal">BỘ QUỐC PHÒNG</span>
                  <span className="leading-none">HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
                  <hr className="border-t-[1px] border-black mx-14" />
                </div>
                <div className="flex flex-col">
                  <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                  <span className="normal-case leading-none">Độc lập - Tự do - Hạnh phúc</span>
                  <hr className="border-t-[1px] border-black mx-14" />
                  <div className="font-normal normal-case italic mt-1">
                    Hà Nội, ngày {dayjs().format("DD")} tháng {formatThangIn(dayjs().month() + 1)}{" "}
                    năm {dayjs().format("YYYY")}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[20px]">Giấy mời</div>
              <div className="font-semibold normal-case text-[20px] leading-none">
                Tham gia hội đồng bảo vệ luận văn
              </div>
              <hr className="border-t-[1px] border-black w-[240px] mx-auto" />

              <div className="mt-4 text-[20px]">Giám đốc học viện kỹ thuật quân sự</div>
              <div className="text-left font-normal normal-case text-[18px] indent-6">
                Trân trọng kính mời Ông/bà:{" "}
                <strong className="uppercase">
                  {invitation?.councilMember?.expertProfileVersion?.name ||
                    invitation?.councilMember?.expert?.currentVersion?.name ||
                    invitation?.councilMember?.expert?.lecturer?.userProfile?.fullname}
                </strong>{" "}
                tham gia hội đồng phản biện luận văn
              </div>
              <div className="text-left font-normal normal-case text-[18px] indent-6">Ngành:</div>
              <div className="text-left font-normal normal-case text-[18px] indent-6">
                Đề tài: {invitation?.councilMember?.council?.thesis?.[0]?.title}
              </div>
              <div className="text-left font-normal normal-case text-[18px] indent-6">
                Người thực hiện:{" "}
                {invitation?.councilMember?.council?.thesis?.[0]?.registrations
                  .map((registration) => {
                    const fullname = registration.student?.userProfile?.fullname
                    const dateOfBirth = registration.student?.userProfile?.dateOfBirth
                    const trainingCourse = registration.student?.fixedClass?.trainingCourse
                    return `${fullname}${
                      dateOfBirth
                        ? `, sinh ngày ${formatDateInSlash(dateOfBirth)}
                                        ${trainingCourse ? `, ${trainingCourse.name}(${trainingCourse.startYear}-${trainingCourse.endYear})` : ""}`
                        : ""
                    }`
                  })
                  .join(". ")}
              </div>
              <div className="text-left font-normal normal-case text-[18px] indent-6">
                Thời gian tiến hành:{" "}
                {invitation.councilMember.council.thesis?.[0].defenseSession?.startTime
                  ? dayjs(
                      invitation.councilMember.council.thesis[0].defenseSession.startTime
                    ).format("HH:mm")
                  : ""}{" "}
                {"  "}
                {invitation.councilMember.council.thesis?.[0].defenseDate
                  ? dayjs(invitation.councilMember.council.thesis[0].defenseDate).format(
                      "DD/MM/YYYY"
                    )
                  : ""}
              </div>
              <div className="text-left font-normal normal-case text-[18px] indent-6">
                Địa điểm: {invitation.councilMember.council.thesis?.[0].room?.name}
              </div>
              <div className="text-left font-normal normal-case text-[18px]">
                Rất mong nhận được sự giúp đỡ của Ông/bà. Xin trân trọng cảm ơn.
              </div>
            </div>
            <div className="overflow-x-auto my-6 flex justify-end">
              <div className="flex flex-col text-center">
                <div className="font-bold flex flex-col text-[18px]">
                  <span className="uppercase">GIÁM ĐỐC</span>
                  <span className="h-10"> </span>
                  <span>Trung tướng Lê Minh Thái</span>
                </div>
              </div>
            </div>
            {index < invitationData.length - 1 && <div className="page-break" />}
          </div>
        ))}
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

export default ModalPrintInvitation
