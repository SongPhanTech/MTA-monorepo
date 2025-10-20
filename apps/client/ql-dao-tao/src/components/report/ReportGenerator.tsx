import React from 'react'
import { TemplateHandler } from 'easy-template-x'
import { saveAs } from 'file-saver'

export interface IMonHoc {
    TenMonhoc: string
    MaMH: string
    soTC: number
    diem01: number
    diem02: number
    diem07: number
    diemhe10: number
    diemhe4: number
    diemchu: string
    ghichu: string
}

export interface IBaoCaoData {
    fullname: string
    dateOfBirth: string
    maSV: string
    htdt: string
    nganh: string
    lop: string
    TenHocKi: string
    monHocs: IMonHoc[]
}
const ReportGenerator: React.FC = () => {
    const reportData: IBaoCaoData = {
        fullname: 'Nguyễn Văn An',
        dateOfBirth: '01/01/2004',
        maSV: '20221234',
        htdt: 'Chính quy',
        nganh: 'Kỹ thuật phần mềm',
        lop: 'KHMT-01',
        TenHocKi: 'Học kỳ 1 năm học 2024 - 2025',
        monHocs: [
            {
                TenMonhoc: 'Hình giải tích và Đại số tuyến tính',
                MaMH: 'TOAN101',
                soTC: 3,
                diem01: 8.0,
                diem02: 7.5,
                diem07: 8.5,
                diemhe10: 8.2,
                diemhe4: 3.5,
                diemchu: 'B+',
                ghichu: '',
            },
            {
                TenMonhoc: 'Hiểu biết về địch, công tác tham mưu và chiến thuật BB',
                MaMH: 'QS102',
                soTC: 3,
                diem01: 9.0,
                diem02: 9.0,
                diem07: 9.5,
                diemhe10: 9.2,
                diemhe4: 4.0,
                diemchu: 'A',
                ghichu: 'Xuất sắc',
            },
            {
                TenMonhoc: 'Nhập môn Lập trình',
                MaMH: 'IT101',
                soTC: 4,
                diem01: 7.0,
                diem02: 8.0,
                diem07: 7.5,
                diemhe10: 7.6,
                diemhe4: 3.0,
                diemchu: 'B',
                ghichu: '',
            },
        ],
    }

    const generateReport = async () => {
        try {
            // 1. Lấy file template từ thư mục public

            const response = await fetch('/lms/templates/chuong-trinh-dao-tao/Template.xlsx')
            const templateFile = await response.blob() // Lấy file dưới dạng Blob

            // 2. Khởi tạo handler
            const handler = new TemplateHandler()

            // 3. Render template với dữ liệu
            //    Hàm render trả về một Blob chứa file Excel đã được điền
            const doc = await handler.process(templateFile, reportData as any)

            // 4. Dùng file-saver để tải file xuống
            saveAs(doc, `BaoCao_${reportData.maSV}.xlsx`)
        } catch (error) {
            console.error('Lỗi khi tạo báo cáo:', error)
            alert('Đã xảy ra lỗi khi tạo file Excel.')
        }
    }

    return (
        <div>
            <button type="button" onClick={generateReport}>
                Tải xuống báo cáo
            </button>
        </div>
    )
}

export default ReportGenerator
