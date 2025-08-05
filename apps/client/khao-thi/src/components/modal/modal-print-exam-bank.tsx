// import { formatDateVN } from '@lib/utils'
import type { ExamBankQuestion, Question } from '@workspace/db'
// import { Docxtemplater, exportFile, loadFile } from '@workspace/libs/docxjs'
import { Button, Modal, Space } from 'antd'
// import dayjs from 'dayjs'
// import { saveAs } from 'file-saver'
// import { upperFirst } from 'lodash'
import { FileDown, Printer } from 'lucide-react'
import { useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'

const tableCellClassName = 'border text-black bg-white border-black text-center p-2 text-xs'
const tableHeaderClassName =
    'border text-black bg-white border-black text-center p-2 font-bold text-xs'

export const ModalPrintExamBank = () => {
    const { isOpen, onClose, input } = useDisclosure<{
        data?: (ExamBankQuestion & { question: Question })[]
    }>({
        tag: ModalPrintExamBank.name,
    })

    const handoverId = (input as any)?.handoverId

    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        // documentTitle: `Bien_ban_ban_giao_${handoverDetail?.number || ''}.pdf`,
    })

    // Xử lý xuất file Word
    const exportToWord = async () => {
        // if (!handoverDetail) return
        // try {
        //     console.log('Loading template file...')
        //     const res = await loadFile('/templates/BMKT05.docx')
        //     console.log('Template loaded successfully:', !!res)
        //     console.log('Initializing Docxtemplater...')
        //     const doc = new Docxtemplater(res, {
        //         linebreaks: true,
        //         paragraphLoop: true,
        //         errorLogging: true,
        //     })
        //     // Lấy thông tin thiết bị
        //     const equipmentInfo = handoverDetail.equipmentRevampContent?.equipmentLocation
        //     const equipmentName = equipmentInfo?.realEquipment?.equipment?.equipmentName || ''
        //     const serial = equipmentInfo?.realEquipment?.serial || ''
        //     const organizationFromNameUpper = upperFirst(
        //         handoverDetail.organizationFrom?.name || ''
        //     )
        //     const organizationToNameUpper = upperFirst(handoverDetail.organizationTo?.name || '')
        //     // Format dữ liệu cho template
        //     const templateData = {
        //         // Thông tin cơ bản
        //         number: handoverDetail.number || '',
        //         date: handoverDetail.date ? formatDateVN(handoverDetail.date) : '',
        //         currentDate: formatDateVN(dayjs()),
        //         currentDay: dayjs().date(),
        //         currentMonth: dayjs().month() + 1,
        //         currentYear: dayjs().year(),
        //         // Thông tin tổ chức
        //         organizationFromName: handoverDetail.organizationFrom?.name || '',
        //         organizationToName: handoverDetail.organizationTo?.name || '',
        //         organizationFromNameUpper: organizationFromNameUpper,
        //         organizationToNameUpper: organizationToNameUpper,
        //         // Thông tin thiết bị chính
        //         equipmentName: equipmentName,
        //         equipmentSerial: serial,
        //         equipmentUnit: equipmentInfo?.realEquipment?.equipment?.unit || '',
        //         equipmentLocation: equipmentInfo?.organization?.name || '',
        //         // Số phiếu sản xuất
        //         productionNumber: latestProductionLog?.number || handoverDetail.number || '',
        //         // Ngày tháng từ handoverDetail
        //         handoverDay: handoverDetail.date ? new Date(handoverDetail.date).getDate() : '',
        //         handoverMonth: handoverDetail.date
        //             ? new Date(handoverDetail.date).getMonth() + 1
        //             : '',
        //         handoverYear: handoverDetail.date
        //             ? new Date(handoverDetail.date).getFullYear()
        //             : '',
        //         // Thành phần tham gia
        //         participants:
        //             handoverDetail.technicalConditionHandoverOfEquipmentBeforeRepair?.map(
        //                 (participant, index) => ({
        //                     index: index + 1,
        //                     role: participant.role || 'Vai trò',
        //                     fullname: participant.profile?.fullname || '',
        //                     position:
        //                         participant.role ||
        //                         getLatestPosition(participant.profile?.workHistory) ||
        //                         'Vai trò',
        //                 })
        //             ) || [],
        //         // Danh sách thiết bị bàn giao
        //         handoverItems:
        //             handoverDetail.handoverOfEquipmentBeforeRepairContent?.map(
        //                 (content, index) => ({
        //                     index: index + 1,
        //                     equipmentName:
        //                         content.equipmentLocation?.realEquipment?.equipment
        //                             ?.equipmentName || '',
        //                     unit: content.equipmentLocation?.realEquipment?.equipment?.unit || '',
        //                     quantity: content.quantity?.toString() || '0',
        //                     serial: content.equipmentLocation?.realEquipment?.serial || '',
        //                     manufacturer:
        //                         content.equipmentLocation?.realEquipment?.manufacturer?.name || '',
        //                     mgfYear: content.equipmentLocation?.realEquipment?.mgfYear || '',
        //                     technicalCondition: content.technicalCondition || '',
        //                     note: handoverDetail.description || '',
        //                 })
        //             ) || [],
        //         // Kết luận
        //         conclusion: handoverDetail.conclusion || '',
        //         // Tổng số thiết bị
        //         totalItems: handoverDetail.handoverOfEquipmentBeforeRepairContent?.length || 0,
        //     }
        //     console.log('Rendering template with data...')
        //     await doc.renderAsync(templateData)
        //     console.log('Template rendered successfully')
        //     const blob = exportFile(doc.getZip())
        //     const fileName = `Bien_ban_ban_giao_${handoverDetail.number || 'NoNumber'}_${dayjs().format('DDMMYYYY')}.docx`
        //     saveAs(blob, fileName)
        //     message.success('Xuất file Word thành công')
        // } catch (error: any) {
        //     console.error('Lỗi khi xuất file Word:', error)
        //     // Detailed error logging for Docxtemplater
        //     if (error?.properties?.errors) {
        //         console.error('Docxtemplater errors:', error.properties.errors)
        //         error.properties.errors.forEach((err: any, index: number) => {
        //             console.error(`Error ${index + 1}:`, {
        //                 message: err.message,
        //                 name: err.name,
        //                 stack: err.stack,
        //                 properties: err.properties,
        //             })
        //         })
        //     }
        //     message.error(`Xuất file Word thất bại: ${error?.message || 'Unknown error'}`)
        // }
    }

    // Hàm lấy vị trí công việc mới nhất từ workHistory
    function getLatestPosition(workHistory: any[] = []) {
        if (!workHistory.length) return ''
        return (
            [...workHistory].sort((a, b) => new Date(b.to).getTime() - new Date(a.to).getTime())[0]
                .position || ''
        )
    }

    // if (!isOpen || !handoverDetail) return null

    // const equipmentInfo = handoverDetail.equipmentRevampContent?.equipmentLocation
    // const equipmentName = equipmentInfo?.realEquipment?.equipment?.equipmentName || ''

    return (
        <Modal
            title="In đề thi"
            open={isOpen}
            onCancel={onClose}
            width="80vw"
            style={{ maxWidth: '1200px' }}
            footer={null}
        >
            <div className="space-y-4">
                <div className="flex justify-end w-full mb-4">
                    <Space>
                        <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
                            In đề thi
                        </Button>
                        <Button type="primary" onClick={() => exportToWord()} icon={<FileDown />}>
                            Xuất file Word
                        </Button>
                    </Space>
                </div>

                <div
                    ref={printRef}
                    className="font-times-new-roman text-black bg-white p-6"
                    style={{ fontSize: '12px', lineHeight: '1.3' }}
                >
                    {/* Header */}
                    <table className="w-full  border-separate border-spacing-0">
                        <tbody>
                            <tr>
                                <td className="align-top w-1/3 border border-dotted border-black p-2 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm uppercase">
                                            Học viện Kỹ thuật Quân sự
                                        </span>
                                        <span className="text-sm font-bold">NHÀ MÁY X52</span>
                                        <hr
                                            className="border-t border-black items-center mx-auto"
                                            style={{ width: '20%' }}
                                        />{' '}
                                        <span className="text-sm">
                                            Số:{' '}
                                            {/* {isEditing ? (
                                            <Input
                                                value={editableData.number}
                                                onChange={(e) =>
                                                    setEditableData((prev) => ({
                                                        ...prev,
                                                        number: e.target.value,
                                                    }))
                                                }
                                                className="inline-block w-auto min-w-[100px] text-xs h-5 px-1 py-0"
                                                placeholder="Số biên bản"
                                            />
                                        ) : (
                                            editableData.number || ''
                                        )}/BB-NM */}
                                        </span>
                                    </div>
                                </td>
                                <td className="align-top w-1/3 border border-dotted border-black p-2 text-center">
                                    <span className="text-sm font-bold block">
                                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                    </span>
                                    <span className="text-sm font-bold block">
                                        Độc lập - Tự do - Hạnh phúc
                                    </span>
                                    <hr
                                        className="border-t border-black items-center mx-auto"
                                        style={{ width: '20%' }}
                                    />{' '}
                                    <span className="text-sm block mt-1">
                                        Khánh Hòa, ngày{' '}
                                        {/* {handoverDetail.date
                                            ? formatDateVN(handoverDetail.date)
                                            : '      tháng      năm 20..'} */}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {/* Tiêu đề chính */}
                    <div className="text-center mb-6">
                        <h1 className="font-bold text-lg uppercase">BIÊN BẢN</h1>
                        <h2 className="font-bold text-base">
                            Bàn giao trang thiết bị trước khi vào sửa chữa
                        </h2>
                        <hr
                            className="border-t border-black items-center mx-auto"
                            style={{ width: '20%' }}
                        />{' '}
                    </div>
                    {/* Thông tin cơ bản */}
                    <div className="mb-4 text-xs space-y-1">
                        {/* <div>
                            Căn cứ PSX số{' '}
                            {latestProductionLog?.number || handoverDetail.number || '...'} của Nhà
                            máy;
                        </div>
                        <div>
                            Hôm nay, ngày{' '}
                            {handoverDetail.date
                                ? new Date(handoverDetail.date).getDate()
                                : '.....'}{' '}
                            tháng{' '}
                            {handoverDetail.date
                                ? new Date(handoverDetail.date).getMonth() + 1
                                : '.....'}{' '}
                            năm{' '}
                            {handoverDetail.date
                                ? new Date(handoverDetail.date).getFullYear()
                                : '202....'}{' '}
                            tại{' '}
                            {handoverDetail.organizationFrom.name || 'Phòng/Xưởng...../Nhà máy X52'}{' '}
                            chúng tôi gồm:
                        </div> */}
                    </div>

                    {/* Thành phần tham gia */}
                    <div className="mb-4 text-xs">
                        {/* Hiển thị thành viên tham gia từ database */}
                        {/* {handoverDetail.technicalConditionHandoverOfEquipmentBeforeRepair &&
                            handoverDetail.technicalConditionHandoverOfEquipmentBeforeRepair
                                .length > 0 && (
                                <div className="mt-4">
                                    <div className="font-bold mb-2">I. THÀNH PHẦN THAM GIA</div>
                                    {handoverDetail.technicalConditionHandoverOfEquipmentBeforeRepair.map(
                                        (participant, index) => (
                                            <div key={participant.id}>
                                                <div className="font-bold">
                                                    {index + 1}. Đại diện{' '}
                                                    {participant.role || 'Vai trò'}
                                                </div>
                                                - Đ/c:{' '}
                                                {participant.profile?.fullname ||
                                                    '............................'}{' '}
                                                - (
                                                {participant.role ||
                                                    getLatestPosition(
                                                        participant.profile?.workHistory
                                                    ) ||
                                                    'Vai trò'}
                                                )
                                            </div>
                                        )
                                    )}
                                </div>
                            )} */}

                        <div className="mt-4">
                            <div className="font-bold mb-2">II. NỘI DUNG BÀN GIAO</div>
                            {/* <div>
                                {handoverDetail.organizationFrom.name || 'Phòng/Xưởng'} (có TTB sửa
                                chữa) bàn giao cho{' '}
                                {handoverDetail.organizationTo.name || 'Xưởng Cơ điện'} các TTB,
                                dụng cụ phục vụ sửa chữa {}
                                cụ thể:
                            </div> */}
                        </div>
                    </div>

                    {/* Bảng thiết bị và vật tư */}
                    <div className="mb-4">
                        <table className="w-full border-collapse border border-black">
                            <thead>
                                <tr>
                                    <th className={tableHeaderClassName} style={{ width: '5%' }}>
                                        TT
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '35%' }}>
                                        Tên thiết bị, dụng cụ
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '8%' }}>
                                        DVT
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '8%' }}>
                                        SL
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '12%' }}>
                                        Kí hiệu, S/N
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '12%' }}>
                                        Nước SX
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '12%' }}>
                                        Năm SX
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '15%' }}>
                                        Tình trạng kỹ thuật
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '8%' }}>
                                        Ghi chú
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Thiết bị chính */}
                                {/* <tr>
                                    <td className={tableCellClassName}>1</td>
                                    <td
                                        className={`${tableCellClassName} text-left px-2`}
                                    >
                                        {equipmentName}
                                        <div className="text-xs italic">
                                            (các dụng cụ, phụ kiện đi kèm)
                                        </div>
                                    </td>
                                    <td className={tableCellClassName}>
                                        {equipmentInfo?.realEquipment?.equipment
                                            ?.unit || ''}
                                    </td>
                                    <td className={tableCellClassName}>1</td>
                                    <td className={tableCellClassName}>
                                        {serial}
                                    </td>
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                </tr> */}

                                {/* Vật tư bàn giao */}
                                {/* {handoverDetail.handoverOfEquipmentBeforeRepairContent?.map(
                                    (content, index) => (
                                        <tr key={content.id}>
                                            <td className={tableCellClassName}>{index + 2}</td>
                                            <td className={`${tableCellClassName} text-left px-2`}>
                                                {content.equipmentLocation?.realEquipment?.equipment
                                                    ?.equipmentName || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment?.equipment
                                                    ?.unit || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.quantity?.toString() || '0'}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment?.serial ||
                                                    ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment
                                                    ?.manufacturer?.name || ''}
                                            </td>

                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment
                                                    ?.mgfYear || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.technicalCondition || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {handoverDetail.description || ''}
                                            </td>
                                        </tr>
                                    )
                                )} */}

                                {/* Phụ kiện kèm theo nếu cần */}
                                <tr>
                                    <td className={tableCellClassName} />
                                    <td className={`${tableCellClassName} text-left px-2 italic`}>
                                        Phụ kiện kèm theo:
                                        <br />
                                        (các dụng cụ, phụ kiện đi kèm)
                                    </td>
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                </tr>
                            </tbody>
                        </table>
                        <div className="text-xs italic mt-1">
                            * Ghi chú: Nếu số lượng TTB lớn có thể làm Phụ lục kèm theo.
                        </div>
                    </div>

                    {/* Kết luận */}
                    <div className="mb-6 text-xs">
                        <div className="font-bold mb-2">III. KẾT LUẬN</div>
                        <div>
                            Bên nhận có trách nhiệm quản lý và sửa chữa{' '}
                            {/* {equipmentName || 'thiết bị này'} kể từ ngày bàn giao. */}
                        </div>
                        <div>
                            Biên bản lập thành 03 bản: bên giao 01 bản, bên nhận 01 bản, lưu Phòng
                            KT-CN./.
                        </div>
                        {/* {handoverDetail.conclusion && (
                            <div className="mt-2">{handoverDetail.conclusion}</div>
                        )} */}
                    </div>

                    {/* Phụ lục - Danh mục các trang thiết bị, vật tư bàn giao phục vụ sửa chữa */}
                    <div className="mt-8 page-break-before">
                        <div className="text-center mb-4">
                            <div className="font-bold">Phụ lục</div>
                            <div className="font-bold">
                                DANH MỤC CÁC TRANG THIẾT BỊ, VẬT TƯ BÀN GIAO PHỤC VỤ SỬA CHỮA
                            </div>
                            {/* <div className="text-xs italic">
                                (Kèm theo Biên bản bàn giao số {handoverDetail.number} ngày{' '}
                                {handoverDetail.date
                                    ? `${new Date(handoverDetail.date).getDate()}/${new Date(handoverDetail.date).getMonth() + 1}/${new Date(handoverDetail.date).getFullYear().toString().slice(-2)}`
                                    : '../../202..'}{' '}
                                của Nhà máy X52)
                            </div> */}
                        </div>

                        <table className="w-full border-collapse border border-black">
                            <thead>
                                <tr>
                                    <th className={tableHeaderClassName} style={{ width: '5%' }}>
                                        TT
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '35%' }}>
                                        Tên thiết bị, dụng cụ
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '8%' }}>
                                        DVT
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '8%' }}>
                                        SL
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '12%' }}>
                                        Kí hiệu, S/N
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '12%' }}>
                                        Nước SX
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '12%' }}>
                                        Năm SX
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '15%' }}>
                                        Tình trạng kỹ thuật
                                    </th>
                                    <th className={tableHeaderClassName} style={{ width: '8%' }}>
                                        Ghi chú
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Thiết bị chính */}
                                {/* <tr>
                                    <td className={tableCellClassName}>1</td>
                                    <td
                                        className={`${tableCellClassName} text-left px-2`}
                                    >
                                        {equipmentName}
                                        <div className="text-xs italic">
                                            (các dụng cụ, phụ kiện đi kèm)
                                        </div>
                                    </td>
                                    <td className={tableCellClassName}>
                                        {equipmentInfo?.realEquipment?.equipment
                                            ?.unit || ''}
                                    </td>
                                    <td className={tableCellClassName}>1</td>
                                    <td className={tableCellClassName}>
                                        {serial}
                                    </td>
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                    <td className={tableCellClassName} />
                                </tr> */}

                                {/* Vật tư bàn giao */}
                                {/* {handoverDetail.handoverOfEquipmentBeforeRepairContent?.map(
                                    (content, index) => (
                                        <tr key={content.id}>
                                            <td className={tableCellClassName}>{index + 2}</td>
                                            <td className={`${tableCellClassName} text-left px-2`}>
                                                {content.equipmentLocation?.realEquipment?.equipment
                                                    ?.equipmentName || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment?.equipment
                                                    ?.unit || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.quantity?.toString() || '0'}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment?.serial ||
                                                    ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment
                                                    ?.manufacturer?.name || ''}
                                            </td>

                                            <td className={tableCellClassName}>
                                                {content.equipmentLocation?.realEquipment
                                                    ?.mgfYear || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {content.technicalCondition || ''}
                                            </td>
                                            <td className={tableCellClassName}>
                                                {handoverDetail.description || ''}
                                            </td>
                                        </tr>
                                    )
                                )} */}
                            </tbody>
                        </table>
                    </div>

                    {/* Chữ ký */}
                    <div className="mt-8 grid grid-cols-3 gap-8 text-xs text-center">
                        <div>
                            <div className="font-bold mb-2">PHÒNG/XƯỞNG ....</div>
                            <div className="mb-10" />
                            {/* <div className="font-bold">{handoverDetail.organizationFrom.name}</div> */}
                        </div>
                        <div>
                            <div className="font-bold mb-2">PHÒNG KT-CN</div>
                            <div className="mb-10" />
                        </div>
                        <div>
                            <div className="font-bold mb-2">PHÒNG KT-CN</div>
                            <div className="mb-10" />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ModalPrintExamBank
