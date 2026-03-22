import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import { ExportDiplomaAppendix } from '@components/ui/export-button'
import { useScoreConverter } from '@hooks/scoreConverter'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree, formatDateVN } from '@lib/utils'
import type { Semester, Student } from '@workspace/db'
import type {
    FixedClass,
    ScoreConvert,
    StudentSubjectScore,
    SubjectClass,
    SubjectVersion,
    TrainingCourse,
    UserProfile,
} from '@workspace/db/client'
import {
    useCountStudent,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyThesisSession,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { exportFromTemplate, TableRow } from '@workspace/libs/template-excel'
import { fuzzyMatch, getMinioUrl } from '@workspace/libs/utils'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, DatePicker, Form, Input, notification, TreeSelect } from 'antd'
import { useWatch } from 'antd/es/form/Form'
import dayjs from 'dayjs'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'

type TSubjectItem = StudentSubjectScore & {
    subjectVersion: SubjectVersion
    subjectClass:
        | (SubjectClass & {
              semester: Semester
          })
        | null
}

type TTrainingCourse = TrainingCourse & {
    scoreConverts: ScoreConvert[]
}

type TFixedClass = {
    fixedClass: FixedClass & {
        trainingCourse: TTrainingCourse
    }
}

type TUserProfile = {
    userProfile: UserProfile
}

export interface ISemesterGroup {
    id: string
    name: string
    subjects: TSubjectItem[]
}

export type TStudentWithSubjects = Student &
    TFixedClass &
    TUserProfile & {
        subjectClassStudent: (StudentSubjectScore & {
            subjectVersion: SubjectVersion
            subjectClass?: SubjectClass & {
                semester?: Semester
            }
        })[]
    }

export type TStudentWithSemesters = TStudentWithSubjects & {
    semesters: Array<{
        id: string
        name: string
        subjects: Array<{
            id: string
            key: string
            stt: number
            tenHocPhan: string
            soTinChi: number
            thangDiem10: string
            thangDiem4: string
            thangDiemChu: string | null
        }>
    }>
}

const formItemLayout = {
    labelCol: { flex: '0 0 100px' },
    wrapperCol: { flex: '1' },
}

const initialPagination = {
    page: 1,
    pageSize: 10,
}

export type StudentGradeSystemForm = {
    trainingObjectTypeId: string[]
    fixedClassIds: string[]
    thesisSessionIds: string[]
    trainingCourseIds: string[]
    managementOrganizationIds: string[]
    recordsPerPage: string
    date: string
    signer: string
    imageUrl: string
}

