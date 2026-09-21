import { CardLopMonHoc } from "@components/commons/card-lop-mon-hoc"
import { Panel } from "@components/dashboard/tong-quan/shared"
import { diemLopMonHocStore } from "@pages/quan-ly-diem/ql-diem-lop-mon-hoc"
import { useSession } from "@workspace/auth/react"
import type { Prisma } from "@workspace/db"
import { useFindFirstLecturer } from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { useRouter } from "next/router"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Empty, Flex, Row, Spin, Tabs, type TabsProps, Typography } from "antd"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useAbility } from "@workspace/permissions/hooks"

const { Title } = Typography
const PAGE_SIZE = 8

/** Compact (dashboard): 1 hàng ngang cuộn, không phân trang */
const COMPACT_ROW_CLASS =
  "flex h-full items-stretch gap-2 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:thin] [scrollbar-color:#c4c4c4_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c4c4c4]"
const COMPACT_CARD_CLASS = "w-[240px] shrink-0"

type SubjectClassWithRelations = Prisma.LecturerGetPayload<{
  include: {
    enterGradeClasses: {
      include: {
        subject: true
        semester: true
        _count: { select: { subjectClassStudent: true } }
      }
    }
    manageFixedClass: {
      include: {
        subjectClasses: {
          include: {
            subject: true
            semester: true
          }
        }
      }
    }
    mainSubjectClasses: {
      include: {
        subject: true
        semester: true
        _count: { select: { subjectClassStudent: true } }
      }
    }
    extraSubjectClasses: {
      include: {
        subject: true
        semester: true
        _count: { select: { subjectClassStudent: true } }
      }
    }
  }
}>

type SubjectClassItem = NonNullable<SubjectClassWithRelations["mainSubjectClasses"]>[number]
type FixedClassItem = NonNullable<SubjectClassWithRelations["manageFixedClass"]>[number]

