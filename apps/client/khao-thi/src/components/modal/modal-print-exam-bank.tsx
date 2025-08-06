// import { formatDateVN } from '@lib/utils'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
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
        subjectVersionName: string
        examCode: string
    }>({
        tag: ModalPrintExamBank.name,
    })

    const handoverId = (input as any)?.handoverId

    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `De_thi_mon_${input?.subjectVersionName}_${input?.examCode}.pdf`,
    })

    // Xử lý xuất file Word
    const exportToWord = async () => {
        if (!input?.data) return
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
                    className="!font-time-news-roman text-black bg-white p-6"
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
                    <div className="mb-4 space-y-4">
                        {input?.data?.map((item, index) => (
                            <div key={item.id}>
                                <span className="font-bold text-base">
                                    Câu hỏi {index + 1}:{' '}
                                    <span
                                        className="prose max-w-none  text-gray-800"
                                        dangerouslySetInnerHTML={{
                                            __html: item.question.content
                                                ? renderWithMath(item.question.content)
                                                : '<i>Chưa có nội dung</i>',
                                        }}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ModalPrintExamBank
