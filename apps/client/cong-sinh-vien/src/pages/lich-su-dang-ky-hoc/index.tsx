import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useClassRegisterStatus } from "@hooks/classRegisterStatus"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { ClassRegisterStatus } from "@workspace/db/client"
import {
  useCountClassRegisterLogs,
  useFindManyClassRegisterLogs,
  useFindManyClassRegisterSession,
} from "@workspace/db/hooks"
import { Col, Divider, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { TriangleAlert } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"

export default function LichSuDangKyHocPage() {
  const { data: me } = useSession()
  const userProfileId = me?.sDM_NhanVienId || ""
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { classRegisterStatusOptions, getClassRegisterStatusColor, getClassRegisterStatusLabel } =
    useClassRegisterStatus()
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    classRegisterSessionId: undefined,
    classRegisterStatus: undefined,
  })

  const where = useMemo(
    () => ({
      deletedAt: null,
      student: { userProfileId },
      ...((filters.code || filters.name) && {
        subjectClass: {
          ...(filters.code
            ? { code: { contains: filters.code, mode: "insensitive" as const } }
            : {}),
          ...(filters.name
            ? { name: { contains: filters.name, mode: "insensitive" as const } }
            : {}),
        },
      }),
      ...(filters.classRegisterSessionId
        ? {
            classRegisterSessionId: {
              in: Array.isArray(filters.classRegisterSessionId)
                ? filters.classRegisterSessionId
                : [filters.classRegisterSessionId],
            },
          }
        : {}),
      ...(filters.classRegisterStatus
        ? {
            status: {
              in: Array.isArray(filters.classRegisterStatus)
                ? filters.classRegisterStatus
                : [filters.classRegisterStatus],
            },
          }
        : {}),
    }),
    [
      userProfileId,
      filters.code,
      filters.name,
      filters.classRegisterSessionId,
      filters.classRegisterStatus,
    ]
  )

  const { data = [], isLoading } = useFindManyClassRegisterLogs(
    {
      where,
      include: {
        subjectClass: {
          include: {
            subject: { select: { code: true, name: true, credit: true } },
            room: { select: { name: true } },
          },
        },
        classRegisterSession: {
          include: {
            semester: { include: { schoolYear: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    { enabled: !!userProfileId }
  )

  const { data: count = 0 } = useCountClassRegisterLogs({ where }, { enabled: !!userProfileId })

  const { data: sessions = [] } = useFindManyClassRegisterSession(
    {
      where: {
        deletedAt: null,
        classRegisterLogs: {
          some: {
            deletedAt: null,
            student: { userProfileId },
          },
        },
      },
      include: {
        semester: { include: { schoolYear: true } },
      },
      orderBy: { startDate: "desc" },
    },
    { enabled: !!userProfileId }
  )

  return (
    <div>
      <Divider
        orientation="center"
        className="uppercase !my-0 text-lg font-semibold [&::before]:border-gray-950 [&::after]:border-gray-950"
        orientationMargin={0}
      >
        Lịch sử đăng ký học
      </Divider>
      <Row gutter={[16, 16]} className="mt-4">
        <Col span={24}>
          <Table
            rowKey="id"
            loading={isLoading}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            scroll={{ x: 1200 }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên môn / lớp",
                dataIndex: "name",
                width: 260,
                type: "input",
                render: (_, record) => (
                  <div className="text-left">
                    <div className="font-medium">
                      {record.subjectClass?.subject?.name || record.subjectClass?.name || "-"}
                    </div>
                    {record.subjectClass?.name &&
                      record.subjectClass?.name !== record.subjectClass?.subject?.name && (
                        <div className="text-xs text-gray-500">{record.subjectClass.name}</div>
                      )}
                  </div>
                ),
              },
              {
                title: "Mã LMH",
                dataIndex: "code",
                width: 110,
                align: "center",
                type: "input",
                render: (_, record) => record.subjectClass?.code || "-",
              },
              {
                title: "Số TC",
                width: 70,
                align: "center",
                render: (_, record) => record.subjectClass?.subject?.credit ?? "-",
              },
              {
                title: "Đợt đăng ký",
                dataIndex: "classRegisterSessionId",
                width: 220,
                type: "select",
                options: sessions.map((s) => ({
                  value: s.id,
                  label: [s.name, s.semester?.name].filter(Boolean).join(" - "),
                })),
                render: (_, record) => record.classRegisterSession?.name || "-",
              },
              {
                title: "Học kỳ",
                width: 200,
                align: "center",
                render: (_, record) =>
                  [
                    record.classRegisterSession?.semester?.name,
                    record.classRegisterSession?.semester?.schoolYear?.name,
                  ]
                    .filter(Boolean)
                    .join(" - ") || "-",
              },
              {
                title: "Trạng thái",
                dataIndex: "classRegisterStatus",
                width: 150,
                align: "center",
                type: "select",
                options: classRegisterStatusOptions.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
                render: (_, record) => (
                  <Tag color={getClassRegisterStatusColor(record.status)}>
                    {getClassRegisterStatusLabel(record.status)}
                  </Tag>
                ),
              },
              {
                title: "Ghi chú",
                width: 80,
                align: "center",
                render: (_, record) =>
                  record.status === ClassRegisterStatus.FAILED && record.reason ? (
                    <Tooltip title={record.reason}>
                      <TriangleAlert
                        size={16}
                        strokeWidth={1.5}
                        className="text-red-600 cursor-pointer mx-auto"
                      />
                    </Tooltip>
                  ) : (
                    "-"
                  ),
              },
              {
                title: "Thời gian đăng ký",
                width: 160,
                align: "center",
                render: (_, record) =>
                  record.createdAt ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm") : "-",
              },
            ]}
            data={data}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

LichSuDangKyHocPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Lịch sử đăng ký học" }]}>{page}</DefaultLayout>
}
