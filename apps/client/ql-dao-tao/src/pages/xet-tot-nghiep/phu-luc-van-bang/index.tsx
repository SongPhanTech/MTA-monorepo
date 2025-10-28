import Table from '@components/commons/table'
import DefaultLayout from '@layouts/default-layout'
import { Button, Input, Select, SelectProps } from 'antd'
import type React from 'react'
import { useState } from 'react'
export default function StudentGradeSystem() {
    const [date, setDate] = useState('27/10/2025')
    const [recordsPerPage, setRecordsPerPage] = useState('1500')
    const options: SelectProps['options'] = []
    const subjects: {
        daiHoc: { id: number; name: string }[]
        nganHan: { id: number; name: string }[]
        caoHoc: { id: number; name: string }[]
    } = {
        daiHoc: [
            { id: 1, name: 'Phụ lục VB (1 cột)' },
            { id: 2, name: 'Phụ lục VB (2 cột)' },
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

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Left Sidebar */}
            <div className="w-68 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-base font-bold color text-primary mb-4  p-2 rounded">
                        Bảng điểm học viên
                    </h2>

                    <div className="space-y-4">
                        {/* Hàng 1: ĐTĐT */}
                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">ĐTĐT:</label>
                            <Select
                                mode="multiple"
                                defaultValue="du-hoc-quan-su"
                                className="flex-1"
                            >
                                <option value="du-hoc-quan-su">Dự học quân sự</option>
                            </Select>
                        </div>

                        {/* Hàng 2: Khóa */}
                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">Khóa:</label>
                            <Select mode="multiple" defaultValue="khoa-52" className="flex-1">
                                <option value="khoa-52">Khóa 52</option>
                            </Select>
                        </div>

                        {/* Hàng 3: Lớp */}
                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">Lớp:</label>
                            <Select mode="multiple" defaultValue="an-ninh" className="flex-1">
                                <option value="an-ninh">An ninh hệ thống thông</option>
                            </Select>
                        </div>

                        {/* Hàng 4: Đợt xét */}
                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">Đợt xét:</label>
                            <Select
                                mode="multiple"
                                defaultValue="xet-tot-nghiep"
                                className="flex-1"
                            >
                                <option value="xet-tot-nghiep">Xét tốt nghiệp ĐHQS K5</option>
                            </Select>
                        </div>

                        {/* Hàng 5: Khoa quản lý */}
                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">Khoa quản lý:</label>
                            <Select mode="multiple" defaultValue="khoa-1" className="flex-1">
                                <option value="khoa-1">Khoa 1</option>
                            </Select>
                        </div>

                        {/* Hàng 6: Button (Không có label, không cần sửa) */}
                        <Button type="primary" className="w-full h-8 text-xs text-white">
                            Xem kết quả
                        </Button>

                        <div className="flex items-center gap-2">
                            <label className="text-xs whitespace-nowrap w-28 mr-2">
                                Số ký tự trang 1:
                            </label>
                            <Input
                                type="number"
                                value={recordsPerPage}
                                onChange={(e) => setRecordsPerPage(e.target.value)}
                                className="h-8 text-xs flex-1"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">Ngày in:</label>
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-8 text-xs pr-8 w-full"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">Người ký:</label>
                            <Input
                                type="text"
                                placeholder="Đại tá, PGS.TS Đặng Ngọc Thạch"
                                className="h-8 text-xs flex-1"
                            />
                        </div>

                        {/* Sửa lại khối dưới đây */}
                        <div className="flex items-center">
                            {/* 1. Thêm spacer rỗng giống hệt label trên */}
                            <div className="w-28 mr-2 shrink-0"> </div>

                            {/* 2. Bọc Input và Button vào một div chung */}
                            <div className="flex gap-2 flex-1">
                                <Input
                                    type="text"
                                    placeholder="Nhập MHCA"
                                    className="h-8 text-xs flex-1"
                                />
                                <Button className="h-8 text-xs px-2 bg-transparent">
                                    Đường dẫn...
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="text-xs font-semibold mr-2 w-28">Import ảnh:</label>
                            <Button className="h-8 text-xs bg-transparent flex-1">Tải lên</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {/* Section I: ĐẠI HỌC */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold color text-primary mb-3">I. Đại học</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {subjects.daiHoc.map((subject, index) => (
                            <Button
                                key={subject.id}
                                type="primary"
                                className="h-auto py-2 px-3 text-xs justify-start text-white"
                            >
                                {index + 1}. {subject.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Section II: NGÂN HẠN - ĐÀI HAN SAU ĐẠI HỌC */}
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

                {/* Section III: CAO HỌC */}
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

                <div className="overflow-hidden">
                    <Table
                        columns={[
                            {
                                title: 'TT',
                                dataIndex: 'tt',
                                key: 'tt',
                            },
                            {
                                title: 'Tên học phần',
                                dataIndex: 'tenHocPhan',
                                key: 'tenHocPhan',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'soTinChi',
                                key: 'soTinChi',
                            },
                            {
                                title: 'Thang điểm 10',
                                dataIndex: 'thangDiem10',
                                key: 'thangDiem10',
                            },
                            {
                                title: 'Thang điểm 4',
                                dataIndex: 'thangDiem4',
                                key: 'thangDiem4',
                            },
                            {
                                title: 'Thang điểm chữ',
                                dataIndex: 'thangDiemChu',
                                key: 'thangDiemChu',
                            },
                        ]}
                        data={[]}
                    />
                </div>
            </div>
        </div>
    )
}

StudentGradeSystem.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
