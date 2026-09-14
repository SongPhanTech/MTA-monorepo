import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { PutExpertProps } from "@components/modal/put-chuyen-gia"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { Prisma } from "@workspace/db/client"
import { useCountExpert, useFindManyExpert, useUpdateExpert } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { CheckCircleFilled } from "@ant-design/icons"
import { Button, Col, Flex, message, Row, Tooltip } from "antd"
import { BookPlus } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type SortOrder = "asc" | "desc"

type ExpertRow = {
  id: string
  name?: string | null
  position?: string | null
  phone?: string | null
  email?: string | null
  bankAccountNumber?: string | null
  bankName?: string | null
  workplace?: string | null
  inAcademy?: boolean | null
  academicRankType?: { sMa?: string | null } | null
  academicDegreeType?: { sMa?: string | null } | null
  lecturer?: {
    organization?: { sMa?: string | null; sTen?: string | null } | null
    userProfile?: {
      phoneNumber?: string | null
      phone?: string | null
      bankAccountNumber?: string | null
      bankName?: string | null
      academicRankType?: { sMa?: string | null } | null
      academicDegreeType?: { sMa?: string | null } | null
    } | null
  } | null
}

const DEFAULT_ORDER_BY = {
  currentVersion: { name: "asc" as const },
}

function compareAlphabet(a?: string | null, b?: string | null) {
  return (a || "").localeCompare(b || "", "vi", { numeric: true, sensitivity: "base" })
}

function getAcademicRank(record: ExpertRow) {
  return record.lecturer?.userProfile?.academicRankType?.sMa || record.academicRankType?.sMa || ""
}

function getAcademicDegree(record: ExpertRow) {
  return (
    record.lecturer?.userProfile?.academicDegreeType?.sMa || record.academicDegreeType?.sMa || ""
  )
}

function getWorkplace(record: ExpertRow) {
  return record.lecturer
    ? `${record.lecturer?.organization?.sMa || ""}-${record.lecturer?.organization?.sTen || ""}`
    : record.workplace || ""
}

function getPhone(record: ExpertRow) {
  return (
    record.phone ||
    record.lecturer?.userProfile?.phoneNumber ||
    record.lecturer?.userProfile?.phone ||
    ""
  )
}

function getBankAccountNumber(record: ExpertRow) {
  return record.bankAccountNumber || record.lecturer?.userProfile?.bankAccountNumber || ""
}

function getBankName(record: ExpertRow) {
  return record.bankName || record.lecturer?.userProfile?.bankName || ""
}

function getOrderBy(
  field: string | null,
  order: SortOrder | null
): Prisma.ExpertOrderByWithRelationInput | Prisma.ExpertOrderByWithRelationInput[] {
  if (!field || !order) return DEFAULT_ORDER_BY

  switch (field) {
    case "name":
      return { currentVersion: { name: order } }
    case "academicRank":
      return [
        { currentVersion: { academicRankType: { sMa: order } } },
        { lecturer: { userProfile: { academicRankType: { sMa: order } } } },
      ]
    case "academicDegree":
      return [
        { currentVersion: { academicDegreeType: { sMa: order } } },
        { lecturer: { userProfile: { academicDegreeType: { sMa: order } } } },
      ]
    case "position":
      return { currentVersion: { position: order } }
    case "workplace":
      return [
        { lecturer: { organization: { sMa: order } } },
        { currentVersion: { workplace: order } },
      ]
    case "phone":
    case "phoneRaw":
      return [
        { currentVersion: { phone: order } },
        { lecturer: { userProfile: { phoneNumber: order } } },
      ]
    case "bankAccountNumber":
      return [
        { currentVersion: { bankAccountNumber: order } },
        { lecturer: { userProfile: { bankAccountNumber: order } } },
      ]
    case "bankName":
      return [
        { currentVersion: { bankName: order } },
        { lecturer: { userProfile: { bankName: order } } },
      ]
    case "email":
      return { currentVersion: { email: order } }
    case "inAcademy":
      return { currentVersion: { inAcademy: order } }
    default:
      return DEFAULT_ORDER_BY
  }
}

