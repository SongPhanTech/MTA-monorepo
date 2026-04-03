import Select from "@components/commons/select"
import TableCollapse from "@components/commons/tableCollapse"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useSemesterTypeOptions } from "@hooks/semesterType"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { Prisma, SchoolYear } from "@workspace/db/client"
import {
  useCountSchoolYear,
  useFindManySchoolYear,
  useUpdateSchoolYear,
  useUpdateSemester,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, Form, message, Row, Tag } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import { BookPlus } from "lucide-react"
import { useRouter } from "next/router"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

function YearAndSemester() {
  const { can, canSome } = useAbility()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    schoolYearId: "",
    semesterType: undefined,
  })

  const { options: semesterOption, getSemesterTypeLabel } = useSemesterTypeOptions()
  const isFiltering = useMemo(() => {
    return Object.values(filters).some((value) => !!value)
  }, [filters])

  const where: Prisma.SchoolYearWhereInput = useMemo(() => {
    return {
      ...(filters.schoolYearId && filters.schoolYearId !== ""
        ? {
            id: filters.schoolYearId,
          }
        : {}),
      ...(isFiltering
        ? {
            semesters: {
              some: {
                ...(filters.code && filters.code !== ""
                  ? {
                      code: {
                        contains: filters.code,
                        mode: "insensitive",
                      },
                    }
                  : {}),
                ...(filters.name && filters.name !== ""
                  ? {
                      name: {
                        contains: filters.name,
                        mode: "insensitive",
                      },
                    }
                  : {}),
                ...(filters.semesterType
                  ? Array.isArray(filters.semesterType)
                    ? {
                        semesterType: {
                          in: filters.semesterType,
                        },
                      }
                    : {
                        semesterType: {
                          equals: filters.semesterType,
                        },
                      }
                  : {}),
              },
            },
          }
        : {}),
    }
  }, [filters, isFiltering])
  const { data = [], refetch } = useFindManySchoolYear({
    where,
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { startDate: "desc" },
        where: {
          ...(filters.code && filters.code !== ""
            ? {
                code: {
                  contains: filters.code,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.name && filters.name !== ""
            ? {
                name: {
                  contains: filters.name,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(filters.semesterType
            ? Array.isArray(filters.semesterType)
              ? {
                  semesterType: {
                    in: filters.semesterType,
                  },
                }
              : {
                  semesterType: {
                    equals: filters.semesterType,
                  },
                }
            : {}),
        },
      },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: dataFilterSchoolYear = [] } = useFindManySchoolYear({
    take: 1000,
    skip: 0,
    orderBy: { startDate: "desc" },
  })

  const { data: count } = useCountSchoolYear({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const { onOpen: onOpenSchoolYear, onClose: onCloseSchoolYear } = useDisclosure<string>({
    tag: "PutSchoolYearModal",
  })

  const { onOpen: onOpenSemester, onClose: onCloseSemester } = useDisclosure<{
    schoolYearId: string
    semesterId: string
  }>({
    tag: "PutSemesterModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpenSchoolYear()
  }

  const handleModalSemester = () => {
    onOpenSemester()
  }
  const { mutateAsync: updateSchoolYear } = useUpdateSchoolYear()
  async function handleDeleteSchoolYear(id: string) {
    try {
      showSpinner()
      await updateSchoolYear({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
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

  const { mutateAsync: updateSemester } = useUpdateSemester()
  async function handleDeleteSemester(id: string) {
    try {
      showSpinner()
      await updateSemester({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
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

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Row gutter={[16, 16]} align="top">
          {/* Tìm kiếm */}
          <Col span={12}>
            <Flex>
              <Col span={12}>
                <Form.Item name="schoolYearId">
                  <Select
                    placeholder="Chọn năm học"
                    options={dataFilterSchoolYear.map((i: SchoolYear) => {
                      return {
                        value: i.id,
                        label: i.name,
                      }
                    })}
                    onChange={(val) => handleFilterChange("schoolYearId", val)}
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Flex>
          </Col>

          <Col span={12}>
            <Flex justify="end" gap={10}>
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC, "THEM") && (
                <>
                  <Button onClick={handleModal} className="border-primary text-primary">
                    <BookPlus />
                    Thêm mới năm học
                  </Button>
                  <Button onClick={handleModalSemester} type="primary">
                    <BookPlus />
                    Thêm mới kỳ học
                  </Button>
                </>
              )}
            </Flex>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <TableCollapse
          rowKey={"key"}
          headerTitleKey={({ code, name, startDate, endDate }) => {
            const format = (date: Date) => dayjs(date).format("DD/MM/YYYY")
            const startDateStr = startDate ? format(startDate) : null
            const endDateStr = endDate ? format(endDate) : null

            const range = [startDateStr, endDateStr].filter(Boolean).join(" -> ")
            const title = [code, name].filter(Boolean).join(" | ")

            return (
              <span className="truncate inline-block align-middle">
                {title} {range ? `(${range})` : ""}
              </span>
            )
          }}
          childrenFieldName="semesters"
          currentPage={currentPage}
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          columns={[
            {
              title: "Mã kỳ",
              dataIndex: "code",
              align: "center",
              width: 140,
              fixed: "left",
              type: "input",
            },
            {
              title: "Tên học kỳ",
              dataIndex: "name",
              align: "center",
              width: 250,
              fixed: "left",
              type: "input",
            },
            {
              title: "Loại học kỳ",
              dataIndex: "semesterType",
              align: "center",
              width: 120,
              type: "select",
              options: semesterOption.filter((opt) => opt.value !== null),
              render: (value) => getSemesterTypeLabel(value),
            },
            {
              title: "Thời gian bắt đầu",
              align: "center",
              // dataIndex: 'startDate',
              width: 140,
              render: ({ startDate }) => dayjs(startDate).format("DD/MM/YYYY"),
            },
            {
              title: "Thời gian kết thúc",
              align: "center",
              // dataIndex: 'endDate',
              width: 140,
              render: ({ endDate }) => (endDate ? dayjs(endDate).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              align: "center",
              width: 300,
              render: (value) => <span className="line-clamp-1">{value}</span>,
            },
            {
              title: "Trạng thái",
              align: "center",
              width: 140,
              fixed: "right",
              render: (value, record) => {
                return !record?.active ? (
                  <Tag color="default">Ngừng đào tạo</Tag>
                ) : (
                  <Tag color="success">Đang đào tạo</Tag>
                )
              },
            },
            {
              title: "Thao tác",
              width: 100,
              align: "center",
              fixed: "right",
              hidden: !canSome(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC, "SUA", "XOA"),
              render: (_, { id, schoolYearId }) => (
                <Row className="justify-center gap-2">
                  {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC, "SUA") && (
                    <EditIcon
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenSemester({
                          schoolYearId: schoolYearId,
                          semesterId: id,
                        })
                      }}
                      className="text-sm text-blue-700 cursor-pointer"
                    />
                  )}
                  {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC, "XOA") && (
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: (e) => {
                          handleDeleteSemester(id)
                          e?.stopPropagation()
                        },
                        onCancel: (e) => {
                          e?.stopPropagation()
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    />
                  )}
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
          defaultExpandAll
          headerRight={({ id }) => (
            <div className="flex gap-2.5 w-[88px] items-center">
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC, "THEM") && (
                <CreateIcon
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenSemester({
                      schoolYearId: id,
                      semesterId: "",
                    })
                  }}
                  title="Thêm học kỳ"
                />
              )}
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC, "SUA") && (
                <EditIcon
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenSchoolYear(id)
                  }}
                  className="text-sm text-blue-700 cursor-pointer"
                />
              )}
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_NAM_HOC_KY_HOC, "XOA") && (
                <DeleteIcon
                  popConfirm={{
                    onConfirm: () => handleDeleteSchoolYear(id),
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          )}
        />
      </Col>
    </Row>
  )
}

export default YearAndSemester

YearAndSemester.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
