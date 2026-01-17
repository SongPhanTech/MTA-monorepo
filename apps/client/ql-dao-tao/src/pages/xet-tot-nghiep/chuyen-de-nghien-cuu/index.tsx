import { FileOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TreeSelect from '@components/commons/tree-select'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { SubjectVersionType } from '@workspace/db'
import {
    useCountStudentSubjectScore,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManyStudentSubjectScore,
    useFindManySubjectClass,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { Button, Col, Form, message, Modal, Row } from 'antd'
import { sqlTransaction } from '@workspace/libs/api/model'
import dayjs from 'dayjs'
import { SquarePen } from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useMemo, useState } from 'react'
import {  useSemesterStore,
useTrainingObjectTypeStore } from '@workspace/ui'
import DatePicker from '@components/commons/date-picker';
import { useDisclosure } from 'react-hook-disclosure-modal'

interface ChuyenDeNghienCuuForm {
    trainingCourseId: string
    organizationId: string
}
interface TimeReportForm {
    subjectClassId: string
    reportDate: string
}

export default function ChuyenDeNghienCuu() {
    const [form] = Form.useForm<ChuyenDeNghienCuuForm>()
    const [timeReportForm] = Form.useForm<TimeReportForm>()
    const [searchParams, setSearchParams] = useState<Partial<ChuyenDeNghienCuuForm>>({})
    const [timeReportParams, setTimeReportParams] = useState<Partial<TimeReportForm>>({})
    
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [isSearched, setIsSearched] = useState(false)
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()
    const { onOpen: openPutResearchTopicModal } = useDisclosure<{
        studentResearchTopicId: string
        studentSubjectScoreId: string
    }>({
        tag: 'PutResearchTopicModal',
    })
    const courseWhere = useMemo(() => {
        return {
            trainingObjectTypeId: trainingObjectTypeId,
        }
    }, [trainingObjectTypeId])
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        where: courseWhere,
    })
    const { data: lecturerData = [] } = useFindManyLecturer({
        include: {
            userProfile: true,
        },
    })
    const { data: organizationData = [] } = useFindManyDM_DonVi()
    const { data: subjectClassData = [] } = useFindManySubjectClass({
        where: {
            subject: {
                type: SubjectVersionType.Research,
            },
            semesterId
        },
    })
    const where = useMemo(() => {
        if (!isSearched) {
            return { id: { in: [] } }
        }
        const filter: any = {
            studentResearchTopic: {
                isNot: null,
            },
            subjectClass: {
                subject: {
                    type: SubjectVersionType.Research,
                },
            },
        }

        if (trainingObjectTypeId) {
            filter.subjectClass = {
                ...filter.subjectClass,

                trainingObjectTypeId: trainingObjectTypeId,
            }
        }

        if (semesterId) {
            filter.subjectClass = {
                ...filter.subjectClass,
                semesterId: semesterId,
            }
        }

        if (searchParams.trainingCourseId) {
            filter.student = {
                fixedClass: {
                    trainingCourseId: searchParams.trainingCourseId,
                },
            }
        }

        if (searchParams.organizationId) {
            filter.subjectVersion = {
                subject: {
                    managementOrganizationId: searchParams.organizationId,
                },
            }
        }
        if (timeReportParams.subjectClassId) {
            filter.subjectClass = {
                ...filter.subjectClass,
                id: timeReportParams.subjectClassId,
            }
        }

        return filter
    }, [searchParams, isSearched, timeReportParams, trainingObjectTypeId,semesterId])
    const { data: studentSubjectScoreData = [], refetch: refetchStudentSubjectScore } =
        useFindManyStudentSubjectScore({
            where,
            include: {
                studentResearchTopic: {
                    include: {
                        supervisor: {
                            include: {
                                userProfile: true,
                            },
                        },
                        coSupervisor: {
                            include: {
                                userProfile: true,
                            },
                        },
                    },
                },
                subjectClass: {
                    include: {
                        trainingObjectType: true,
                        semester: true,
                    },
                },
                student: {
                    include: {
                        userProfile: true,
                        fixedClass: {
                            include: {
                                trainingCourse: true,
                            },
                        },
                    },
                },
                subjectVersion: {
                    include: {
                        subject: {
                            include: {
                                managementOrganization: true,
                            },
                        },
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        })
    const { data: studentSubjectScoreAllData = [], refetch: refetchStudentSubjectScoreAll } =
        useFindManyStudentSubjectScore({
            where,
            include: {
                studentResearchTopic: {
                    include: {
                        supervisor: {
                            include: {
                                userProfile: true,
                            },
                        },
                        coSupervisor: {
                            include: {
                                userProfile: true,
                            },
                        },
                    },
                },
                subjectClass: {
                    include: {
                        trainingObjectType: true,
                        semester: true,
                    },
                },
                student: {
                    include: {
                        userProfile: true,
                        fixedClass: {
                            include: {
                                trainingCourse: true,
                            },
                        },
                    },
                },
                subjectVersion: {
                    include: {
                        subject: {
                            include: {
                                managementOrganization: true,
                            },
                        },
                    },
                },
            },
        })

    const { data: count, refetch: refetchCount } = useCountStudentSubjectScore({
        where: isSearched ? { ...where, deletedAt: null } : { id: { in: [] } },
    })
    const handleAssignDate = async () => {
        const reportDate = timeReportForm.getFieldValue('reportDate')
        if (!reportDate) {
            return message.warning('Vui lòng chọn hạn nhập chuyên đề trước khi gán!')
        }

        const res = await sqlTransaction([
            {
                model: 'StudentResearchTopic',
                operation: 'updateMany',
                data: {
                    where: {
                        id: {
                            in: studentSubjectScoreAllData.map(
                                (item: any) => item.studentResearchTopic?.id
                            ),
                        },
                    },
                    data: {
                        deadline: reportDate,
                    },
                },
            },
        ])
        if (res.status !== 200) {
            return message.error('Có lỗi xảy ra khi gán ngày.')
        }
        message.success('Gán ngày thành công!')
        refetchStudentSubjectScore()
        refetchCount()
        refetchStudentSubjectScoreAll()
    }
    const handleSearch = () => {
        const values = form.getFieldsValue()
        setSearchParams(values)
        setIsSearched(true)
        setCurrentPage(1)
        refetchStudentSubjectScore()
        refetchStudentSubjectScoreAll()
        refetchCount()
    }

    const treeOrgData = buildOrgTree(organizationData ?? [], '0')
    const getData = async () => {
        const subjectClassId = timeReportForm.getFieldValue('subjectClassId')
        if (!subjectClassId) {
            return message.warning('Vui lòng chọn lớp môn học trước khi lấy dữ liệu')
        }

        setTimeReportParams({ subjectClassId })

        try {
            const subjectStudent = await sqlTransaction([
                {
                    model: 'StudentSubjectScore',
                    operation: 'findMany',
                    data: {
                        where: { subjectClassId: subjectClassId },
                        include: { studentResearchTopic: true },
                    },
                },
            ])

            const studentSubjectScoreData = subjectStudent.data || []
            if (studentSubjectScoreData.length === 0) {
                return message.error('Lớp môn học này không có sinh viên nào.')
            }
            const recordsToCreate = studentSubjectScoreData.filter(
                (item: any) => !item.studentResearchTopic
            )
            if (recordsToCreate.length === 0) {
                return message.info('Tất cả sinh viên trong lớp này đã được khởi tạo chuyên đề.')
            }
            console.log('recordsToCreate', recordsToCreate)
            const res = await sqlTransaction([
                {
                    model: 'StudentResearchTopic',
                    operation: 'createMany',
                    data: {
                        //@ts-expect-error: Prisma type error
                        data: recordsToCreate[0].map((record: any) => ({
                            studentSubjectScoreId: record.id,
                            deadline: null,
                            name: null,
                            mainContent: null,
                            supervisorId: null,
                            coSupervisorId: null,
                            reportDate: null,
                        })),
                    },
                },
            ])
            if (res.status !== 200) {
                if (res.status === 409) {
                    return message.error('Chuyên đề đã có trong lớp môn học này.')
                }
            }

            message.success('Lấy dữ liệu thành công!')
        } catch (error) {
            console.error('getData Error:', error)
            message.error('Có lỗi xảy ra khi xử lý dữ liệu.')
        } finally {
            setIsSearched(true)
            refetchStudentSubjectScore()
            refetchStudentSubjectScoreAll()
            refetchCount()
        }
    }
    const exportToExcel = async () => {
        if (studentSubjectScoreData.length === 0) {
            return message.warning('Không có dữ liệu để xuất Excel!')
        }

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Danh sách chuyên đề')

        const refSheetName = 'LecturerData'
        const refSheet = workbook.addWorksheet(refSheetName)
        refSheet.state = 'veryHidden'

        // Đổ dữ liệu Giảng viên vào Sheet tham chiếu
        lecturerData.forEach((l, index) => {
            const fullName =
                `${l.userProfile?.lastName || ''} ${l.userProfile?.firstName || ''}`.trim()
            refSheet.getCell(index + 1, 1).value = fullName // Cột A: Tên
            refSheet.getCell(index + 1, 2).value = l.id // Cột B: ID
        })

        // Xác định dải ô tham chiếu (Quan trọng: Phải có dấu nháy đơn bao quanh tên Sheet)
        const lecturerCount = lecturerData.length || 1
        const nameRange = `'${refSheetName}'!$A$1:$A$${lecturerCount}`
        const tableRange = `'${refSheetName}'!$A$1:$B$${lecturerCount}`

        // 2. PHẦN ĐẦU SHEET CHÍNH: TIÊU ĐỀ VÀ THÔNG TIN TÌM KIẾM
        worksheet.mergeCells('A1:Q1')
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'DANH SÁCH CHUYÊN ĐỀ NGHIÊN CỨU'
        titleCell.font = { size: 16, bold: true }
        titleCell.alignment = { horizontal: 'center' }

        const getNameById = (id: string | undefined, data: any[]) =>
            data.find((item) => item.id === id)?.name || 'Tất cả'

        const searchRows = [
            // [
            //     'trainingObjectTypeId',
            //     `Đối tượng đào tạo: ${getNameById(searchParams.trainingObjectTypeId, trainingObjectTypeData)}`,
            // ],
            [
                'trainingCourseId',
                `Khóa học: ${getNameById(searchParams.trainingCourseId, trainingCourseData)}`,
            ],
            // ['semesterId', `Học kỳ: ${getNameById(searchParams.semesterId, semesterData)}`],
            [
                'organizationId',
                `Khoa quản lý: ${organizationData.find((o) => o.Id === searchParams.organizationId)?.sTen || 'Tất cả'}`,
            ],
            ['reportDate', `Ngày xuất file: ${dayjs().format('DD/MM/YYYY HH:mm')}`],
            [],
        ]
        searchRows.forEach((val) => {
            const row = worksheet.addRow(val)
            row.getCell(1).font = { bold: true }
        })

        const columns = [
            { header: 'ID_RECORD', key: 'recordId', width: 0, hidden: true },
            { header: 'Hạn nhập', key: 'deadline', width: 15 },
            // { header: 'ĐTĐT', key: 'trainingType', width: 15 },
            { header: 'Khóa học', key: 'course', width: 15 },
            // { header: 'Học kỳ', key: 'semester', width: 15 },
            { header: 'Mã SV', key: 'studentCode', width: 15 },
            { header: 'Họ và tên SV', key: 'studentName', width: 25 },
            { header: 'Lớp môn học', key: 'subjectClass', width: 20 },
            { header: 'STC', key: 'credits', width: 10 },
            { header: 'Tên chuyên đề', key: 'topicName', width: 35 },
            { header: 'Nội dung chính', key: 'mainContent', width: 35 },
            { header: 'GVHD 1', key: 'gvhd1', width: 30 },
            { header: 'GVHD 2', key: 'gvhd2', width: 30 },
            { header: 'ID_GV1', key: 'idGv1', width: 0, hidden: true },
            { header: 'ID_GV2', key: 'idGv2', width: 0, hidden: true },
            { header: 'Thời gian báo cáo', key: 'reportDate', width: 15 },
            { header: 'Điểm', key: 'score', width: 10 },
        ]

        const headerRowNumber = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1
        const headerRow = worksheet.getRow(headerRowNumber)
        columns.forEach((col, idx) => {
            headerRow.getCell(idx + 1).value = col.header
            worksheet.getColumn(idx + 1).key = col.key
            worksheet.getColumn(idx + 1).width = col.width
            if (col.hidden) worksheet.getColumn(idx + 1).hidden = true
        })
        headerRow.font = { bold: true }
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

        studentSubjectScoreData.forEach((record, index) => {
            const currentRowNum = headerRowNumber + index + 1
            const topic = record.studentResearchTopic

            const dataRow = worksheet.addRow({
                recordId: record.id,
                deadline: topic?.deadline ? dayjs(topic.deadline).format('DD/MM/YYYY') : '',
                trainingType: record?.subjectClass?.trainingObjectType?.name || '',
                course: record?.student?.fixedClass?.trainingCourse?.name || '',
                semester: record?.subjectClass?.semester?.name || '',
                studentCode: record?.student?.userProfile?.code || '',
                studentName:
                    `${record?.student?.userProfile?.lastName || ''} ${record?.student?.userProfile?.firstName || ''}`.trim(),
                subjectClass: record?.subjectClass?.name || '',
                credits: record?.subjectVersion?.credit || 0,
                topicName: topic?.name || '',
                mainContent: topic?.mainContent || '',
                gvhd1: topic?.supervisor
                    ? `${topic.supervisor.userProfile?.lastName} ${topic.supervisor.userProfile?.firstName}`.trim()
                    : '',
                gvhd2: topic?.coSupervisor
                    ? `${topic.coSupervisor.userProfile?.lastName} ${topic.coSupervisor.userProfile?.firstName}`.trim()
                    : '',
                reportDate: topic?.reportDate ? dayjs(topic.reportDate).format('DD/MM/YYYY') : '',
                score: record.finalScore || '',
            })

            const validation: ExcelJS.DataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [nameRange],
                showErrorMessage: true,
                errorTitle: 'Dữ liệu không hợp lệ',
                error: 'Vui lòng chọn giảng viên từ danh sách.',
            }

            dataRow.getCell('gvhd1').dataValidation = validation
            dataRow.getCell('gvhd2').dataValidation = validation

            dataRow.getCell('idGv1').value = {
                formula: `=IF(L${currentRowNum}<>"", VLOOKUP(L${currentRowNum}, ${tableRange}, 2, FALSE), "")`,
            }
            dataRow.getCell('idGv2').value = {
                formula: `=IF(M${currentRowNum}<>"", VLOOKUP(M${currentRowNum}, ${tableRange}, 2, FALSE), "")`,
            }
        })

        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer]), `Danh_sach_Chuyen_de_${dayjs().format('DDMMYYYY_HHmm')}.xlsx`)
        message.success('Xuất file thành công!')
    }
    const getCellValue = (cell: ExcelJS.Cell) => {
        const val = cell.value

        if (val === null || val === undefined) return null

        if (typeof val === 'object' && 'result' in val) {
            const result = val.result
            if (result === null || result === undefined || result === '') return null
            return result.toString().trim()
        }

        const strVal = val.toString().trim()
        return strVal !== '' ? strVal : null
    }
    const importExcel = async (file: File) => {
        const loading = message.loading('Đang xử lý file Excel...', 0)
        try {
            const workbook = new ExcelJS.Workbook()
            const buffer = await file.arrayBuffer()
            await workbook.xlsx.load(buffer)

            const worksheet = workbook.getWorksheet('Danh sách chuyên đề')
            if (!worksheet) {
                return message.error('Không tìm thấy Sheet "Danh sách chuyên đề" trong file!')
            }

            const dataToUpdate: any[] = []

            let startRow = 1
            worksheet.eachRow((row, rowNumber) => {
                if (row.getCell(1).value === 'ID_RECORD') {
                    startRow = rowNumber + 1
                }
            })

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber < startRow) return

                const studentSubjectScoreId = getCellValue(row.getCell(1))
                if (!studentSubjectScoreId) return

                const supervisorId = getCellValue(row.getCell(14))
                const coSupervisorId = getCellValue(row.getCell(15))

                const name = getCellValue(row.getCell(10))
                const mainContent = getCellValue(row.getCell(11))

                const deadlineVal = row.getCell(2).value
                const reportDateVal = row.getCell(16).value

                const deadline = deadlineVal instanceof Date ? deadlineVal.toISOString() : null
                const reportDate =
                    reportDateVal instanceof Date ? reportDateVal.toISOString() : null

                dataToUpdate.push({
                    model: 'StudentResearchTopic',
                    operation: 'upsert',
                    data: {
                        where: { studentSubjectScoreId: studentSubjectScoreId },
                        update: {
                            name,
                            mainContent,
                            supervisorId,
                            coSupervisorId,
                            deadline,
                            reportDate,
                        },
                        create: {
                            studentSubjectScoreId,
                            name,
                            mainContent,
                            supervisorId,
                            coSupervisorId,
                            deadline,
                            reportDate,
                        },
                    },
                })
            })

            if (dataToUpdate.length === 0) {
                return message.warning('Không tìm thấy dữ liệu hợp lệ trong file.')
            }
            const finalData = dataToUpdate.map((item) => {
                const fixValue = (val: any) => (val === '[object Object]' ? null : val)

                return {
                    ...item,
                    data: {
                        ...item.data,
                        update: {
                            ...item.data.update,
                            supervisorId: fixValue(item.data.update.supervisorId),
                            coSupervisorId: fixValue(item.data.update.coSupervisorId),
                        },
                        create: {
                            ...item.data.create,
                            supervisorId: fixValue(item.data.create.supervisorId),
                            coSupervisorId: fixValue(item.data.create.coSupervisorId),
                        },
                    },
                }
            })

            const res = await sqlTransaction(finalData)
            console.log('res', res)

            message.success(`Cập nhật thành công ${finalData.length} bản ghi!`)
            refetchStudentSubjectScore()
        } catch (error) {
            console.error('Import Excel Error:', error)
            message.error(
                'Lỗi khi đọc file hoặc cập nhật dữ liệu. Vui lòng kiểm tra lại định dạng file!'
            )
        } finally {
            loading()
        }
    }
    const confirmImport = (file: File) => {
        Modal.confirm({
            title: 'Xác nhận Import dữ liệu',
            icon: <FileOutlined />,
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn import thông tin từ file sau không?</p>
                    <p>
                        <strong>Tên file:</strong>{' '}
                        <span className="text-blue-600">{file.name}</span>
                    </p>
                    <p className="text-red-500 text-xs">
                        * Lưu ý: Dữ liệu trong hệ thống sẽ được cập nhật hoặc tạo mới dựa trên nội
                        dung file Excel.
                    </p>
                </div>
            ),
            okText: 'Xác nhận Import',
            cancelText: 'Hủy bỏ',
            okButtonProps: {
                type: 'primary',
                className: 'bg-[#02884f] hover:bg-[#19945d] border-none',
            },
            onOk: () => {
                importExcel(file)
            },
        })
    }

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={24}>
                        <Form
                            form={form}
                            layout="horizontal"
                            className="w-full mb-2 flex flex-wrap items-end gap-4"
                        >
                            {/* <Form.Item
                                name="trainingObjectTypeId"
                                label="Đối tượng"
                                className="mb-0"
                            >
                                <Select
                                    className="w-36"
                                    options={trainingObjectTypeData?.map((item) => ({
                                        label: item.name,
                                        value: item.id,
                                    }))}
                                    onChange={() =>
                                        form.setFieldValue('trainingCourseId', undefined)
                                    }
                                    placeholder="Chọn đối tượng"
                                />
                            </Form.Item> */}

                            <Form.Item name="trainingCourseId" label="Khóa học" className="mb-0">
                                <Select
                                    className="w-36"
                                    options={
                                        trainingCourseData?.map((item) => ({
                                            label: item.name,
                                            value: item.id,
                                        })) || []
                                    }
                                    popupMatchSelectWidth={false} 
                                    placeholder="Chọn khóa học"
                                />
                            </Form.Item>

                            <Form.Item name="organizationId" label="Khoa quản lí" className="mb-0">
                                <TreeSelect
                                    className="w-80"
                                    placeholder="Chọn khoa quản lý"
                                    allowClear
                                    showSearch
                                    treeDefaultExpandAll
                                    treeData={treeOrgData}
                                />
                            </Form.Item>
                            {/* <Form.Item name="semesterId" label="Học kỳ" className="mb-0">
                                <Select
                                    className="w-64"
                                    maxTagCount="responsive"
                                    maxTagPlaceholder={(omittedValues) =>
                                        `+${omittedValues.length}`
                                    }
                                    options={semesterData?.map((x) => {
                                        return {
                                            label: x.name,
                                            value: x.id,
                                        }
                                    })}
                                    placeholder="Chọn học kỳ"
                                />
                            </Form.Item> */}
                            <Form.Item className="mb-0">
                                <div className="flex gap-2">
                                    <Button type="primary" onClick={handleSearch}>
                                        Xem dữ liệu
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<FileOutlined />}
                                        onClick={() => {}}
                                    >
                                        Phụ lục QĐ chuyên đề nghiên cứu
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
                <Row gutter={[8, 8]} align="top" justify="space-between">
                    <Col span={24}>
                        <Form
                            form={timeReportForm}
                            layout="horizontal"
                            className="w-full mb-2 flex flex-wrap items-end gap-4"
                        >
                            <Form.Item name="subjectClassId" label="Lớp môn học" className="mb-0">
                                <Select
                                    className="w-46"
                                    options={subjectClassData?.map((item) => ({
                                        label: `${item.code} - ${item.name}`,
                                        value: item.id,
                                    }))}
                                    popupMatchSelectWidth={false} 
                                    placeholder="Chọn lớp môn học"
                                />
                            </Form.Item>

                            <Form.Item className="mb-0">
                                <div className="flex gap-2">
                                    <Button type="primary" onClick={async () => await getData()}>
                                        Lấy dữ liệu
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={async () => await exportToExcel()}
                                    >
                                        Xuất mẫu excel
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            document.getElementById('import-excel')?.click()
                                        }
                                    >
                                        Import Excel
                                    </Button>
                                    <input
                                        id="import-excel"
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                confirmImport(file)
                                            }
                                            e.target.value = ''
                                        }}
                                    />
                                </div>
                            </Form.Item>
                            <Form.Item
                                name="reportDate"
                                label="Hạn nhập chuyên đề"
                                className="mb-0 ml-2"
                            >
                                <DatePicker
                                    className="w-44"
                                    placeholder="Chọn hạn nhập chuyên đề"
                                />
                            </Form.Item>
                            <Form.Item className="mb-0">
                                <div className="flex gap-2">
                                    <Button type="primary" onClick={handleAssignDate}>
                                        Gán ngày
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
                <Table
                    columns={[
                        {
                            title: 'Hạn nhập chuyên đề',
                            width: 200,
                            align: 'left',
                            render: (_, record) => {
                                return (
                                    <div>
                                        {record.studentResearchTopic?.deadline
                                            ? dayjs(record.studentResearchTopic?.deadline).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </div>
                                )
                            },
                        },
                        // {
                        //     title: 'ĐTĐT',
                        //     width: 150,
                        //     align: 'left',
                        //     render: (_, record) => {
                        //         return record?.subjectClass?.trainingObjectType?.name || ''
                        //     },
                        // },
                        {
                            title: 'Khóa học',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return record?.student?.fixedClass?.trainingCourse?.name || ''
                            },
                        },
                        // {
                        //     title: 'Học kỳ',
                        //     width: 150,
                        //     align: 'left',
                        //     render: (_, record) => {
                        //         return record?.subjectClass?.semester?.name || ''
                        //     },
                        // },
                        {
                            title: 'Sinh viên',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return `${record?.student?.userProfile?.lastName || ''} ${
                                    record?.student?.userProfile?.firstName || ''
                                }`.trim()
                            },
                        },
                        {
                            title: 'Lớp môn học',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return record?.subjectClass?.name || ''
                            },
                        },
                        {
                            title: 'STC',
                            width: 50,
                            align: 'left',
                            render: (_, record) => {
                                return record?.subjectVersion?.credit || ''
                            },
                        },
                        {
                            title: 'Tên chuyên đề',
                            width: 250,
                            align: 'left',
                            render: (_, record) => {
                                return record?.studentResearchTopic?.name || ''
                            },
                        },
                        {
                            title: 'Nội dung chính đạt được',
                            width: 250,
                            align: 'left',
                            render: (_, record) => {
                                return record?.studentResearchTopic?.mainContent || ''
                            },
                        },
                        {
                            title: 'GVHD1',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return `${
                                    record?.studentResearchTopic?.supervisor?.userProfile
                                        ?.lastName || ''
                                }
                 ${record?.studentResearchTopic?.supervisor?.userProfile?.firstName || ''}`.trim()
                            },
                        },
                        {
                            title: 'GVHD2',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return `${
                                    record?.studentResearchTopic?.coSupervisor?.userProfile
                                        ?.lastName || ''
                                }
                 ${record?.studentResearchTopic?.coSupervisor?.userProfile?.firstName || ''}`.trim()
                            },
                        },
                        {
                            title: 'Thời gian báo cáo',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return record?.studentResearchTopic?.reportDate
                                    ? dayjs(record?.studentResearchTopic?.reportDate).format(
                                          'DD/MM/YYYY'
                                      )
                                    : ''
                            },
                        },
                        {
                            title: 'Điểm',
                            width: 100,
                            align: 'left',
                            render: (_, record) => {
                                return record?.finalScore
                                    ? Number(record?.finalScore).toFixedSmart(2)
                                    : ''
                            },
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            fixed: 'right',
                            align: 'center',
                            render: (_, record) => {
                                return (
                                    <div className="flex justify-center items-center">
                                        <SquarePen className="text-sm cursor-pointer" onClick={() =>
                                             openPutResearchTopicModal({
                                                 studentResearchTopicId: record.studentResearchTopic?.id,
                                                 studentSubjectScoreId: record.id })} />
                                    </div>
                                )
                            },
                        },
                    ]}
                    data={studentSubjectScoreData}
                    pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: count,
                        onChange: (page, pageSize) => {
                            if (numberOfPages === pageSize) {
                                setCurrentPage(page)
                            } else {
                                setCurrentPage(1)
                                setNumberOfPages(pageSize)
                            }
                        },
                    }}
                />
            </Col>
        </Row>
    )
}
ChuyenDeNghienCuu.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
