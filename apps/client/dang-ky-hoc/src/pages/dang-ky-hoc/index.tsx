import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import DefaultLayout from '@layouts/default-layout'
import { cn } from '@lib/utils'
import { $Enums } from '@workspace/db'
import {
    classRegister,
    classUnregister,
    useGetClassesInfo,
    useGetClassRegisterSession,
} from '@workspace/libs/api/portal'
import type { GetClassesInfo200ItemSubjectClassItem } from '@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItem'
import type { GetClassesInfo200ItemSubjectClassItemClassSchedulesItem } from '@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItemClassSchedulesItem'
import { Button, Checkbox, message, Popconfirm, Tabs } from 'antd'
import dayjs from 'dayjs'
import { CircleXIcon, LogOutIcon } from 'lucide-react'
import { useState } from 'react'

dayjs.locale('vi')
export default function DangKyHocPage() {
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
                            label: [
                                session.name,
                                session.semester.name,
                                session.semester.schoolYear.name,
                            ].join(' - '),
                            key: session.id,
                            children: (
                                <DanhSachMonDangKy
                                    sessionId={session.id}
                                    curriculumVersions={session.curriculumVersions.map((cv) => ({
                                        id: cv?.id ?? '',
                                        name: cv?.name ?? '',
                                        code: cv?.code ?? '',
                                    }))}
                                    endDate={session.endDate}
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
    endDate,
}: {
    sessionId: string
    curriculumVersions: { id: string; name: string; code: string }[]
    endDate: string | null
}) => {
    const [curriculumVersionId, setCurriculumVersionId] = useState(
        curriculumVersions.length > 0 ? curriculumVersions[0].id : ''
    )

    const [byCurriculum, setByCurriculum] = useState(1) // 1: theo chương trình đào tạo, 0: toàn khoá

    const { data: classesInfo, refetch: refetchClassesInfo } = useGetClassesInfo({
        sessionId,
        curriculumVersionId,
        byCurriculum: byCurriculum === 1 ? 'true' : 'false',
        isRegistered: 'false',
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
            {endDate && (
                <p className="mb-2">
                    Hạn đăng ký học:{' '}
                    <b className="text-red-500">{dayjs(endDate).format('DD/MM/YYYY')}</b>, vui lòng
                    đăng ký trước thời gian này!
                </p>
            )}
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
                                return record.subjectClassTimes?.map?.((tkb) => {
                                    return (
                                        <p>
                                            {tkb.dayOfWeek === 8 ? 'CN' : `T${tkb.dayOfWeek}`} -{' '}
                                            {tkb.startPeriod} - {tkb.endPeriod}
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
                            render: (_, record) => {
                                const isMaxed =
                                    (record.maxStudent || 0) <=
                                    (record._count?.subjectClassStudent || 0)
                                const isRegisteredBool = record.subjectClassStudent?.length > 0
                                const isDisabled = isMaxed || isRegisteredBool
                                return (
                                    <Button
                                        disabled={isDisabled}
                                        type="text"
                                        onClick={async () => {
                                            try {
                                                const res = await classRegister({
                                                    sessionId,
                                                    subjectClassIds: [record.id],
                                                })
                                                if (res.status !== 200) {
                                                    throw new Error(res.data.message)
                                                }
                                            } catch (error) {
                                                message.error(
                                                    (error as any)?.message || 'Đăng ký thất bại'
                                                )
                                            }
                                            refetchClassesInfo()
                                            refetchClassesRegisteredInfo()
                                        }}
                                        className={cn(
                                            'text-primary flex justify-center items-center gap-2 cursor-pointer',
                                            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                        )}
                                    >
                                        <LogOutIcon />
                                        Đăng ký
                                    </Button>
                                )
                            },
                        },
                    ]}
                    onRow={(record) => {
                        const r = record as unknown as GetClassesInfo200ItemSubjectClassItem
                        return {
                            className:
                                r.subjectClassStudent?.map?.((e) => e.student.userProfileId)
                                    .length > 0
                                    ? 'bg-green-200'
                                    : '',
                        }
                    }}
                    headerTitleKey={(record) =>
                        [record.code, record.name].filter(Boolean).join(' - ')
                    }
                    childrenFieldName={'subjectClass'}
                    data={classesInfo?.data}
                />
            )}

            <div className="flex gap-2 items-center">
                <b className="text-lg">Danh sách môn học đã đăng ký</b>
                {classesRegisteredInfo?.status === 200 && (
                    <p>
                        Bạn đã đăng ký{' '}
                        <b>
                            {classesRegisteredInfo?.data?.flatMap?.((e) => e?.subjectClass)
                                ?.length || 0}
                        </b>{' '}
                        học phần,{' '}
                        <b>
                            {classesRegisteredInfo?.data
                                ?.flatMap?.((e) => e?.subjectClass)
                                .reduce((acc, curr) => acc + (curr.credit || 0), 0)}
                        </b>{' '}
                        tín chỉ
                    </p>
                )}
            </div>
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
                            fixed: 'right',
                            render: (_, record) => (
                                <Popconfirm
                                    title="Bạn có chắc chắn muốn huỷ đăng ký học phần này?"
                                    okText="Huỷ"
                                    cancelText="Đóng"
                                    onConfirm={async () => {
                                        try {
                                            await classUnregister({
                                                sessionId,
                                                subjectClassIds: [record.id],
                                            })
                                        } catch (error) {}
                                        refetchClassesInfo()
                                        refetchClassesRegisteredInfo()
                                    }}
                                    className="text-red-500 flex justify-center items-center gap-2 cursor-pointer"
                                >
                                    <CircleXIcon />
                                    Huỷ
                                </Popconfirm>
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
