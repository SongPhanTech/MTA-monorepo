import { CardLopMonHoc } from '@components/commons/card-lop-mon-hoc'
import DefaultLayout from '@layouts/default-layout'
import { useSession } from '@workspace/auth/react'
import type { Prisma } from '@workspace/db'
import { useFindFirstLecturer } from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useRouter } from 'next/router'
import {
    DanhSachThongBao,
    LichCongTac,
    ThongKeDonVi,
    ThongKeTotNghiep,
    useSemesterStore,
    useTrainingObjectTypeStore,
} from '@workspace/ui'
import { Col, Empty, Row, Spin, Tabs, Typography } from 'antd'

const { Title } = Typography

type SubjectClassWithRelations = Prisma.SubjectClassGetPayload<{
    include: { subject: true; semester: true }
}>

function DanhSachLopTab({
    data,
    isLoading,
    onCardClick,
}: {
    data: SubjectClassWithRelations[]
    isLoading: boolean
    onCardClick?: () => void
}) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Spin />
            </div>
        )
    }

    if (!data || data.length === 0) {
        return <Empty description="Không có dữ liệu" />
    }

    return (
        <Row gutter={[16, 16]}>
            {data.map((item, index) => (
                <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={6}>
                    <CardLopMonHoc
                        index={index + 1}
                        subjectName={item.subject?.name}
                        subjectCode={item.subject?.code}
                        semesterName={item.semester?.name}
                        maxStudent={item.maxStudent}
                        startDate={item.startDate}
                        endDate={item.endDate}
                        status={item.status}
                        onClick={onCardClick}
                    />
                </Col>
            ))}
        </Row>
    )
}

function Page() {
    const { can } = useAbility()
    const { data: me } = useSession()
    const router = useRouter()

    const profileId = me?.sDM_NhanVienId || '891421ca-0b96-4f60-81e5-d9fc6e1c004d'
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectId } = useTrainingObjectTypeStore()

    const { data: lecturer, isLoading } = useFindFirstLecturer(
        {
            where: {
                userProfileId: profileId,
            },
            include: {
                mainSubjectClasses: {
                    where: {
                        semesterId,
                        trainingObjectTypeId: trainingObjectId,
                    },
                    include: {
                        subject: true,
                        semester: true,
                    },
                },
                extraSubjectClasses: {
                    where: {
                        semesterId,
                        trainingObjectTypeId: trainingObjectId,
                    },
                    include: {
                        subject: true,
                        semester: true,
                    },
                },
                enterGradeClasses: {
                    where: {
                        semesterId,
                        trainingObjectTypeId: trainingObjectId,
                    },
                    include: {
                        subject: true,
                        semester: true,
                    },
                },
            },
        },
        {
            enabled: !!profileId,
        }
    )

    const tabItems = [
        {
            key: 'lop-quan-ly',
            label: `Lớp quản lý (${lecturer?.mainSubjectClasses?.length || 0})`,
            children: (
                <DanhSachLopTab
                    data={lecturer?.mainSubjectClasses || []}
                    isLoading={isLoading}
                    onCardClick={() => router.push(ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE)}
                />
            ),
        },
        {
            key: 'lop-nhap-diem',
            label: `Lớp nhập điểm (${lecturer?.enterGradeClasses?.length || 0})`,
            children: (
                <DanhSachLopTab
                    data={lecturer?.enterGradeClasses || []}
                    isLoading={isLoading}
                    onCardClick={() =>
                        router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_CC_TX)
                    }
                />
            ),
        },
        {
            key: 'lop-tro-giang',
            label: `Lớp trợ giảng (${lecturer?.extraSubjectClasses?.length || 0})`,
            children: (
                <DanhSachLopTab data={lecturer?.extraSubjectClasses || []} isLoading={isLoading} />
            ),
        },
    ]

    return (
        <div>
            <Row gutter={[8, 8]}>
                {/* Tabs lớp giảng viên */}
                <Col span={24}>
                    <div className="bg-white rounded shadow p-4">
                        <Title level={4}>Danh sách lớp của giảng viên</Title>
                        <Tabs items={tabItems} />
                    </div>
                </Col>

                <Col span={18}>
                    <div className="bg-white rounded shadow h-full flex flex-col">
                        <div className="px-4">
                            <Title level={4}>Thời khoá biểu</Title>
                        </div>
                        <div className="flex-1 px-2">
                            <LichCongTac
                                onlyMySchedule={can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_TUAN_THANG,
                                    'XEM'
                                )}
                            />
                        </div>
                    </div>
                </Col>
                <Col span={6}>
                    <div className="bg-white rounded shadow h-full flex flex-col">
                        <div className="px-4">
                            <Title level={4}>Thông báo</Title>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-2 px-2">
                            <DanhSachThongBao />
                        </div>
                    </div>
                </Col>
                <Col span={24}>
                    <Title level={4}>Thống kê số lượng học viên tốt nghiệp</Title>
                    <ThongKeTotNghiep />
                </Col>
                <Col span={24}>
                    <Title level={4}>Thống kê cơ cấu tổ chức đào tạo</Title>
                    <ThongKeDonVi />
                </Col>
            </Row>
        </div>
    )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