function DanhSachLopBienCheTab({
  data,
  isLoading,
  onCardClick,
  compact,
}: {
  data: FixedClassItem[]
  isLoading: boolean
  onCardClick?: (id: string) => void
  compact?: boolean
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const paged = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Empty
        description="Không có dữ liệu"
        image={compact ? Empty.PRESENTED_IMAGE_SIMPLE : undefined}
        className={compact ? "!my-2" : undefined}
      />
    )
  }

  if (compact) {
    return (
      <div className={COMPACT_ROW_CLASS}>
        {data.map((item, index) => (
          <div key={item.id} className={COMPACT_CARD_CLASS}>
            <CardLopMonHoc
              index={index + 1}
              subjectName={item.name}
              subjectCode={item.code ?? undefined}
              onClick={() => onCardClick?.(item.id)}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {paged.map((item, index) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={6}>
            <CardLopMonHoc
              index={page * PAGE_SIZE + index + 1}
              subjectName={item.name}
              subjectCode={item.code ?? undefined}
              onClick={() => onCardClick?.(item.id)}
            />
          </Col>
        ))}
      </Row>
      {totalPages > 1 && (
        <Flex justify="center" align="center" gap={8} className="mt-4">
          <Button
            icon={<ChevronLeft size={16} />}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          />
          <span>
            {page + 1} / {totalPages}
          </span>
          <Button
            icon={<ChevronRight size={16} />}
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          />
        </Flex>
      )}
    </div>
  )
}

function DanhSachLopTab({
  data,
  isLoading,
  onCardClick,
  compact,
}: {
  data: SubjectClassItem[]
  isLoading: boolean
  onCardClick?: (id: string) => void
  compact?: boolean
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const paged = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Empty
        description="Không có dữ liệu"
        image={compact ? Empty.PRESENTED_IMAGE_SIMPLE : undefined}
        className={compact ? "!my-2" : undefined}
      />
    )
  }

  if (compact) {
    return (
      <div className={COMPACT_ROW_CLASS}>
        {data.map((item, index) => (
          <div key={item.id} className={COMPACT_CARD_CLASS}>
            <CardLopMonHoc
              index={index + 1}
              subjectName={item.subject?.name}
              subjectCode={item.subject?.code}
              semesterName={item.semester?.name}
              maxStudent={item._count?.subjectClassStudent}
              startDate={item.startDate}
              endDate={item.endDate}
              status={item.status}
              onClick={() => onCardClick?.(item.id)}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {paged.map((item, index) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={6}>
            <CardLopMonHoc
              index={page * PAGE_SIZE + index + 1}
              subjectName={item.subject?.name}
              subjectCode={item.subject?.code}
              semesterName={item.semester?.name}
              maxStudent={item._count?.subjectClassStudent}
              startDate={item.startDate}
              endDate={item.endDate}
              status={item.status}
              onClick={() => onCardClick?.(item.id)}
            />
          </Col>
        ))}
      </Row>
      {totalPages > 1 && (
        <Flex justify="center" align="center" gap={8} className="mt-4">
          <Button
            icon={<ChevronLeft size={16} />}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          />
          <span>
            {page + 1} / {totalPages}
          </span>
          <Button
            icon={<ChevronRight size={16} />}
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          />
        </Flex>
      )}
    </div>
  )
}

export default function DanhSachLopGiangVien({ compact = false }: { compact?: boolean }) {
  const { data: me } = useSession()
  const router = useRouter()
  const { can } = useAbility()

  const profileId = me?.sDM_NhanVienId || "891421ca-0b96-4f60-81e5-d9fc6e1c004d"
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()

  const { data: lecturer, isLoading } = useFindFirstLecturer(
    {
      where: { userProfileId: profileId },
      include: {
        mainSubjectClasses: {
          where: { semesterId, trainingObjectTypeId: trainingObjectId, cancelled: false },
          include: {
            subject: true,
            semester: true,
            _count: { select: { subjectClassStudent: true } },
          },
        },
        extraSubjectClasses: {
          where: { semesterId, trainingObjectTypeId: trainingObjectId, cancelled: false },
          include: {
            subject: true,
            semester: true,
            _count: { select: { subjectClassStudent: true } },
          },
        },
        enterGradeClasses: {
          where: { semesterId, trainingObjectTypeId: trainingObjectId, cancelled: false },
          include: {
            subject: true,
            semester: true,
            _count: { select: { subjectClassStudent: true } },
          },
        },
        manageFixedClass: {
          where: {
            subjectClasses: {
              some: {
                semesterId,
                trainingObjectTypeId: trainingObjectId,
                cancelled: false,
              },
            },
          },
          include: {
            subjectClasses: {
              include: { subject: true, semester: true },
            },
          },
        },
      },
    },
    { enabled: !!profileId }
  )

  const tabItems: TabsProps["items"] = [
    {
      key: "lop-nhap-diem",
      label: `Lớp nhập điểm (${lecturer?.enterGradeClasses?.length || 0})`,
      children: (
        <DanhSachLopTab
          compact={compact}
          data={lecturer?.enterGradeClasses || []}
          isLoading={isLoading}
          onCardClick={() => router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_CC_TX)}
        />
      ),
    },
    {
      key: "lop-giang-day",
      label: `Lớp giảng dạy (${lecturer?.mainSubjectClasses?.length || 0})`,
      children: (
        <DanhSachLopTab
          compact={compact}
          data={lecturer?.mainSubjectClasses || []}
          isLoading={isLoading}
          onCardClick={(id) => {
            diemLopMonHocStore.setState({ selectedSubjectClassId: id })
            router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC)
          }}
        />
      ),
    },
    {
      key: "lop-tro-giang",
      label: `Lớp trợ giảng (${lecturer?.extraSubjectClasses?.length || 0})`,
      children: (
        <DanhSachLopTab
          compact={compact}
          data={lecturer?.extraSubjectClasses || []}
          isLoading={isLoading}
          onCardClick={(id) => {
            diemLopMonHocStore.setState({ selectedSubjectClassId: id })
            router.push(ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_LOP_MON_HOC)
          }}
        />
      ),
    },
    {
      key: "lop-quan-ly",
      label: `Lớp quản lý (${lecturer?.manageFixedClass?.length || 0})`,
      children: (
        <DanhSachLopBienCheTab
          compact={compact}
          data={lecturer?.manageFixedClass || []}
          isLoading={isLoading}
          onCardClick={(id) =>
            router.push(ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace("[id]", id))
          }
        />
      ),
    },
  ]

  if (compact) {
    return (
      <Panel
        title="Danh sách lớp của giảng viên"
        className="h-full"
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-1"
      >
        <Tabs
          size="small"
          items={tabItems}
          className="flex h-full min-h-0 flex-col [&_.ant-tabs-content]:h-full [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-nav]:!mb-1.5 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:text-[12px] [&_.ant-tabs-tabpane]:h-full"
        />
      </Panel>
    )
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <Title level={4}>Danh sách lớp của giảng viên</Title>
      <Tabs items={tabItems} />
    </div>
  )
}
