import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import DefaultLayout from '@layouts/default-layout'
import { useGetClassRegisterSession } from '@workspace/libs/api/portal'
import { Tabs } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'

dayjs.locale('vi')
export default function StudentScoreClassPage() {
    const router = useRouter()
    const studentId = router.query.id as string
    const [_filters, _setFilters] = useState({
        searchText: '',
    })

    const { data: classRegisterSession } = useGetClassRegisterSession()
    return (
        <div>
            {classRegisterSession?.status !== 200 ? (
                <center>
                    <b className="text-lg">{'Tạm ngừng đăng ký học. Vui lòng quay lại sau!'}</b>
                </center>
            ) : (
                <Tabs
                    hideAdd
                    type="editable-card"
                    items={
                        classRegisterSession?.data?.map((session) => ({
                            label: session.name,
                            key: session.id,
                            children: (
                                <div>
                                    <b className="text-lg">Danh sách môn học mở đăng ký</b>
                                    <TableCollapse
                                        columns={[
                                            {
                                                title: 'Mã học phần',
                                                dataIndex: 'classCode',
                                                key: 'classCode',
                                            },
                                            {
                                                title: 'Tên học phần',
                                                dataIndex: 'name',
                                                key: 'name',
                                            },
                                            {
                                                title: 'Số tín chỉ',
                                            },
                                            {
                                                title: 'Bắt buộc',
                                            },
                                            {
                                                title: 'Giảng viên',
                                            },
                                            {
                                                title: 'Phòng học',
                                            },
                                            {
                                                title: 'Số lượng',
                                            },
                                            {
                                                title: 'Còn lại',
                                            },
                                            {
                                                title: 'Thời khoá biểu',
                                            },
                                            {
                                                title: 'Thao tác',
                                            },
                                        ]}
                                        headerTitleKey={'name'}
                                        childrenFieldName={'classes'}
                                        data={[]}
                                    />
                                    <b className="text-lg">Danh sách môn học đã đăng ký</b>
                                    <Table
                                        columns={[
                                            {
                                                title: 'STT',
                                                width: 60,
                                            },
                                            {
                                                title: 'Mã học phần',
                                            },
                                            {
                                                title: 'Tên học phần',
                                            },
                                            {
                                                title: 'Số tín chỉ',
                                            },
                                            {
                                                title: 'Bắt buộc',
                                            },
                                            {
                                                title: 'Giảng viên',
                                            },
                                            {
                                                title: 'Phòng học',
                                            },
                                            {
                                                title: 'Số lượng',
                                            },
                                            {
                                                title: 'Còn lại',
                                            },
                                            {
                                                title: 'Thời khoá biểu',
                                            },
                                            {
                                                title: 'Thao tác',
                                            },
                                        ]}
                                    />
                                </div>
                            ),
                        })) || []
                    }
                />
            )}
        </div>
    )
}

StudentScoreClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout breadcrumbList={[{ title: 'Đăng ký học' }]}>{page}</DefaultLayout>
}
