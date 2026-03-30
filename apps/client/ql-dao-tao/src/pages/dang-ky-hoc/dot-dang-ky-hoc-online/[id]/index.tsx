import Table from "@components/commons/table"

import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useClassRegisterStatus } from "@hooks/classRegisterStatus"
import DefaultLayout from "@layouts/default-layout"
import { ClassRegisterStatus } from "@workspace/db"
import {
  useCountClassRegisterLogs,
  useFindManyClassRegisterLogs,
  useFindManySubjectClass,
  useFindUniqueClassRegisterSession,
} from "@workspace/db/hooks"
import { ROUTER_PATH } from "@workspace/router"
import { Col, Divider, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import { TriangleAlert } from "lucide-react"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"

export default function ClassRegisterLogs() {
  const router = useRouter()
  const id = router.query.id as string
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { classRegisterStatusOptions, getClassRegisterStatusColor, getClassRegisterStatusLabel } =
    useClassRegisterStatus()
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    code: "",
    subjectClassId: undefined,
    classRegisterStatus: undefined,
  })
  const { data: initialValue } = useFindUniqueClassRegisterSession(
    {
      where: { id },
      include: {
        semester: {
          include: {
            schoolYear: true,
          },
        },
      },
    },
    { enabled: !!id }
  )

  const where = useMemo(
    () => ({
      classRegisterSessionId: id,
      ...(filters.code
        ? {
            student: {
              code: {
                contains: filters.name,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.name
        ? {
            student: {
              userProfile: {
                fullname: {
                  contains: filters.name,
                  mode: "insensitive" as const,
                },
              },
            },
          }
        : {}),
      ...(filters.subjectClassId
        ? {
            subjectClassId: {
              in: Array.isArray(filters.subjectClassId)
                ? filters.subjectClassId
                : [filters.subjectClassId],
            },
          }
        : {}),
      ...(filters.classRegisterStatus
        ? {
            status: { in: filters.classRegisterStatus },
          }
        : {}),
    }),
    [id, filters.name, filters.code, filters.subjectClassId, filters.classRegisterStatus]
  )

  const { data } = useFindManyClassRegisterLogs(
    {
      where,

      include: {
        student: {
          include: {
            userProfile: true,
          },
        },
        subjectClass: true,
      },
      orderBy: [{ student: { userProfile: { firstName: "asc" } } }, { createdAt: "desc" }],
    },
    {
      enabled: !!id,
    }
  )

  const { data: count } = useCountClassRegisterLogs(
    {
      where: {
        ...where,
        deletedAt: null,
      },
    },
    {
      enabled: !!id,
    }
  )

  const { data: subjectClass } = useFindManySubjectClass(
    {
      where: {
        classRegisterLogs: {
          some: {
            classRegisterSessionId: id,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    },
    {
      enabled: !!id,
    }
  )

  return (
    <div>
      <Divider orientation="left" orientationMargin={0}>
        {[
          initialValue?.code,
          initialValue?.name,
          initialValue?.semester?.name,
          initialValue?.semester?.schoolYear?.name,
          dayjs(initialValue?.startDate).format("HH:mm DD/MM/YYYY"),
          dayjs(initialValue?.endDate).format("HH:mm DD/MM/YYYY"),
        ]
          .filter(Boolean)
          .join(" - ")}
      </Divider>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Table
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "code",
                width: 120,
                align: "center",
                type: "input",
                render: (_, record) => record?.student?.code || "",
              },
              {
                title: "Họ và tên",
                dataIndex: "name",
                width: 200,
                align: "center",
                type: "input",

                render: (_, record) =>
                  record?.student?.userProfile?.fullname ||
                  [record?.student?.userProfile?.lastName, record?.student?.userProfile?.firstName]
                    .filter(Boolean)
                    .join(" ") ||
                  "",
              },
              {
                title: "Lớp",
                dataIndex: "subjectClassId",
                width: 200,
                align: "center",
                type: "select",
                options: subjectClass?.map((i) => {
                  return {
                    label: i?.name,
                    value: i?.id,
                  }
                }),
                render: (_, record) => record?.subjectClass?.name || "",
              },
              {
                title: "Trạng thái",
                dataIndex: "classRegisterStatus",

                align: "center",
                width: 140,
                fixed: "right",
                type: "select",
                options: classRegisterStatusOptions.map((i) => ({
                  value: i.value,
                  label: i.label,
                })),
                render: (_, record) => {
                  const label = getClassRegisterStatusLabel(record.status)
                  const color = getClassRegisterStatusColor(record.status)
                  return <Tag color={color}>{label}</Tag>
                },
              },
              {
                title: "Ghi chú",
                dataIndex: "reason",
                align: "center",
                width: 100,
                fixed: "right",
                render: (_, record) =>
                  record?.status === ClassRegisterStatus.FAILED && (
                    <Row className="justify-center gap-2">
                      <Tooltip title={record?.reason}>
                        <TriangleAlert
                          size={16}
                          strokeWidth={1.5}
                          className="text-red-600 cursor-pointer"
                        />
                      </Tooltip>
                    </Row>
                  ),
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

ClassRegisterLogs.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Kế hoạch đào tạo" },
        {
          title: "Đợt đăng ký học",
          href: ROUTER_PATH.QL_DAO_TAO.DANG_KY_HOC_DOT_DANG_KY_HOC_ONLINE,
        },
        { title: "Các đơn đăng ký học" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
