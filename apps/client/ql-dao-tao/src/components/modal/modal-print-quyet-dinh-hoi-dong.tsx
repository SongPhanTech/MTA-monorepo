import { PrinterOutlined } from '@ant-design/icons'
import type { DM_DonVi, FixedClass, Student, TrainingCourse } from '@workspace/db'
import { Button, Modal } from 'antd'
import dayjs from 'dayjs'
import { useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'

dayjs.locale('vi')

type ModalPrintDecisionInput = {
    dataTable: Student[]
    dataFixedClass: FixedClass & {
        trainingCourse?: TrainingCourse
        managementOrganization?: DM_DonVi
    }
}

const ModalPrintDecision = () => {
    const formattedDate = `..., ngày ${dayjs().format('DD')} tháng ${dayjs().format('MM')} năm ${dayjs().format('YYYY')}`
    const printRef = useRef<HTMLDivElement>(null)

    const { isOpen, onClose, input } = useDisclosure<ModalPrintDecisionInput>({
        tag: ModalPrintDecision.name,
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

    const basicInfoCol1 = [
        {
            title: 'Mã lớp niên chế:',
            value: <span>{input?.dataFixedClass?.code}</span>,
        },
        {
            title: 'Khoá:',
            value: <span>{input?.dataFixedClass?.trainingCourse?.name}</span>,
        },
    ]

    const basicInfoCol2 = [
        {
            title: 'Tên lớp niên chế:',
            value: <span className="font-medium">{input?.dataFixedClass?.name}</span>,
        },
        {
            title: 'Đơn vị quản lý:',
            value: (
                <span>
                    {input?.dataFixedClass?.managementOrganization?.sMa} -{' '}
                    {input?.dataFixedClass?.managementOrganization?.sTen}
                </span>
            ),
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
                <div className="flex items-center justify-between w-[95%]">
                    <span>Danh sách quyết định</span>
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
                className="mx-auto p-10 page text-sm leading-relaxed !font-time-news-roman"
            >
                <div className="text-center font-bold uppercase">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-normal">BỘ QUỐC PHÒNG</span>
                            <span className="leading-none">HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
                            <hr className="border-t-[1px] border-black mx-14" />
                            <span className="font-normal normal-case mt-1">Số: 2954/QĐ-HV</span>
                        </div>
                        <div className="flex flex-col">
                            <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                            <span className="normal-case leading-none">
                                Độc lập - Tự do - Hạnh phúc
                            </span>
                            <hr className="border-t-[1px] border-black mx-14" />
                            <div className="font-normal normal-case italic mt-1">
                                Hà Nội, ngày 02 tháng 6 năm 2025
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-[20px]">Quyết định</div>
                    <div className="font-semibold normal-case text-[20px] leading-none">
                        Thành lập hội đồng đánh giá luận văn - Đợt tháng 6/2025
                    </div>
                    <hr className="border-t-[1px] border-black w-[240px] mx-auto" />

                    <div className="mt-4 text-[20px]">Giám đốc học viện kỹ thuật quân sự</div>
                    <div>
                        <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                            Căn cứ chức năng, nhiệm vụ, quyền hạn của Học viện KTQS;
                        </div>
                        <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                            Căn cứ Quy chế số 923/QC-HV ngày 28/3/2022 của Học viện về Tuyển sinh và
                            đào tạo trình độ thạc sĩ tại Học viện KTQS;
                        </div>
                        <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                            Theo đề nghị của đồng chí Trưởng phòng Sau đại học tại tờ trình số
                            406/TTr-SĐH ngày 30/5/2025.
                        </div>
                        <div className="mt-4 text-[20px]">Quyết định:</div>
                    </div>
                </div>
                <div className="text-[18px] mt-8 leading-5">
                    <div className="indent-6">
                        <strong>Điều 1.</strong> Thành lập hội đồng đánh giá luận văn thạc sĩ ngành
                        Khoa học máy tính về đề tài:{' '}
                        <i>
                            <strong>"abc"</strong>
                        </i>
                        .
                    </div>
                    <div className="indent-6">
                        Học viên thực hiện: Nguyễn Thị A, sinh ngày 12/10/1999,Khóa 35(2023-2025).
                    </div>
                    <div className="indent-6">Cán bộ hướng dẫn: TS.Nguyễn Quốc Khánh.</div>
                    <div className="indent-6">
                        Chỉ định và mời các đồng chí có tên sau đây tham gia hội đồng:
                    </div>
                    <ul className="list-none indent-6">
                        <li className="grid grid-cols-3 gap-2 mb-1">
                            <span className="col-span-1 before:content-['-'] before:mr-1">
                                TS. Phan Việt Anh
                            </span>
                            <span>HVKTQS</span>
                            <span>Chủ tịch</span>
                        </li>
                        <li className="grid grid-cols-3 gap-2 mb-1">
                            <span className="col-span-1 before:content-['-'] before:mr-1">
                                TS. Phan Thị Hải Hồng
                            </span>
                            <span>HVKTQS</span>
                            <span>Thư ký</span>
                        </li>
                        <li className="grid grid-cols-3 gap-2 mb-1">
                            <span className="col-span-1 before:content-['-'] before:mr-1">
                                TS. Nguyễn Chí Thành
                            </span>
                            <span>Viện CNTT</span>
                            <span>Ủy viên, Phản biện 1</span>
                        </li>
                        <li className="grid grid-cols-3 gap-2 mb-1">
                            <span className="col-span-1 before:content-['-'] before:mr-1">
                                TS. Nguyễn Trung Dũng
                            </span>
                            <span>Viện 10/BTL86</span>
                            <span>Ủy viên, Phản biện 2</span>
                        </li>
                        <li className="grid grid-cols-3 gap-2">
                            <span className="col-span-1 before:content-['-'] before:mr-1">
                                TS. Nguyễn Mạnh Hùng
                            </span>
                            <span>HVKTQS</span>
                            <span>Ủy viên</span>
                        </li>
                    </ul>
                    <div className="indent-6 mt-1">
                        <strong>Điều 2.</strong> Nhiệm vụ của Hội đồng được quy định theo Quy chế
                        đào tạo trình độ thạc sĩ của Bộ GD&ĐT và của Học viện.
                    </div>
                    <div className="indent-6 mt-1">
                        <strong>Điều 3.</strong> Quyết định này có hiệu lực kể từ ngày ký. Đồng chí
                        Trưởng phòng Sau đại học, Viện trưởng Viện công nghệ thông tin và Truyền
                        thông chủ trì chuyên ngành đào tạo và các đồng chí có tên tại Điều 1 chịu
                        trách nhiệm thi hành Quyết định này./.
                    </div>
                </div>
                <div className="overflow-x-auto mt-6 flex justify-between">
                    <div className="flex flex-col text-[16px]">
                        <div className="flex flex-col">
                            <span className="font-semibold italic">Nơi nhận:</span>
                            <ul className="list-none leading-4">
                                <li>- GĐHV;</li>
                                <li>- K11, K21, K21, K22, K24, K31;</li>
                                <li>- V2, V4, V5, V6, P9;</li>
                                <li>- Lưu: VT, P7 (03). Tha17.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col text-center">
                        <div className="font-bold flex flex-col text-[18px]">
                            <span className="uppercase">GIÁM ĐỐC</span>
                            <span className="font-normal my-2">(Đã ký)</span>
                            <span>Trung tướng Lê Minh Thái</span>
                        </div>
                    </div>
                </div>
                <hr className="border-t-[1px] border-black" />
                <div className="flex items-center text-center font-bold uppercase justify-between mt-2">
                    <div className="flex flex-col">
                        <span className="font-normal">BỘ QUỐC PHÒNG</span>
                        <span className="leading-none">HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
                        <hr className="border-t-[1px] border-black mx-14" />
                        <span className="font-normal normal-case mt-1">Số: &emsp;&emsp;/QĐ-HV</span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <span>Trích sao</span>
                        <div className="font-normal normal-case italic mt-1">
                            Hà Nội, ngày 02 tháng 6 năm 2025
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto mt-6 flex justify-between">
                    <div className="flex flex-col text-[16px]">
                        <div className="flex flex-col">
                            <span className="font-semibold italic">Nơi nhận:</span>
                            <ul className="list-none leading-4">
                                <li>- Thành viên Hội đồng(05);</li>
                                <li>- Hồ sơ bảo vệ(01);</li>
                                <li>- Lưu: QL/P7. Th07;</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col text-center">
                        <div className="font-bold flex flex-col text-[18px]">
                            <span className="uppercase">TL. GIÁM ĐỐC</span>
                            <span className="uppercase">KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC</span>
                            <span className="uppercase">PHÓ TRƯỞNG PHÒNG</span>
                            <span className="mt-12">Đại tá Trần Ngọc Châu</span>
                        </div>
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

export default ModalPrintDecision
