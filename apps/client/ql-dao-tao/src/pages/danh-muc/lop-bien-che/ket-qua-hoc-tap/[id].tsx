import { SafetyCertificateOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import type { FilterProps } from '@constants/type'
import { useScoreConverter } from '@hooks/scoreConverter'
import DefaultLayout from '@layouts/default-layout'
import type { ArchivedCertificate, Prisma, StudentSubjectScore } from '@workspace/db/client'
import {
    useFindManySemester,
    useFindManyStudentSemesterResult,
    useFindManyStudentSubjectScore,
    useFindManySubjectVersion,
    useFindUniqueStudent,
} from '@workspace/db/hooks'
import { exportFromTemplate, type TableRow } from '@workspace/libs/template-excel'
import { getMinioUrl } from '@workspace/libs/utils'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Flex, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export interface IMonHoc {
    TenMonhoc: string
    MaMH?: string
    soTC?: number
    diem01?: number
    diem02?: number
    diem07?: number
    diemhe10?: number
    diemhe4?: number
    diemchu?: string
    ghichu?: string
}

export interface IHocKi {
    TenHocKi?: string
    SoTinChiKy?: number
    DiemTBKyHe10?: number
    DiemTBKyHe4?: number
    monHocs?: IMonHoc[]
}
export default function StudentScoreClassPage() {
    const router = useRouter()
    const { can, canSome } = useAbility()
    const [expandAll, setExpandAll] = useState(true)
    const studentId = router.query.id as string
    const [semesterId, setSemesterId] = useState<string>()
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
    })

    const { onOpen } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: 'ModalPrintToKQHT',
    })

    const { onOpen: onOpenModalAddScore } = useDisclosure<{
        id: string
        list: string[]
        studentId: string
        subjectClassStudent: StudentSubjectScore
    }>({
        tag: 'PutAddOlympicScoreModal',
    })

    const { onOpen: onOpenModalAddCertificate } = useDisclosure<{
        id: string
        list: string[]
        studentId: string
        subjectClassStudent: StudentSubjectScore
    }>({
        tag: 'PutAddCertificateScoreModal',
    })

    const { onOpen: onOpenModalNhapDiem } = useDisclosure<string>({
        tag: 'NhapDiemThuCong',
        onClose: () => {
            refetch()
        },
    })
    const exportTemplate = async () => {
        const hocKis: IHocKi[] = []
        if (data.length > 0) {
            data.forEach((item) => {
                const monhoc: IMonHoc[] = []
                item.subjectClasses.forEach((subjectClass) => {
                    subjectClass.subjectClassStudent.forEach((subjectClassStudent) => {
                        monhoc.push({
                            TenMonhoc: subjectClassStudent.subjectVersion.name,
                            MaMH: subjectClassStudent.subjectVersion.code?.slice(0, 2) ?? '',
                            soTC: subjectClassStudent.subjectVersion.credit,
                            diemhe10:
                                subjectClassStudent?.manualFinalScore ||
                                subjectClassStudent?.finalScore?.toNumber() ||
                                0,
                            diemhe4:
                                convertScore(
                                    subjectClassStudent?.manualFinalScore ||
                                        subjectClassStudent?.finalScore?.toNumber() ||
                                        0
                                ).base4 ?? 0,
                            diemchu:
                                convertScore(
                                    subjectClassStudent?.manualFinalScore ??
                                        subjectClassStudent?.finalScore?.toNumber() ??
                                        0
                                ).letter ?? '',
                            ghichu: subjectClassStudent.description ?? '',
                        })
                    })
                })
                const tongSoTinChi = monhoc.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0)

                const tongDiemNhanTinChiHe10 = monhoc.reduce(
                    (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
                    0
                )
                const tongDiemNhanTinChiHe4 = monhoc.reduce(
                    (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
                    0
                )

                const diemTBHe10_Raw =
                    tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe10 / tongSoTinChi
                const diemTBHe4_Raw = tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe4 / tongSoTinChi

                const diemTBHe10 = Number.parseFloat(diemTBHe10_Raw.toFixed(1))
                const diemTBHe4 = Number.parseFloat(diemTBHe4_Raw.toFixed(1))

                hocKis.push({
                    TenHocKi: `${item.code}-${item.name}-${item.schoolYear?.name}`,
                    SoTinChiKy: tongSoTinChi,
                    DiemTBKyHe10: diemTBHe10,
                    DiemTBKyHe4: diemTBHe4,
                    monHocs: monhoc,
                })
            })
        }
        const sampleStudentData = {
            fullname: student?.userProfile?.fullname,
            dateOfBirth: student?.userProfile?.dateOfBirth,
            maSV: student?.code,
            // TODO: check htdt
            htdt: student?.fixedClass?.trainingCourse.trainingObjectType.name,
            nganh: student?.curriculumVersion?.curriculum.trainingMajor.name,
            lop: student?.fixedClass?.trainingCourse?.name,
            hocKis: hocKis,
        }

        const tableRows = sampleStudentData.hocKis.flatMap((hocKi) => {
            const hocKiRow: TableRow = {
                cells: [
                    {
                        value: hocKi.TenHocKi ?? '',
                        colSpan: 19,
                        bold: true,
                        align: 'left',
                        border: true,
                    },
                ],
            }
            const monHocRows: TableRow[] =
                hocKi?.monHocs?.map((monHoc: IMonHoc, index: number) => ({
                    cells: [
                        { value: index + 1 },
                        { value: monHoc.TenMonhoc ?? '', colSpan: 6, border: true },
                        { value: monHoc.MaMH ?? '' },
                        { value: monHoc.soTC, align: 'center' },
                        { value: monHoc.diem01 ?? 0, align: 'right' },
                        { value: monHoc.diem02 ?? 0, align: 'right' },
                        { value: monHoc.diem07 ?? 0, align: 'right' },
                        { value: null },
                        { value: null },
                        { value: monHoc.diemhe10 ?? 0, align: 'right' },
                        { value: monHoc.diemhe4 ?? 0, align: 'right' },
                        { value: monHoc.diemchu ?? '', align: 'center' },
                        { value: null },
                        { value: monHoc.ghichu ?? '' },
                    ],
                })) ?? []

            // Dòng trung bình học kỳ
            const trungBinhRow: TableRow = {
                cells: [
                    { value: null },
                    { value: 'Điểm trung bình học kỳ:', colSpan: 6, bold: true, align: 'center' },
                    { value: null }, // Cột 7
                    { value: hocKi.SoTinChiKy ?? 0, bold: true, align: 'center' }, // Cột 8
                    { value: null }, // Cột 9
                    { value: null }, // Cột 10
                    { value: null }, // Cột 11
                    { value: null }, // Cột 12
                    { value: null }, // Cột 13
                    { value: hocKi.DiemTBKyHe10 ?? 0, bold: true, align: 'right' }, // Cột 14
                    { value: hocKi.DiemTBKyHe4 ?? 0, bold: true, align: 'right' }, // Cột 15
                    { value: null }, // Cột 16
                    { value: null }, // Cột 17
                    { value: null }, // Cột 18
                ],
            }

            return [hocKiRow, ...monHocRows, trungBinhRow]
        })

        const gapRow: TableRow = {
            cells: [{ value: null, colSpan: 18, border: false }],
        }
        const tongtinchi = sampleStudentData.hocKis.reduce(
            (acc, curr) => acc + (curr.SoTinChiKy ?? 0),
            0
        )

        // Tính điểm trung bình hệ 10 toàn khóa: tổng (điểm TB kỳ × số tín chỉ kỳ) / tổng số tín chỉ
        const tongDiemNhanTinChiHe10 = sampleStudentData.hocKis.reduce(
            (acc, curr) => acc + (curr.DiemTBKyHe10 ?? 0) * (curr.SoTinChiKy ?? 0),
            0
        )
        const tongDiemNhanTinChiHe4 = sampleStudentData.hocKis.reduce(
            (acc, curr) => acc + (curr.DiemTBKyHe4 ?? 0) * (curr.SoTinChiKy ?? 0),
            0
        )

        const tongdiemhe10 =
            tongtinchi === 0
                ? 0
                : Number.parseFloat((tongDiemNhanTinChiHe10 / tongtinchi).toFixed(1))
        const tongdiemhe4 =
            tongtinchi === 0
                ? 0
                : Number.parseFloat((tongDiemNhanTinChiHe4 / tongtinchi).toFixed(1))
        const totalRow: TableRow = {
            cells: [{ value: `Tổng tín chỉ: ${tongtinchi}`, colSpan: 18, border: false }],
        }
        const diemTBHe10Row: TableRow = {
            cells: [
                {
                    value: `Điểm trung bình hệ 10 toàn khóa: ${tongdiemhe10}`,
                    colSpan: 18,
                    border: false,
                },
            ],
        }
        const diemTBHe4Row: TableRow = {
            cells: [
                {
                    value: `Điểm trung bình hệ 4 toàn khóa: ${tongdiemhe4}`,
                    colSpan: 18,
                    border: false,
                },
            ],
        }
        const xeploai = convertScore(tongdiemhe10).classification
        const xepLoaiRow: TableRow = {
            cells: [{ value: `Xếp loại: ${xeploai}`, colSpan: 18, border: false }],
        }

        const dateSignatureRow: TableRow = {
            cells: [
                { value: null, colSpan: 12, border: false }, // Ô trống bên trái
                {
                    value: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
                    colSpan: 6,
                    border: false,
                    align: 'center',
                },
            ],
        }

        const titleSignatureRow: TableRow = {
            cells: [
                { value: null, colSpan: 12, border: false },
                {
                    value: '  KT. TRƯỞNG PHÒNG \n PHÓ TRƯỞNG PHÒNG',
                    colSpan: 6,
                    border: false,
                    align: 'center',
                    bold: true,
                },
            ],
        }
        const nameSignatureRow: TableRow = {
            cells: [
                { value: null, colSpan: 12, border: false }, // Ô trống bên trái
                {
                    value: 'Đại tá, TS Nguyễn Văn Bình												',
                    colSpan: 6,
                    border: false,
                    align: 'center',
                    bold: true,
                },
            ],
        }
        exportFromTemplate({
            templateUrl: getMinioUrl('/mta/template/quatrinh.xlsx'),
            sheets: [
                {
                    sheet: 'BaoCaoDiem',
                    data: {
                        fullname: sampleStudentData.fullname ?? '',
                        dateOfBirth: sampleStudentData.dateOfBirth
                            ? dayjs(sampleStudentData.dateOfBirth).format('DD/MM/YYYY')
                            : '',
                        htdt: sampleStudentData.htdt ?? '',
                        maSV: sampleStudentData.maSV ?? '',
                        nganh: sampleStudentData.nganh ?? '',
                        lop: sampleStudentData.lop ?? '',
                    },
                    tableStartCell: { row: 11, col: 1 },
                    rows: [
                        ...tableRows,
                        gapRow,
                        gapRow,
                        totalRow,
                        diemTBHe10Row,
                        diemTBHe4Row,
                        xepLoaiRow,
                        dateSignatureRow,
                        titleSignatureRow,
                        nameSignatureRow,
                    ],
                    hiddenColumns: ['M', 'N', 'R', 'J', 'K', 'L'],
                },
            ],
            fileName: `BDCN-${sampleStudentData.fullname}.xlsx`,
        })
    }

    const { data: student } = useFindUniqueStudent(
        {
            where: { id: studentId },
            include: {
                userProfile: true,
                curriculumVersion: {
                    include: {
                        trainingLevel: true,
                        curriculum: {
                            include: {
                                trainingMajor: {
                                    include: {
                                        trainingField: true,
                                    },
                                },
                            },
                        },
                    },
                },
                fixedClass: {
                    include: {
                        trainingCourse: {
                            include: {
                                trainingObjectType: true,
                                scoreConverts: true,
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!studentId,
        }
    )

    const { data: manualScoreData = [] } = useFindManyStudentSubjectScore(
        {
            where: {
                studentId: studentId,
                manualFinalScore: { gt: 0 },
            },
            include: { subjectVersion: true },
        },
        { enabled: !!studentId }
    )

    const { data: trainingSubjectVersions = [] } = useFindManySubjectVersion(
        {
            where: {
                studentSubjectScore: {
                    some: {
                        studentId: studentId,
                        subjectClass: { cancelled: false },
                    },
                },
            },
        },
        {
            enabled: !!studentId,
        }
    )

    const subjectVersionWhere: Prisma.SubjectVersionWhereInput = useMemo(() => {
        return {
            ...(filters.code
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.name
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.creditCmp
                ? {
                      credit: {
                          ...(filters.creditCmp.gte
                              ? {
                                    gte: Number(filters.creditCmp.gte),
                                }
                              : {}),
                          ...(filters.creditCmp.lte
                              ? {
                                    lte: Number(filters.creditCmp.lte),
                                }
                              : {}),
                      },
                  }
                : {}),
        }
    }, [filters.name, filters.creditCmp, filters.code])

    const subjectScoreWhere: Prisma.StudentSubjectScoreWhereInput = useMemo(() => {
        return {
            studentId,
            ...(filters.attendanceScoreCmp
                ? {
                      attendanceScore: {
                          ...(filters.attendanceScoreCmp.gte
                              ? {
                                    gte: Number(filters.attendanceScoreCmp.gte),
                                }
                              : {}),
                          ...(filters.attendanceScoreCmp.lte
                              ? {
                                    lte: Number(filters.attendanceScoreCmp.lte),
                                }
                              : {}),
                      },
                  }
                : {}),
            ...(filters.midtermScoreCmp
                ? {
                      midtermScore: {
                          ...(filters.midtermScoreCmp.gte
                              ? {
                                    gte: Number(filters.midtermScoreCmp.gte),
                                }
                              : {}),
                          ...(filters.midtermScoreCmp.lte
                              ? {
                                    lte: Number(filters.midtermScoreCmp.lte),
                                }
                              : {}),
                      },
                  }
                : {}),
            ...(filters.examScoreCmp
                ? {
                      examScore: {
                          ...(filters.examScoreCmp.gte
                              ? {
                                    gte: Number(filters.examScoreCmp.gte),
                                }
                              : {}),
                          ...(filters.examScoreCmp.lte
                              ? {
                                    lte: Number(filters.examScoreCmp.lte),
                                }
                              : {}),
                      },
                  }
                : {}),
            ...(filters.finalScoreCmp
                ? {
                      finalScore: {
                          ...(filters.finalScoreCmp.gte
                              ? {
                                    gte: Number(filters.finalScoreCmp.gte),
                                }
                              : {}),
                          ...(filters.finalScoreCmp.lte
                              ? {
                                    lte: Number(filters.finalScoreCmp.lte),
                                }
                              : {}),
                      },
                  }
                : {}),
            subjectVersion: subjectVersionWhere,
        }
    }, [filters, studentId, subjectVersionWhere])

    const { data = [], refetch } = useFindManySemester({
        where: {
            subjectClasses: {
                some: {
                    subject: subjectVersionWhere,
                    subjectClassStudent: {
                        some: subjectScoreWhere,
                    },
                },
            },
        },
        include: {
            subjectClasses: {
                where: {
                    subjectClassStudent: {
                        some: subjectScoreWhere,
                    },
                },
                include: {
                    subject: true,
                    subjectClassStudent: {
                        where: subjectScoreWhere,
                        include: {
                            subjectVersion: true,
                            certificates: {
                                include: { archivedCertificate: true },
                            },
                            awards: {
                                include: { archivedAward: true },
                            },
                        },
                    },
                },
            },
            trainingCoursesStart: {
                where: {
                    id: student?.fixedClass?.trainingCourseId ?? undefined,
                },
                include: {
                    scoreConverts: true,
                },
            },
            schoolYear: true,
        },
        orderBy: {
            startDate: 'asc',
        },
    })

    const { convertScore } = useScoreConverter(student?.fixedClass?.trainingCourse.scoreConverts)

    // Lấy kết quả học tập theo kỳ
    const { data: semesterResults = [] } = useFindManyStudentSemesterResult(
        {
            where: { studentId },
            include: { rank: true },
        },
        { enabled: !!studentId }
    )

    const semesterResultMap = useMemo(() => {
        const map: Record<string, (typeof semesterResults)[number]> = {}
        for (const result of semesterResults) {
            map[result.semesterId] = result
        }
        return map
    }, [semesterResults])

    // Transform data: thêm summary row vào cuối mỗi học kỳ
    const dataWithSummary = useMemo(() => {
        return data
            .filter((s) => !semesterId || semesterId === s.id)
            .map((semester: any) => {
                const result = semesterResultMap[semester.id]
                if (!result) return semester
                return {
                    ...semester,
                    subjectClasses: [
                        ...semester.subjectClasses,
                        {
                            id: `summary-${semester.id}`,
                            $isSummary: true,
                            semesterResult: result,
                            subjectClassStudent: [],
                        },
                    ],
                }
            })
    }, [data, semesterId, semesterResultMap])

    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Quản lý hồ sơ' },
                {
                    title: 'Lớp quản lý',
                    href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
                },
                {
                    title: 'Chi tiết lớp quản lý',
                    href: student?.fixedClassId
                        ? ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace(
                              '[id]',
                              student?.fixedClassId
                          )
                        : undefined,
                },
                { title: 'Kết quả học tập' },
            ]}
        >
            <div>
                <Divider orientation="left" orientationMargin={0}>
                    {[
                        student?.code,
                        student?.userProfile?.fullname,
                        student?.fixedClass?.trainingCourse.trainingObjectType.name,
                        student?.fixedClass?.trainingCourse?.name,
                        student?.curriculumVersion?.name,
                        student?.curriculumVersion?.curriculum.trainingMajor.name,
                        student?.curriculumVersion?.curriculum.trainingMajor.trainingField.name,
                    ]
                        .filter(Boolean)
                        .join(' - ')}
                </Divider>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        {/* Row nút thêm */}
                        <Row gutter={[8, 8]} align="top" justify="space-between">
                            {/* Hàng chứa các button */}
                            <Col xs={24}>
                                <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                                    {can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_QL_SV_HV_CHUYEN_TRUONG,
                                        'THEM'
                                    ) && (
                                        <Button
                                            type="primary"
                                            onClick={() => onOpenModalNhapDiem(studentId)}
                                        >
                                            Nhập điểm trực tiếp
                                        </Button>
                                    )}
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            onOpen({
                                                dataTable: data,
                                                dataStudent: student,
                                            })
                                        }
                                    >
                                        In kết quả học tập
                                    </Button>

                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            exportTemplate()
                                        }}
                                    >
                                        Xuất bảng điểm cá nhân (Mẫu P2)
                                    </Button>
                                </Flex>
                            </Col>
                        </Row>
                    </Col>

                    <Col span={24}>
                        <h3 className="text-lg font-bold">Kết quả học tập theo kỳ</h3>
                        <Flex justify="space-between">
                            <Select
                                value={semesterId}
                                onChange={(v) => {
                                    setSemesterId(v)
                                }}
                                className="w-64"
                                options={data.map((s) => ({
                                    label: `${s.code} - ${s.name} - ${s.schoolYear.name}`,
                                    value: s.id,
                                }))}
                            />
                            <Button onClick={() => setExpandAll(!expandAll)}>
                                {expandAll ? 'Thu gọn' : 'Mở rộng'}
                            </Button>
                        </Flex>
                        <TableCollapse
                            rowKey="key"
                            currentPage={1}
                            headerTitleKey={({ code, name, schoolYear }) => (
                                <p className="font-bold text-base">
                                    {[code, name, schoolYear?.name].filter(Boolean).join(' - ')}
                                </p>
                            )}
                            headerColumn={[
                                {
                                    colSpan: 1,
                                },
                                {
                                    render: (_, { code, name, schoolYear }) => (
                                        <p className="font-medium text-base">
                                            {[code, name, schoolYear?.name]
                                                .filter(Boolean)
                                                .join(' - ')}
                                        </p>
                                    ),
                                    colSpan: 15,
                                },
                                // {
                                //     render: (_, { code, name, schoolYear }) => (
                                //         // TODO: kết quả học kỳ của SV: điểm TBC, học bổng, cảnh cáo,...
                                //         <Button>Chi tiết</Button>
                                //     ),
                                //     colSpan: 1,
                                // },
                            ]}
                            filters={filters}
                            setFilters={(value) => {
                                setFilters(value)
                            }}
                            childrenFieldName="subjectClasses"
                            defaultExpandAll={expandAll}
                            columns={[
                                {
                                    title: 'Mã môn học',
                                    align: 'center',
                                    dataIndex: 'code',
                                    type: 'input',
                                    fixed: 'left',
                                    width: 120,
                                    render: (_, record: any) => {
                                        return record?.subject?.code || ''
                                    },
                                },
                                {
                                    title: 'Tên môn học',
                                    align: 'center',
                                    dataIndex: 'name',
                                    fixed: 'left',
                                    type: 'input_search',
                                    options: trainingSubjectVersions.map((item) => ({
                                        label: item.name,
                                        value: item.name,
                                    })),
                                    width: 200,
                                },
                                {
                                    title: 'Điểm TX',
                                    align: 'center',
                                    dataIndex: 'attendanceScoreCmp',
                                    type: 'cmp',
                                    width: 100,
                                    render: (_, record: any) => {
                                        if (record.$isSummary) return null
                                        return record?.subjectClassStudent?.[0]?.attendanceScore
                                    },
                                },
                                {
                                    title: 'Điểm ĐK',
                                    align: 'center',
                                    dataIndex: 'midtermScoreCmp',
                                    type: 'cmp',
                                    width: 100,
                                    render: (_, record: any) => {
                                        if (record.$isSummary) return null
                                        return record?.subjectClassStudent?.[0]?.midtermScore
                                    },
                                },
                                {
                                    title: 'Điểm thi',
                                    align: 'center',
                                    dataIndex: 'examScoreCmp',
                                    type: 'cmp',
                                    width: 100,
                                    render: (_, record: any) => {
                                        if (record.$isSummary) return null
                                        return record?.subjectClassStudent?.[0]?.examScore
                                    },
                                },
                                {
                                    title: 'Điểm cộng',
                                    align: 'center',
                                    width: 100,
                                    render: (_, record: any) => {
                                        if (record.$isSummary) return null
                                        const totalBonus =
                                            record.subjectClassStudent?.[0]?.awards.reduce(
                                                (
                                                    acc: number,
                                                    curr: { archivedAward: { bonusScore: number } }
                                                ) => acc + (curr?.archivedAward?.bonusScore ?? 0),
                                                0
                                            )
                                        return totalBonus || 0
                                    },
                                },
                                {
                                    title: 'Chứng chỉ',
                                    align: 'center',
                                    width: 150,
                                    render: (_, record: any) => {
                                        if (record.$isSummary) return null
                                        return record.subjectClassStudent?.[0]?.certificates
                                            .map(
                                                (i: { archivedCertificate: ArchivedCertificate }) =>
                                                    i?.archivedCertificate?.code
                                            )
                                            .join(', ')
                                    },
                                },
                                {
                                    title: <Tooltip title="Điểm tương đương">Điểm TĐ</Tooltip>,
                                    align: 'center',
                                    width: 80,
                                    render: (__, record: any) => {
                                        if (record.$isSummary) return null
                                        const arr: { finalScore: number }[] =
                                            record.subjectClassStudent?.[0]?.certificates.map(
                                                (i: {
                                                    archivedCertificate: ArchivedCertificate
                                                }) => {
                                                    return {
                                                        ...i,
                                                        finalScore:
                                                            Number(
                                                                i?.archivedCertificate?.finalScore
                                                            ) || 0,
                                                    }
                                                }
                                            )
                                        return arr?.length > 0
                                            ? _.maxBy(arr, 'finalScore')?.finalScore
                                            : ''
                                    },
                                },
                                {
                                    title: <Tooltip title="Số tín chỉ">STC</Tooltip>,
                                    align: 'center',
                                    dataIndex: 'creditCmp',
                                    type: 'cmp',
                                    width: 100,
                                    render: (_, record: any) => {
                                        // if (record.$isSummary) return <b>{record.semesterResult.registeredCredits}</b>
                                        return record?.subjectClassStudent?.[0]?.subjectVersion
                                            .credit
                                    },
                                },
                                {
                                    title: 'Điểm hệ 10',
                                    align: 'center',
                                    dataIndex: 'finalScoreCmp',
                                    type: 'cmp',
                                    width: 100,
                                    render: (_, record: any) => {
                                        // if (record.$isSummary) {
                                        //     return <b>{Number(record.semesterResult.gpaBase10)}</b>
                                        // }
                                        const subjectClassStudent = record?.subjectClassStudent?.[0]
                                        return (
                                            subjectClassStudent?.manualFinalScore ??
                                            subjectClassStudent?.finalScore?.toNumber() ??
                                            ''
                                        )
                                    },
                                },
                                {
                                    title: 'Điểm hệ 4',
                                    align: 'center',
                                    dataIndex: 'finalScore4',
                                    width: 100,
                                    render: (_, record: any) => {
                                        // if (record.$isSummary) {
                                        //     return <b>{Number(record.semesterResult.gpaBase4)}</b>
                                        // }
                                        const subjectClassStudent = record?.subjectClassStudent?.[0]
                                        const score =
                                            subjectClassStudent?.manualFinalScore ||
                                            subjectClassStudent?.finalScore?.toNumber()
                                        if (score === undefined || score === null) return null
                                        return score !== undefined ? convertScore(score).base4 : ''
                                    },
                                },
                                {
                                    title: 'Điểm hệ chữ',
                                    align: 'center',
                                    width: 120,
                                    render: (_, record: any) => {
                                        if (record.$isSummary) {
                                            return <b>{record.semesterResult.rank?.name || ''}</b>
                                        }
                                        const subjectClassStudent = record?.subjectClassStudent?.[0]

                                        const score =
                                            subjectClassStudent?.manualFinalScore ??
                                            subjectClassStudent?.finalScore?.toNumber()

                                        if (score === null || score === undefined) return null

                                        return convertScore(score).letter
                                    },
                                },
                                {
                                    title: 'Kết quả',
                                    align: 'center',
                                    width: 100,
                                    render: (_: any, record: any) => {
                                        // if (record.$isSummary) {
                                        //     return (
                                        //         <b>
                                        //             Đạt: {record.semesterResult.passedCredits}/{record.semesterResult.registeredCredits}
                                        //         </b>
                                        //     )
                                        // }
                                        const subjectClassStudent = record.subjectClassStudent?.[0]
                                        const score =
                                            subjectClassStudent?.manualFinalScore ??
                                            subjectClassStudent?.finalScore

                                        if (score === undefined || score === null) return null
                                        const result = convertScore(score.toNumber())

                                        return (
                                            <div className="flex items-center justify-center">
                                                {result.pass ? (
                                                    <Check size={18} color="green" />
                                                ) : (
                                                    <X size={18} color="red" />
                                                )}
                                            </div>
                                        )
                                    },
                                },
                                {
                                    title: 'Ghi chú',
                                    align: 'center',
                                    dataIndex: ['subjectClassStudent', '0', 'description'],
                                    width: 200,
                                    render: (value: string, record: any) => {
                                        if (record.$isSummary) {
                                            const r = record.semesterResult
                                            return (
                                                <span className="font-semibold text-xs">
                                                    TL hệ 10: {Number(r.cumulativeGpaBase10)} | TL
                                                    hệ 4: {Number(r.cumulativeGpaBase4)}
                                                </span>
                                            )
                                        }
                                        return <span className="line-clamp-1">{value}</span>
                                    },
                                },
                                {
                                    title: 'Thao tác',
                                    width: 150,
                                    align: 'center',
                                    fixed: 'right',
                                    render: (_, { id, subjectClassStudent }: any) => {
                                        if (
                                            subjectClassStudent?.length === 0 &&
                                            !id?.startsWith?.('summary-')
                                        )
                                            return null
                                        if (id?.startsWith?.('summary-')) return null
                                        return (
                                            <Row className="justify-center gap-2">
                                                {/* <Tooltip title="Cộng điểm">
                                                <BookCheckIcon
                                                    className="cursor-pointer hover:text-blue-500"
                                                    size={16}
                                                    onClick={() => {
                                                        const currentAwards =
                                                            subjectClassStudent?.[0]?.awards || []
                                                        onOpenModalAddScore({
                                                            id: subjectClassStudent?.[0]?.id,
                                                            studentId: studentId,
                                                            list: currentAwards.map(
                                                                (i: any) => i.archivedAwardId
                                                            ),
                                                            subjectClassStudent:
                                                                subjectClassStudent?.[0],
                                                        })
                                                    }}
                                                />
                                            </Tooltip> */}

                                                <Tooltip title="Thêm chứng chỉ">
                                                    <SafetyCertificateOutlined
                                                        className="cursor-pointer hover:text-green-500"
                                                        onClick={() => {
                                                            onOpenModalAddCertificate({
                                                                id: subjectClassStudent?.[0]?.id,
                                                                studentId: studentId,
                                                                list:
                                                                    subjectClassStudent?.[0]?.certificates.map(
                                                                        (i: any) =>
                                                                            i.archivedCertificateId
                                                                    ) || [],
                                                                subjectClassStudent:
                                                                    subjectClassStudent?.[0],
                                                            })
                                                        }}
                                                    />
                                                </Tooltip>
                                            </Row>
                                        )
                                    },
                                },
                            ]}
                            data={dataWithSummary}
                            pagination={{
                                hideOnSinglePage: true,
                            }}
                        />
                    </Col>
                    <Col span={24}>
                        <h3 className="text-lg font-bold">Danh sách điểm phiên</h3>
                        <Table
                            // filters={filters}
                            // setFilters={setFilters}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 50,
                                    align: 'center',
                                    render: (_, __, index) => index + 1,
                                },
                                {
                                    title: 'Mã môn học',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record) => record?.subjectVersion?.code,
                                },
                                {
                                    title: 'Tên môn học',
                                    align: 'center',
                                    render: (_, record) => record?.subjectVersion?.name,
                                },
                                {
                                    title: 'Điểm',
                                    dataIndex: 'manualFinalScore',
                                    align: 'center',
                                    width: 150,
                                },
                                {
                                    title: 'Ghi chú',
                                    dataIndex: 'description',
                                    align: 'center',
                                    width: 250,
                                },
                            ]}
                            data={manualScoreData}
                            pagination={false}
                        />
                    </Col>
                </Row>
            </div>
        </DefaultLayout>
    )
}
