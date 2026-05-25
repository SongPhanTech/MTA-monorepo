import TableCollapse from "@components/commons/tableCollapse"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import {
  useCountTrainingBlockOnCurriculumVersion,
  useFindManyTrainingBlockOnCurriculumVersion,
} from "@workspace/db/hooks"
import { Drawer, Tabs, Tag, Tooltip } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { BookOpen, GraduationCap } from "lucide-react"
import {
  useCountTrainingBlockSubject,
  useFindManyTrainingBlockSubject,
} from "@workspace/db/hooks"
interface DrawerPayload {
  trainingBlockId: string
  trainingBlockName?: string
  defaultTab?: "curriculumVersions" | "subjects"
}
function CurriculumVersionTab({
  trainingBlockId,
  isOpen,
}: {
  trainingBlockId: string
  isOpen: boolean
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<Record<string, any>>({
    name: "",
    code: "",
  })

  const where = useMemo(
    () => ({
      trainingBlockId,
      curriculumVersion: { deletedAt: null },
      ...(filters.name
        ? { curriculumVersion: { name: { contains: filters.name, mode: "insensitive" as const } } }
        : {}),
    }),
    [trainingBlockId, filters]
  )

  const { data: count } = useCountTrainingBlockOnCurriculumVersion(
    { where },
    { enabled: !!trainingBlockId && isOpen }
  )

  const { data = [], isLoading, isFetching } = useFindManyTrainingBlockOnCurriculumVersion(
    {
      where,
      include: {
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: true,
                managementOrganization: true,
              },
            },
          },
        },
      },
      orderBy: { priority: "asc" },
      take: numberOfPages,
      skip: numberOfPages * (currentPage - 1),
    },
    { enabled: !!trainingBlockId && isOpen }
  )
  const groupedData = useMemo(() => {
    const map = new Map<string, any>()

    data.forEach((item) => {
      const cv = item.curriculumVersion as any
      if (!cv) return
      const curriculumId = cv.curriculum?.id ?? "unknown"

      if (!map.has(curriculumId)) {
        map.set(curriculumId, {
          id: curriculumId,
          name: cv.curriculum?.name ?? "—",
          trainingMajor: cv.curriculum?.trainingMajor,
          managementOrganization: cv.curriculum?.managementOrganization,
          curriculumVersions: [],
        })
      }
      map.get(curriculumId).curriculumVersions.push({
        ...cv,
        electiveCreditsRequired: item.electiveCreditsRequired,
      })
    })

    return Array.from(map.values())
  }, [data])

  return (
    <TableCollapse
      rowKey="id"
      loading={isLoading || isFetching}
      data={groupedData}
      childrenFieldName="curriculumVersions"
      headerTitleKey={({ name, managementOrganization }) => {
        const org = [managementOrganization?.sMa, managementOrganization?.sTen]
          .filter(Boolean)
          .join(" - ")
        return `Chương trình: ${[name, org].filter(Boolean).join(" | ")}`
      }}
      filters={filters}
      setFilters={(val) => {
        setFilters(val)
        setCurrentPage(1)
      }}
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
      columns={[
        {
          title: "Mã CTĐT",
          dataIndex: "code",
          width: 120,
          align: "center",
          type: "input",
        },
        {
          title: "Tên phiên bản CTĐT",
          dataIndex: "name",
          type: "input",
        },
        {
          title: "Chuyên ngành",
          align: "center",
          width: 180,
          render: (_: any, record: any) => record?.curriculum?.trainingMajor?.name || "—",
        }
       
      ]}
    />
  )
}
function SubjectTab({
  trainingBlockId,
  isOpen,
}: {
  trainingBlockId: string
  isOpen: boolean
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<Record<string, any>>({
    name: "",
    code: "",
    type: undefined,
  })

  const where = useMemo(
    () => ({
      trainingBlockId,
      deletedAt: null,
      curriculumVersion: { deletedAt: null },
    }),
    [trainingBlockId]
  )

  const subjectWhere = useMemo(
    () => ({
      ...(filters.name
        ? { subject: { name: { contains: filters.name, mode: "insensitive" as const } } }
        : {}),
      ...(filters.code
        ? { subject: { code: { contains: filters.code, mode: "insensitive" as const } } }
        : {}),
      ...(filters.type?.length === 1 ? { type: filters.type[0] } : {}),
      deletedAt: null,
    }),
    [filters]
  )

  const { data: count } = useCountTrainingBlockOnCurriculumVersion(
    { where },
    { enabled: !!trainingBlockId && isOpen }
  )

  const { data = [], isLoading, isFetching } = useFindManyTrainingBlockOnCurriculumVersion(
    {
      where,
      include: {
        curriculumVersion: true,
        subjects: {
          where: subjectWhere,
          include: { subject: true },
          orderBy: { semester: "asc" },
        },
      },
      orderBy: { priority: "asc" },
      take: numberOfPages,
      skip: numberOfPages * (currentPage - 1),
    },
    { enabled: !!trainingBlockId && isOpen }
  )

  return (
    <TableCollapse
      rowKey="id"
      loading={isLoading || isFetching}
      data={data}
      childrenFieldName="subjects"
      headerTitleKey={(record: any) => {
        const cv = record?.curriculumVersion
        return `CTĐT: ${cv?.name ?? "—"}`
      }}
      filters={filters}
      setFilters={(val) => {
        setFilters(val)
        setCurrentPage(1)
      }}
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
      columns={[
        {
          title: "Mã học phần",
          dataIndex: ["subject", "code"],
          width: 130,
          align: "center",
          type: "input",
        },
        {
          title: "Tên học phần",
          dataIndex: ["subject", "name"],
          type: "input",
        },
        {
          title: "Số tín chỉ",
          dataIndex: ["subject", "credit"],
          width: 100,
          align: "center",
        },
        {
          title: "Loại",
          dataIndex: "type",
          width: 120,
          align: "center",
          type: "select",
          options: [
            { label: "Bắt buộc", value: "Mandatory" },
            { label: "Tự chọn", value: "Elective" },
          ],
          render: (type: string) =>
            type === "Mandatory" ? (
              <Tag color="blue">Bắt buộc</Tag>
            ) : (
              <Tag color="orange">Tự chọn</Tag>
            ),
        }
      ]}
    />
  )
}

const ModalCurriculumVersionByTrainingBlock = () => {
  const { isOpen, onClose, input } = useDisclosure<DrawerPayload>({
    tag: "DrawerTrainingBlockDetail",
  })

  const { trainingBlockId = "", trainingBlockName, defaultTab } = input || {}

  const tabItems = [
    {
      key: "curriculumVersions",
      label: (
        <span className="flex items-center gap-1.5">
          <GraduationCap size={14} />
          Chương trình đào tạo
        </span>
      ),
      children: (
        <CurriculumVersionTab
          trainingBlockId={trainingBlockId}
          isOpen={isOpen}
        />
      ),
    },
    {
      key: "subjects",
      label: (
        <span className="flex items-center gap-1.5">
          <BookOpen size={14} />
          Học phần
        </span>
      ),
      children: (
        <SubjectTab
          trainingBlockId={trainingBlockId}
          isOpen={isOpen}
        />
      ),
    },
  ]

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="text-base font-semibold">Chi tiết khối kiến thức</div>
          {trainingBlockName && (
            <div className="text-sm text-gray-500 font-normal mt-0.5">
              {trainingBlockName}
            </div>
          )}
        </div>
      }
      width={1000}
      destroyOnClose
      footer={null}
    >
      <Tabs
        defaultActiveKey={defaultTab ?? "curriculumVersions"}
        items={tabItems}
      />
    </Drawer>
  )
}

export default ModalCurriculumVersionByTrainingBlock