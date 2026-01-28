import { FileOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TreeSelect from '@components/commons/tree-select'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { SubjectVersionType } from '@workspace/db'
import {
    useCountStudentResearchTopic,
    useCreateManyStudentResearchTopic,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManyStudentResearchTopic,
    useFindManySubjectClass,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, message, Modal, Row, Tooltip } from 'antd'
import { sqlTransaction } from '@workspace/libs/api/model'
import dayjs from 'dayjs'
import { SquarePen } from 'lucide-react'
import ExcelJS from 'exceljs'
import { useMemo, useState } from 'react'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import DatePicker from '@components/commons/date-picker'

import { useDisclosure } from 'react-hook-disclosure-modal'
import type { Prisma } from '@workspace/db/client'

interface ChuyenDeNghienCuuForm {
    trainingCourseId: string
    organizationId: string
    subjectClassId: string
    reportDate: string
}

export default function ChuyenDeNghienCuu() {
    const [form] = Form.useForm<ChuyenDeNghienCuuForm>()
    const organizationId = Form.useWatch('organizationId', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const subjectClassId = Form.useWatch('subjectClassId', form)
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(20)
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()

    const { onOpen: openPutResearchTopicModal } = useDisclosure<{
        studentResearchTopicId: string
    }>({
        tag: 'PutResearchTopicModal',
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        where: {
            trainingObjectTypeId: trainingObjectTypeId,
        },
        orderBy: {
            name: 'desc',
        },
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
                studentSubjectScore: {
                    some: {
                        student: {
                            fixedClass: {
                                trainingCourseId,
                            },
                        },
                    },
                },
            },
            semesterId,
            trainingObjectTypeId,
        },
    })
    const where = useMemo(() => {
        const filter: Prisma.StudentResearchTopicWhereInput = {
            studentSubjectScore: {
                subjectClass: {
                    subject: {
                        type: SubjectVersionType.Research,
                        managementOrganizationId: organizationId,
                    },
                    trainingObjectTypeId,
                    semesterId,
                    cancelled: false,
                    active: true,
                    ...(subjectClassId ? { id: subjectClassId } : {}),
                },
                student: {
                    fixedClass: {
                        trainingCourseId: trainingCourseId || undefined,
                    },
                    status: 'ENROLLED',
                    active: true,
                    deletedAt: null,
                },
            },
            deletedAt: null,
        }

        return {
            ...filter,
            deletedAt: null,
        }
    }, [organizationId, trainingCourseId, subjectClassId, trainingObjectTypeId, semesterId])
    const { data: studentResearchTopicData = [], refetch: refetchStudentResearchTopic } =
        useFindManyStudentResearchTopic({
            where,
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
                studentSubjectScore: {
                    include: {
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
                },
            },
            orderBy: [
                {
                    studentSubjectScore: {
                        student: {
                            userProfile: {
                                firstName: 'asc',
                            },
                        },
                    },
                },
                {
                    studentSubjectScore: {
                        student: {
                            userProfile: {
                                lastName: 'asc',
                            },
                        },
                    },
                },
            ],
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        })

    const { data: count, refetch: refetchCount } = useCountStudentResearchTopic({
        where,
    })

    const { mutateAsync: createManyStudentResearchTopic } = useCreateManyStudentResearchTopic()

    const handleAssignDate = async () => {
        const reportDate = form.getFieldValue('reportDate')
        if (!reportDate) {
            return message.warning('Vui lòng chọn hạn nhập chuyên đề trước khi gán!')
        }

        const res = await sqlTransaction([
            {
                model: 'StudentResearchTopic',
                operation: 'updateMany',
                data: {
                    where,
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
        refetchStudentResearchTopic()
        refetchCount()
    }

    const treeOrgData = buildOrgTree(organizationData ?? [], '0')
    const getData = async () => {
        if (!subjectClassId) {
            return message.warning('Vui lòng chọn lớp môn học trước khi lấy dữ liệu')
        }
        try {
            const subjectStudent = await sqlTransaction([
                {
                    model: 'StudentSubjectScore',
                    operation: 'findMany',
                    data: {
                        where: { subjectClassId: subjectClassId },
                    },
                },
            ])
            const studentSubjectScoreData = subjectStudent
                .data?.[0] as Prisma.StudentSubjectScoreGetPayload<{}>[]
            if (studentSubjectScoreData.length === 0) {
                return message.error('Lớp môn học này không có sinh viên nào.')
            }
            await createManyStudentResearchTopic({
                data: studentSubjectScoreData.map((record) => ({
                    studentSubjectScoreId: record.id,
                })),
                skipDuplicates: true,
            })
            message.success('Lấy dữ liệu thành công!')
        } catch (error) {
            console.error('getData Error:', error)
            message.error('Có lỗi xảy ra khi xử lý dữ liệu.')
        } finally {
            refetchStudentResearchTopic()
            refetchCount()
        }
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

            message.success(`Cập nhật thành công ${finalData.length} bản ghi!`)
            refetchStudentResearchTopic()
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
        <Row gutter={[8, 8]}>
            <Col span={24}>
                <Form form={form}>
                    <Flex gap={6} wrap="wrap">
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
                        <Form.Item className="mb-0">
                            <div className="flex gap-2">
                                <Button type="primary" icon={<FileOutlined />} onClick={() => {}}>
                                    Phụ lục QĐ chuyên đề nghiên cứu
                                </Button>
                            </div>
                        </Form.Item>
                    </Flex>
                    <Flex gap={6} wrap="wrap" className="mt-2">
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
                                {/* <Button type="primary" onClick={async () => await exportToExcel()}>
                                    Xuất mẫu excel
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => document.getElementById('import-excel')?.click()}
                                >
                                    Import Excel
                                </Button> */}
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
                            <DatePicker className="w-44" placeholder="Chọn hạn nhập chuyên đề" />
                        </Form.Item>
                        <Form.Item className="mb-0">
                            <div className="flex gap-2">
                                <Button type="primary" onClick={handleAssignDate}>
                                    Gán ngày
                                </Button>
                            </div>
                        </Form.Item>
                    </Flex>
                </Form>
                <Table
                    scrollable
                    maxHeight={'calc(100vh - 330px)'}
                    columns={[
                        {
                            title: '',
                            width: 40,
                            fixed: 'right',
                            align: 'center',
                            render: (_, record) => {
                                return (
                                    <div className="flex justify-center items-center">
                                        <SquarePen
                                            className="text-sm cursor-pointer"
                                            onClick={() =>
                                                openPutResearchTopicModal({
                                                    studentResearchTopicId: record.id,
                                                })
                                            }
                                        />
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Hạn nhập chuyên đề',
                            width: 140,
                            align: 'center',
                            render: (_, record) => {
                                return (
                                    <div>
                                        {record?.deadline
                                            ? dayjs(record.deadline).format('DD/MM/YYYY')
                                            : ''}
                                    </div>
                                )
                            },
                        },
                        {
                            title: 'Mã SV',
                            width: 100,
                            align: 'center',
                            render: (_, record) => {
                                return record?.studentSubjectScore?.student?.code || ''
                            },
                        },
                        {
                            title: 'Họ và tên',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return record?.studentSubjectScore?.student?.userProfile?.fullname
                            },
                        },
                        {
                            title: 'Ngày sinh',
                            width: 80,
                            align: 'center',
                            render: (_, record) => {
                                return record?.studentSubjectScore?.student?.userProfile
                                    ?.dateOfBirth
                                    ? dayjs(
                                          record?.studentSubjectScore?.student?.userProfile
                                              ?.dateOfBirth
                                      ).format('DD/MM/YYYY')
                                    : ''
                            },
                        },
                        // {
                        //     title: 'Lớp môn học',
                        //     width: 150,
                        //     align: 'left',
                        //     render: (_, record) => {
                        //         return record?.subjectClass?.name || ''
                        //     },
                        // },
                        // {
                        //     title: 'STC',
                        //     width: 50,
                        //     align: 'center',
                        //     render: (_, record) => {
                        //         return record?.subjectVersion?.credit || ''
                        //     },
                        // },
                        {
                            title: 'Tên chuyên đề',
                            width: 250,
                            align: 'left',
                            render: (_, record) => {
                                return record?.name || ''
                            },
                        },
                        {
                            title: 'Nội dung chính đạt được',
                            width: 250,
                            align: 'left',
                            render: (_, record) => {
                                return record?.mainContent || ''
                            },
                        },
                        {
                            title: <Tooltip title="Giảng viên hướng dẫn 1">GVHD1</Tooltip>,
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return `${record?.supervisor?.userProfile?.lastName || ''}
                 ${record?.supervisor?.userProfile?.firstName || ''}`.trim()
                            },
                        },
                        {
                            title: <Tooltip title="Giảng viên hướng dẫn 2">GVHD2</Tooltip>,
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return `${record?.coSupervisor?.userProfile?.lastName || ''}
                 ${record?.coSupervisor?.userProfile?.firstName || ''}`.trim()
                            },
                        },
                        {
                            title: 'Thời gian báo cáo',
                            width: 120,
                            align: 'center',
                            render: (_, record) => {
                                return record?.reportDate
                                    ? dayjs(record?.reportDate).format('DD/MM/YYYY')
                                    : ''
                            },
                        },
                        {
                            title: 'Điểm',
                            width: 80,
                            align: 'center',
                            render: (_, record) => {
                                return record?.studentSubjectScore?.finalScore
                                    ? Number(record?.studentSubjectScore?.finalScore).toFixedSmart(
                                          2
                                      )
                                    : ''
                            },
                        },
                    ]}
                    data={studentResearchTopicData}
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
