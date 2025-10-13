import { z } from '@hono/zod-openapi'

export const StudentInfo = z
    .object({
        id: z.string().describe('id của HV/SV'),
        stt: z.number().describe('STT'),
        name: z.string().describe('Họ tên'),
        code: z.string().describe('Mã sinh viên'),
        birth: z.string().describe('Ngày sinh'),
        hometown: z.string().describe('Quê quán'),
    })
    .openapi('StudentInfo')

export const ListScholarship = z.object({
    id: z.string().describe('ID của tiêu chí học bổng'),
    name: z.string().describe('Tên tiêu chí học bổng'),
    order: z.number().describe('Thứ tự trong danh sách'),
})
export const ListAcademicAction = z.object({
    id: z.string().describe('ID của hành động'),
    name: z.string().describe('Tên tiêu chí học bổng'),
    actionType: z.string().describe('Loại hành động'),
})

export const StudentScholarship = z.object({
    id: z.string().describe('ID của sinh viên'),
    stt: z.number().describe('STT'),
    hoTen: z.string().describe('Họ tên sinh viên'),
    maSinhVien: z.string().describe('Mã sinh viên'),
    doiTuong: z.string().describe('Đối tượng'),
    khoa: z.string().describe('Khoá'),
    khoaId: z.string().describe('ID Khoá'),
    chuyenNganh: z.string().describe('Chuyên ngành'),
    chuyenNganhId: z.string().describe('ID Chuyên ngành'),
    nganh: z.string().describe('Ngành'),
    nganhId: z.string().describe('ID Ngành'),
    kyDangHoc: z.number().describe('Kỳ đăng học'),
    kyCuoi: z.boolean().describe('Kỳ cuối'),
    ngaySinh: z.string().describe('Ngày sinh'),
    fullDiemD: z.boolean().describe('Tất cả trên điểm D '),
    fullDiemC: z.boolean().describe('Tất cả trên điểm C'),
    diemMonThuongNhoNhat: z.number().describe('Điểm môn thưởng nhỏ nhất'),
    diemMonTotNghiepNhoNhat: z.number().describe('Điểm môn tốt nghiệp nhỏ nhất'),
    heSoDiem: z.number().describe('Loại hệ số điểm'),
    diemDauVao: z.number().describe('Điểm đầu vào'),
    diemTrungBinh4: z.number().describe('Điểm trung bình hệ 4'),
    diemTrungBinh10: z.number().describe('Điểm trung bình hệ 10'),
    xepLoaiHocTap: z.string().describe('Xếp loại học tập'),
    soTinChiDangKy: z.number().describe('Số tín chỉ đăng ký trong học kỳ'),
    soTinChiTichLuy: z.number().describe('Số tín chỉ tích lũy'),
    soTinChiYeuCau: z.number().describe('Số tín chỉ yêu cầu theo CTDT'),
    soTinChiMoTrongKy: z.number().describe('Số tín chỉ mở trong kỳ'),
    trinhDoNgoaiNgu: z.boolean().describe('Đạt trình độ ngoại ngữ theo quy định'),
    trinhDoTinHoc: z.boolean().describe('Đạt trình độ tin học theo quy định'),
    xepLoaiRenLuyen: z.string().describe('Xếp loại rèn luyện'),
    biKyLuat: z.boolean().describe('Bị kỷ luật từ khiển trách trở lên'),
    chucVuHocVien: z.string().describe('Chức vụ học viên'),
    diemThuong: z.number().describe('Điểm thưởng chức vụ'),
    quocTich: z.string().describe('Quốc tịch'),
    hocBong: z.array(z.any()).describe('Danh sách học bổng đạt được'),
    ghiChu: z.string().describe('Ghi chú'),

    userProfile: z.any().describe('Thông tin người dùng'),
})

