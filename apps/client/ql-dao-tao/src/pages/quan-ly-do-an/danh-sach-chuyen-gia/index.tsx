import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { PutExpertProfileProps } from "@components/modal/put-chuyen-gia"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { Prisma } from "@workspace/db/client"
import { useCountExpert, useFindManyExpert, useUpdateExpert } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import { BookPlus } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type ExpertRow = {
  id: string
  name?: string | null
  phone?: string | null
  email?: string | null
  bankAccountNumber?: string | null
  bankName?: string | null
  workplace?: string | null
  academicRankType?: { sMa?: string | null } | null
  academicDegreeType?: { sMa?: string | null } | null
  lecturer?: {
    organization?: { sMa?: string | null; sTen?: string | null } | null
    userProfile?: {
      bankAccountNumber?: string | null
      bankName?: string | null
      academicRankType?: { sMa?: string | null } | null
      academicDegreeType?: { sMa?: string | null } | null
    } | null
  } | null
}

export default function ExpertProfile() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
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
    const versionAnd: Prisma.ExpertProfileVersionWhereInput[] = [{ projectExpert: true }]

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
    orderBy: { currentVersion: { name: "asc" } },
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
        phone: e.currentVersion?.phone,
        email: e.currentVersion?.email,
        bankAccountNumber: e.currentVersion?.bankAccountNumber,
        bankName: e.currentVersion?.bankName,
        workplace: e.currentVersion?.workplace,
        academicRankType: e.currentVersion?.academicRankType,
        academicDegreeType: e.currentVersion?.academicDegreeType,
      })) as ExpertRow[],
    [expertData]
  )

  const { onOpen } = useDisclosure<PutExpertProfileProps>({ tag: "PutExpertProfile" })
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateExpert } = useUpdateExpert()

  const handleModal = () => onOpen({ thesisExpert: false })

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateExpert({
        where: { id },
        data: { deletedAt: new Date() },
      })
      message.success("Xóa thành công")
    } catch (error: any) {
      if (error?.code === "P2004") {
        message.success("Xóa thành công")
        return
      }
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
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
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
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_: unknown, __: unknown, index: number) =>
                  index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên chuyên gia",
                dataIndex: "name",
                width: 150,
                type: "input",
                align: "center",
              },
              {
                title: "Học hàm",
                dataIndex: "academicRank",
                width: 150,
                align: "center",
                type: "input",
                render: (_: unknown, record: ExpertRow) =>
                  record.lecturer?.userProfile?.academicRankType?.sMa ||
                  record.academicRankType?.sMa,
              },
              {
                title: "Hàm vị",
                dataIndex: "academicDegree",
                width: 150,
                align: "center",
                type: "input",
                render: (_: unknown, record: ExpertRow) =>
                  record.lecturer?.userProfile?.academicDegreeType?.sMa ||
                  record.academicDegreeType?.sMa,
              },
              {
                title: "Đơn vị công tác",
                dataIndex: "workplace",
                width: 150,
                align: "center",
                type: "input",
                render: (_: unknown, record: ExpertRow) =>
                  record.lecturer
                    ? `${record.lecturer?.organization?.sMa || ""}-${record.lecturer?.organization?.sTen || ""}`
                    : record.workplace || "",
              },
              {
                title: "Số điện thoại",
                dataIndex: "phone",
                width: 150,
                align: "center",
                type: "input",
              },
              {
                title: "Email",
                dataIndex: "email",
                width: 150,
                align: "center",
                type: "input",
              },
              {
                title: "Tên ngân hàng",
                dataIndex: "bankName",
                width: 100,
                align: "center",
                type: "input",
                render: (_: unknown, record: ExpertRow) =>
                  record.bankName || record.lecturer?.userProfile?.bankName || "",
              },
              {
                title: "STK",
                dataIndex: "bankAccountNumber",
                width: 100,
                align: "center",
                type: "input",
                render: (_: unknown, record: ExpertRow) =>
                  record.bankAccountNumber ||
                  record.lecturer?.userProfile?.bankAccountNumber ||
                  "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
                  "SUA",
                  "XOA"
                ),
                render: (_: unknown, { id }: ExpertRow) => {
                  if (!id) return ""
                  return (
                    <Row className="justify-center gap-2">
                      {can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
                        "SUA"
                      ) && (
                        <EditIcon
                          onClick={() => onOpen({ id, thesisExpert: false })}
                          className="text-sm text-blue-700 cursor-pointer"
                        />
                      )}
                      {can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
                        "XOA"
                      ) && (
                        <DeleteIcon
                          popConfirm={{
                            onConfirm: () => handleDelete(id),
                          }}
                        />
                      )}
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

ExpertProfile.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
