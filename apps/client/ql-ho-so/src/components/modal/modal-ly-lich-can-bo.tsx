import { PrinterOutlined } from '@ant-design/icons'
import { GridBlock } from '@components/commons/grid-block'
import { useFindUniqueStaff } from '@workspace/db/hooks'
import { Button, Modal } from 'antd'
import dayjs from 'dayjs'
import { useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'
import { data, data2, data3 } from '@/utils/dataFake'

dayjs.locale('vi')

type ModalLyLichCanBoInput = {
    id: string
}

const ModalLyLichCanBo = () => {
    const formattedDate = `..., Ngày ${dayjs().format('DD')} tháng ${dayjs().format('MM')} năm ${dayjs().format('YYYY')}`
    const printRef = useRef<HTMLDivElement>(null)

    const { isOpen, onClose, input } = useDisclosure<ModalLyLichCanBoInput>({
        tag: ModalLyLichCanBo.name,
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
                    <span>Modal tóm tắt lý lịch</span>
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
                className="mx-auto p-10 page text-sm leading-relaxed font-time-news-roman flex flex-col gap-2 page-1"
            >
                <span className="italic flex w-full justify-center">
                    Mẫu 2C-BNV/2008 ban hành kèm theo Quyết định số 02/2008/QĐ-BNV ngày 06/10/2008
                    của Bộ trưởng Bộ Nội vụ
                </span>
                <p>
                    Cơ quan, đơn vị có thẩm quyền quản lý CBCC{' '}
                    <span className="inline-block w-24 flex-1 border-b border-dotted  border-black" />
                    &nbsp; Số hiệu cán bộ, công chức:{' '}
                    <span className="inline-block w-36 flex-1 border-b border-dotted  border-black" />
                </p>
                <p className="mt-2">
                    Cơ quan, đơn vị sử dụng CBCC
                    <span className="inline-block w-64 flex-1 border-b border-dotted  border-black" />
                </p>
                <span className="uppercase flex w-full justify-center font-bold">
                    SƠ YẾU LÝ LỊCH CÁN BỘ, CÔNG CHỨC
                </span>
                <div className="flex gap-2">
                    <div className="border border-solid border-black min-w-[151.181px] min-h-[226.771px] flex items-center justify-center">
                        Ảnh màu <br /> (4 x 6 cm)
                    </div>
                    <div className="w-full flex flex-col items-start justify-center">
                        <p className="flex w-full uppercase">
                            1) Họ và tên khai sinh (viết chữ in hoa):{' '}
                            {initialData?.userProfile?.fullname}
                            <span className="inline-block flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full">
                            2) Tên gọi khác:{' '}
                            <span className="inline-block flex-1 border-b border-dotted  border-black" />
                        </p>
                        <p className="flex w-full">
                            3) Sinh ngày:
                            <span className="inline-block w-14 flex-1 border-b border-dotted  border-black" />
                            tháng
                            <span className="inline-block w-12 flex-1 border-b border-dotted  border-black" />
                            năm
                            <span className="inline-block w-16 flex-1 border-b border-dotted  border-black" />
                            , Giới tính (nam, nữ):
                            <span className="inline-block w-32 flex-1 border-b border-dotted  border-black" />
                        </p>

                        <p className="flex w-full">
                            4) Nơi sinh: Xã
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            , Huyện
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            , Tỉnh
                            <span className="inline-block w-28 flex-1 border-b border-dotted  border-black" />
                        </p>

                        <p className="flex w-full">
                            5) Quê quán: Xã
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            , Huyện
                            <span className="inline-block w-40 flex-1 border-b border-dotted  border-black" />
                            , Tỉnh
                            <span className="inline-block w-28 flex-1 border-b border-dotted  border-black" />
                        </p>
                    </div>
                </div>
                <GridBlock
                    columns={2}
                    items={[
                        { key: 'dan-toc', content: <>6) Dân tộc: </> },
                        { key: 'ton-giao', content: <>7) Tôn giáo: </> },
                    ]}
                />
                <span>
                    8) Nơi đăng ký bộ khẩu thường trú (Số nhà, đường phố, thành phố, xóm, thôn, xã,
                    huyện, tỉnh):{' '}
                </span>
                <span>
                    9) Nơi ở hiện nay (Số nhà, đường phố, thành phố, xóm, thôn, xã, huyện, tỉnh):{' '}
                </span>
                <span>10) Nghề nghiệp khi được tuyển dụng: </span>
                <GridBlock
                    columns={2}
                    items={[
                        { key: 'ngay-tuyen-dung', content: <>11) Ngày tuyển dụng: </> },
                        { key: 'co-quan', content: <>, Cơ quan tuyển dụng: </> },
                    ]}
                />
                <span>
                    12) Chức vụ (chức danh) hiện tại (Về chính quyền hoặc Đảng, đoàn thể, kể cả chức
                    vụ kiêm nhiệm):{' '}
                </span>
                <span>13) Công việc chính được giao: </span>
                <div className="flex w-full">
                    <div className="w-[70%]">14) Ngạch công chức (viên chức): </div>
                    <div className="w-[30%]">, Mã ngạch: </div>
                </div>
                <div className="flex w-full">
                    <div className="w-[20%]">Bậc lương: </div>
                    <div className="w-[20%]">, Hệ số: </div>
                    <div className="w-[20%]">, Ngày hưởng: </div>
                    <div className="w-[20%]">, Phụ cấp chức vụ: </div>
                    <div className="w-[20%]">, Phụ cấp khác: </div>
                </div>
                <span>
                    15.1- Trình độ giáo dục phổ thông (đã tốt nghiệp lớp mấy/thuộc hệ nào):{' '}
                </span>
                <span>
                    15.2- Trình độ chuyên môn cao nhất (TSKH, TS, Ths, cử nhân, kỹ sư, cao đẳng,
                    trung cấp, sơ cấp, chuyên ngành):{' '}
                </span>
                <div className="flex w-full">
                    <div className="w-[50%]">15.3- Lý luận chính trị: </div>
                    <div className="w-[50%]">15.4-Quản lý nhà nước: </div>
                </div>
                <div className="flex w-full">
                    <div className="w-[50%]">15.5- Ngoại ngữ: </div>
                    <div className="w-[50%]">15.6-Tin học: </div>
                </div>
                <div className="flex w-full">
                    <div className="w-[60%]">16) Ngày vào Đảng Cộng sản Việt Nam: </div>
                    <div className="w-[40%]">, Ngày chính thức: </div>
                </div>
                <span>
                    17) Ngày tham gia tổ chức chính trị - xã hội (Ngày tham gia tổ chức: Đoàn,
                    Hội,..... và làm việc gì trong tổ chức đó):{' '}
                </span>
                <div className="flex w-full">
                    <div className="w-[33.3%]">18) Ngày nhập ngũ: </div>
                    <div className="w-[33.3%]">Ngày xuất ngũ: </div>
                    <div className="w-[33.3%]">Quân hàm cao nhất: </div>
                </div>
                <span>19) Danh hiệu được phong tặng cao nhất: </span>
                <span>20) Sở trường công tác: </span>
                <div className="flex w-full">
                    <div className="w-[50%]">21) Khen thưởng: </div>
                    <div className="w-[50%]">22) Kỷ luật: </div>
                </div>
                <div className="flex w-full">
                    <div className="w-[25%]">23) Tình trạng sức khoẻ: </div>
                    <div className="w-[25%]">, Chiều cao: </div>
                    <div className="w-[25%]">, Cân nặng: </div>
                    <div className="w-[25%]">, Nhóm máu: </div>
                </div>
                <div className="flex w-full">
                    <div className="w-[50%]">24) Là thương binh hạng: </div>
                    <div className="w-[50%]">, Là con gia đình chính sách: </div>
                </div>
                <div className="flex w-full">
                    <div className="w-[33.3%]">25) Số chứng minh nhân dân: </div>
                    <div className="w-[33.3%]">Ngày cấp: </div>
                    <div className="w-[33.3%]">26) Số sổ BHXH: </div>
                </div>
                <span>
                    27) Đào tạo, bồi dưỡng về chuyên môn, nghiệp vụ, lý luận chính trị, ngoại ngữ,
                    tin học:{' '}
                </span>
                <table className="w-full table-fixed border border-black">
                    <thead>
                        <tr>
                            <th className="border border-black p-1 text-center font-semibold">
                                Tên trường
                            </th>
                            <th className="border border-black p-1 text-center font-semibold">
                                Chuyên ngành đào tạo, bồi dưỡng
                            </th>
                            <th className="border border-black p-1 text-center font-semibold">
                                Từ tháng, năm -<br />
                                đến tháng, năm
                            </th>
                            <th className="border border-black p-1 text-center font-semibold">
                                Hình thức
                                <br />
                                đào tạo
                            </th>
                            <th className="border border-black p-1 text-center font-semibold">
                                Văn bằng, chứng chỉ, <br />
                                trình độ gì
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filledRows.map((item, i) => (
                            <tr key={`${item.school}-${i}`}>
                                <td className="border border-black p-1 text-center h-[32px]">
                                    {item.school || ''}
                                </td>
                                <td className="border border-black p-1 text-center h-[32px]">
                                    {item.major || ''}
                                </td>
                                <td className="border border-black p-1 text-center h-[32px]">
                                    {item.duration || '....../....../......'}
                                </td>
                                <td className="border border-black p-1 text-center h-[32px]">
                                    {item.type || ''}
                                </td>
                                <td className="border border-black p-1 text-center h-[32px]">
                                    {item.certificate || ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <span>
                    <span className="italic">Ghi chú:</span> Hình thức đào tạo: Chính quy, tại chức,
                    chuyên tu, bồi dưỡng ..../ Văn bằng: TSKH, TS, Ths, Cử nhân, Kỹ sư ............
                </span>
                <span>28) Tóm tắt quá trình công tác</span>
                <table className="w-full table-fixed border border-black">
                    <thead>
                        <tr>
                            <th className="border border-black p-1 text-center font-semibold w-1/4">
                                Từ tháng, năm đến
                                <br />
                                tháng, năm
                            </th>
                            <th className="border border-black p-1 text-center font-semibold w-3/4">
                                Chức danh, chức vụ, đơn vị công tác (Đảng, chính quyền, đoàn thể, tổ
                                chức xã hội), kể cả thời gian được đào tạo, bồi dưỡng về chuyên môn,
                                nghiệp vụ, ......
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filledRows2.map((item, i) => (
                            <tr key={`${item.duration}-${i}`}>
                                <td className="border border-black p-1 h-[32px]">
                                    {item.duration || ''}
                                </td>
                                <td className="border border-black p-1 h-[32px]">
                                    {item.detail || ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <span>29) Đặc điểm lịch sử bản thân:</span>
                <span>
                    - Khai rõ: bị bắt, bị tù (từ ngày tháng năm nào đến ngày tháng năm nào, ở đâu),
                    đã khai báo cho ai, những vấn đề gì? Bản thân có làm việc trong chế độ cũ (cơ
                    quan, đơn vị nào, địa điểm, chức danh, chức vụ, thời gian làm việc ....)
                </span>
                <div className="space-y-2">
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                </div>
                <span>
                    - Tham gia hoặc có quan hệ với các tổ chức chính trị, kinh tế, xã hội nào ở nước
                    ngoài (làm gì, tổ chức nào, đặt trụ sở ở đâu .........?):
                </span>
                <div className="space-y-2">
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                </div>
                <span>
                    - Có thân nhân (Cha, Mẹ, Vợ, Chồng, con, anh chị em ruột) ở nước ngoài (làm gì,
                    địa chỉ ........)?
                </span>
                <div className="space-y-2">
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                </div>
                <span>30) Quan hệ gia đình</span>
                <span>a) Về bản thân: Cha, Mẹ, Vợ (hoặc chồng), các con, anh chị em ruột</span>
                <table className="min-w-full border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-black p-1 text-center font-semibold w-[10%]">
                                Mối quan hệ
                            </th>
                            <th className="border border-black p-1 text-center font-semibold w-[30%]">
                                Họ và tên
                            </th>
                            <th className="border border-black p-1 text-center font-semibold  w-[10%]">
                                Năm sinh
                            </th>
                            <th className="border border-black p-1 text-center font-semibold w-[50%]">
                                Quê quán, nghề nghiệp, chức danh, chức vụ, đơn vị công tác, học tập,
                                nơi ở (trong, ngoài nước); thành viên các tổ chức chính trị - xã hội
                                ……
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
                            </tr>
                        ))}
                    </tbody>
                </table>
                <span>b) Về bên vợ (hoặc chồng): Cha, Mẹ, anh chị em ruột</span>
                <table className="min-w-full border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border border-black p-1 text-center font-semibold w-[10%]">
                                Mối quan hệ
                            </th>
                            <th className="border border-black p-1 text-center font-semibold w-[30%]">
                                Họ và tên
                            </th>
                            <th className="border border-black p-1 text-center font-semibold  w-[10%]">
                                Năm sinh
                            </th>
                            <th className="border border-black p-1 text-center font-semibold w-[50%]">
                                Quê quán, nghề nghiệp, chức danh, chức vụ, đơn vị công tác, học tập,
                                nơi ở (trong, ngoài nước); thành viên các tổ chức chính trị - xã hội
                                ……
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
                            </tr>
                        ))}
                    </tbody>
                </table>
                <span>31) Diễn biến quá trình lương của cán bộ, công chức</span>
                <table className="min-w-full border border-black">
                    <tbody>
                        {['Tháng/năm', 'Mã ngạch/bậc', 'Hệ số lương'].map((header) => (
                            <tr key={header}>
                                <td className="border border-black p-2 font-medium w-1/4">
                                    {header}
                                </td>
                                {[...Array(5)].map((_, cellIndex) => {
                                    const cellKey = `${header.replace(/\s+/g, '-')}-cell-${cellIndex}`
                                    return (
                                        <td key={cellKey} className="border border-black p-2 h-8" />
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <span>
                    32) Nhận xét, đánh giá của cơ quan, đơn vị quản lý và sử dụng cán bộ, công chức
                </span>
                <div className="space-y-2">
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                </div>
                <span className="flex justify-end">{formattedDate}</span>
                <div className="flex w-full">
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

export default ModalLyLichCanBo