export const StudentAcademicWarning = z.object({
    id: z.string().describe('ID của sinh viên'),
    stt: z.number().describe('STT'),
    hoTen: z.string().describe('Họ tên sinh viên'),
    maSinhVien: z.string().describe('Mã sinh viên'),
    doiTuong: z.string().describe('Đối tượng'),
    khoa: z.string().describe('Khoá'),
    khoaId: z.string().describe('ID Khoá'),
    chuyenNganh: z.string().describe('Chuyên ngành'),
    chuyenNganhId: z.string().describe('ID Chuyên ngành'),
    nganh: z.string().describe('Ngành'),
    nganhId: z.string().describe('ID Ngành'),
    kyDangHoc: z.number().describe('Kỳ đăng học'),
    namDangHoc: z.number().describe('Năm đang học'),
    heSoDiem: z.number().describe('Loại hệ số điểm'),
    kyCuoi: z.boolean().describe('Kỳ cuối'),
    ngaySinh: z.string().describe('Ngày sinh'),
    diemTrungBinh4: z.number().describe('Điểm trung bình hệ 4'),
    diemTrungBinh10: z.number().describe('Điểm trung bình hệ 10'),
    xepLoaiHocTap: z.string().describe('Xếp loại học tập'),
    soTinChiDangKy: z.number().describe('Số tín chỉ đăng ký trong học kỳ'),
    soTinChiTichLuy: z.number().describe('Số tín chỉ tích lũy'),
    diemHe10TichLuy: z.number().describe('Điểm hệ 10 tích lũy'),
    diemHe4TichLuy: z.number().describe('Điểm hệ 4 tích lũy'),
    noTinChiTrongKy: z.number().describe('Nợ tín chỉ trong kỳ (số môn thi trong kỳ không đạt)'),
    tongSoTinChiNo: z.number().describe('Số tín chỉ nợ'),

    userProfile: z.any().describe('Thông tin người dùng'),
})
export const StudentAcademicAction = z.object({
    id: z.string().describe('ID của sinh viên'),
    stt: z.number().describe('STT'),
    hoTen: z.string().describe('Họ tên sinh viên'),
    maSinhVien: z.string().describe('Mã sinh viên'),
    doiTuong: z.string().describe('Đối tượng'),
    khoa: z.string().describe('Khoá'),
    khoaId: z.string().describe('ID Khoá'),
    chuyenNganh: z.string().describe('Chuyên ngành'),
    chuyenNganhId: z.string().describe('ID Chuyên ngành'),
    nganh: z.string().describe('Ngành'),
    nganhId: z.string().describe('ID Ngành'),
    kyDangHoc: z.number().describe('Kỳ đăng học'),
    namDangHoc: z.number().describe('Năm đang học'),
    heSoDiem: z.number().describe('Loại hệ số điểm'),
    kyCuoi: z.boolean().describe('Kỳ cuối'),
    ngaySinh: z.string().describe('Ngày sinh'),
    diemTrungBinh4: z.number().describe('Điểm trung bình hệ 4'),
    diemTrungBinh10: z.number().describe('Điểm trung bình hệ 10'),
    xepLoaiHocTap: z.string().describe('Xếp loại học tập'),
    soTinChiDangKy: z.number().describe('Số tín chỉ đăng ký trong học kỳ'),
    soTinChiTichLuy: z.number().describe('Số tín chỉ tích lũy'),
    soTinChiYeuCau: z.number().describe('Số tín chỉ yêu cầu theo CTDT'),
    diemHe10TichLuy: z.number().describe('Điểm hệ 10 tích lũy'),
    diemHe4TichLuy: z.number().describe('Điểm hệ 4 tích lũy'),
    noTinChiTrongKy: z.number().describe('Nợ tín chỉ trong kỳ (số môn thi trong kỳ không đạt)'),
    tongSoTinChiNo: z.number().describe('Số tín chỉ nợ'),
    mucCanhCaoHocTap: z.number().describe('Mức cảnh cáo học tập'),
    mucCanhCaoHocDuong: z.number().describe('Mức cảnh cáo học đường'),
    xepLoaiRenLuyenKy: z.string().describe('Xếp loại rèn luyện'),

    userProfile: z.any().describe('Thông tin người dùng'),
})
export const StudentInfoCheck = z.object({
    id: z.string().describe('ID của sinh viên'),
    stt: z.number().describe('STT'),
    hoTen: z.string().describe('Họ tên sinh viên'),
    maSinhVien: z.string().describe('Mã sinh viên'),
    doiTuong: z.string().describe('Đối tượng'),
    khoa: z.string().describe('Khoá'),
    khoaId: z.string().describe('ID Khoá'),
    chuyenNganh: z.string().describe('Chuyên ngành'),
    chuyenNganhId: z.string().describe('ID Chuyên ngành'),
    nganh: z.string().describe('Ngành'),
    nganhId: z.string().describe('ID Ngành'),
    kyDangHoc: z.number().describe('Kỳ đăng học'),
    kyCuoi: z.boolean().describe('Kỳ cuối'),
    ngaySinh: z.string().describe('Ngày sinh'),
    fullDiemD: z.boolean().describe('Tất cả trên điểm D '),
    fullDiemC: z.boolean().describe('Tất cả trên điểm C'),
    diemMonThuongNhoNhat: z.number().describe('Điểm môn thưởng nhỏ nhất'),
    diemMonTotNghiepNhoNhat: z.number().describe('Điểm môn tốt nghiệp nhỏ nhất'),
    heSoDiem: z.number().describe('Loại hệ số điểm'),
    diemDauVao: z.number().describe('Điểm đầu vào'),
    diemTrungBinh4: z.number().describe('Điểm trung bình hệ 4'),
    diemTrungBinh10: z.number().describe('Điểm trung bình hệ 10'),
    xepLoaiHocTap: z.string().describe('Xếp loại học tập'),
    soTinChiDangKy: z.number().describe('Số tín chỉ đăng ký trong học kỳ'),
    soTinChiTichLuy: z.number().describe('Số tín chỉ tích lũy'),
    soTinChiYeuCau: z.number().describe('Số tín chỉ yêu cầu theo CTDT'),
    soTinChiMoTrongKy: z.number().describe('Số tín chỉ mở trong kỳ'),
    trinhDoNgoaiNgu: z.boolean().describe('Đạt trình độ ngoại ngữ theo quy định'),
    trinhDoTinHoc: z.boolean().describe('Đạt trình độ tin học theo quy định'),
    xepLoaiRenLuyen: z.string().describe('Xếp loại rèn luyện'),
    biKyLuat: z.boolean().describe('Bị kỷ luật từ khiển trách trở lên'),
    chucVuHocVien: z.string().describe('Chức vụ học viên'),
    diemThuong: z.number().describe('Điểm thưởng chức vụ'),
    quocTich: z.string().describe('Quốc tịch'),
    ghiChu: z.string().describe('Ghi chú'),
    noTinChiTrongKy: z.number().describe('Nợ tín chỉ trong kỳ (số môn thi trong kỳ không đạt)'),
    tongSoTinChiNo: z.number().describe('Số tín chỉ nợ'),
    diemHe10TichLuy: z.number().describe('Điểm hệ 10 tích lũy'),
    diemHe4TichLuy: z.number().describe('Điểm hệ 4 tích lũy'),
    namDangHoc: z.number().describe('Năm đang học'),
    mucCanhCaoHocTap: z.number().describe('Mức cảnh cáo học tập'),
    mucCanhCaoHocDuong: z.number().describe('Mức cảnh cáo học đường'),
    xepLoaiRenLuyenKy: z.string().describe('Xếp loại rèn luyện'),
    lyDoXepLoai: z.string().describe('Lý do xếp loại'),
    userProfile: z.any().describe('Thông tin người dùng'),
})
export const StudentResult = z.object({
    id: z.string().describe('ID của sinh viên'),
    studentSemesterResult: z.any().describe('Kết quả học tập của sinh viên trong học kỳ'),
    trainingMajor: z.string().describe('Chuyên ngành'),
    trainingMajorId: z.string().describe('ID Chuyên ngành'),
    trainingField: z.string().describe('Ngành'),
    trainingFieldId: z.string().describe('ID Ngành'),
    userProfile: z.any().describe('Thông tin người dùng'),
    hasScholarship: z.boolean().describe('Có học bổng hay không'),
    scholarship: z.array(z.any()).describe('Danh sách học bổng của sinh viên'),
    hasAcademicAction: z.boolean().describe('Có hành động học vụ hay không'),
    academicAction: z
        .array(ListAcademicAction)
        .describe('Danh sách hành động học vụ của sinh viên'),
    hasAcademicWarning: z.boolean().describe('Có cảnh cáo học tập'),
    academicWarningRule: z.array(z.any()).describe('Danh sách cảnh cáo học tập của sinh viên'),
    decreaseAcademicWarning: z.boolean().describe('Giảm cảnh cáo học tập'),
    highestScholarship: z.any().describe('Học bổng cao nhất của sinh viên'),
    scholarshipRecived: z.array(z.any()).describe('Thông tin học bổng đã nhận'),
    reason: z.string().describe('Lý do'),
})
export const CourseStudentResult = z.object({
    courseId: z.string().describe('ID khoá học'),
    courseName: z.string().describe('Tên khoá học'),
    students: z.array(StudentResult).describe('Danh sách sinh viên trong khoá học'),
})
export const StudentTemplateData = z.object({
    date: z.string().describe('Ngày'),
    month: z.string().describe('Tháng'),
    year: z.number().describe('Năm'),
    student: z.array(StudentScholarship).describe('Danh sách sinh viên'),
})

