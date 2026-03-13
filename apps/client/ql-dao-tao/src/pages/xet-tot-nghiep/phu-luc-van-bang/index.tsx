import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import {
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyThesisSession,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { fuzzyMatch } from '@workspace/libs/utils'
import { useFindManyTrainingObjectTypePermission } from '@workspace/ui'
import { Button, DatePicker, Form, Input, TreeSelect, Upload } from 'antd'
import dayjs from 'dayjs'
import type React from 'react'
import { useState } from 'react'

export type StudentGradeSystemForm = {
    trainingObjectTypeId: string[]
    classId: string[]
    thesisSessionId: string[]
    trainingCourseId: string[]
    managementOrganizationId: string[]
    recordsPerPage: string
    date: string
    signer: string
    imageUrl: string
}
export default function StudentGradeSystem() {
    const [form] = Form.useForm<StudentGradeSystemForm>()
    const formItemLayout = {
        labelCol: { flex: '0 0 100px' },
        wrapperCol: { flex: '1' },
    }
    const [recordsPerPage, setRecordsPerPage] = useState('1500')
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

    const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectTypePermission()
    const { data: fixedClasses = [] } = useFindManyFixedClass()
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()
    const { data: thesisSessionData = [] } = useFindManyThesisSession()
    const { data: dm_DonVi = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })
    const treeData = buildOrgTree(dm_DonVi)
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Left Sidebar */}
            <div className="w-68 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-base font-bold color text-primary mb-4  p-2 rounded">
                        Bảng điểm học viên
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="trainingObjectTypeId"
                                labelAlign="left"
                                label="ĐTĐT"
                                {...formItemLayout}
                            >
                                <Select
                                    mode="multiple"
                                    className="flex-1 w-64"
                                    placeholder="Chọn ĐTĐT"
                                    maxTagCount={2}
                                    maxTagPlaceholder={(omittedValues) =>
                                        `+${omittedValues.length}`
                                    }
                                    options={trainingObjectTypes?.map((e) => ({
                                        label: e.name,
                                        value: e.id,
                                    }))}
                                />
                            </FormItem>
                        </div>
                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="trainingCourseId"
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
                                        `+${omittedValues.length}`
                                    }
                                    options={trainingCourseData?.map((e) => ({
                                        label: e.name,
                                        value: e.id,
                                    }))}
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="classId"
                                label="Lớp"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Select
                                    mode="multiple"
                                    className="flex-1 w-64"
                                    maxTagCount={2}
                                    maxTagPlaceholder={(omittedValues) =>
                                        `+${omittedValues.length}`
                                    }
                                    placeholder="Chọn lớp quản lí"
                                    options={fixedClasses?.map((e) => ({
                                        label: e.name,
                                        value: e.id,
                                    }))}
                                />
                            </FormItem>
                        </div>

                        {/* Hàng 4: Đợt xét */}
                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="thesisSessionId"
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
                                />
                            </FormItem>
                        </div>

                        {/* Hàng 5: Khoa quản lý */}
                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="managementOrganizationId"
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
                                    treeDefaultExpandAll
                                    filterTreeNode={(input, treeNode) =>
                                        fuzzyMatch(input, treeNode.label?.toString() || '')
                                    }
                                />
                            </FormItem>
                        </div>

                        <Button type="primary" className="w-full h-8 text-xs text-white">
                            Xem kết quả
                        </Button>

                        <div className="flex items-center gap-2">
                            <FormItem
                                form={form}
                                name="recordsPerPage"
                                label="Số ký tự trang "
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Input
                                    type="number"
                                    placeholder="Nhập số ký tự trang"
                                    className="h-8 text-xs flex-1"
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="date"
                                label="Ngày in"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    placeholder={`${dayjs().format('DD/MM/YYYY')}`}
                                    className="h-8 text-xs flex-1"
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center gap-2">
                            <FormItem
                                form={form}
                                name="signer"
                                label="Người ký"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Input
                                    type="text"
                                    className="h-8 text-xs flex-1"
                                    placeholder="Nhập người ký"
                                />
                                <div className="flex gap-2 flex-1 mt-2">
                                    <Input type="text" className="h-8 text-xs  " />
                                    <Button className="h-8 text-xs px-2 bg-transparent">
                                        Đường dẫn...
                                    </Button>
                                </div>
                            </FormItem>
                        </div>

                        <div className="flex items-center">
                            <FormItem
                                form={form}
                                name="imageUrl"
                                label="Import ảnh"
                                labelAlign="left"
                                {...formItemLayout}
                            >
                                <Button className="h-8 text-xs bg-transparent flex-1">
                                    Tải lên
                                </Button>
                                <Upload
                                    accept="image/*"
                                    onChange={(info) => {
                                        console.log(info)
                                    }}
                                />
                            </FormItem>
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
