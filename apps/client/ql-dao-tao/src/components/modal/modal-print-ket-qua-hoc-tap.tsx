import { Button, Modal } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useRef } from 'react'
import { PrinterOutlined } from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'
import { boolean } from 'zod'

dayjs.locale('vi')

const mockScoreData = [
    {
        id: 1,
        name: 'Vật lý đại cương 1',
        credit: 3,
        score10: 7.5,
        score4: 3.0,
        letter: 'B',
    },
    {
        id: 2,
        name: 'Thí nghiệm Vật lý đại cương 1',
        credit: 1,
        score10: 7.0,
        score4: 3.0,
        letter: 'B',
    },
    {
        id: 3,
        name: 'Vật lý đại cương 2',
        credit: 4,
        score10: 6.8,
        score4: 2.5,
        letter: 'C+',
    },
    {
        id: 4,
        name: 'Thí nghiệm Vật lý đại cương 2',
        credit: 1,
        score10: 6.7,
        score4: 2.5,
        letter: 'C+',
    },
    {
        id: 5,
        name: 'Hình giải tích và đại số tuyến tính',
        credit: 4,
        score10: 8.7,
        score4: 3.7,
        letter: 'A',
    },
    {
        id: 6,
        name: 'Giải tích 1',
        credit: 3,
        score10: 7.7,
        score4: 3.0,
        letter: 'B',
    },
    {
        id: 7,
        name: 'Giải tích 2',
        credit: 3,
        score10: 8.0,
        score4: 3.0,
        letter: 'B',
    },
    {
        id: 8,
        name: 'Lý thuyết xác suất thống kê',
        credit: 3,
        score10: 8.4,
        score4: 3.5,
        letter: 'B+',
    },
    {
        id: 9,
        name: 'Lập trình cơ bản',
        credit: 4,
        score10: 9.4,
        score4: 4.0,
        letter: 'A+',
    },
    {
        id: 10,
        name: 'Tiếng Anh B1.1',
        credit: 2,
        score10: 10.0,
        score4: 4.0,
        letter: 'A+',
    },
    {
        id: 11,
        name: 'Tiếng Anh B1.2',
        credit: 2,
        score10: 9.0,
        score4: 4.0,
        letter: 'A+',
    },
    {
        isGraduationPart: true,
        title: 'Học phần tốt nghiệp',
        items: [
            {
                id: 50,
                name: 'Thực tập công nghiệp',
                credits: 3,
                score10: 8.0,
                score4: 3.5,
                letter: 'B+',
            },
            {
                id: 51,
                name: 'Đồ án tốt nghiệp',
                credits: 6,
                score10: 7.7,
                score4: 3.0,
                letter: 'B',
            },
        ],
    },
]

interface ModalPrintToKQHTProps {
    isPrintModalOpen: boolean
    setIsPrintModalOpen: (open: boolean) => void
}

export default function ModalPrintToKQHT({
    isPrintModalOpen,
    setIsPrintModalOpen,
}: ModalPrintToKQHTProps) {
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
    })

    const basicInfoCol1 = [
        {
            title: 'Họ và tên:',
            value: <span className="font-medium">Trần Hữu Đức</span>,
        },
        {
            title: 'Mã sinh viên:',
            value: <span>18150064</span>,
        },
        {
            title: 'Ngôn ngữ đào tạo:',
            value: <span>Tiếng việt</span>,
        },
        {
            title: 'Ngành đào tạo:',
            value: '',
        },
        {
            title: 'Chuyên ngành:',
            value: <span>Công nghệ dữ liệu</span>,
        },
    ]

    const basicInfoCol2 = [
        {
            title: 'Ngày sinh:',
            value: <span>11/11/2025</span>,
        },
        {
            title: 'Ngày nhập học:',
            value: <span>11/12/2025</span>,
        },
        {
            title: 'Thời gian đào tạo:',
            value: <span>5 năm</span>,
        },
        {
            title: 'Trình độ đào tạo:',
            value: <span>Đại học</span>,
        },

        {
            title: 'Hình thức đào tạo:',
            value: <span>Chính quy</span>,
        },
    ]

    return (
        <Modal
            open={isPrintModalOpen}
            onCancel={() => setIsPrintModalOpen(false)}
            footer={null}
            width={900}
            style={{ top: 20 }}
            title={
                <div className="flex items-center justify-between w-[98%]">
                    <span>Kết quả học tập</span>
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
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
                className="mx-auto p-10 page text-sm leading-relaxed font-[Times New Roman]"
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
                            <span className="normal-case">
                                Độc lập - Tự do - Hạnh phúc
                            </span>
                            <hr className="text-black border-[1px] mx-14" />
                        </div>
                    </div>

                    <div className="mt-4 uppercase text-[20px]">
                        Phụ lục văn bằng
                    </div>
                    <div className="text-sm normal-case font-normal italic">
                        (Kèm theo bằng tốt nghiệp số hiệu ...)
                    </div>
                </div>
                <div className="flex justify-between flex-col gap-5 md:flex-row mt-6">
                    <div className="flex flex-col gap-2.5 w-full lg:w-[50%]">
                        {basicInfoCol1?.filter(Boolean).map((item, index) => (
                            <div
                                key={item?.title || index}
                                className="flex flex-col gap-1 sm:flex-row sm:gap-0 md:gap-2 lg:gap-10 w-full"
                            >
                                <span className="text-[#656565] text-sm min-w-32">
                                    {item?.title}
                                </span>
                                <span className="text-sm font-semibold">
                                    {item?.value}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2.5 w-full lg:w-[50%]">
                        {basicInfoCol2?.filter(Boolean).map((item, index) => (
                            <div
                                key={item?.title || index}
                                className="flex flex-col gap-1 sm:flex-row sm:gap-0 md:gap-2 lg:gap-10"
                            >
                                <span className="text-[#656565] text-sm min-w-32">
                                    {item?.title}
                                </span>
                                <span className="text-sm font-semibold">
                                    {item?.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto text-sm mt-6">
                    <table className="w-full border border-black border-collapse">
                        <thead>
                            <tr>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 w-[40px] text-center"
                                >
                                    TT
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 text-center"
                                >
                                    Tên học phần
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 w-[60px] text-center"
                                >
                                    Số tín chỉ
                                </th>
                                <th
                                    colSpan={3}
                                    className="border border-black px-1 py-1 text-center"
                                >
                                    Điểm học phần
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
                            {mockScoreData.map((item, index) =>
                                item.isGraduationPart ? (
                                    <>
                                        <tr
                                            key={`graduation-title-${item.title}`}
                                        >
                                            <td
                                                colSpan={6}
                                                className="border border-black px-1 py-1 font-semibold"
                                            >
                                                {item.title}
                                            </td>
                                        </tr>
                                        {item.items.map((subItem, index) => (
                                            <tr key={subItem.id}>
                                                <td className="border border-black px-1 py-1 text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="border border-black px-1 py-1">
                                                    {subItem.name}
                                                </td>
                                                <td className="border border-black px-1 py-1 text-center">
                                                    {subItem.credits}
                                                </td>
                                                <td className="border border-black px-1 py-1 text-center">
                                                    {subItem.score10}
                                                </td>
                                                <td className="border border-black px-1 py-1 text-center">
                                                    {subItem.score4}
                                                </td>
                                                <td className="border border-black px-1 py-1 text-center">
                                                    {subItem.letter}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : (
                                    <tr key={item.id}>
                                        <td className="border border-black px-1 py-1 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="border border-black px-1 py-1">
                                            {item.name}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-center">
                                            {item.credit}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-center">
                                            {item.score10}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-center">
                                            {item.score4}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-center">
                                            {item.letter}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="overflow-x-auto mt-6 flex justify-between">
                    <div className="flex flex-col max-w-[70%]">
                        <div className="flex">
                            <div className="italic min-w-32">
                                Tổng số tín chỉ:{' '}
                            </div>
                            <span className="font-bold">153</span>
                        </div>
                        <div>
                            <span>
                                Điểm trung bình chung tích lũy toàn khóa (Thanh
                                điểm 4):{' '}
                            </span>
                            <span className="font-bold">3,03</span>
                        </div>
                        <div className="flex">
                            <div className="min-w-32">Xếp hạng: </div>
                            <span className="font-bold">Khá</span>
                        </div>
                    </div>
                    <div className="flex flex-col text-center mt-5">
                        <span className="italic">
                            Hà Nội, ngày 06 tháng 01 năm 2025
                        </span>
                        <div className="uppercase font-bold flex flex-col">
                            <span>TL. GIÁM ĐỐC</span>
                            <span>Trường phòng đào tạo</span>
                        </div>
                        <div className="min-h-40 flex items-end justify-center">
                            <span>Đại tá, TS Nguyễn Trọng Lưu</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-sm leading-[1.5] whitespace-pre-wrap">
                    <p className="italic font-[500]">Ghi chú:</p>
                    <p>- Học phần có đánh dấu * là học phần tự chọn.</p>
                    <p>
                        - Học phần tin nghiệm và học phần bổ sung kiến thức
                        không được tính vào trung bình chung tích lũy.
                    </p>
                    <p>- Hệ thống điểm được quy định theo:</p>

                    <div className="mt-2 ml-6 text-sm">
                        <div className="grid grid-cols-[160px_repeat(9,minmax(40px,1fr))] gap-x-4 font-medium">
                            <div>Thang điểm chữ</div>
                            <div>A+</div>
                            <div>A</div>
                            <div>B+</div>
                            <div>B</div>
                            <div>C+</div>
                            <div>C</div>
                            <div>D+</div>
                            <div>D</div>
                            <div>F</div>

                            <div className="mt-2">Thang điểm 4</div>
                            <div>4.0</div>
                            <div>4.0</div>
                            <div>3.5</div>
                            <div>3.0</div>
                            <div>2.5</div>
                            <div>2.0</div>
                            <div>1.5</div>
                            <div>1.0</div>
                            <div>0.0</div>

                            <div className="mt-2">Thang điểm 10</div>
                            <div>9.0 – 10</div>
                            <div>8.5 – 8.9</div>
                            <div>8.0 – 8.4</div>
                            <div>7.0 – 7.9</div>
                            <div>6.5 – 6.9</div>
                            <div>5.5 – 6.4</div>
                            <div>5.0 – 5.4</div>
                            <div>4.0 – 4.9</div>
                            <div>&lt; 4.0</div>
                        </div>
                    </div>

                    <p className="mt-4">
                        - Phân loại tốt nghiệp theo thang điểm 4:
                    </p>
                    <div className="ml-6 mt-1 space-y-1">
                        <p>Xuất sắc: 3.60 – 4.00</p>
                        <p>Giỏi: 3.20 – 3.59</p>
                        <p>Khá: 2.50 – 3.19</p>
                        <p>Trung bình khá: 2.30 – 2.49</p>
                        <p>
                            Trung bình: 2.00 – 2.29 (Loại tốt nghiệp có thể ị hạ
                            mức theo quy chế đào tạo đại học của HVKTQS được áp
                            dụng tại thời điểm xét tốt nghiệp)
                        </p>
                    </div>
                </div>
            </div>
            <style>
                {`
                @media print {
    .page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      background: white;
      overflow: hidden;
    }
  }

  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  table {
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
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
