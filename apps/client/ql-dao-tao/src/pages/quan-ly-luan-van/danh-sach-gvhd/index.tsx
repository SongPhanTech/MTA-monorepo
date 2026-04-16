import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import {
  useCountExpertProfile,
  useDeleteExpertProfile,
  useFindManyDM_DonVi,
  useFindManyExpertProfile,
} from "@workspace/db/hooks"
import { whereOrganization } from "@workspace/libs/constants"
import { Button, Col, Flex, Form, Input, message, Row, Space, Tag, Tooltip } from "antd"
import { useMemo, useState, type Key } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import TreeSelect from "@/components/commons/tree-select"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Search } from "lucide-react"

function getSupervisorName(record: any) {
  const profile = record?.lecturer?.userProfile
  const rank = profile?.academicRankType?.sMa || record?.academicRankType?.sMa || ""
  const degree = profile?.academicDegreeType?.sMa || record?.academicDegreeType?.sMa || ""
  const title = [rank, degree].filter(Boolean).join(".")
  const fullname = record?.name || profile?.fullname || ""

  return [title, fullname].filter(Boolean).join(" ").trim()
}

export default function DanhSachGiangVienHuongDan() {
  const [form] = Form.useForm()
  const { showSpinner, hideSpinner } = useSpinner()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [filters, setFilters] = useState<any>({
    searchText: "",
    organizationId: undefined,
    thesisTitle: "",
  })

  const { data: sDm_Donvi = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeOrgData = buildOrgTree(sDm_Donvi ?? [], "0")

  const where = useMemo(() => {
    return {
      thesisExpert: true,
      deletedAt: null,
      ...(filters.searchText && {
        OR: [
          { name: { contains: filters.searchText, mode: "insensitive" as const } },
          { code: { contains: filters.searchText, mode: "insensitive" as const } },
          {
            lecturer: {
              userProfile: {
                fullname: { contains: filters.searchText, mode: "insensitive" as const },
              },
            },
          },
          { lecturer: { code: { contains: filters.searchText, mode: "insensitive" as const } } },
        ],
      }),
      ...(filters.organizationId && {
        lecturer: { organizationId: filters.organizationId },
      }),
      ...(filters.thesisTitle && {
        OR: [
          {
            supervisedTheses: {
              some: {
                title: { contains: filters.thesisTitle, mode: "insensitive" as const },
                deletedAt: null,
              },
            },
          },
          {
            coSupervisedTheses: {
              some: {
                title: { contains: filters.thesisTitle, mode: "insensitive" as const },
                deletedAt: null,
              },
            },
          },
        ],
      }),
    }
  }, [filters])

  const {
    data: experts = [],
    refetch,
    isFetching,
  } = useFindManyExpertProfile({
    where,
    include: {
      lecturer: {
        include: {
          userProfile: {
            include: {
              academicRankType: true,
              academicDegreeType: true,
            },
          },
          organization: true,
        },
      },
      academicRankType: true,
      academicDegreeType: true,
      supervisedTheses: {
        where: { deletedAt: null },
        select: { title: true, id: true },
      },
      coSupervisedTheses: {
        where: { deletedAt: null },
        select: { title: true, id: true },
      },
    },
    orderBy: { name: "asc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count = 0 } = useCountExpertProfile({ where })

  const { onOpen: onOpenPutExpert } = useDisclosure<any>({
    tag: "PutExpertProfile",
  })

  const { mutateAsync: deleteExpert } = useDeleteExpertProfile()

  const handleDelete = async (id: string) => {
    try {
      showSpinner()
      await deleteExpert({ where: { id } })
      message.success("Xoá thành công")
      refetch()
    } catch (error) {
      message.error("Xoá thất bại")
    } finally {
      hideSpinner()
    }
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: Key[]) => {
      setSelectedRowKeys(keys)
    },
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm min-h-[calc(100vh-100px)]">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Table
            bordered
            loading={isFetching}
            data={experts}
            rowSelection={rowSelection}
            columns={[
              {
                title: "Mã CBHD",
                width: 150,
                align: "center",
                render: (_, record) => record.code || record.lecturer?.code || "-",
              },
              {
                title: "Họ và tên",
                align: "center",
                width: 220,
                render: (_, record) => getSupervisorName(record),
              },
              {
                title: "Đề tài hướng dẫn",
                dataIndex: "thesisTitle",
                width: 300,
                type: "input",
                render: (_, record) => {
                  const titles = [
                    ...(record.supervisedTheses?.map((p: any) => p.title) || []),
                    ...(record.coSupervisedTheses?.map((p: any) => p.title) || []),
                  ].filter(Boolean)
                  return titles.length > 0 ? (
                    <ul className="pl-4 m-0 list-disc text-xs text-gray-600">
                      {titles.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  ) : (
                    "-"
                  )
                },
              },
              {
                title: "SL luận văn/Đồ án hướng dẫn",
                width: 120,
                align: "center",
                render: (_, record) => {
                  const mainCount = record.supervisedTheses?.length || 0
                  const coCount = record.coSupervisedTheses?.length || 0
                  const total = mainCount + coCount
                  return (
                    <Tooltip title={`Hướng dẫn chính: ${mainCount}, Hướng dẫn phụ: ${coCount}`}>
                      <Tag color={total > 0 ? "blue" : "default"} className="cursor-help">
                        {total}
                      </Tag>
                    </Tooltip>
                  )
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, size) => {
                setCurrentPage(page)
                setNumberOfPages(size)
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

DanhSachGiangVienHuongDan.getLayout = (page: React.ReactElement) => (
  <DefaultLayout>{page}</DefaultLayout>
)
