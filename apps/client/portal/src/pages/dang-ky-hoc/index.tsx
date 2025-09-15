import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import DefaultLayout from '@layouts/default-layout'
import { $Enums } from '@workspace/db'
import { useGetClassesInfo, useGetClassRegisterSession } from '@workspace/libs/api/portal'
import { Checkbox, Tabs } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState } from 'react'

dayjs.locale('vi')
export default function DangKyHocPage() {
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
                    type="card"
                    items={
                        classRegisterSession?.data?.map((session) => ({
                            label: session.name,
                            key: session.id,
                            children: (
                                <DanhSachMonDangKy
                                    sessionId={session.id}
                                    curriculumVersions={session.curriculumVersions.map((cv) => ({
                                        id: cv?.id ?? '',
                                        name: cv?.name ?? '',
                                    }))}
                                />
                            ),
                        })) || []
                    }
                />
            )}
        </div>
    )
}

const DanhSachMonDangKy = ({
    sessionId,
    curriculumVersions = [],
}: {
    sessionId: string
    curriculumVersions: { id: string; name: string }[]
}) => {
    const [curriculumVersionId, setCurriculumVersionId] = useState(
        curriculumVersions.length > 0 ? curriculumVersions[0].id : ''
    )
    const { data: classesInfo } = useGetClassesInfo({
        sessionId,
        curriculumVersionId,
    })

    return (
        <div>
            <div>
                <Select
                    options={curriculumVersions.map((cv) => ({ label: cv.name, value: cv.id }))}
                    placeholder="Chọn chương trình đào tạo"
                    style={{ width: 300, marginBottom: 16 }}
                    value={curriculumVersionId}
                    allowClear={false}
                    onChange={(value) => setCurriculumVersionId(value)}
                />
            </div>
            <b className="text-lg">Danh sách môn học mở đăng ký</b>
            {classesInfo?.status === 200 && (
                <TableCollapse
                    columns={[
                        {
                            title: 'Mã học phần',
                            dataIndex: 'code',
                            align: 'center',
                        },
                        {
                            title: 'Tên học phần',
                            dataIndex: 'name',
                        },
                        {
                            title: 'Số tín chỉ',
                            dataIndex: 'credit',
                            align: 'center',
                        },
                        {
                            title: 'Bắt buộc',
                            align: 'center',
                            render: (_, record) => (
                                <Checkbox
                                    checked={
                                        record.type === $Enums.SubjectRequirementType.Mandatory
                                    }
                                    disabled
                                />
                            ),
                        },
                        {
                            title: 'Giảng viên',
                            render: (_, record) =>
                                [
                                    record.mainLecturer?.userProfile.fullname,
                                    record.extraLecturer?.userProfile.fullname,
                                ]
                                    .filter(Boolean)
                                    .join(', '),
                        },
                        {
                            title: 'Phòng học',
                            align: 'center',
                            render: (_, record) => record.room?.name,
                        },
                        {
                            title: 'Số lượng',
                            align: 'center',
                            render: (_, record) =>
                                `${record._count?.classRegisterLogs || 0}/${record.maxStudent}`,
                        },
                        {
                            title: 'Còn lại',
                            align: 'center',
                            render: (_, record) =>
                                record.maxStudent - (record._count?.classRegisterLogs || 0),
                        },
                        {
                            title: 'Thời khoá biểu',
                            align: 'center',
                            render: (_, record) => {
                                const tkb = record.classSchedules?.pop?.()
                                return tkb
                                    ? `${dayjs(tkb.classDate).format('ddd')} - ${tkb.startPeriod} - ${tkb.endPeriod}`
                                    : ''
                            },
                        },
                        {
                            title: 'Thao tác',
                            align: 'center',
                        },
                    ]}
                    headerTitleKey={'name'}
                    childrenFieldName={'subjectClass'}
                    data={classesInfo?.data}
                />
            )}

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
                        align: 'center',
                    },
                ]}
            />
        </div>
    )
}

DangKyHocPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout breadcrumbList={[{ title: 'Đăng ký học' }]}>{page}</DefaultLayout>
}
