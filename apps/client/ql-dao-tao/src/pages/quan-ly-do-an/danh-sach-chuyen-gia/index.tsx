import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import type { PutExpertProfileProps } from "@components/modal/put-chuyen-gia"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountExpertProfile,
  useFindManyExpertProfile,
  useUpdateExpertProfile,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import { BookPlus } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

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

  const where = useMemo(
    () => ({
      projectExpert: true,
      ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" as const } } : {}),
      ...(filters.name ? { name: { contains: filters.name, mode: "insensitive" as const } } : {}),
      ...(filters.academicRank
        ? {
            OR: [
              {
                academicRank: {
                  contains: filters.academicRank,
                  mode: "insensitive" as const,
                },
              },
              {
                lecturer: {
                  userProfile: {
                    academicRankType: {
                      sTen: {
                        contains: filters.academicRank,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(filters.academicDegree
        ? {
            OR: [
              {
                academicDegree: {
                  contains: filters.academicDegree,
                  mode: "insensitive" as const,
                },
              },
              {
                lecturer: {
                  userProfile: {
                    academicDegreeType: {
                      sTen: {
                        contains: filters.academicDegree,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(filters.specialization
        ? {
            specialization: {
              contains: filters.specialization,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.workplace
        ? { workplace: { contains: filters.workplace, mode: "insensitive" as const } }
        : {}),
      ...(filters.phone
        ? { phone: { contains: filters.phone, mode: "insensitive" as const } }
        : {}),
      ...(filters.email
        ? { email: { contains: filters.email, mode: "insensitive" as const } }
        : {}),
    }),
    [filters]
  )

  const { data: expertProfileData } = useFindManyExpertProfile({
    where,
    include: {
      academicDegreeType: true,
      academicRankType: true,
      lecturer: {
        include: {
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
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountExpertProfile({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { onOpen } = useDisclosure<PutExpertProfileProps>({
    tag: "PutExpertProfile",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    const input: PutExpertProfileProps = {
      thesisExpert: false,
    }
    onOpen(input)
  }
  const { mutateAsync: updateExpertProfile } = useUpdateExpertProfile()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateExpertProfile({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      message.success("Xóa thành công")
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
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
                render: (__, record) =>
                  record.lecturer?.userProfile?.academicRankType?.sMa ||
                  record?.academicRankType?.sMa,
              },
              {
                title: "Hàm vị",
                dataIndex: "academicDegree",
                width: 150,
                align: "center",
                type: "input",
                render: (__, record) =>
                  record.lecturer?.userProfile?.academicDegreeType?.sMa ||
                  record?.academicDegreeType?.sMa,
              },
              {
                title: "Chuyên ngành",
                dataIndex: "specialization",
                width: 150,
                align: "center",
                type: "input",
              },
              {
                title: "Đơn vị công tác",
                dataIndex: "workplace",
                width: 150,
                align: "center",
                type: "input",
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
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DO_AN_DANH_SACH_CHUYEN_GIA,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
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
                  }
                  return ""
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
            data={expertProfileData}
          />
        </Col>
      </Row>
    </div>
  )
}

ExpertProfile.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
