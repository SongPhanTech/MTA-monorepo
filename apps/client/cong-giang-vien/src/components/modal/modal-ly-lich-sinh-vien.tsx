import { formatDateInSlash, formatThangIn, formatThangNamIn } from "@workspace/libs/timezone"
import { PrinterOutlined } from "@ant-design/icons"
import { GridBlock } from "@components/commons/grid-block"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Input, Modal } from "antd"
import dayjs from "dayjs"
import { useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

const MISSING_DATE = "- -"

function formatDateOrPlaceholder(
  value: Date | string | null | undefined,
  format: string
) {
  if (!value) return MISSING_DATE
  if (format === "DD/M/YYYY") return formatDateInSlash(value) || MISSING_DATE
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(format) : MISSING_DATE
}

type ModalTomTatLyLichInput = {
  id: string
}

const ModalTomTatLyLich = () => {
  const formattedDate = `${dayjs().format("DD")}/${formatThangIn(dayjs().month() + 1)}/${dayjs().format("YYYY")}`
  const printRef = useRef<HTMLDivElement>(null)
  const [signerName, setSignerName] = useState("Đại úy Đào Văn Thắng")

  const { isOpen, onClose, input } = useDisclosure<ModalTomTatLyLichInput>({
    tag: "ModalTomTatLyLich",
  })

  const GENDER_TO_SPOUSE_MAP = {
    nam: "vợ",
    nữ: "chồng",
    Ông: "vợ",
    bà: "chồng",
  } as const

  const getSpouseTitle = (genderName: string) => {
    return (
      Object.entries(GENDER_TO_SPOUSE_MAP).find(([key, value]) => {
        if (genderName.toLocaleLowerCase().includes(key.toLocaleLowerCase())) return value
        return "Vợ(Chồng)"
      })?.[1] || "Vợ(Chồng)"
    )
  }

  const getRelativeByType = (
    relatives: NonNullable<typeof initialData>["relatives"],
    type: string
  ) => {
    return relatives?.find((rel) => rel.quanHeThanNhan?.code === type)
  }

  const getCapBacForPeriodBeforeStart = (tuThangNam: Date | null) => {
    if (!initialData?.capBac || !tuThangNam) return null

    const tuNgay = dayjs(tuThangNam)

    // Lấy cấp bậc gần nhất trước hoặc tại thời điểm bắt đầu công tác
    const capBacBeforeOrAt = initialData.capBac
      .filter((cb) => {
        if (!cb.ngayNhanQuyetDinh) return false
        return dayjs(cb.ngayNhanQuyetDinh).isSameOrBefore(tuNgay, "day")
      })
      .sort((a, b) => dayjs(b.ngayNhanQuyetDinh).diff(dayjs(a.ngayNhanQuyetDinh)))[0]

    if (capBacBeforeOrAt) {
      return {
        ten: capBacBeforeOrAt?.capBac?.sTen || "",
        thangNam: formatThangNamIn(capBacBeforeOrAt.ngayNhanQuyetDinh),
      }
    }

    return null
  }

  const getChucVuDangDoanAtTime = (tuThangNam: Date | null, item?: any) => {
    if (!tuThangNam) return ""

    // Nếu có nhập chucVuDangDoan thì ưu tiên
    if (item?.chucVuDangDoan) {
      return item.chucVuDangDoan
    }

    const tuNgay = dayjs(tuThangNam)
    const partyJoinDate = initialData?.officialCPVDate ? dayjs(initialData.officialCPVDate) : null
    const unionJoinDate = initialData?.unionDate ? dayjs(initialData.unionDate) : null

    const wasPartyMember = partyJoinDate?.isSameOrBefore(tuNgay)
    const wasUnionMember = unionJoinDate?.isSameOrBefore(tuNgay)

    if (wasPartyMember) return "Đảng viên"
    if (wasUnionMember) return "Đoàn viên"

    return ""
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
      },
    },
    { enabled: !!input?.id }
  )

  const Header = () => {
    return (
      <div className="flex flex-col page-1">
        <div className="uppercase text-lg font-bold flex w-full justify-center">
          Bản tóm tắt lý lịch
        </div>
        <div className="flex justify-between items-center mb-2">
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

          <div className="flex-1 pl-4">
            <div className="mb-1">
              <span className="font-bold">Họ tên khai sinh: </span>
              <span className="font-bold uppercase">{initialData?.fullname}</span>
              <span className="ml-4">(Giới tính: {initialData?.gender?.sTen})</span>
            </div>
            <div className="mb-1">
              <span className="font-bold">Họ tên khác: </span>
              <span>{initialData?.hoTenThuongDung || "Không"}</span>
            </div>
            <div className="mb-1">
              Cấp bậc, hệ số lương, tháng năm: {initialData?.capBac?.[0]?.capBac?.sTen || ""}/(
              {initialData?.capBac?.[0]?.ngayNhanQuyetDinh
                ? formatThangNamIn(initialData?.capBac?.[0]?.ngayNhanQuyetDinh)
                : ""}
              )
            </div>
          </div>
        </div>

        <div className="mt-2 flex">
          <span className="font-medium">SH:</span>
          <span className="ml-2 font-bold">{initialData?.officerNumber}</span>
        </div>
      </div>
    )
  }

  const Muc1 = () => {
    return (
      <div className="flex flex-col">
        <div className="uppercase text-lg font-bold flex w-full justify-center">I. Bản thân</div>
        <div className="flex flex-col">
          <GridBlock
            columns={3}
            items={[
              {
                key: "dob",
                content: (
                  <>
                    Sinh ngày: {formatDateOrPlaceholder(initialData?.dateOfBirth, "DD/M/YYYY")}
                  </>
                ),
              },
              {
                key: "ethnicity",
                content: <>Dân tộc: {initialData?.ethnicity?.sTen}</>,
              },
              {
                key: "religion",
                content: <>Tôn giáo: {initialData?.religion?.sTen || "Không"}</>,
              },
            ]}
          />

          <span>Quê quán: {initialData?.homeTown}</span>
          <span>Nơi ở hiện nay: {initialData?.currentAddress}</span>
          <GridBlock
            columns={2}
            items={[
              {
                key: "ngay-tham-gia-cach-mang",
                content: (
                  <>
                    Ngày tham gia cách mạng:{" "}
                    {initialData?.revolutionaryDate
                      ? formatDateInSlash(initialData?.revolutionaryDate)
                      : ""}
                  </>
                ),
              },
              {
                key: "ngay-tuyen-dung",
                content: (
                  <>
                    Ngày tuyển dụng:{" "}
                    {initialData?.recruitmentDate
                      ? formatDateInSlash(initialData?.recruitmentDate)
                      : ""}
                  </>
                ),
              },
            ]}
          />
          <GridBlock
            columns={3}
            items={[
              {
                key: "ngay-nhap-ngu",
                content: (
                  <>
                    Ngày nhập ngũ:{" "}
                    {initialData?.enlistmentDate
                      ? formatDateInSlash(initialData?.enlistmentDate)
                      : ""}
                  </>
                ),
              },
              {
                key: "ngay-xuat-ngu",
                content: (
                  <>
                    Xuất ngũ:{" "}
                    {initialData?.dischargeDate
                      ? formatDateInSlash(initialData?.dischargeDate)
                      : ""}
                  </>
                ),
              },
              {
                key: "ngay-tai-ngu",
                content: (
                  <>
                    Tái ngũ:{" "}
                    {initialData?.reEnlistmentDate
                      ? formatDateInSlash(initialData?.reEnlistmentDate)
                      : ""}
                  </>
                ),
              },
            ]}
          />
          <GridBlock
            columns={2}
            items={[
              {
                key: "ngay-vao-dang",
                content: (
                  <>
                    Ngày vào Đảng:{" "}
                    {initialData?.CPVJoinDate
                      ? formatDateInSlash(initialData?.CPVJoinDate)
                      : ""}
                  </>
                ),
              },
              {
                key: "chinh-thuc",
                content: (
                  <>
                    Chính thức:{" "}
                    {initialData?.officialCPVDate
                      ? formatDateInSlash(initialData?.officialCPVDate)
                      : ""}
                  </>
                ),
              },
            ]}
          />
          <span>Giáo dục phổ thông: {initialData?.trinhDoHocVan?.name}</span>
          <span>Chức danh khoa học, học vị cao nhất, chuyên ngành, thời gian: </span>
          <span>
            Chỉ huy quản lý <span className="text-sm">(sơ, trung, cao cấp)</span>:{" "}
            {initialData?.chiHuyQuanLy?.name}
          </span>
          <span>
            Lý luận chính trị <span className="text-sm">(sơ, trung, cao cấp)</span>:{" "}
            {initialData?.trinhDoLyLuanChinhTri?.[0]?.trinhDo?.name}
          </span>
          <span>
            Chuyên môn kỹ thuật <span className="text-sm">(sơ, trung, cao cấp)</span>:{" "}
            {initialData?.chuyenMonKyThuat?.name}
          </span>
          <span>
            Ngoại ngữ, trình độ, tháng năm:
            <br />
            {initialData?.ngoaiNgu?.length
              ? initialData.ngoaiNgu
                  .map((item) =>
                    [
                      item.ngonNgu?.sTen,
                      item.trinhDo?.sTen,
                      item.thoiGianBatDau,
                      item.thoiGianKetThuc,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  )
                  .join("\n")
                  .split("\n")
                  .map((line, idx) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))
              : ""}
          </span>
          <span>
            Tiếng dân tộc, mức độ nghe, nói, viết:
            <br />
            {initialData?.tiengDanToc?.length
              ? initialData.tiengDanToc
                  .map((item) =>
                    [item?.danToc?.sTen, item.nghe, item.noi, item.viet].filter(Boolean).join(" , ")
                  )
                  .join("\n")
                  .split("\n")
                  .map((line, idx) => (
                    <span className="pl-6 font-bold mt-1" key={line}>
                      - {line}
                      <br />
                    </span>
                  ))
              : ""}
          </span>
          <span>
            Qua trường{" "}
            <span className="text-sm">
              (tên trường, ngành học, chuyên ngành học, cấp học, thời gian, kết quả, loại hình đào
              tạo):
              <br />
              {initialData?.quaTrinhHocTap?.length
                ? initialData.quaTrinhHocTap
                    .map((item) => [
                      item?.tenTruong?.name,
                      item?.nganhHoc,
                      item?.chuyenNganh,
                      item?.tuNgay,
                      item?.denNgay,
                      item?.ketQua,
                      item?.loaiHinhDaoTao,
                    ])
                    .join("\n")
                    .split("\n")
                    .map((line, idx) => (
                      <span className="pl-6 font-bold mt-1" key={line}>
                        - {line}
                        <br />
                      </span>
                    ))
                : ""}
            </span>
          </span>
          <span>
            Chiến đấu, phục vụ chiến đấu{" "}
            <span className="text-sm">
              (thời gian; cương vị, đơn vị; địa danh, địa điểm; trực tiếp hoặc phục vụ chiến đấu;
              đối tượng):
              <br />
              {initialData?.chienDau?.length
                ? initialData.chienDau
                    .map((item) => [
                      item?.cuongVi,
                      item?.donVi,
                      item?.diaDiem,
                      item?.vaiTro,
                      item?.doiTuong,
                      item?.thoiGianBatDau,
                      item?.thoiGianKetThuc,
                    ])
                    .join("\n")
                    .split("\n")
                    .map((line, idx) => (
                      <span className="pl-6 font-bold mt-1" key={line}>
                        - {line}
                        <br />
                      </span>
                    ))
                : ""}
            </span>
          </span>
          <span>
            Đã đi nước ngoài
            <span className="text-sm">
              (tên nước, thời gian, lý do): <br />
              {initialData?.diNuocNgoai?.length
                ? initialData.diNuocNgoai
                    .map((item) => [
                      item?.tenNuoc?.sTen,
                      formatDateInSlash(item?.tuNgay),
                      formatDateInSlash(item?.denNgay),
                      item?.lyDo,
                    ])
                    .join("\n")
                    .split("\n")
                    .map((line, idx) => (
                      <span className="pl-6 font-bold mt-1" key={line}>
                        - {line}
                        <br />
                      </span>
                    ))
                : ""}
            </span>
          </span>
          <GridBlock
            columns={3}
            items={[
              {
                key: "suc-khoe",
                content: <>Sức khỏe: {initialData?.sucKhoe?.name}</>,
              },
              {
                key: "nhom-mau",
                content: <>Nhóm máu: {initialData?.nhomMau?.name}</>,
              },
              {
                key: "benh-chinh",
                content: <>Bệnh chính: {initialData?.benh}</>,
              },
            ]}
          />
          <span>
            Thương tật{" "}
            <span className="text-sm">
              (loại, tỷ lệ, nguyên nhân, thời gian và nơi bị thương, thời gian giám định):
              {initialData?.thuongTat?.length
                ? initialData.thuongTat
                    .map((item) => [
                      item?.loai?.name,
                      item?.tiLe,
                      item?.nguyenNhan,
                      formatDateInSlash(item?.thoiGian),
                      item?.noiBiThuong,
                      formatDateInSlash(item?.thoiGianGiamDinh),
                    ])
                    .join("\n")
                    .split("\n")
                    .map((line, idx) => (
                      <span className="pl-6 font-bold mt-1" key={line}>
                        - {line}
                        <br />
                      </span>
                    ))
                : ""}
            </span>
          </span>

          <span>
            Danh hiệu được phong tháng năm:
            {initialData?.danhHieu?.length
              ? initialData.danhHieu
                  .map((item) => [item?.ten, formatDateInSlash(item?.thoiGian)])
                  .join("\n")
                  .split("\n")
                  .map((line, idx) => (
                    <span className="pl-6 font-bold mt-1" key={line}>
                      - {line}
                      <br />
                    </span>
                  ))
              : ""}
          </span>
          <span>
            Khen thưởng{" "}
            <span className="text-sm">
              (hình thức, tháng, năm, lý do):
              {initialData?.khenThuong?.length
                ? initialData.khenThuong
                    .map((item) => [
                      item?.hinhThucKhenThuong?.name,
                      formatDateInSlash(item?.ngayNhanQuyetDinh),
                    ])
                    .join("\n")
                    .split("\n")
                    .map((line, idx) => (
                      <span className="pl-6 font-bold mt-1" key={line}>
                        - {line}
                        <br />
                      </span>
                    ))
                : ""}
            </span>
          </span>
          <span>
            Kỷ luật{" "}
            <span className="text-sm">
              (hình thức, tháng, năm, lý do):
              {initialData?.kyLuat?.length
                ? initialData.kyLuat
                    .map((item) => [
                      item?.hinhThucKyLuat,
                      formatDateInSlash(item?.ngayNhanQuyetDinh),
                    ])
                    .join("\n")
                    .split("\n")
                    .map((line, idx) => (
                      <span className="pl-6 font-bold mt-1" key={line}>
                        - {line}
                        <br />
                      </span>
                    ))
                : ""}
            </span>
          </span>
          <span>Trước khi nhập ngũ (tuyển dụng) làm gì? Ở đâu? Quan hệ CT-XH: </span>
          <span className="pl-6 font-bold mt-1">{initialData?.truocKhiNhapNgu}</span>
          <span>
            Tình hình nhà ở <span className="text-sm">(loại nhà, diện tích, hình thức sở hữu)</span>
            :{initialData?.tinhHinhNhaO}
          </span>
        </div>
        <div className="new-page flex flex-col" style={{ minHeight: "200mm" }}>
          <div className="uppercase text-lg font-bold flex w-full justify-center mb-4">
            Quá trình công tác
          </div>
          <div className="flex-grow border border-black flex flex-col">
            <table className="w-full border-collapse flex-grow">
              <thead>
                <tr>
                  <th className="border border-black p-1 text-center align-middle" colSpan={2}>
                    Thời gian
                  </th>
                  <th className="border border-black p-1 text-center align-middle" rowSpan={2}>
                    Chức danh, chức vụ, đơn vị công tác
                    <br />
                    <span className="font-normal">
                      (đơn vị quân đội ghi từ c, d, e, f...), số quyết định
                    </span>
                  </th>
                  <th className="border border-black p-1 text-center align-middle" rowSpan={2}>
                    Cấp bậc, <br /> tháng năm
                  </th>
                  <th className="border border-black p-1 text-center align-middle" rowSpan={2}>
                    Chức vụ Đảng, <br /> đoàn thể
                  </th>
                </tr>
                <tr>
                  <th className="border border-black p-1 text-center">Từ</th>
                  <th className="border border-black p-1 text-center">Đến</th>
                </tr>
              </thead>
              <tbody>
                {initialData?.quaTrinhCongTac?.length
                  ? initialData.quaTrinhCongTac
                      .sort((a, b) => {
                        if (!a.tuThangNam || !b.tuThangNam) return 0
                        return dayjs(a.tuThangNam).diff(dayjs(b.tuThangNam))
                      })
                      .map((item, index) => {
                        const capBacInfo = getCapBacForPeriodBeforeStart(item.tuThangNam)

                        return (
                          <tr key={item.id}>
                            <td className="border border-black p-1 text-center">
                              {item.tuThangNam ? formatThangNamIn(item.tuThangNam) : ""}
                            </td>
                            <td className="border border-black p-1 text-center">
                              {item.denThangNam
                                ? formatThangNamIn(item.denThangNam)
                                : "Hiện tại"}
                            </td>
                            <td className="border border-black p-1">
                              <div>
                                {[item.chucDanh, item.chucVu?.sTen, item.donVi, item.soQuyetDinh]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </td>
                            <td className="border border-black p-1 text-center">
                              {capBacInfo ? (
                                <div className="flex flex-col">
                                  <span>{capBacInfo.ten}</span>
                                  <span className="text-xs">({capBacInfo.thangNam})</span>
                                </div>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="border border-black p-1 text-center">
                              {getChucVuDangDoanAtTime(item.tuThangNam, item)}
                            </td>
                          </tr>
                        )
                      })
                  : null}
                {/* Thêm các dòng trống để table có chiều cao đủ */}
                {Array.from({
                  length: Math.max(0, 15 - (initialData?.quaTrinhCongTac?.length || 0)),
                }).map((_, index) => (
                  <tr key={`empty-${_}`} style={{ height: "40px" }}>
                    <td className="border border-black p-1" />
                    <td className="border border-black p-1" />
                    <td className="border border-black p-1" />
                    <td className="border border-black p-1" />
                    <td className="border border-black p-1" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const Muc2 = () => {
    const relatives = initialData?.relatives || []
    const father = getRelativeByType(relatives, "FATHER")
    const mother = getRelativeByType(relatives, "MOTHER")

    return (
      <div className="new-page flex flex-col">
        <div className="uppercase text-lg font-bold flex w-full justify-center">
          II. Tình hình KT-CT của gia đình
        </div>
        <div className="flex flex-col">
          <GridBlock
            columns={3}
            items={[
              {
                key: "name-cha",
                content: (
                  <>
                    Họ tên cha: <span className="font-bold capitalize">{father?.name}</span>
                  </>
                ),
              },
              {
                key: "dob-cha",
                content: <>Sinh: {father?.birthYear}</>,
              },
              {
                key: "nghe-nghiep-cha",
                content: <>Nghề nghiệp: {father?.job}</>,
              },
            ]}
          />
          <GridBlock
            columns={3}
            items={[
              {
                key: "name-me",
                content: (
                  <>
                    Họ tên mẹ: <span className="font-bold capitalize">{mother?.name}</span>
                  </>
                ),
              },
              {
                key: "dob-me",
                content: <>{mother?.birthYear}</>,
              },
              {
                key: "nghe-nghiep-me",
                content: <>Nghề nghiệp: {mother?.job}</>,
              },
            ]}
          />
          <span>Thành phần gia đình: {initialData?.thanhPhanGiaDinh}</span>
          <span>Quê quán: {father?.queQuan}</span>
          <span>Nơi ở hiện nay: {father?.noiOHienTai}</span>
          <div className="flex justify-between">
            <span>Cha mẹ sinh được: {initialData?.soACE}</span>
            <span>Đồng chí: {initialData?.fullname}</span>
            <span>Là thứ: {initialData?.conThuMay}</span>
          </div>
          <span className="pl-6 font-bold">Tình hình KT-CT của gia đình</span>
          <p>
            <span className="pl-6 font-bold">* Kinh tế:</span> {initialData?.kinhTeGiaDinh}
          </p>

          <p>
            <span className="pl-6 font-bold">* Chính trị:</span> {initialData?.chinhTriGiaDinh}
          </p>
        </div>
      </div>
    )
  }

  const Muc3 = () => {
    const relatives = initialData?.relatives || []

    const fatherInLaw = getRelativeByType(relatives, "FATHER_IN_LOW")
    const motherInLaw = getRelativeByType(relatives, "MOTHER_IN_LOW")
    const spouse = getRelativeByType(relatives, "MARRIER")
    const children = relatives?.filter((rel) =>
      ["SON", "DAUGHTER"].includes(rel.quanHeThanNhan?.code || "")
    )

    return (
      <div className="flex flex-col">
        <div className="uppercase text-lg font-bold flex w-full justify-center">
          III. Tình hình KT-CT của gia đình {getSpouseTitle(initialData?.gender?.sTen ?? "")}
        </div>
        <div className="flex flex-col">
          <GridBlock
            columns={3}
            items={[
              {
                key: "name-cha",
                content: (
                  <>
                    Họ tên cha: <span className="font-bold capitalize">{fatherInLaw?.name}</span>
                  </>
                ),
              },
              {
                key: "dob-cha",
                content: <>Sinh: {fatherInLaw?.birthYear}</>,
              },
              {
                key: "nghe-nghiep-cha",
                content: <>Nghề nghiệp: {fatherInLaw?.job}</>,
              },
            ]}
          />
          <GridBlock
            columns={3}
            items={[
              {
                key: "name-me",
                content: (
                  <>
                    Họ tên mẹ: <span className="font-bold capitalize">{motherInLaw?.name}</span>
                  </>
                ),
              },
              {
                key: "dob-me",
                content: <>Sinh: {motherInLaw?.birthYear}</>,
              },
              {
                key: "nghe-nghiep-me",
                content: <>Nghề nghiệp: {motherInLaw?.job}</>,
              },
            ]}
          />
          <span>Thành phần gia đình: {initialData?.fThanhPhanGiaDinh}</span>
          <span>Quê quán: {fatherInLaw?.queQuan}</span>
          <span>Nơi ở hiện nay: {fatherInLaw?.noiOHienTai}</span>
          <div className="flex justify-between">
            <span>Cha mẹ sinh được: {initialData?.fSoACE}</span>
          </div>
          <span className="pl-6 font-bold">
            Tình hình KT-CT của gia đình {getSpouseTitle(initialData?.gender?.sTen ?? "")}
          </span>
          <p>
            <span className="pl-6 font-bold">* Kinh tế:</span> {initialData?.fKinhTeGiaDinh}
          </p>

          <p>
            <span className="pl-6 font-bold">* Chính trị:</span> {initialData?.fChinhTriGiaDinh}
          </p>
          <p>
            <span className="pl-6 font-bold">
              * Bản thân {getSpouseTitle(initialData?.gender?.sTen ?? "")}:
            </span>{" "}
            {initialData?.fBanThan}
          </p>
        </div>
        <div className="flex flex-col mt-6">
          <GridBlock
            columns={2}
            items={[
              {
                key: "name-vo",
                content: (
                  <>
                    Họ tên{getSpouseTitle(initialData?.gender?.sTen ?? "")}:{" "}
                    <span className="font-bold capitalize">{spouse?.name}</span>
                  </>
                ),
              },
              {
                key: "dob-vo",
                content: <>Năm sinh: {spouse?.birthYear}</>,
              },
            ]}
          />
          <span>Nghề nghiệp: {spouse?.job}</span>
          <span>Chỗ ở hiện nay: {spouse?.noiOHienTai}</span>
          <span>
            Họ tên, năm sinh, nghề nghiệp các con:{" "}
            {children.length > 0
              ? children
                  .map((child) => {
                    const fields = [
                      child.name,
                      child.birthYear,
                      child.job,
                      child.queQuan,
                      child.noiOHienTai,
                    ].filter(Boolean)

                    return fields.join(", ")
                  })
                  .join("; ")
              : "Chưa có con"}
          </span>
        </div>
      </div>
    )
  }

  const Muc4 = () => {
    return (
      <div className="new-page flex flex-col">
        <div className="uppercase text-lg font-bold flex w-full justify-center">
          IV. Tóm tắt nhận xét
        </div>
        <p>
          <span className="pl-6 font-bold italic">+ Lý lịch:</span>
        </p>
        <p>
          <span className="pl-6 font-bold italic">+ Bản thân:</span>
        </p>
        <p>
          <span className="pl-6 font-bold italic">+ Điểm mạnh:</span>
        </p>
        <p>
          <span className="pl-6 font-bold italic">+ Hạn chế:</span>{" "}
        </p>
        <p>
          <span className="pl-6 font-bold">+ Kết luận:</span>
        </p>
        <p>
          <span className="pl-6 font-bold">+ HSD:</span> 1a
        </p>
      </div>
    )
  }

  const Footer = () => {
    return (
      <div className="flex flex-col mt-10">
        <span className="font-bold">
          Những điều cần ghi thêm (Khai lý lịch, chưa có xác minh hoặc xác minh chính trị nhưng chưa
          rõ cần phải thâm trả, xác minh lại; những nội dung chỉnh lý lịch được cấp có thẩm quyền
          quyết định:)
        </span>
        <div className="space-y-2">
          <div className="h-6 border-b border-dotted border-black w-full" />
          <div className="h-6 border-b border-dotted border-black w-full" />
          <div className="h-6 border-b border-dotted border-black w-full" />
        </div>
        <span className="mt-5">Ngày trích: {formattedDate}</span>
        <span>
          Tài liệu căn cứ để trích: <span className="font-bold">T63 lưu, NXCB năm</span>
        </span>
        <div className="flex w-full">
          <div className="flex flex-col items-center justify-center w-[50%]">
            <span>Họ tên, cấp bậc, chức vụ, chữ ký người trích</span>
            <span className="uppercase font-bold">Chính trị viên tiểu đoàn</span>
            <div className="mt-20" />
            <span className="font-bold">{signerName}</span>
          </div>
          <div className="flex flex-col items-center w-[50%]">
            <span className="mt-6" />
            <span className="uppercase font-bold">Cấp phê chuẩn</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>Modal tóm tắt lý lịch</span>
          {/* TODO: Làm select chọn trưởng phòng đào tạo */}
          <Input
            placeholder="Nhập tên người ký"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-64"
          />
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div
        ref={printRef}
        className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman flex flex-col gap-2"
      >
        <Header />
        <Muc1 />
        <Muc2 />
        <Muc3 />
        <Muc4 />
        <Footer />
      </div>
      <style>
        {`
            @media print {
                .blank-page {
                    height: 100vh;
                    visibility: hidden;
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
            `}
      </style>
    </Modal>
  )
}

export default ModalTomTatLyLich