export default function DanhSachChuyenGiaLuanVan() {
  const { can } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [sorter, setSorter] = useState<{ field: string | null; order: SortOrder | null }>({
    field: "name",
    order: "asc",
  })
  const [filters, setFilters] = useState<FilterProps>({
    code: undefined,
    name: undefined,
    academicRank: undefined,
    academicDegree: undefined,
    specialization: undefined,
    workplace: undefined,
    phone: undefined,
    email: undefined,
  })

  const where = useMemo((): Prisma.ExpertWhereInput => {
    const versionAnd: Prisma.ExpertProfileVersionWhereInput[] = [{ thesisExpert: true }]

    if (filters.name) {
      versionAnd.push({ name: { contains: filters.name, mode: "insensitive" } })
    }
    if (filters.specialization) {
      versionAnd.push({
        specialization: { contains: filters.specialization, mode: "insensitive" },
      })
    }
    if (filters.workplace) {
      versionAnd.push({ workplace: { contains: filters.workplace, mode: "insensitive" } })
    }
    if (filters.phone) {
      versionAnd.push({ phone: { contains: filters.phone, mode: "insensitive" } })
    }
    if (filters.email) {
      versionAnd.push({ email: { contains: filters.email, mode: "insensitive" } })
    }
    if (filters.academicRank) {
      versionAnd.push({
        OR: [
          { academicRankType: { sTen: { contains: filters.academicRank, mode: "insensitive" } } },
          { academicRankType: { sMa: { contains: filters.academicRank, mode: "insensitive" } } },
        ],
      })
    }
    if (filters.academicDegree) {
      versionAnd.push({
        OR: [
          {
            academicDegreeType: {
              sTen: { contains: filters.academicDegree, mode: "insensitive" },
            },
          },
          {
            academicDegreeType: {
              sMa: { contains: filters.academicDegree, mode: "insensitive" },
            },
          },
        ],
      })
    }

    return {
      deletedAt: null,
      active: true,
      AND: [
        { OR: [{ lecturerId: null }, { lecturer: { active: true } }] },
        { currentVersion: { is: { AND: versionAnd } } },
      ],
      ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" } } : {}),
    }
  }, [filters])

  const orderBy = useMemo(() => getOrderBy(sorter.field, sorter.order), [sorter])
  const sortOrderOf = (field: string) =>
    sorter.field === field
      ? sorter.order === "asc"
        ? ("ascend" as const)
        : sorter.order === "desc"
          ? ("descend" as const)
          : undefined
      : undefined

  const { data: expertData } = useFindManyExpert({
    where,
    include: {
      currentVersion: {
        include: {
          academicDegreeType: true,
          academicRankType: true,
        },
      },
      lecturer: {
        include: {
          organization: true,
          userProfile: {
            include: {
              rank: true,
              academicDegreeType: true,
              academicRankType: true,
            },
          },
        },
      },
    },
    orderBy,
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountExpert({ where })

  const rows = useMemo(
    () =>
      (expertData ?? []).map((e) => ({
        id: e.id,
        lecturer: e.lecturer,
        name: e.currentVersion?.name,
        position: e.currentVersion?.position,
        phone: e.currentVersion?.phone,
        email: e.currentVersion?.email,
        bankAccountNumber: e.currentVersion?.bankAccountNumber,
        bankName: e.currentVersion?.bankName,
        workplace: e.currentVersion?.workplace,
        inAcademy: e.currentVersion?.inAcademy,
        academicRankType: e.currentVersion?.academicRankType,
        academicDegreeType: e.currentVersion?.academicDegreeType,
      })) as ExpertRow[],
    [expertData]
  )

  const { onOpen } = useDisclosure<PutExpertProps>({ tag: "PutExpert" })
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateExpert } = useUpdateExpert()

  const handleModal = () => onOpen({ thesisExpert: true })

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateExpert({
        where: { id },
        data: { deletedAt: new Date() },
      })
      message.success("Xóa thành công")
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error.info.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={6}>
              <Flex justify="end">
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_CHUYEN_GIA,
                  "THEM"
                ) && (
                  <Button onClick={handleModal} type="primary">
                    <BookPlus />
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            id="expert-profile"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            onChange={(_, __, sorterInfo: any) => {
              const info = Array.isArray(sorterInfo) ? sorterInfo[0] : sorterInfo
              const field = String(info?.columnKey || info?.field || "")
              const order =
                info?.order === "ascend" ? "asc" : info?.order === "descend" ? "desc" : null

              if (field && order) {
                if (sorter.field !== field || sorter.order !== order) {
                  setSorter({ field, order })
                  setCurrentPage(1)
                }
                return
              }

              if (sorter.field || sorter.order) {
                setSorter({ field: null, order: null })
              }
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên chuyên gia",
                dataIndex: "name",
                width: 150,
                type: "input",
                align: "center",
                sorter: (a: ExpertRow, b: ExpertRow) => compareAlphabet(a.name, b.name),
                sortOrder: sortOrderOf("name"),
              },
              {
                title: "Học hàm",
                dataIndex: "academicRank",
                width: 100,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) =>
                  compareAlphabet(getAcademicRank(a), getAcademicRank(b)),
                sortOrder: sortOrderOf("academicRank"),
                render: (_: unknown, record: any) => getAcademicRank(record),
              },
              {
                title: "Hàm vị",
                dataIndex: "academicDegree",
                width: 100,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) =>
                  compareAlphabet(getAcademicDegree(a), getAcademicDegree(b)),
                sortOrder: sortOrderOf("academicDegree"),
                render: (_: unknown, record: any) => getAcademicDegree(record),
              },
              {
                title: "Chức vụ",
                dataIndex: "position",
                width: 100,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) => compareAlphabet(a.position, b.position),
                sortOrder: sortOrderOf("position"),
              },
              {
                title: "Đơn vị công tác",
                dataIndex: "workplace",
                width: 150,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) =>
                  compareAlphabet(getWorkplace(a), getWorkplace(b)),
                sortOrder: sortOrderOf("workplace"),
                render: (_: unknown, record: any) => getWorkplace(record),
              },
              {
                title: "SĐT",
                dataIndex: "phone",
                width: 100,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) => compareAlphabet(getPhone(a), getPhone(b)),
                sortOrder: sortOrderOf("phone"),
                render: (_: unknown, record: any) => getPhone(record),
              },
              {
                title: "STK",
                dataIndex: "bankAccountNumber",
                width: 100,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) =>
                  compareAlphabet(getBankAccountNumber(a), getBankAccountNumber(b)),
                sortOrder: sortOrderOf("bankAccountNumber"),
                render: (_: unknown, record: any) => getBankAccountNumber(record),
              },
              {
                title: "Tên ngân hàng",
                dataIndex: "bankName",
                width: 100,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) =>
                  compareAlphabet(getBankName(a), getBankName(b)),
                sortOrder: sortOrderOf("bankName"),
                render: (_: unknown, record: any) => getBankName(record),
              },
              {
                title: "Số điện thoại",
                key: "phoneRaw",
                dataIndex: "phone",
                width: 150,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) => compareAlphabet(a.phone, b.phone),
                sortOrder: sortOrderOf("phoneRaw"),
              },
              {
                title: "Email",
                dataIndex: "email",
                width: 150,
                align: "center",
                type: "input",
                sorter: (a: ExpertRow, b: ExpertRow) => compareAlphabet(a.email, b.email),
                sortOrder: sortOrderOf("email"),
              },
              {
                title: "Trong học viện",
                key: "inAcademy",
                dataIndex: "inAcademy",
                width: 120,
                align: "center",
                sorter: (a: ExpertRow, b: ExpertRow) =>
                  Number(Boolean(a.inAcademy)) - Number(Boolean(b.inAcademy)),
                sortOrder: sortOrderOf("inAcademy"),
                render: (_: unknown, record: ExpertRow) => {
                  if (record.inAcademy) {
                    return (
                      <Flex justify="center" align="center">
                        <Tooltip title="Trong học viện (theo hồ sơ đang áp dụng)">
                          <CheckCircleFilled style={{ color: "#16a34a", fontSize: 18 }} />
                        </Tooltip>
                      </Flex>
                    )
                  }
                  return (
                    <Flex justify="center" align="center">
                      <Tooltip title="Ngoài học viện (theo hồ sơ đang áp dụng)">
                        <span className="text-gray-400">—</span>
                      </Tooltip>
                    </Flex>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_: unknown, { id }: any) => {
                  if (!id) return ""
                  return (
                    <Row className="justify-center gap-2">
                      <EditIcon
                        onClick={() => onOpen({ id, thesisExpert: true })}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                    </Row>
                  )
                },
              },
            ]}
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
            data={rows}
          />
        </Col>
      </Row>
    </div>
  )
}

DanhSachChuyenGiaLuanVan.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
