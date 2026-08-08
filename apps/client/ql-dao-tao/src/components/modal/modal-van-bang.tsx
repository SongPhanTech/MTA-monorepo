import useSpinner from "@hooks/spinner"
import { useFindUniqueStudent, useUpdateGraduationDecision } from "@workspace/db/hooks"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Button, Checkbox, Input, Modal, message, Space } from "antd"
import dayjs from "dayjs"
import { Printer } from "lucide-react"
import { useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

export const ModalVanBang = () => {
  const formattedDate = `Hà Nội, ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}`
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "ModalVanBang",
  })
  const [signerName, setSignerName] = useState("Đại tá Trần Ngọc Châu")
  const [checkedItems, setCheckedItems] = useState({
    front: true,
    back: true,
  })
  const { data } = useFindUniqueStudent(
    {
      where: { id },
      include: {
        userProfile: true,
        graduationDecision: { include: { diplomaFront: true, diplomaBack: true } },
      },
    },
    { enabled: !!id }
  )

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Van_bang_${data?.id}_${data?.userProfile?.fullname}.pdf`,
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
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateGraduationDecision } = useUpdateGraduationDecision()

  const handlePrintVanBang = async () => {
    handlePrint()
    try {
      showSpinner()
      await updateGraduationDecision({
        where: {
          id: data?.graduationDecision?.id,
        },
        data: {
          totalCopy: (data?.graduationDecision?.totalCopy ?? 0) + 1,
        },
      })
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

  return (
    <Modal
      title="Văn bằng"
      open={isOpen}
      onCancel={onClose}
      width="80vw"
      style={{ maxWidth: "1200px" }}
      footer={null}
    >
      <div className="space-y-4">
        <div className="flex justify-between w-full mb-4">
          <Input
            placeholder="Nhập tên người ký"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-64"
          />
          <Space>
            <Button type="primary" onClick={() => handlePrintVanBang()} icon={<Printer />}>
              Sao lưu văn bằng
            </Button>
          </Space>
        </div>

        <div
          ref={printRef}
          className="!font-time-news-roman text-black bg-white p-6"
          style={{ fontSize: "16px", lineHeight: "1.5" }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <div className="flex gap-2 w-full items-center">
                <Checkbox
                  className="print:hidden"
                  checked={checkedItems.front}
                  onChange={(e) =>
                    setCheckedItems((prev) => ({
                      ...prev,
                      front: e.target.checked,
                    }))
                  }
                />
                <strong className={`${!checkedItems.front ? "print:hidden" : ""}`}>
                  Phôi mặt trước
                </strong>
              </div>
              {data?.graduationDecision?.diplomaFront?.path ? (
                <img
                  src={`${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${data.graduationDecision.diplomaFront.path}`}
                  alt={data.graduationDecision.diplomaFront.name}
                  className={`max-w-full h-auto mx-auto object-contain block ${!checkedItems.front ? "print:hidden" : ""}`}
                  style={{ maxHeight: "25vh" }}
                />
              ) : (
                <div
                  className={`w-full h-24 flex items-center justify-center border border-dashed rounded text-gray-400 my-2 print:hidden ${!checkedItems.front ? "print:hidden" : ""}`}
                >
                  Chưa tải lên phôi mặt trước
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-2 w-full items-center">
                <Checkbox
                  className="print:hidden"
                  checked={checkedItems.back}
                  onChange={(e) =>
                    setCheckedItems((prev) => ({
                      ...prev,
                      back: e.target.checked,
                    }))
                  }
                />
                <strong className={`${!checkedItems.back ? "print:hidden" : ""}`}>
                  Phôi mặt sau
                </strong>
              </div>
              {data?.graduationDecision?.diplomaBack?.path ? (
                <img
                  src={`${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${data.graduationDecision.diplomaBack.path}`}
                  alt={data.graduationDecision.diplomaBack.name}
                  className={`max-w-full h-auto mx-auto object-contain block ${!checkedItems.back ? "print:hidden" : ""}`}
                  style={{ maxHeight: "25vh" }}
                />
              ) : (
                <div
                  className={`w-full h-24 flex items-center justify-center border border-dashed rounded text-gray-400 my-2 print:hidden ${!checkedItems.back ? "print:hidden" : ""}`}
                >
                  Chưa tải lên phôi mặt sau
                </div>
              )}
            </div>
          </div>

          <div className="print:block hidden">
            <div className="border-b border-black py-5" />
            <table className="w-full border-separate border-spacing-0 mb-2">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-center">
                    <span className="uppercase">
                      Bộ Quốc Phòng <br />
                      <span className="font-bold relative inline-block">
                        Học viện Kỹ thuật Quân sự
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1/2 border-b border-black" />
                      </span>
                    </span>
                  </td>

                  <td className="align-top w-1/2 p-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold uppercase">Trích sao</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-center">
                    <span>Số:</span>
                    <span className="italic inline-block w-20" />
                    <span>/TRS-HV</span>
                  </td>

                  <td className="align-top w-1/2 p-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="italic">{formattedDate}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-left">
                    <span className="italic font-bold">Nơi nhận:</span>
                    <ul className="list-none">
                      <li>- Thành viên Hội đồng (05);</li>
                      <li>- Hồ sơ bảo vệ (01);</li>
                      <li>- Lưu: QL/P7. Th07.</li>
                    </ul>
                  </td>

                  <td className="align-top w-1/2 p-2 text-center">
                    <div className="flex flex-col items-center font-bold uppercase">
                      <span>TL. GIÁM ĐỐC</span>
                      <span>KT. Trưởng phòng sau đại học</span>
                      <span>Phó trưởng phòng</span>
                    </div>
                    <div className="h-20" />
                    <span className="font-bold">{signerName}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalVanBang
