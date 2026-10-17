import { formatDateInSlash, formatThangIn } from "@workspace/libs/timezone"
import { PrinterOutlined } from "@ant-design/icons"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { data, data2, data3 } from "@/utils/dataFake"

dayjs.locale("vi")

const MISSING_DATE = "- -"

function formatDateOrPlaceholder(value: Date | string | null | undefined, format: string) {
  if (!value) return MISSING_DATE
  if (format === "DD/M/YYYY") return formatDateInSlash(value) || MISSING_DATE
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(format) : MISSING_DATE
}

type ModalSoYeuLyLichInput = {
  id: string
}

const ModalSoYeuLyLich = () => {
  const formattedDate = `..., Ngày ${dayjs().format("DD")} tháng ${formatThangIn(dayjs().month() + 1)} năm ${dayjs().format("YYYY")}`
  const printRef = useRef<HTMLDivElement>(null)

  const { isOpen, onClose, input } = useDisclosure<ModalSoYeuLyLichInput>({
    tag: "ModalSoYeuLyLich",
  })

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

  const { data: initialData } = useFindUniqueUserProfile(
    {
      where: {
        id: input?.id,
      },
      include: {
        religion: true,
        ethnicity: true,
        trinhDoHocVan: true,
        chuyenMonKyThuat: true,
        chiHuyQuanLy: true,
        ngoaiNgu: {
          include: {
            ngonNgu: true,
            trinhDo: true,
          },
        },
        tiengDanToc: {
          include: {
            danToc: true,
          },
        },
        trinhDoLyLuanChinhTri: {
          include: {
            trinhDo: true,
          },
        },
        quaTrinhHocTap: {
          include: {
            tenTruong: true,
            nganhHoc: true,
            chuyenNganh: true,
          },
        },
        chienDau: true,
        diNuocNgoai: {
          include: {
            tenNuoc: true,
          },
        },
        sucKhoe: true,
        nhomMau: true,
        thuongTat: {
          include: {
            loai: true,
          },
        },
        danhHieu: true,
        khenThuong: {
          include: {
            hinhThucKhenThuong: true,
          },
        },
        kyLuat: true,
        quaTrinhCongTac: {
          include: {
            chucVu: true,
          },
        },
        capBac: {
          include: {
            capBac: true,
          },
        },
        relatives: {
          include: {
            quanHeThanNhan: true,
          },
        },
        gender: true,
        tinHoc: {
          include: {
            dM_TrinhDoTinHoc: true,
          },
        },
        positionCPV: true,
        hocHam: {
          include: {
            academicRankType: true,
          },
        },
        hocVi: {
          include: {
            academicDegreeType: true,
          },
        },
      },
    },
    { enabled: !!input?.id }
  )

  const formatAcademicInfo = () => {
    const academicInfo = []

    const hocVi = initialData?.hocVi?.[0]?.academicDegreeType?.sTen
    if (hocVi) {
      academicInfo.push(hocVi)
    }

    const hocHam = initialData?.hocHam?.[0]?.academicRankType?.sTen
    if (hocHam) {
      academicInfo.push(hocHam)
    }

    const danhHieu = initialData?.danhHieu?.map((item) => item.ten).filter(Boolean)
    if (danhHieu && danhHieu.length > 0) {
      academicInfo.push(...danhHieu)
    }

    return academicInfo.length > 0 ? academicInfo.join(", ") : ""
  }

  const totalRows = Math.max(5, data.length)
  const filledRows = [...data, ...Array(totalRows - data.length).fill({})]

  const totalRows2 = Math.max(9, data2.length)
  const filledRows2 = [...data2, ...Array(totalRows2 - data2.length).fill({})]

  const totalRows3 = Math.max(5, data3.length)
  const filledRows3 = [...data, ...Array(totalRows3 - data3.length).fill({})]

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>Modal sơ yếu lý lịch</span>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div
        ref={printRef}
        className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman flex flex-col gap-2 page-1"
      >
        <div className="flex gap-2">
          <div className="border border-solid border-black min-w-[113px] min-h-[151px] flex items-center justify-center">
            {initialData?.avatar ? (
              <img
                src={getMinioUrl(initialData?.avatar) || ""}
                alt="avatar"
                className="border border-solid border-black w-[113px] h-[151px]"
              />
            ) : (
              <>
                Ảnh màu <br /> (4 x 6 cm)
              </>
            )}
          </div>
          <div className="w-full">
            <div className="uppercase flex w-full leading-[12px] mb-4 justify-center font-bold text-center">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="flex w-full leading-[12px] mb-4 justify-center font-bold text-center">
              Độc lập - Tự do- Hạnh phúc
            </div>
            <br />
            <br />
            <div className="uppercase flex w-full leading-[12px] mb-4 justify-center font-bold text-2xl">
              SƠ YẾU LÝ LỊCH
            </div>
          </div>
        </div>

        <div className="uppercase flex w-full leading-[12px] mb-4 font-bold">
          I. THÔNG TIN BẢN THÂN.
        </div>

        <div className="flex gap-2">
          <div className="w-full flex flex-col items-start justify-center">
            <p className="flex w-full leading-[12px] mb-4">
              1. Họ và tên (chữ in hoa): {initialData?.fullname}
              <span className="inline-block flex-1" />, Giới tính (nam, nữ):{" "}
              {initialData?.gender?.sTen}
              <span className="inline-block w-32 flex-2 " />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              2. Họ tên thường dùng: {initialData?.hoTenThuongDung}
              <span className="inline-block flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              3. Sinh ngày: {formatDateOrPlaceholder(initialData?.dateOfBirth, "DD")}
              <span className="inline-block w-14 flex-1 " />
              tháng: {formatDateOrPlaceholder(initialData?.dateOfBirth, "M")}
              <span className="inline-block w-12 flex-1" />
              năm: {formatDateOrPlaceholder(initialData?.dateOfBirth, "YYYY")}
              <span className="inline-block w-16 flex-1" />
            </p>

            <p className="flex w-full leading-[12px] mb-4">
              4. Nơi sinh: {initialData?.placeOfBirth}
              <span className="inline-block w-40 flex-" />
            </p>

            <p className="flex w-full leading-[12px] mb-4">
              5. Nguyên quán: {initialData?.originalPlace}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              6. Nơi đăng ký hộ khẩu thường trú: {initialData?.permanentAddress}
              <span className="inline-block w-40 flex-1 " />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              7. Chỗ ở hiện nay: {initialData?.currentAddress}
              <span className="inline-block w-40 flex-1 " />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              8. Điện thoại liên hệ: {initialData?.phoneNumber}
              <span className="inline-block w-40 flex-1 " />
              Email: {initialData?.email}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              9. Dân tộc: {initialData?.ethnicity?.sTen}
              <span className="inline-block w-40 flex-1 " />
              Tôn giáo: {initialData?.religion?.sTen}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              10. Thành phần gia đình: {initialData?.thanhPhanGiaDinh}
              <span className="inline-block w-40 flex-1 " />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              11. Số CMND/CCCD: {initialData?.idCardNumber}
              <span className="inline-block w-40 flex-1 " />
              Ngày cấp:{" "}
              {initialData?.idCardDate ? formatDateInSlash(initialData?.idCardDate) : null}
              <span className="inline-block w-40 flex-1 " />
              Nơi cấp: {initialData?.placeOfIdCardNumber}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              12. Trình độ chuyên môn:
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              12.1 Đại học:
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              Ngành
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
              Chuyên ngành
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
              Nơi đào tạo
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              12.2 Thạc sĩ:
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              Ngành
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
              Chuyên ngành
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
              Nơi đào tạo
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              12.3 Tiến sĩ:
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              Ngành
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
              Chuyên ngành
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
              Nơi đào tạo
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              13. Trình độ ngoại ngữ:
              {initialData?.ngoaiNgu?.length
                ? initialData.ngoaiNgu
                    .map((item) => {
                      const ngonNgu = item.ngonNgu?.sTen || ""
                      const trinhDo = item.trinhDo?.sTen || ""
                      return ngonNgu && trinhDo ? `${ngonNgu} - ${trinhDo}` : ngonNgu || trinhDo
                    })
                    .filter(Boolean)
                    .join(", ")
                : ""}
              <span className="inline-block w-40 flex-" />
              Tin học:
              {initialData?.tinHoc?.length
                ? initialData.tinHoc
                    .map((item) => {
                      const trinhDo = item.dM_TrinhDoTinHoc?.sTen || ""
                      return trinhDo
                    })
                    .filter(Boolean)
                    .join(", ")
                : ""}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              14. Trình độ lý luận chính trị:{" "}
              {initialData?.trinhDoLyLuanChinhTri?.[0]?.trinhDo?.name || ""}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              15. Ngày vào đoàn TNCS HCM:{" "}
              {initialData?.unionDate ? formatDateInSlash(initialData.unionDate) : null}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              16. Ngày vào đảng CSVN:{" "}
              {initialData?.CPVJoinDate ? formatDateInSlash(initialData.CPVJoinDate) : null}
              <span className="inline-block w-40 flex-1" />
              Chính thức:{" "}
              {initialData?.officialCPVDate ? formatDateInSlash(initialData.officialCPVDate) : null}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              17. Cơ quan công tác hiện nay (nếu có):
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              18. Chức vụ hiện nay (nếu có): {initialData?.positionCPV?.sTen || ""}
              <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              19. Học vị, học hàm, danh hiệu Nhà nước phong tặng: {formatAcademicInfo()}
              <span className="inline-block w-40 flex-1" />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              20. Khen thưởng:{" "}
              {initialData?.khenThuong?.[0]
                ? `${initialData.khenThuong[0].hinhThucKhenThuong?.name || ""} ${
                    initialData.khenThuong[0].ngayNhanQuyetDinh
                      ? `(${formatDateInSlash(initialData.khenThuong[0].ngayNhanQuyetDinh)})`
                      : ""
                  }`
                : ""}
              <span className="inline-block w-40 flex-1 " />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              21. Kỷ luật:{" "}
              {initialData?.kyLuat?.[0]
                ? `${initialData.kyLuat[0].hinhThucKyLuat || ""} ${
                    initialData.kyLuat[0].ngayNhanQuyetDinh
                      ? `(${formatDateInSlash(initialData.kyLuat[0].ngayNhanQuyetDinh)})`
                      : null
                  }`
                : ""}
              <span className="inline-block w-40 flex-1 " />
            </p>
            <p className="flex w-full leading-[12px] mb-4">
              22. Sở truòng: {initialData?.soTruong || ""}
              <span className="inline-block w-40 flex-1 " />
            </p>
          </div>
        </div>
        <div className="flex w-full leading-[12px] mb-4 font-bold">
          II. QUAN HỆ GIA ĐÌNH{" "}
          <span className="italic font-[400]">
            (Ghi rõ họ tên, năm sinh, nghề nghiệp, nơi công tác của bố mẹ đẻ, anh chị em ruột)
          </span>
        </div>
        <div className="flex w-full leading-[12px] mb-4">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-black p-1 text-center font-semibold w-[15%]">
                  Quan hệ
                </th>
                <th className="border border-black p-1 text-center font-semibold w-[25%]">
                  Họ và tên
                </th>
                <th className="border border-black p-1 text-center font-semibold  w-[10%]">
                  Năm sinh
                </th>
                <th className="border border-black p-1 text-center font-semibold w-[25%]">
                  Nghề nghiệp
                </th>
                <th className="border border-black p-1 text-center font-semibold w-[25%]">
                  Nơi làm việc
                </th>
              </tr>
            </thead>
            <tbody>
              {initialData?.relatives?.map((relative, index) => (
                <tr key={relative.id}>
                  <td className="border border-black p-1 h-[32px]">
                    {relative.quanHeThanNhan?.name || ""}
                  </td>
                  <td className="border border-black p-1 h-[32px]">{relative.name || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{relative.birthYear || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{relative.job || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{relative.information || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="uppercase flex w-full leading-[12px] mb-4 font-bold">
          III. QUÁ TRÌNH ĐÀO TẠO, BỒI DƯỠNG.
        </div>
        <div className="flex w-full leading-[12px] mb-4">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-black p-1 text-center font-semibold w-[15%]">
                  Thời gian
                </th>
                <th className="border border-black p-1 text-center font-semibold w-[25%]">
                  Tên trường
                </th>
                <th className="border border-black p-1 text-center font-semibold  w-[10%]">
                  Ngành học
                </th>
                <th className="border border-black p-1 text-center font-semibold w-[25%]">
                  Hình thức đào tạo
                </th>
                <th className="border border-black p-1 text-center font-semibold w-[25%]">
                  Văn bằng
                </th>
              </tr>
            </thead>
            <tbody>
              {filledRows3.map((row, index) => (
                <tr key={`${row.fullName}-${index}`}>
                  <td className="border border-black p-1 h-[32px]">{row.relationship || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{row.fullName || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{row.yearOfBirth || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{row.details || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{row.details || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="uppercase flex w-full leading-[12px] mb-4 font-bold">
          IV. QUÁ TRÌNH CÔNG TÁC
        </div>
        <div className="flex w-full leading-[12px] mb-4">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-black p-1 text-center font-semibold w-[30%]">
                  Thời gian
                </th>
                <th className="border border-black p-1 text-center font-semibold w-[50%]">
                  Đơn vị công tác
                </th>
                <th className="border border-black p-1 text-center font-semibold  w-[30%]">
                  Chức vụ
                </th>
              </tr>
            </thead>
            <tbody>
              {initialData?.quaTrinhCongTac?.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-black p-1 h-[32px]">
                    {item.tuThangNam ? formatDateInSlash(item.tuThangNam) : ""} -{" "}
                    {item.denThangNam ? formatDateInSlash(item.denThangNam) : ""}
                  </td>
                  <td className="border border-black p-1 h-[32px]">{item.chucVu?.sTen || ""}</td>
                  <td className="border border-black p-1 h-[32px]">{item.chucVu?.sTen || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span className="flex justify-end">{formattedDate}</span>
        <div className="flex w-full leading-[12px] mb-4">
          <div className="w-1/3 flex flex-col items-center">
            <span className="font-bold">Người khai</span>
            <span className="text-center">
              Tôi xin cam đoan những lời khai trên đây là đúng sự thật
            </span>
            <span className="italic">(Ký tên, ghi rõ họ tên)</span>
          </div>
          <div className="w-2/3 flex flex-col items-center">
            <span className="font-bold">Thủ trưởng cơ quan, đơn vị quản lý và sử dụng CBCC</span>
            <span className="italic">(Ký tên, ghi rõ họ tên)</span>
          </div>
        </div>
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
                .new-page {
                    page-break-before: always;
                }
                .page-1 {
                    margin-top: -40px !important;
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

export default ModalSoYeuLyLich
