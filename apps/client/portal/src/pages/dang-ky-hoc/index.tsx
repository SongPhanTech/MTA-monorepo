import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import DefaultLayout from '@layouts/default-layout'
import { $Enums } from '@workspace/db'
import {
    classRegister,
    useGetClassesInfo,
    useGetClassRegisterSession,
} from '@workspace/libs/api/portal'
import type { GetClassesInfo200ItemSubjectClassItemClassSchedulesItem } from '@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItemClassSchedulesItem'
import { Checkbox, Tabs } from 'antd'
import dayjs from 'dayjs'
import { CircleXIcon, LogOutIcon } from 'lucide-react'
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
                                        code: cv?.code ?? '',
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
    curriculumVersions: { id: string; name: string; code: string }[]
}) => {
    const [curriculumVersionId, setCurriculumVersionId] = useState(
        curriculumVersions.length > 0 ? curriculumVersions[0].id : ''
    )

    const [byCurriculum, setByCurriculum] = useState(1) // 1: theo chương trình đào tạo, 0: toàn khoá

    const { data: classesInfo, refetch: refetchClassesInfo } = useGetClassesInfo({
        sessionId,
        curriculumVersionId,
        byCurriculum: byCurriculum === 1 ? 'true' : 'false',
    })

    const { data: classesRegisteredInfo, refetch: refetchClassesRegisteredInfo } =
        useGetClassesInfo({
            sessionId,
            curriculumVersionId,
            byCurriculum: 'false',
            isRegistered: 'true',
        })

    return (
        <div>
            <div className="flex gap-2">
                <Select
                    options={curriculumVersions.map((cv) => ({
                        label: `${cv.code} - ${cv.name}`,
                        value: cv.id,
                    }))}
                    placeholder="Chọn chương trình đào tạo"
                    style={{ width: 300, marginBottom: 16 }}
                    value={curriculumVersionId}
                    allowClear={false}
                    onChange={setCurriculumVersionId}
                />
                <Select
                    options={[
                        {
                            label: 'Môn học trong chương trình đào tạo',
                            value: 1,
                        },
                        {
                            label: 'Môn học toàn khoá',
                            value: 0,
                        },
                    ]}
                    placeholder="Chọn loại môn học"
                    style={{ width: 300, marginBottom: 16 }}
                    value={byCurriculum}
                    allowClear={false}
                    onChange={setByCurriculum}
                />
            </div>
            <b className="text-lg">Danh sách môn học mở đăng ký</b>
            {classesInfo?.status === 200 && (
                <TableCollapse
                    defaultExpandAll
                    columns={[
                        {
                            title: 'Mã học phần',
                            dataIndex: 'code',
                            align: 'center',
                            width: 120,
                        },
                        {
                            title: 'Tên học phần',
                            dataIndex: 'name',
                        },
                        {
                            title: 'Số TC',
                            dataIndex: 'credit',
                            align: 'center',
                            width: 60,
                        },
                        {
                            title: 'Bắt buộc',
                            align: 'center',
                            width: 80,
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
                            width: 150,
                            render: (_, record) => record.room?.name,
                        },
                        {
                            title: 'Số lượng',
                            align: 'center',
                            width: 80,
                            render: (_, record) =>
                                `${record._count?.subjectClassStudent || 0}/${record.maxStudent}`,
                        },
                        {
                            title: 'Thời khoá biểu',
                            width: 300,
                            align: 'center',
                            render: (_, record) => {
                                return record.classSchedules?.map?.((tkb) => {
                                    return (
                                        <p>
                                            {dayjs(tkb.classDate).format('ddd')} - {tkb.startPeriod}{' '}
                                            - {tkb.endPeriod}
                                        </p>
                                    )
                                })
                            },
                        },
                        {
                            title: 'Thao tác',
                            align: 'center',
                            width: 120,
                            fixed: 'right',
                            render: (_, record) => (
                                <p
                                    onClick={async () => {
                                        try {
                                            await classRegister({
                                                sessionId,
                                                subjectClassIds: [record.id],
                                            })
                                        } catch (error) {}
                                        refetchClassesInfo()
                                        refetchClassesRegisteredInfo()
                                    }}
                                    className="text-primary flex justify-center items-center gap-2 cursor-pointer"
                                >
                                    <LogOutIcon />
                                    Đăng ký
                                </p>
                            ),
                        },
                    ]}
                    headerTitleKey={(record) =>
                        [record.code, record.name].filter(Boolean).join(' - ')
                    }
                    childrenFieldName={'subjectClass'}
                    data={classesInfo?.data}
                />
            )}

            <b className="text-lg">Danh sách môn học đã đăng ký</b>
            {classesRegisteredInfo?.status === 200 && (
                <Table
                    columns={[
                        {
                            title: 'STT',
                            width: 60,
                            fixed: 'left',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Mã học phần',
                            dataIndex: 'code',
                            align: 'center',
                            width: 120,
                        },
                        {
                            title: 'Tên học phần',
                            dataIndex: 'name',
                        },
                        {
                            title: 'Số TC',
                            dataIndex: 'credit',
                            align: 'center',
                            width: 60,
                        },
                        {
                            title: 'Bắt buộc',
                            align: 'center',
                            width: 80,
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
                            width: 150,
                            render: (_, record) => record.room?.name,
                        },
                        {
                            title: 'Số lượng',
                            align: 'center',
                            width: 80,
                            render: (_, record) =>
                                `${record._count?.subjectClassStudent || 0}/${record.maxStudent}`,
                        },
                        {
                            title: 'Thời khoá biểu',
                            width: 300,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => {
                                return record.classSchedules?.map?.(
                                    (
                                        tkb: GetClassesInfo200ItemSubjectClassItemClassSchedulesItem
                                    ) => {
                                        return (
                                            <p>
                                                {dayjs(tkb.classDate).format('ddd')} -{' '}
                                                {tkb.startPeriod} - {tkb.endPeriod}
                                            </p>
                                        )
                                    }
                                )
                            },
                        },
                        {
                            title: 'Thao tác',
                            align: 'center',
                            width: 120,
                            render: (_, record) => (
                                <p
                                    onClick={async () => {
                                        refetchClassesInfo()
                                        refetchClassesRegisteredInfo()
                                    }}
                                    className="text-red-500 flex justify-center items-center gap-2 cursor-pointer"
                                >
                                    <CircleXIcon />
                                    Huỷ
                                </p>
                            ),
                        },
                    ]}
                    scroll={{
                        x: 'max-content',
                    }}
                    data={classesRegisteredInfo.data.flatMap((e) => e.subjectClass)}
                />
            )}
        </div>
    )
}

DangKyHocPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout breadcrumbList={[{ title: 'Đăng ký học' }]}>{page}</DefaultLayout>
}
