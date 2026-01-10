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
    useFindManySemester,
    useFindManyStudentSubjectScore,
    useFindManySubjectClass,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { Button, Col, DatePicker, Form, message, Row } from 'antd'
import { sqlTransaction } from '@workspace/libs/api/model'
import dayjs from 'dayjs'
import { SquarePen } from 'lucide-react'
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useMemo, useState } from 'react'

interface ChuyenDeNghienCuuForm {
    trainingObjectTypeId: string
    trainingCourseId: string
    organizationId: string
    semesterId: string
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
    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()
    const watchTrainingObjectTypeId = Form.useWatch('trainingObjectTypeId', form)
    const courseWhere = useMemo(() => {
        if (!watchTrainingObjectTypeId) return {}
        return {
            trainingObjectTypeId: watchTrainingObjectTypeId,
        }
    }, [watchTrainingObjectTypeId])
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        where: courseWhere,
    })
    const {data:lecturerData = []} = useFindManyLecturer({
        include: {
            userProfile: true,
        },
    })
    const { data: organizationData = [] } = useFindManyDM_DonVi()
    const { data: semesterData = [] } = useFindManySemester()
    const { data: subjectClassData = [] } = useFindManySubjectClass({
        where: {
            subject: {
                type: SubjectVersionType.Research,
            },
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

        if (searchParams.trainingObjectTypeId) {
            filter.subjectClass = {
                ...filter.subjectClass,

                trainingObjectTypeId: searchParams.trainingObjectTypeId,
            }
        }

        if (searchParams.semesterId) {
            filter.subjectClass = {
                ...filter.subjectClass,
                semesterId: searchParams.semesterId,
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

        return filter
    }, [searchParams, isSearched])
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
                return message.error('Vui lòng kiểm tra lại dữ liệu học sinh.')
            }

            message.success('Lấy dữ liệu thành công!')
            refetchStudentSubjectScore()
            refetchStudentSubjectScoreAll()
            refetchCount()
        } catch (error) {
            console.error('getData Error:', error)
            message.error('Có lỗi xảy ra khi xử lý dữ liệu.')
        }
    }
    const exportToExcel = async () => {
        if (studentSubjectScoreData.length === 0) {
            return message.warning('Không có dữ liệu để xuất Excel!');
        }
    
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách chuyên đề');
        const refSheet = workbook.addWorksheet('LecturerData');
        refSheet.state = 'veryHidden'; 

        lecturerData.forEach((l, index) => {
            const fullName = `${l.userProfile?.lastName || ''} ${l.userProfile?.firstName || ''}`.trim();
            refSheet.getCell(`A${index + 1}`).value = fullName;
            refSheet.getCell(`B${index + 1}`).value = l.id;
        });
        const lecturerNameRange = `LecturerData!$A$1:$A$${lecturerData.length}`;
        const fullTableRange = `LecturerData!$A$1:$B$${lecturerData.length}`;
    
        worksheet.columns = [
            { header: 'Mã SV', key: 'studentCode', width: 15 },
            { header: 'Họ và tên', key: 'studentName', width: 25 },
            { header: 'Tên chuyên đề', key: 'topicName', width: 35 },
            { header: 'GVHD 1', key: 'gvhd1', width: 25 }, 
            { header: 'GVHD 2', key: 'gvhd2', width: 25 }, 
            { header: 'ID_GV1', key: 'idGv1', width: 0, hidden: true }, 
            { header: 'ID_GV2', key: 'idGv2', width: 0, hidden: true }, 
            { header: 'Điểm', key: 'score', width: 10 },
        ];
    
        studentSubjectScoreData.forEach((record, index) => {
            const rowNumber = index + 2; // Dòng dữ liệu bắt đầu từ 2 (sau header)
            const topic = record.studentResearchTopic;
            
            const row = worksheet.addRow({
                studentCode: record.student?.userProfile?.code || '',
                studentName: `${record.student?.userProfile?.lastName || ''} ${record.student?.userProfile?.firstName || ''}`.trim(),
                topicName: topic?.name || '',
                gvhd1: topic?.supervisor ? `${topic.supervisor.userProfile?.lastName} ${topic.supervisor.userProfile?.firstName}`.trim() : '',
                gvhd2: topic?.coSupervisor ? `${topic.coSupervisor.userProfile?.lastName} ${topic.coSupervisor.userProfile?.firstName}`.trim() : '',
                score: record.finalScore || '',
            });
    
            const validation: ExcelJS.DataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [lecturerNameRange]
            };
            row.getCell('gvhd1').dataValidation = validation;
            row.getCell('gvhd2').dataValidation = validation;
    
            row.getCell('idGv1').value = {
                formula: `=IF(D${rowNumber}<>"", VLOOKUP(D${rowNumber}, ${fullTableRange}, 2, FALSE), "")`
            };
            row.getCell('idGv2').value = {
                formula: `=IF(E${rowNumber}<>"", VLOOKUP(E${rowNumber}, ${fullTableRange}, 2, FALSE), "")`
            };
        });
    
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Chuyen_de_Nghien_cuu_${dayjs().format('DDMMYYYY')}.xlsx`);
    };
    const importExcel = async () => {
        
    }

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={24}>
                        <Form
                            form={form}
                            layout="horizontal"
                            className="w-full mb-6 flex flex-wrap items-end gap-4"
                        >
                            <Form.Item
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
                            </Form.Item>

                            <Form.Item name="trainingCourseId" label="Khóa học" className="mb-0">
                                <Select
                                    className="w-36"
                                    options={
                                        trainingCourseData?.map((item) => ({
                                            label: item.name,
                                            value: item.id,
                                        })) || []
                                    }
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

                            <Form.Item name="semesterId" label="Học kỳ" className="mb-0">
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
                            </Form.Item>

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
                <Row gutter={[16, 16]} align="top" justify="space-between">
                    <Col span={24}>
                        <Form
                            form={timeReportForm}
                            layout="horizontal"
                            className="w-full mb-6 flex flex-wrap items-end gap-4"
                        >
                            <Form.Item name="subjectClassId" label="Lớp môn học" className="mb-0">
                                <Select
                                    className="w-46"
                                    options={subjectClassData?.map((item) => ({
                                        label: `${item.code} - ${item.name}`,
                                        value: item.id,
                                    }))}
                                    placeholder="Chọn lớp môn học"
                                />
                            </Form.Item>

                            <Form.Item className="mb-0">
                                <div className="flex gap-2">
                                    <Button type="primary" onClick={async () => await getData()}>
                                        Lấy dữ liệu
                                    </Button>
                                    <Button  type="primary" onClick={exportToExcel}>
                                        Xuất mẫu excel
                                    </Button>
                                </div>
                            </Form.Item>
                            <Form.Item
                                name="reportDate"
                                label="Hạn nhập chuyên đề"
                                className="mb-0"
                            >
                                <DatePicker
                                    className="w-36"
                                    format="DD/MM/YYYY"
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
                        {
                            title: 'ĐTĐT',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return record?.subjectClass?.trainingObjectType?.name || ''
                            },
                        },
                        {
                            title: 'Khóa học',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return record?.student?.fixedClass?.trainingCourse?.name || ''
                            },
                        },
                        {
                            title: 'Học kỳ',
                            width: 150,
                            align: 'left',
                            render: (_, record) => {
                                return record?.subjectClass?.semester?.name || ''
                            },
                        },
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
                                        <SquarePen className="text-sm cursor-pointer" />
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