export const CourseStudentScholarship = z.object({
    courseId: z.string().describe('ID khoá học'),
    courseName: z.string().describe('Tên khoá học'),
    students: z
        .array(StudentScholarship)
        .describe('Danh sách sinh viên đạt học bổng trong khoá học'),
})
export const CourseStudentAcademicWarning = z.object({
    courseId: z.string().describe('ID khoá học'),
    courseName: z.string().describe('Tên khoá học'),
    students: z
        .array(StudentAcademicWarning)
        .describe('Danh sách sinh viên có cảnh báo học vụ trong khoá học'),
})
export const CourseStudentAcademicAction = z.object({
    courseId: z.string().describe('ID khoá học'),
    courseName: z.string().describe('Tên khoá học'),
    students: z
        .array(StudentAcademicAction)
        .describe('Danh sách sinh viên lưu ban, thôi học trong khoá học'),
})

export const StudentRepeatGrade = z.object({
    id: z.string().describe('ID của sinh viên'),
    studentName: z.string().describe('Họ tên sinh viên'),
    studentCode: z.string().describe('Mã sinh viên'),
    gpa_semester: z.number().describe('Điểm trung bình học kỳ'),
    gpa_academic: z.number().describe('Điểm trung bình tích lũy'),
    total_credit: z.number().describe('Tổng số tín chỉ đã học'),
    repeatGradeTimes: z.number().describe('Số lần lưu ban'),
    statusRepeatGrade: z.string().describe('Trạng thái lưu ban'),
})

export type StudentInfo = z.infer<typeof StudentInfo>
export type StudentTemplateData = z.infer<typeof StudentTemplateData>
export type StudentScholarship = z.infer<typeof StudentScholarship>
export type ListScholarship = z.infer<typeof ListScholarship>
export type StudentAcademicWarning = z.infer<typeof StudentAcademicWarning>
export type CourseStudentScholarship = z.infer<typeof CourseStudentScholarship>
export type CourseStudentAcademicWarning = z.infer<typeof CourseStudentAcademicWarning>
export type CourseStudentAcademicAction = z.infer<typeof CourseStudentAcademicAction>
export type StudentAcademicAction = z.infer<typeof StudentAcademicAction>
export type StudentInfoCheck = z.infer<typeof StudentInfoCheck>
export type StudentResult = z.infer<typeof StudentResult>
export type CourseStudentResult = z.infer<typeof CourseStudentResult>
export type ListAcademicAction = z.infer<typeof ListAcademicAction>
export type StudentRepeatGrade = z.infer<typeof StudentRepeatGrade>
