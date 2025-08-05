import { PrinterOutlined } from '@ant-design/icons'
import { useFindUniqueStaff } from '@workspace/db/hooks'
import { Button, Modal } from 'antd'
import dayjs from 'dayjs'
import { useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'
import { data, data2, data3 } from '@/utils/dataFake'

dayjs.locale('vi')

type ModalSoYeuLyLichInput = {
    id: string
}

const ModalSoYeuLyLich = () => {
    const formattedDate = `..., Ngày ${dayjs().format('DD')} tháng ${dayjs().format('MM')} năm ${dayjs().format('YYYY')}`
    const printRef = useRef<HTMLDivElement>(null)

    const { isOpen, onClose, input } = useDisclosure<ModalSoYeuLyLichInput>({
        tag: ModalSoYeuLyLich.name,
    })

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

    const { data: initialData } = useFindUniqueStaff(
        {
            where: {
                id: input?.id,
            },
            include: {
                userProfile: {
                    include: {
                        religion: true,
                        ethnicity: true,
                    },
                },
            },
        },
        { enabled: !!input?.id }
    )

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
                className="mx-auto p-10 page text-sm leading-relaxed !font-time-news-roman flex flex-col gap-2 page-1"
            >
                <div className="flex gap-2">
                    <div className="border border-solid border-black min-w-[151.181px] h-[226.771px] flex items-center justify-center">
                        Ảnh màu <br /> (4 x 6 cm)
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
                            1. Họ và tên (chữ in hoa): {initialData?.userProfile?.fullname}
                            <span className="inline-block flex-1 border-b border-dotted  border-black" />
                            , Giới tính (nam, nữ):
                            <span className="inline-block w-32 flex-2 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            2. Họ tên thường dùng:{' '}
                            <span className="inline-block flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            3. Sinh ngày:
                            <span className="inline-block w-14 flex-1 border-b border-dotted  border-black" />
                            tháng
                            <span className="inline-block w-12 flex-1 border-b border-dotted  border-black" />
                            năm
                            <span className="inline-block w-16 flex-1 border-b border-dotted  border-black" />
                        </p>

                        <p className="flex w-full leading-[12px] mb-4">
                            4. Nơi sinh:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>

                        <p className="flex w-full leading-[12px] mb-4">
                            5. Nguyên quán:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            6. Nơi đăng ký hộ khẩu thường trú:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            7. Chỗ ở hiện nay:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            8. Điện thoại liên hệ:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            Email:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            9. Dân tộc:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            Tôn giáo:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            10. Thành phần gia đình:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            11. Số CMND/CCCD:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            Ngày cấp
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            Nơi cấp
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
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
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            Tin học:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            14. Trình độ lý luận chính trị:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            15. Ngày vào đoàn TNCS HCM:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            16. Ngày vào đảng CSVN:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            Chính thức:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            17. Cơ quan công tác hiện nay (nếu có):
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            18. Chức vụ hiện nay (nếu có):
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            19. Học vị, học hàm, danh hiệu Nhà nước phong tặng:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            20. Khen thưởng:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            21. Kỷ luật:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full leading-[12px] mb-4">
                            22. Sở truòng:
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                        </p>
                    </div>
                </div>
                <div className="flex w-full leading-[12px] mb-4 font-bold">
                    II. QUAN HỆ GIA ĐÌNH{' '}
                    <span className="italic font-[400]">
                        (Ghi rõ họ tên, năm sinh, nghề nghiệp, nơi công tác của bố mẹ đẻ, anh chị em
                        ruột)
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
                            {filledRows3.map((row, index) => (
                                <tr key={`${row.fullName}-${index}`}>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.relationship || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.fullName || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.yearOfBirth || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.details || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.details || ''}
                                    </td>
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
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.relationship || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.fullName || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.yearOfBirth || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.details || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.details || ''}
                                    </td>
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
                                <th className="border border-black p-1 text-center font-semibold w-[20%]">
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
                            {filledRows3.map((row, index) => (
                                <tr key={`${row.fullName}-${index}`}>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.relationship || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.fullName || ''}
                                    </td>
                                    <td className="border border-black p-1 h-[32px]">
                                        {row.yearOfBirth || ''}
                                    </td>
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
                        <span className="font-bold">
                            Thủ trưởng cơ quan, đơn vị quản lý và sử dụng CBCC
                        </span>
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