export default function StudentGradeSystem() {
    const [form] = Form.useForm<StudentGradeSystemForm>()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const trainingCourseIds: string[] = useWatch('trainingCourseIds', form)
    const fixedClassIds: string[] = useWatch('fixedClassIds', form)
    const managementOrganizationIds: string[] = useWatch('managementOrganizationIds', form)
    const [page, setPage] = useState(initialPagination.page)
    const [pageSize, setPageSize] = useState(initialPagination.pageSize)
    const [viewResult, setViewResult] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<TStudentWithSemesters | null>(null)
    const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectType({
        where: { active: true },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
        {
            where: {
                active: true,
                deletedAt: null,
                ...(trainingObjectTypeId && {
                    trainingObjectTypeId,
                }),
            },
        },
        {
            enabled: !!trainingObjectTypeId || trainingObjectTypes?.length > 0,
        }
    )

    const { data: fixedClasses = [] } = useFindManyFixedClass(
        {
            where: {
                active: true,
                deletedAt: null,
                ...(trainingCourseIds?.length && {
                    trainingCourseId: {
                        in: trainingCourseIds,
                    },
                }),
            },
        },
        {
            enabled: trainingCourseIds?.length > 0,
        }
    )

    const { data: thesisSessionData = [] } = useFindManyThesisSession(
        {
            where: {
                active: true,
                trainingObjectTypeId,
                ...(trainingCourseIds?.length && {
                    trainingCourseId: {
                        in: trainingCourseIds,
                    },
                }),
            },
        },
        {
            enabled: !!trainingObjectTypeId || trainingCourseData?.length > 0,
        }
    )

    const { data: dm_DonVi = [] } = useFindManyDM_DonVi({
        where: {
            ...whereOrganization,
            ...(fixedClassIds?.length && {
                fixedClass: {
                    some: {
                        id: {
                            in: fixedClassIds,
                        },
                    },
                },
            }),
        },
    })

    const treeData = buildOrgTree(dm_DonVi)

    const where = {
        active: true,
        fixedClass: {
            ...(fixedClassIds?.length > 0 && {
                id: {
                    in: fixedClassIds,
                },
            }),
            ...(trainingCourseIds?.length > 0 && {
                trainingCourseId: {
                    in: trainingCourseIds,
                },
            }),
            ...(managementOrganizationIds?.length > 0 && {
                managementOrganizationId: {
                    in: managementOrganizationIds,
                },
            }),
        },
    }

    const { data: count } = useCountStudent(
        {
            where: { ...where },
        },
        {
            enabled: viewResult,
        }
    )

    const {
        data: students,
        isLoading: isLoadingStudents,
        isFetching: isFetchingStudents,
    } = useFindManyStudent(
        {
            where: { ...where },
            take: pageSize,
            skip: (page - 1) * pageSize,
            include: {
                userProfile: true,
                fixedClass: {
                    include: {
                        trainingCourse: {
                            include: {
                                scoreConverts: true,
                            },
                        },
                    },
                },
                subjectClassStudent: {
                    include: {
                        subjectVersion: true,
                        subjectClass: {
                            include: {
                                semester: true,
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: viewResult,
        }
    )

    const { convertScore } = useScoreConverter(
        students?.[0]?.fixedClass?.trainingCourse?.scoreConverts
    )

    const studentsWithSemesters = useMemo(() => {
        return (students || []).map((student) => {
            const { scoreConverts } = student?.fixedClass?.trainingCourse || {}
            const semesterMap = new Map()

            student.subjectClassStudent?.forEach((item) => {
                const semester = item.subjectClass?.semester
                if (!semester) return

                if (!semesterMap.has(semester.id)) {
                    semesterMap.set(semester.id, {
                        id: semester.id,
                        name: semester.name,
                        subjects: [],
                    })
                }
                const semesterGroup = semesterMap.get(semester.id)

                const scoreConvert = scoreConverts?.find(
                    (s) =>
                        s.base10Min <= Number(item.finalScore) &&
                        s.base10Max >= Number(item.finalScore)
                )

                semesterGroup.subjects.push({
                    id: item.id,
                    key: item.id,
                    stt: semesterGroup.subjects.length + 1,
                    tenHocPhan: item.subjectVersion?.name || '',
                    soTinChi: item.subjectVersion?.credit || '',
                    thangDiem10: item?.finalScore ? Number(item?.finalScore).toFixed(2) : '-',
                    thangDiem4: scoreConvert?.base4 || '',
                    thangDiemChu: scoreConvert?.letter,
                })
            })

            return {
                ...student,
                semesters: Array.from(semesterMap.values()),
            }
        }) as TStudentWithSemesters[]
    }, [students])

    const studentTableData = useMemo(() => {
        return (studentsWithSemesters || []).map((student, index) => ({
            key: student.id,
            stt: (page - 1) * pageSize + index + 1,
            maSinhVien: student.code,
            hoTen: student.userProfile?.fullname || '',
            lop: student.fixedClass?.name || '',
            khoa: student.fixedClass?.trainingCourse?.name || '',
            semesters: student.semesters,
        }))
    }, [studentsWithSemesters, page, pageSize])

    const selectedStudentGradeData = useMemo(() => {
        if (!selectedStudent) return []

        return (selectedStudent.semesters || []).map((semester) => ({
            id: semester.id,
            key: semester.id,
            tenHocPhan: semester.name,
            $type: 'parent' as const,
            subjects: semester.subjects.map((subject, index) => ({
                ...subject,
                stt: index + 1,
                $type: 'child' as const,
            })),
        }))
    }, [selectedStudent])

    const handleExportPLVB1 = () => {
        if (!students?.length) {
            notification.info({ message: 'Không có dữ liệu để xuất!' })
            return
        }
        const TOTAL_COLUMNS = 11
        const SIGN_COL = 4
        const MAX_ROWS = 50

        const allSheetOptions = studentsWithSemesters.map((student) => {
            let stt = 0
            const tableRows = student.semesters
                .flatMap((semester) => {
                    const subjectRows: TableRow[] = []

                    const subjects = semester?.subjects ?? []
                    for (let i = 0; i < subjects.length; i += 2) {
                        const s1 = subjects[i]
                        const s2 = subjects[i + 1]
                        stt += 2

                        subjectRows.push({
                            cells: [
                                { value: stt - 1, align: 'center' },

                                { value: s1?.tenHocPhan ?? '', colSpan: 1, border: true },
                                { value: s1?.soTinChi ?? 0, align: 'center' },
                                { value: Number(s1?.thangDiem10 ?? 0), align: 'right' },
                                { value: Number(s1?.thangDiem4 ?? 0), align: 'right' },
                                { value: s1?.thangDiemChu ?? '', align: 'center' },

                                { value: stt, align: 'center' },
                                { value: s2?.tenHocPhan ?? '', colSpan: 1, border: true },
                                { value: s2?.soTinChi ?? 0, align: 'center' },
                                { value: Number(s2?.thangDiem10 ?? 0), align: 'right' },
                                { value: Number(s2?.thangDiem4 ?? 0), align: 'right' },
                                { value: s2?.thangDiemChu ?? '', align: 'center' },
                            ],
                        })
                    }

                    return subjectRows
                })
                .slice(0, MAX_ROWS)

            const tongTinChi = student.semesters.reduce(
                (acc, semester) =>
                    acc + (semester.subjects?.reduce((s, sub) => s + (sub.soTinChi ?? 0), 0) ?? 0),
                0
            )

            const tongDiemNhanTinChiHe10 = student.semesters.reduce(
                (acc, semester) =>
                    acc +
                    (semester.subjects?.reduce(
                        (s, sub) => s + (Number(sub?.thangDiem10) || 0) * (sub.soTinChi ?? 0),
                        0
                    ) ?? 0),
                0
            )

            const tongDiemNhanTinChiHe4 = student.semesters.reduce(
                (acc, semester) =>
                    acc +
                    (semester.subjects?.reduce(
                        (s, sub) => s + (Number(sub?.thangDiem4) || 0) * (sub.soTinChi ?? 0),
                        0
                    ) ?? 0),
                0
            )

            const diemTBHe10 =
                tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe10 / tongTinChi).toFixed(2))

            const diemTBHe4 =
                tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe4 / tongTinChi).toFixed(2))

            const xepLoai = convertScore(diemTBHe10)?.classification ?? ''

            const gapRow: TableRow = {
                cells: [{ value: null, colSpan: TOTAL_COLUMNS }],
            }

            const tongTinChiRow: TableRow = {
                cells: [
                    {
                        value: `Tổng tín chỉ: ${tongTinChi}`,
                        colSpan: TOTAL_COLUMNS,
                        bold: true,
                    },
                ],
            }

            const diemHe10Row: TableRow = {
                cells: [
                    {
                        value: `Điểm TB hệ 10: ${diemTBHe10}`,
                        colSpan: TOTAL_COLUMNS,
                    },
                ],
            }

            const diemHe4Row: TableRow = {
                cells: [
                    {
                        value: `Điểm TB hệ 4: ${diemTBHe4}`,
                        colSpan: TOTAL_COLUMNS,
                    },
                ],
            }

            const xepLoaiRow: TableRow = {
                cells: [
                    {
                        value: `Xếp loại: ${xepLoai}`,
                        colSpan: TOTAL_COLUMNS,
                        bold: true,
                    },
                ],
            }

            const today = new Date()

            const dateSignatureRow: TableRow = {
                cells: [
                    { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL }, // 7
                    {
                        value: `Hà Nội, ngày ${today.getDate()} tháng ${
                            today.getMonth() + 1
                        } năm ${today.getFullYear()}`,
                        colSpan: SIGN_COL,
                        align: 'center',
                    },
                ],
            }

            const titleSignatureRow: TableRow = {
                cells: [
                    { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL },
                    {
                        value: 'KT. TRƯỞNG PHÒNG\nPHÓ TRƯỞNG PHÒNG',
                        colSpan: SIGN_COL,
                        align: 'center',
                        bold: true,
                    },
                ],
            }

            const nameSignatureRow: TableRow = {
                cells: [
                    { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL },
                    {
                        value: 'Đại tá, TS Nguyễn Văn Bình',
                        colSpan: SIGN_COL,
                        align: 'center',
                        bold: true,
                    },
                ],
            }

            return {
                sheet: `${student.userProfile.code} - ${student.userProfile.fullname}`,
                data: {
                    ho_ten: student.userProfile.fullname,
                    ma_hoc_vien: student.userProfile.code,
                    ngay_sinh: formatDateVN(student.userProfile.dateOfBirth ?? ''),
                    ngay_nhap_hoc: formatDateVN(student.fixedClass.createdAt),
                    hinh_thuc_dao_tao: student.universityTrainingType || '',
                    ngon_ngu_dao_tao: '',
                    nganh_hoc: '',
                    chuyen_nganh: '',
                    thoi_gian_dao_tao: '',
                    trinh_do_dao_tao: '',
                    ngon_ngu: '',
                },
                tableStartCell: { row: 14, col: 1 },
                rows: [
                    ...tableRows,
                    tongTinChiRow,
                    diemHe10Row,
                    diemHe4Row,
                    xepLoaiRow,
                    gapRow,
                    dateSignatureRow,
                    titleSignatureRow,
                    { cells: [{ value: null, colSpan: TOTAL_COLUMNS }] },
                    nameSignatureRow,
                ],
            }
        })

        exportFromTemplate({
            templateUrl: getMinioUrl('/mta/template/phu-luc-van-ban-2-cot.xlsx'),
            sheets: allSheetOptions,
            fileName: 'PLVB1.xlsx',
            mergeSheetsToOne: true,
            sheetName: 'PLVB1',
        })
    }

    const handleExportPLVB1Col = () => {
        if (!students?.length) {
            notification.info({ message: 'Không có dữ liệu để xuất!' })
            return
        }
        const TOTAL_COLUMNS = 11
        const SIGN_COL = 4
        const MAX_ROWS = 50

        const allSheetOptions = studentsWithSemesters.map((student) => {
            let stt = 0
            const tableRows = student.semesters
                .flatMap((semester) => {
                    const subjectRows: TableRow[] = []

                    const subjects = semester?.subjects ?? []
                    for (let i = 0; i < subjects.length; i++) {
                        const s1 = subjects[i]
                        stt += 1

                        subjectRows.push({
                            cells: [
                                { value: stt - 1, align: 'center' },

                                { value: s1?.tenHocPhan ?? '', colSpan: 3, border: true },
                                { value: s1?.soTinChi ?? 0, colSpan: 2, align: 'center' },
                                { value: Number(s1?.thangDiem10 ?? 0), colSpan: 2, align: 'right' },
                                { value: Number(s1?.thangDiem4 ?? 0), colSpan: 2, align: 'right' },
                                { value: s1?.thangDiemChu ?? '', colSpan: 2, align: 'center' },
                            ],
                        })
                    }

                    return subjectRows
                })
                .slice(0, MAX_ROWS)

            const tongTinChi = student.semesters.reduce(
                (acc, semester) =>
                    acc + (semester.subjects?.reduce((s, sub) => s + (sub.soTinChi ?? 0), 0) ?? 0),
                0
            )

            const tongDiemNhanTinChiHe10 = student.semesters.reduce(
                (acc, semester) =>
                    acc +
                    (semester.subjects?.reduce(
                        (s, sub) => s + (Number(sub?.thangDiem10) || 0) * (sub.soTinChi ?? 0),
                        0
                    ) ?? 0),
                0
            )

            const tongDiemNhanTinChiHe4 = student.semesters.reduce(
                (acc, semester) =>
                    acc +
                    (semester.subjects?.reduce(
                        (s, sub) => s + (Number(sub?.thangDiem4) || 0) * (sub.soTinChi ?? 0),
                        0
                    ) ?? 0),
                0
            )

            const diemTBHe10 =
                tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe10 / tongTinChi).toFixed(2))

            const diemTBHe4 =
                tongTinChi === 0 ? 0 : Number((tongDiemNhanTinChiHe4 / tongTinChi).toFixed(2))

            const xepLoai = convertScore(diemTBHe10)?.classification ?? ''

            const gapRow: TableRow = {
                cells: [{ value: null, colSpan: TOTAL_COLUMNS }],
            }

            const tongTinChiRow: TableRow = {
                cells: [
                    {
                        value: `Tổng tín chỉ: ${tongTinChi}`,
                        colSpan: TOTAL_COLUMNS,
                        bold: true,
                    },
                ],
            }

            const diemHe10Row: TableRow = {
                cells: [
                    {
                        value: `Điểm TB hệ 10: ${diemTBHe10}`,
                        colSpan: TOTAL_COLUMNS,
                    },
                ],
            }

            const diemHe4Row: TableRow = {
                cells: [
                    {
                        value: `Điểm TB hệ 4: ${diemTBHe4}`,
                        colSpan: TOTAL_COLUMNS,
                    },
                ],
            }

            const xepLoaiRow: TableRow = {
                cells: [
                    {
                        value: `Xếp loại: ${xepLoai}`,
                        colSpan: TOTAL_COLUMNS,
                        bold: true,
                    },
                ],
            }

            const today = new Date()

            const dateSignatureRow: TableRow = {
                cells: [
                    { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL }, // 7
                    {
                        value: `Hà Nội, ngày ${today.getDate()} tháng ${
                            today.getMonth() + 1
                        } năm ${today.getFullYear()}`,
                        colSpan: SIGN_COL,
                        align: 'center',
                    },
                ],
            }

            const titleSignatureRow: TableRow = {
                cells: [
                    { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL },
                    {
                        value: 'KT. TRƯỞNG PHÒNG\nPHÓ TRƯỞNG PHÒNG',
                        colSpan: SIGN_COL,
                        align: 'center',
                        bold: true,
                    },
                ],
            }

            const nameSignatureRow: TableRow = {
                cells: [
                    { value: null, colSpan: TOTAL_COLUMNS - SIGN_COL },
                    {
                        value: 'Đại tá, TS Nguyễn Văn Bình',
                        colSpan: SIGN_COL,
                        align: 'center',
                        bold: true,
                    },
                ],
            }

            return {
                sheet: `${student.userProfile.code} - ${student.userProfile.fullname}`,
                data: {
                    ho_ten: student.userProfile.fullname,
                    ma_hoc_vien: student.userProfile.code,
                    ngay_sinh: formatDateVN(student.userProfile.dateOfBirth ?? ''),
                    ngay_nhap_hoc: formatDateVN(student.fixedClass.createdAt),
                    hinh_thuc_dao_tao: student.universityTrainingType || '',
                    ngon_ngu_dao_tao: '',
                    nganh_hoc: '',
                    chuyen_nganh: '',
                    thoi_gian_dao_tao: '',
                    trinh_do_dao_tao: '',
                    ngon_ngu: '',
                },
                tableStartCell: { row: 14, col: 1 },
                rows: [
                    ...tableRows,
                    tongTinChiRow,
                    diemHe10Row,
                    diemHe4Row,
                    xepLoaiRow,
                    gapRow,
                    dateSignatureRow,
                    titleSignatureRow,
                    { cells: [{ value: null, colSpan: TOTAL_COLUMNS }] },
                    nameSignatureRow,
                ],
            }
        })

        exportFromTemplate({
            templateUrl: getMinioUrl('/mta/template/phu-luc-van-ban-1-cot.xlsx'),
            sheets: allSheetOptions,
            fileName: 'PLVB1C.xlsx',
            mergeSheetsToOne: true,
            sheetName: 'PLVB',
        })
    }

    const subjects: {
        daiHoc: { id: number; name: string; onClick?: () => void }[]
        nganHan: { id: number; name: string }[]
        caoHoc: { id: number; name: string }[]
    } = {
        daiHoc: [
            { id: 1, name: 'Phụ lục VB (1 cột)', onClick: handleExportPLVB1Col },
            { id: 2, name: 'Phụ lục VB (2 cột)', onClick: handleExportPLVB1 },
            { id: 3, name: 'Phụ lục VB (2 cột - 1 trang)' },
            { id: 4, name: 'Bảng điểm Ngân hạn (P2)' },
        ],
        nganHan: [
            { id: 5, name: 'Bảng điểm ngắn hạn SDH' },
            { id: 6, name: 'In phôi bảng ngắn hạn SDH (Anh)' },
            { id: 7, name: 'In phôi bảng ngắn/DÀI hạn SDH (Mỹ)' },
            { id: 8, name: 'In quyết định tốt nghiệp ngắn hạn (ĐẠI HÀN) SDH' },
            { id: 9, name: 'Bảng điểm ĐẠI HÀN SDH (2 cột)' },
            { id: 10, name: 'Bảng điểm ĐẠI HÀN SDH (1 cột)' },
            { id: 12, name: 'Danh sách đề nghị TN - ĐẠI HÀN' },
        ],
        caoHoc: [
            { id: 14, name: 'PL Đề nghị công nhận tốt nghiệp' },
            { id: 15, name: 'Xác nhận thông tin HV làm văn bằng' },
            { id: 16, name: 'PL Quyết định tốt nghiệp CAO HỌC' },
            { id: 17, name: 'Quyết định công nhận tốt nghiệp' },
            { id: 18, name: 'In PL văn bằng CAO HỌC (2 cột)' },
            { id: 19, name: 'In PL văn bằng CAO HỌC (1 cột)' },
            { id: 20, name: 'In phôi bảng CAO HỌC' },
            { id: 21, name: 'Sổ gốc cấp phát văn bằng' },
            { id: 22, name: 'Thống kê KQ đào tạo' },
            { id: 23, name: 'Thống kê kết quả bảo vệ luận văn' },
            { id: 24, name: 'In Danh sách trình chiếu CAO HỌC' },
            { id: 25, name: 'Trình chiếu tốt nghiệp (WORD)' },
            { id: 26, name: 'Trình chiếu tốt nghiệp (PDF)' },
        ],
    }
    useEffect(() => {
        if (!form) return

        form.resetFields()
        form.setFieldValue('trainingObjectTypeId', trainingObjectTypeId)
    }, [form, trainingObjectTypeId])

    return (
        <div className="flex h-screen bg-gray-50">
            <div className="w-68 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-base font-bold color text-primary mb-4 p-2 rounded">
                        Bảng điểm học viên
                    </h2>

                    <Form
                        form={form}
                        onValuesChange={(changed) => {
                            if ('trainingCourseIds' in changed) {
                                form.setFieldsValue({
                                    fixedClassIds: [],
                                    managementOrganizationIds: [],
                                })
                            }

                            if ('fixedClassIds' in changed) {
                                form.setFieldValue('managementOrganizationIds', [])
                            }
                        }}
                        className="space-y-4"
                        initialValues={{ trainingObjectTypeId: trainingObjectTypeId }}
                    >
                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="trainingObjectTypeId"
                                labelAlign="left"
                                label="ĐTĐT"
                                {...formItemLayout}
                            >
                                <Select
                                    className="flex-1 w-64"
                                    placeholder="Chọn ĐTĐT"
                                    options={trainingObjectTypes?.map((e) => ({
                                        label: e.name,
                                        value: e.id,
                                    }))}
                                    disabled
                                />
                            </FormItem>
                        </div>
                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="trainingCourseIds"
                                labelAlign="left"
                                label="Khoá"
                                {...formItemLayout}
                            >
                                <Select
                                    mode="multiple"
                                    className="flex-1 w-64"
                                    placeholder="Chọn Khoá"
                                    maxTagCount={2}
                                    maxTagPlaceholder={(omittedValues) =>
                                        `+${omittedValues?.length}`
                                    }
                                    options={trainingCourseData?.map((e) => ({
                                        label: e.name,
                                        value: e.id,
                                    }))}
                                    disabled={!trainingObjectTypeId || !trainingObjectTypes.length}
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="fixedClassIds"
                                label="Lớp"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Select
                                    mode="multiple"
                                    className="flex-1 w-64"
                                    maxTagCount={2}
                                    maxTagPlaceholder={(omittedValues) =>
                                        `+${omittedValues?.length}`
                                    }
                                    placeholder="Chọn lớp quản lí"
                                    options={fixedClasses?.map((e) => ({
                                        label: e.name,
                                        value: e.id,
                                    }))}
                                    disabled={!trainingCourseIds?.length}
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="thesisSessionIds"
                                label="Đợt xét"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Select
                                    mode="multiple"
                                    className="flex-1 w-64"
                                    placeholder="Chọn Đợt xét"
                                    maxTagCount={2}
                                    maxTagPlaceholder={(omittedValues) =>
                                        `+${omittedValues.length}`
                                    }
                                    options={thesisSessionData?.map((e) => ({
                                        label: e.name,
                                        value: e.id,
                                    }))}
                                    disabled={!trainingCourseIds?.length || !trainingObjectTypeId}
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="managementOrganizationIds"
                                label="Khoa quản lý"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <TreeSelect
                                    multiple
                                    className="flex-1 w-64"
                                    maxTagCount={2}
                                    maxTagPlaceholder={(omittedValues) =>
                                        `+${omittedValues.length}`
                                    }
                                    treeData={treeData}
                                    placeholder="Chọn khoa quản lý"
                                    allowClear
                                    showSearch
                                    disabled={!fixedClassIds?.length}
                                    treeDefaultExpandAll
                                    filterTreeNode={(input, treeNode) =>
                                        fuzzyMatch(input, treeNode.label?.toString() || '')
                                    }
                                />
                            </FormItem>
                        </div>

                        <Button
                            type="primary"
                            onClick={() => {
                                setSelectedStudent(null)
                                setViewResult(true)
                                setPage(initialPagination.page)
                            }}
                            className="w-full h-8 text-xs text-white"
                        >
                            Xem kết quả
                        </Button>

                        <div className="flex items-center w-full">
                            <FormItem
                                form={form}
                                name="date"
                                label="Ngày in"
                                labelAlign="left"
                                className="w-full"
                                {...formItemLayout}
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    placeholder={`${dayjs().format('DD/MM/YYYY')}`}
                                    className="h-8 text-xs flex-1 w-full"
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center w-full gap-2">
                            <FormItem
                                form={form}
                                name="signer"
                                className="w-full"
                                label="Người ký"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Input
                                    type="text"
                                    className="h-8 text-xs flex-1 w-full"
                                    placeholder="Nhập người ký"
                                />
                            </FormItem>
                        </div>
                    </Form>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-sm font-bold color text-primary mb-3">I. Đại học</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {subjects.daiHoc.map((subject, index) => {
                            return (
                                <ExportDiplomaAppendix
                                    onClick={subject?.onClick}
                                    key={subject?.id}
                                    title={`${index + 1}. ${subject.name}`}
                                    type="primary"
                                    className="h-auto px-3 text-xs justify-start text-white"
                                />
                            )
                        })}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-bold color text-primary mb-3">
                        II. Ngắn hạn - Dài hạn sau đại học
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {subjects.nganHan.map((subject, index) => (
                            <Button
                                key={index}
                                type="primary"
                                className="h-auto py-2 px-3 text-xs justify-start text-white"
                            >
                                {index + 1}. {subject.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-bold color text-primary mb-3">III. Cao học</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {subjects.caoHoc.map((subject, index) => (
                            <Button
                                key={index}
                                type="primary"
                                className="h-auto py-2 px-3 text-xs justify-start text-white"
                            >
                                {index + 1}. {subject.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-md font-semibold mb-2">Danh sách sinh viên</h3>
                    <Table
                        loading={isLoadingStudents || isFetchingStudents}
                        columns={[
                            {
                                title: 'STT',
                                dataIndex: 'stt',
                                key: 'stt',
                                width: 60,
                            },
                            {
                                title: 'Mã sinh viên',
                                dataIndex: 'maSinhVien',
                                key: 'maSinhVien',
                                width: 60,
                            },
                            {
                                title: 'Họ tên',
                                dataIndex: 'hoTen',
                                key: 'hoTen',
                                width: 120,
                            },
                            {
                                title: 'Lớp',
                                dataIndex: 'lop',
                                key: 'lop',
                                width: 150,
                            },
                            {
                                title: 'Khóa',
                                dataIndex: 'khoa',
                                key: 'khoa',
                                width: 100,
                            },
                        ]}
                        data={studentTableData}
                        pagination={{
                            pageSize,
                            total: count,
                            onChange(newPage, newPageSize) {
                                if (newPageSize !== pageSize) {
                                    setPage(initialPagination.page)
                                    setPageSize(pageSize)
                                    return
                                }
                                setPage(newPage)
                                setPageSize(pageSize)
                            },
                        }}
                        onRow={(record) => ({
                            onClick: () => {
                                const student = studentsWithSemesters?.find(
                                    (s) => s.id === record.key
                                )
                                setSelectedStudent(student || null)
                            },
                            className:
                                selectedStudent?.id === record.key
                                    ? 'bg-blue-100 cursor-pointer'
                                    : 'cursor-pointer',
                        })}
                        bordered
                    />
                </div>

                {selectedStudent && (
                    <div>
                        <h3 className="text-md font-semibold mb-2">
                            Bảng điểm: {selectedStudent.userProfile?.fullname} -{' '}
                            {selectedStudent.code}
                        </h3>
                        <TableCollapse
                            data={selectedStudentGradeData}
                            columns={[
                                {
                                    title: 'Tên học phần',
                                    dataIndex: 'tenHocPhan',
                                    key: 'tenHocPhan',
                                },
                                {
                                    title: 'Số tín chỉ',
                                    dataIndex: 'soTinChi',
                                    key: 'soTinChi',
                                    width: 100,
                                },
                                {
                                    title: 'Thang điểm 10',
                                    dataIndex: 'thangDiem10',
                                    key: 'thangDiem10',
                                    width: 120,
                                    render: (value: string) => value || '-',
                                },
                                {
                                    title: 'Thang điểm 4',
                                    dataIndex: 'thangDiem4',
                                    key: 'thangDiem4',
                                    width: 120,
                                },
                                {
                                    title: 'Thang điểm chữ',
                                    dataIndex: 'thangDiemChu',
                                    key: 'thangDiemChu',
                                    width: 120,
                                },
                            ]}
                            headerTitleKey="tenHocPhan"
                            childrenFieldName="subjects"
                            bordered
                            pagination={{
                                pageSize: initialPagination.pageSize,
                            }}
                            rowKey="id"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

StudentGradeSystem.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
