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

export const StudentScholarship = z.object({
    id: z.string().describe('ID của sinh viên'),
    stt: z.number().describe('STT'),
    hoTen: z.string().describe('Họ tên sinh viên'),
    maSinhVien: z.string().describe('Mã sinh viên'),
    doiTuong: z.string().describe('Đối tượng'),
    khoa: z.string().describe('Khoa'),
    chuyenNganh: z.string().describe('Chuyên ngành'),
    kyDangHoc: z.number().describe('Kỳ đăng học'),
    kyCuoi: z.boolean().describe('Kỳ cuối'),
    ngaySinh: z.string().describe('Ngày sinh'),
    fullDiemD: z.boolean().describe('Tất cả trên điểm D'),
    fullDiemC: z.boolean().describe('Tất cả trên điểm C'),
    diemTrungBinh4: z.number().describe('Điểm trung bình hệ 4'),
    diemTrungBinh10: z.number().describe('Điểm trung bình hệ 10'),
    xepLoaiHocTap: z.string().describe('Xếp loại học tập'),
    soTinChiDangKy: z.number().describe('Số tín chỉ đăng ký trong học kỳ'),
    soTinChiTichLuy: z.number().describe('Số tín chỉ tích lũy'),
    soTinChiYeuCau: z.number().describe('Số tín chỉ yêu cầu theo CTDT'),
    trinhDoNgoaiNgu: z.boolean().describe('Đạt trình độ ngoại ngữ theo quy định'),
    trinhDoTinHoc: z.boolean().describe('Đạt trình độ tin học theo quy định'),
    diemRenLuyen: z.number().describe('Điểm rèn luyện'),
    xepLoaiRenLuyen: z.string().describe('Xếp loại rèn luyện'),
    biKyLuat: z.boolean().describe('Bị kỷ luật từ khiển trách trở lên'),
    chucVuHocVien: z.string().describe('Chức vụ học viên'),
    diemThuong: z.number().describe('Điểm thưởng chức vụ'),
    quocTich: z.string().describe('Quốc tịch'),
    duDieuKienHocBong: z.boolean().describe('Đủ điều kiện học bổng'),
    ghiChu: z.string().describe('Ghi chú'),

    userProfile: z.any().describe('Thông tin người dùng'),
})

export const StudentDiscipline = z.object({
    id: z.string().describe('ID của sinh viên'),
    stt: z.number().describe('STT'),
    hoTen: z.string().describe('Họ tên sinh viên'),
    maSinhVien: z.string().describe('Mã sinh viên'),
    doiTuong: z.string().describe('Đối tượng'),
    khoa: z.string().describe('Khoa'),
    chuyenNganh: z.string().describe('Chuyên ngành'),
    kyDangHoc: z.number().describe('Kỳ đăng học'),
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

export const StudentTemplateData = z.object({
    date: z.string().describe('Ngày'),
    month: z.string().describe('Tháng'),
    year: z.number().describe('Năm'),
    student: z.array(StudentScholarship).describe('Danh sách sinh viên'),
})
export type StudentInfo = z.infer<typeof StudentInfo>
export type StudentTemplateData = z.infer<typeof StudentTemplateData>
export type StudentScholarship = z.infer<typeof StudentScholarship>
export type StudentDiscipline = z.infer<typeof StudentDiscipline>
