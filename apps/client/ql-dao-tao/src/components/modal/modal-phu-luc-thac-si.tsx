import { GridBlock } from "@components/commons/grid-block"
import { useFindUniqueStudent } from "@workspace/db/hooks"
import { Button, Modal, Space } from "antd"
import dayjs from "dayjs"
import { Printer } from "lucide-react"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { dataFake, fakeData, fakeScores, type Subject } from "@/utils/dataFake"

const mid = Math.ceil(dataFake.length / 2)
const leftData = dataFake.slice(0, mid)
const rightData = dataFake.slice(mid)

const SubjectTable: React.FC<{ data: Subject[]; startIndex: number }> = ({ data, startIndex }) => (
  <table className="table-auto border-collapse border border-black w-full text-sm">
    <thead>
      <tr>
        <th className="border border-black px-2 py-1 w-10 text-center">TT</th>
        <th className="border border-black px-2 py-1 text-center">Tên học phần</th>
        <th className="border border-black px-2 py-1 w-12 text-center">Số TC</th>
        <th className="border border-black px-2 py-1 w-12 text-center">Điểm</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item, idx) => (
        <tr key={`${item}-${idx + 1}`}>
          <td className="border border-black px-2 py-1 text-center">{startIndex + idx + 1}</td>
          <td className="border border-black px-2 py-1">{item.name}</td>
          <td className="border border-black px-2 py-1 text-center">{item.credits}</td>
          <td className="border border-black px-2 py-1 text-center">{item.score}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export const ModalPhuLucThacSi = () => {
  const formattedDate = `Ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}`
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "ModalPhuLucThacSi",
  })

  const { data } = useFindUniqueStudent(
    {
      where: { id },
      include: {
        userProfile: {
          include: { gender: true, ethnicity: true, religion: true, nationality: true },
        },
        graduationDecision: true,
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                trainingObjectType: {
                  include: {
                    trainingForm: true,
                  },
                },
              },
            },
          },
        },

        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: {
                  include: {
                    trainingField: true,
                  },
                },
              },
            },
            trainingTime: true,
            trainingLanguage: true,
          },
        },
      },
    },
    { enabled: !!id }
  )

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Phu_luc_thac_si_${data?.code}_${data?.userProfile?.fullname}.pdf`,
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
      }
    `,
  })

  const basicInfoCol1 = [
    {
      title: "Họ và tên:",
      value: <span className="uppercase">{data?.userProfile?.fullname}</span>,
    },
    {
      title: "Ngày sinh:",
      value: (
        <span>
          {data?.userProfile?.dateOfBirth &&
            dayjs(data?.userProfile?.dateOfBirth).format("DD/MM/YYYY")}
        </span>
      ),
    },
    {
      title: "Khoá:",
      value: <span>{data?.fixedClass?.trainingCourse?.name}</span>,
    },
  ]

  const basicInfoCol2 = [
    {
      title: "Mã học viên:",
      value: <span>{data?.code}</span>,
    },
    {
      title: "Nơi sinh:",
      value: <span>{data?.userProfile?.placeOfBirth}</span>,
    },
    {
      title: "Ngày nhập học:",
      value: <span>{data?.from && dayjs(data?.from).format("DD/MM/YYYY")}</span>,
    },
  ]

  const basicInfoCol3 = [
    {
      title: "Ngành:",
      value: <span>{data?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name}</span>,
    },
    {
      title: "Chuyên ngành:",
      value: <span>{data?.curriculumVersion?.curriculum?.trainingMajor?.name}</span>,
    },
    {
      title: "Ngôn ngữ đào tạo:",
      value: <span>{data?.curriculumVersion?.trainingLanguage?.name}</span>,
    },
  ]
  const basicInfoCol4 = [
    {
      title: "",
      value: "",
    },
    {
      title: "Thời gian đào tạo:",
      value: <span>{data?.curriculumVersion?.trainingTime?.name}</span>,
    },
    {
      title: "Hình thức đào tạo:",
      value: (
        <span>{data?.fixedClass?.trainingCourse?.trainingObjectType?.trainingForm?.name}</span>
      ),
    },
  ]

  return (
    <Modal
      title="In phụ lục văn bằng thạc sĩ"
      open={isOpen}
      onCancel={onClose}
      width="80vw"
      style={{ maxWidth: "1200px" }}
      footer={null}
    >
      <div className="space-y-4">
        <div className="flex justify-end w-full mb-4">
          <Space>
            <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
              In phụ lục
            </Button>
          </Space>
        </div>

        <div
          ref={printRef}
          className="!font-time-news-roman text-black bg-white p-6"
          style={{ fontSize: "14px", lineHeight: "1.5" }}
        >
          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Bộ Quốc Phòng</span>
                      <span>Học viện Kỹ Thuật Quân sự</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Cộng hòa Xã hội Chủ nghĩa Việt Nam</span>
                      <span>Độc lập - Tự do - Hạnh phúc</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center">
              <div className="mt-2 uppercase font-bold">Phụ lục văn bằng</div>
              <div className="text-sm normal-case font-normal italic">
                {`(Kèm theo Bằng Thạc sĩ số: ${data?.graduationDecision?.diplomaNumber || ""})`}
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
            <div className="text-[#656565] text-sm py-2">
              Đã hoàn thành chương trình đào tạo thạc sĩ theo định hướng nghiên cứu
            </div>
            <div className="flex justify-between gap-5">
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol3?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol4?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[#656565] text-sm py-2">Kết quả đào tạo:</div>
            <div className="overflow-x-auto text-sm">
              <table className="w-full border border-black border-collapse">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-black px-1 py-1 w-[40px] text-center">
                      TT
                    </th>
                    <th rowSpan={2} className="border border-black px-1 py-1 text-center">
                      Tên học phần
                    </th>
                    <th rowSpan={2} className="border border-black px-1 py-1 w-[60px] text-center">
                      Số TC
                    </th>
                    <th colSpan={3} className="border border-black px-1 py-1 text-center">
                      Điểm
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 10
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 4
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm chữ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fakeScores.map((row, index) => (
                    <tr key={row.id}>
                      <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                      <td className="border border-black px-1 py-1">{row.name}</td>
                      <td className="border border-black px-1 py-1 text-center">{row.credits}</td>
                      <td className="border border-black px-1 py-1 text-center">
                        {row.score10 ?? ""}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {row.score4 ?? ""}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {row.scoreLetter ?? ""}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center font-bold">
                      Điểm trung bình chung tốt nghiệp
                    </td>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="font-bold italic text-sm py-1">Tên chuyên đề nghiên cứu 1:</div>
            <div className="font-bold italic text-sm py-1">Tên chuyên đề nghiên cứu 2:</div>
            <div className="font-bold italic text-sm py-1">Tên chuyên đề nghiên cứu 3:</div>
            <div className="font-bold italic text-sm py-1">Tên chuyên đề nghiên cứu 4:</div>
            <div className="font-bold italic text-sm py-1">Tên chuyên đề nghiên cứu 5:</div>
            <div className="font-bold italic py-1">Tên đề tài luận văn:</div>
            <span>Cán bộ hướng dẫn: </span>
            <div>
              Bảo vệ ngày ... tháng ... năm ... tại Hội đồng đánh giá luận văn HVKTQS, danh
              sách{" "}
            </div>
            <div className="overflow-x-auto">
              <table className="table-auto  border-separate border-spacing-0 w-full text-sm">
                <tbody>
                  {fakeData.map((item, index) => (
                    <tr key={item.stt} className="hover:bg-gray-50">
                      <td className="px-3 py-1 font-medium">
                        {index + 1}. {item.role}
                      </td>
                      <td className="px-3 py-1">{item.name}</td>
                      <td className="px-3 py-1">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Bộ Quốc Phòng</span>
                      <span>Học viện Kỹ Thuật Quân sự</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Cộng hòa Xã hội Chủ nghĩa Việt Nam</span>
                      <span>Độc lập - Tự do - Hạnh phúc</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center">
              <div className="mt-4 uppercase font-bold">Phụ lục văn bằng</div>
              <div className="text-sm normal-case font-normal italic">
                {`(Kèm theo Bằng Thạc sĩ số: ${data?.graduationDecision?.diplomaNumber || ""})`}
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
            <div className="text-[#656565] text-sm py-2">
              Đã hoàn thành chương trình đào tạo thạc sĩ theo định hướng nghiên cứu
            </div>
            <div className="flex justify-between gap-5">
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol3?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol4?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[#656565] text-sm py-2">Kết quả đào tạo:</div>
            <div className="overflow-x-auto text-sm">
              <table className="w-full border border-black border-collapse">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-black px-1 py-1 w-[40px] text-center">
                      TT
                    </th>
                    <th rowSpan={2} className="border border-black px-1 py-1 text-center">
                      Tên học phần
                    </th>
                    <th rowSpan={2} className="border border-black px-1 py-1 w-[60px] text-center">
                      Số TC
                    </th>
                    <th colSpan={3} className="border border-black px-1 py-1 text-center">
                      Điểm
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 10
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 4
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm chữ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 font-bold">
                      Luận văn tốt nghiệp (Đối với NC) hoặc đề án tốt nghiệp (với UD)
                    </td>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 font-bold text-center">
                      Điểm trung bình chung tốt nghiệp
                    </td>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center" />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="font-bold italic py-2">
              Tên đề tài luận văn (Đối với NC) hoặc tên đề án tốt nghiệp (với ƯD):{" "}
            </div>
            <span>Cán bộ hướng dẫn: </span>
            <div>
              Bảo vệ ngày ... tháng ... năm ... tại Hội đồng đánh giá luận văn HVKTQS, danh
              sách{" "}
            </div>
            <div className="overflow-x-auto">
              <table className="table-auto  border-separate border-spacing-0 w-full text-sm">
                <tbody>
                  {fakeData.map((item, index) => (
                    <tr key={item.stt} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">
                        {index + 1}. {item.role}
                      </td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-center" />

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-2 text-center">
                    <span className="italic">{formattedDate}</span>
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>TL. GIÁM ĐỐC</span>
                      <span>Trưởng phòng sau đại học</span>
                      <div className="h-20" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Học viện Kỹ Thuật Quân sự</span>
                      <span>Phòng sau đại học</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Cộng hòa Xã hội Chủ nghĩa Việt Nam</span>
                      <span>Độc lập - Tự do - Hạnh phúc</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span>Số: 0 /CN-SĐH</span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-right">
                    <span>
                      <span>{formattedDate}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center">
              <div className="mt-4 uppercase font-bold">Giấy chứng nhận</div>
              <div className="text-sm normal-case">Kết quả học tập của Học viên cao học</div>
            </div>

            <span>Phòng Sau đại học - Học viện Kỹ thuật Quân sự chứng nhận:</span>
            <div className="flex justify-between gap-5 mt-2">
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
            <div className="text-[#656565] text-sm mt-2">
              {`Học viên chuyên ngành: ${data?.curriculumVersion?.curriculum?.trainingMajor?.name} `}
            </div>
            <div className="text-[#656565] text-sm mt-2">
              Học viên chấp hành tốt quy định về đào tạo, không vi phạm nội quy, quy định của Học
              viện.
            </div>
            <div className="text-[#656565] text-sm py-2">Kết quả học tập như sau: </div>
            <div className="grid grid-cols-2 gap-4">
              <SubjectTable data={leftData} startIndex={0} />
              <SubjectTable data={rightData} startIndex={mid} />
            </div>

            <div className="mt-2 flex flex-col">
              <span>Điểm trung bình chung các học phần: 8.4</span>
              <span>Giấy này có hiệu lực đến hết ngày </span>
            </div>
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-left">
                    <span className="italic">Nơi nhận:</span>
                    <ul className="list-none leading-4">
                      <li>- Học viên;</li>
                      <li>- Lưu;</li>
                    </ul>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-2 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Kt. Trưởng phòng</span>
                      <span>Phó trưởng phòng</span>
                      <div className="h-20" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Học viện Kỹ Thuật Quân sự</span>
                      <span>Phòng sau đại học</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center" />
                </tr>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span>Số hồ sơ TS: 123</span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-right" />
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center font-bold">
              <div className="mt-4 uppercase">Phiếu học viên quân sự</div>
              <div className="text-sm flex flex-col items-center">
                <span>{`Khoá: ${data?.fixedClass?.trainingCourse?.name}, Lớp CN: ${data?.fixedClass?.name}`}</span>
                <span>{`Chuyên ngành: ${data?.curriculumVersion?.curriculum?.trainingMajor?.name}`}</span>
              </div>
            </div>

            <span className="uppercase font-bold">A. Bản thân</span>
            <GridBlock
              columns={2}
              items={[
                {
                  key: "dan-toc",
                  content: (
                    <>
                      Họ và tên học viên:{" "}
                      <span className="font-bold capitalize">
                        {data?.userProfile?.fullname}
                      </span>{" "}
                    </>
                  ),
                },
                {
                  key: "masv",
                  content: <>Mã số HV: {data?.code}</>,
                },
              ]}
            />
            <GridBlock
              columns={3}
              items={[
                {
                  key: "gioi-tinh",
                  content: <>Giới tính: {data?.userProfile?.gender?.sTen}</>,
                },
                {
                  key: "dob",
                  content: (
                    <>
                      Ngày sinh:{" "}
                      {data?.userProfile?.dateOfBirth &&
                        dayjs(data?.userProfile?.dateOfBirth).format("DD/MM/YYYY")}
                    </>
                  ),
                },
                {
                  key: "noi-sinh",
                  content: <>Nơi sinh: {data?.userProfile?.placeOfBirth}</>,
                },
              ]}
            />
            <GridBlock
              columns={3}
              items={[
                {
                  key: "dan-toc",
                  content: <>Dân tộc: {data?.userProfile?.ethnicity?.sTen}</>,
                },
                {
                  key: "ton-diao",
                  content: <>Tôn giáo: {data?.userProfile?.religion?.sTen}</>,
                },
                {
                  key: "quoc-tich",
                  content: <>Quốc tịch: {data?.userProfile?.nationality?.sTen}</>,
                },
              ]}
            />
            <div className="flex flex-col">
              <span>Quê quán (Xã, Huyện, Tỉnh): {data?.userProfile?.homeTown}</span>
              <span>Nơi ở hiện nay (Ghi rõ đến số nhà):</span>
              <span>Đơn vị trước khi đi học:</span>
              <span>Cụ thể (Từ cấp tiểu đoàn trở lên):</span>
              <span>Địa chỉ nơi đóng quân (Xã, Huyện, Tỉnh):</span>
            </div>
            <GridBlock
              columns={2}
              items={[
                {
                  key: "so-hieu",
                  content: <>Số hiệu SQ (QNCN):</>,
                },
                {
                  key: "date-nhap-ngu",
                  content: <>Tháng, năm nhập ngũ:</>,
                },
              ]}
            />
            <GridBlock
              columns={2}
              items={[
                {
                  key: "cap-bac",
                  content: <>Cấp bậc:</>,
                },
                {
                  key: "date-1",
                  content: <>Tháng, năm nhận:</>,
                },
              ]}
            />
            <GridBlock
              columns={2}
              items={[
                {
                  key: "nang-luong-lan",
                  content: <>Nâng lương lần:</>,
                },
                {
                  key: "date-2",
                  content: <>Tháng, năm nhận:</>,
                },
              ]}
            />
            <GridBlock
              columns={2}
              items={[
                {
                  key: "chuc-vu",
                  content: <>Chức vụ:</>,
                },
                {
                  key: "date-3",
                  content: <>Tháng, năm nhận:</>,
                },
              ]}
            />
            <GridBlock
              columns={3}
              items={[
                {
                  key: "date-dang",
                  content: (
                    <>
                      Ngày vào Đảng:{" "}
                      {data?.userProfile?.CPVJoinDate &&
                        dayjs(data?.userProfile?.CPVJoinDate).format("DD/MM/YYYY")}
                    </>
                  ),
                },
                {
                  key: "date-chinh",
                  content: (
                    <>
                      Ngày chính thức:{" "}
                      {data?.userProfile?.officialCPVDate &&
                        dayjs(data?.userProfile?.officialCPVDate).format("DD/MM/YYYY")}
                    </>
                  ),
                },
                {
                  key: "so-the",
                  content: <>Số thẻ Đảng viên: </>,
                },
              ]}
            />
            <span>Cấp ủy Đảng cao nhất đã qua:</span>
            <GridBlock
              columns={2}
              items={[
                {
                  key: "con-liet-si",
                  content: <>Con liệt sĩ:</>,
                },
                {
                  key: "thuong-binh",
                  content: <>Bản thân là thương binh:</>,
                },
              ]}
            />
            <div>Tốt nghiệp đại học làm hồ sơ tuyển sinh:</div>
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-left">
                    <ul className="list-none leading-4">
                      <li>+ Trường: HVKTQS</li>
                      <li>
                        + Chuyên ngành: {data?.curriculumVersion?.curriculum?.trainingMajor?.name}
                      </li>
                      <li>
                        + Hình thức đào tạo:{" "}
                        {data?.fixedClass?.trainingCourse?.trainingObjectType?.trainingForm?.name}
                      </li>
                    </ul>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-2 text-left">
                    <ul className="list-none leading-4">
                      <li>+ Năm tốt nghiệp:</li>
                      <li>+ Số năm đào tạo: {data?.curriculumVersion?.trainingTime?.name}</li>
                      <li>+ PLTN: </li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
            <span>Đã qua trường (Từ 6 tháng trở lên)</span>
            <div className="p-4">
              <table className="table-fixed border-collapse border border-black w-full text-center">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-1 w-1/5">Tên trường</th>
                    <th className="border border-black px-2 py-1 w-1/5">Chuyên ngành</th>
                    <th className="border border-black px-2 py-1 w-1/5">Hình thức ĐT</th>
                    <th className="border border-black px-2 py-1 w-1/5">Niên khoá</th>
                    <th className="border border-black px-2 py-1 w-1/5">Xếp loại TN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black h-10" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalPhuLucThacSi
