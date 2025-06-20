import { PrinterOutlined } from '@ant-design/icons'
import { useTrainingLanguageOptions } from '@hooks/trainingLanguage'
import { useFindUniqueCurriculumVersion } from '@workspace/db/hooks'
import { Button, Modal } from 'antd'
import dayjs from 'dayjs'
import { useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'

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

type ModalPrintToKQHTInput = {
    dataTable: any
    dataStudent: any
}

const ModalPrintToKQHT = () => {
    const formattedDate = `..., ngày ${dayjs().format('DD')} tháng ${dayjs().format('MM')} năm ${dayjs().format('YYYY')}`
    const printRef = useRef<HTMLDivElement>(null)

    const { isOpen, onClose, input } = useDisclosure<ModalPrintToKQHTInput>({
        tag: ModalPrintToKQHT.name,
    })

    console.log(input?.dataStudent)

    const { data: subjectScoreData } = useFindUniqueCurriculumVersion({
        where: {
            id: input?.dataStudent?.curriculumVersionId,
        },

        include: {
            trainingBlocks: {
                include: {
                    subjects: {
                        include: {
                            subject: {
                                include: {
                                    subjectClass: {
                                        where: {
                                            subjectClassStudent: {
                                                every: {
                                                    studentId:
                                                        input?.dataStudent?.id,
                                                },
                                            },
                                        },
                                        include: {
                                            subjectClassStudent: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    console.log(subjectScoreData)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
        @page {
            size: A4;
        }
        @media print {
            @page { margin: 1 1 1 1 !important; }
            body, html, #root {
                height: auto !important;
                overflow: visible !important;
            }
            .page {
                page-break-after: auto !important;
                break-after: auto !important;
                min-height: 297mm;
                width: 210mm;
                padding: 15mm;
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

    const { getTrainingLanguageLabel } = useTrainingLanguageOptions()

    const basicInfoCol1 = [
        {
            title: 'Họ và tên:',
            value: (
                <span className="font-medium">
                    {input?.dataStudent?.userProfile?.lastName}{' '}
                    {input?.dataStudent?.userProfile?.firstName}
                </span>
            ),
        },
        {
            title: 'Mã sinh viên:',
            value: <span>{input?.dataStudent?.code}</span>,
        },
        {
            title: 'Ngôn ngữ đào tạo:',
            value: (
                <span>
                    {getTrainingLanguageLabel(
                        input?.dataStudent?.curriculumVersion?.trainingLanguage
                    )}
                </span>
            ),
        },
        {
            title: 'Ngành đào tạo:',
            value: (
                <span>
                    {
                        input?.dataStudent?.curriculumVersion?.curriculum
                            ?.trainingMajor?.trainingField?.name
                    }
                </span>
            ),
        },
        {
            title: 'Chuyên ngành:',
            value: (
                <span>
                    {
                        input?.dataStudent?.curriculumVersion?.curriculum
                            ?.trainingMajor?.name
                    }
                </span>
            ),
        },
    ]

    const basicInfoCol2 = [
        {
            title: 'Ngày sinh:',
            value: (
                <span>
                    {dayjs(input?.dataStudent?.userProfile?.dateOfBirth).format(
                        'DD/MM/YYYY'
                    )}
                </span>
            ),
        },
        {
            title: 'Năm nhập học:',
            value: <span>{input?.dataStudent?.fixedClass?.startYear}</span>,
        },
        {
            title: 'Thời gian đào tạo:',
            value: (
                <span>{input?.dataStudent?.curriculumVersion?.time} năm</span>
            ),
        },
        {
            title: 'Trình độ đào tạo:',
            value: (
                <span>
                    {input?.dataStudent?.curriculumVersion?.trainingLevel?.name}
                </span>
            ),
        },

        {
            title: 'Hình thức đào tạo:',
            value: <span>{input?.dataStudent?.trainingForm?.name}</span>,
        },
    ]

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
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
                <div className="flex justify-between gap-5 mt-6">
                    <div className="flex flex-col gap-2.5 w-[50%]">
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
                    <div className="flex flex-col gap-2.5 w-[50%]">
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
                                Tổng số tín chỉ:
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
                            <div className="min-w-32">Xếp hạng:</div>
                            <span className="font-bold">Khá</span>
                        </div>
                    </div>
                    <div className="flex flex-col text-center mt-5">
                        <span className="italic">{formattedDate}</span>
                        <div className="uppercase font-bold flex flex-col">
                            <span>TL. GIÁM ĐỐC</span>
                            <span>Trưởng phòng đào tạo</span>
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

                    <div className="mt-2 text-sm">
                        {/* Sắp xếp dữ liệu theo thứ tự từ cao xuống thấp */}
                        {(() => {
                            const sortedData = [
                                ...(input?.dataTable?.[0]
                                    ?.trainingCoursesStart?.[0]
                                    ?.scoreConverts ?? []),
                            ].sort((a, b) => b.base4 - a.base4)

                            return (
                                <>
                                    {/* Dòng Thang điểm chữ */}
                                    <div className="grid grid-cols-[minmax(120px,1fr)_repeat(9,minmax(40px,1fr))] gap-x-2 mb-2 items-center">
                                        <div className="font-medium">
                                            Thang điểm chữ
                                        </div>
                                        {sortedData.map((item) => (
                                            <div
                                                key={item.id}
                                                className="text-center"
                                            >
                                                {item.letter}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dòng Thang điểm 4 */}
                                    <div className="grid grid-cols-[minmax(120px,1fr)_repeat(9,minmax(40px,1fr))] gap-x-2 mb-2 items-center">
                                        <div className="font-medium">
                                            Thang điểm 4
                                        </div>
                                        {sortedData.map((item) => (
                                            <div
                                                key={item.id}
                                                className="text-center"
                                            >
                                                {item.base4}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dòng Thang điểm 10 */}
                                    <div className="grid grid-cols-[minmax(120px,1fr)_repeat(9,minmax(40px,1fr))] gap-x-2 items-center">
                                        <div className="font-medium">
                                            Thang điểm 10
                                        </div>
                                        {sortedData.map((item) => (
                                            <div
                                                key={item.id}
                                                className="text-center"
                                            >
                                                {item.base10Min === 0
                                                    ? `<${item.base10Max + 0.1}`
                                                    : `${item.base10Min}${item.base10Max ? `-${item.base10Max}` : ''}`}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )
                        })()}
                    </div>

                    <p className="mt-2">
                        - Phân loại tốt nghiệp theo thang điểm 4: {(() => {
                            const uniqueClassifications = new Set()

                            return input?.dataTable?.[0]?.trainingCoursesStart?.[0]?.scoreConverts
                                ?.filter((item: any) => {
                                    // Chỉ lấy từ Xuất sắc tới TB
                                    const validClassifications = [
                                        'Xuất sắc',
                                        'Giỏi',
                                        'Khá',
                                        'TBK',
                                        'TB',
                                    ]
                                    const isValid =
                                        validClassifications.includes(
                                            item.classification
                                        )

                                    // Loại bỏ trùng lặp
                                    if (
                                        isValid &&
                                        !uniqueClassifications.has(
                                            item.classification
                                        )
                                    ) {
                                        uniqueClassifications.add(
                                            item.classification
                                        )
                                        return true
                                    }
                                    return false
                                })
                                ?.sort((a: any, b: any) => b.base4 - a.base4)
                                ?.map((item: any, index: any, array: any) => {
                                    // Xác định tên hiển thị và khoảng điểm hệ 4
                                    let displayName = item.classification
                                    let range = ''

                                    // Đổi tên hiển thị
                                    if (item.classification === 'TBK')
                                        displayName = 'Trung bình khá'
                                    if (item.classification === 'TB')
                                        displayName = 'Trung bình'

                                    // Xác định khoảng điểm
                                    switch (item.classification) {
                                        case 'Xuất sắc':
                                            range = '3.60-4.00'
                                            break
                                        case 'Giỏi':
                                            range = '3.20-3.59'
                                            break
                                        case 'Khá':
                                            range = '2.50-3.19'
                                            break
                                        case 'TBK':
                                            range = '2.30-2.49'
                                            break
                                        case 'TB':
                                            range = '2.00-2.29'
                                            break
                                        default:
                                            range = ''
                                    }

                                    return (
                                        <span
                                            key={item.id || item.classification}
                                        >
                                            {displayName}: {range}
                                            {index < array.length - 1
                                                ? '; '
                                                : ''}
                                        </span>
                                    )
                                })
                        })()}
                        .(Loại tốt nghiệp có thể bị hạ mức theo quy chế đào tạo
                        đại học của HVKTQS được áp dụng tại thời điểm xét tốt
                        nghiệp).
                    </p>
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

export default ModalPrintToKQHT
