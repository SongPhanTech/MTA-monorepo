import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { emptyObjectIf } from "@workspace/constant"
import {
  useCountTrainingCourse,
  useFindManySchoolYear,
  useFindManyTrainingCourse,
  useFindUniqueTrainingCourse,
  useUpdateTrainingCourse,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { exportFromTemplate } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Dropdown, Flex, Menu, message, Row, Tag, Tooltip } from "antd"
import { FileDown } from "lucide-react"
import type React from "react"
import { useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TrainingCoursePage() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const idTrainingCourse = useRef<string>("")
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    admissionQuota: undefined,
    semesterStart: undefined,
  })

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: initialData } = useFindUniqueTrainingCourse(
    {
      where: { id: idTrainingCourse.current },
      include: {
        trainingObjectType: true,
        fixedClass: {
          include: {
            students: true,
          },
        },
      },
    },
    { enabled: !!idTrainingCourse.current }
  )

  console.log("filters.schoolYearId", filters.schoolYearId)

  const where = useMemo(
    () => ({
      ...(filters.code && filters.code !== ""
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.schoolYearIds?.length
        ? {
            semesterStart: {
              OR: filters?.schoolYearIds?.map((id) => ({ schoolYearId: id })),
            },
          }
        : {}),
      trainingObjectTypeId,
      deletedAt: null,
    }),
    [filters.code, filters.name, trainingObjectTypeId, filters.schoolYearIds]
  )

  const { data = [], refetch } = useFindManyTrainingCourse({
    where,
    include: {
      trainingObjectType: true,
      trainingLanguage: true,
      semesterStart: {
        include: {
          schoolYear: true,
        },
      },
    },
    orderBy: [
      ...emptyObjectIf(
        [
          {
            admissionQuota: filters.admissionQuota,
          },
        ],
        !!filters.admissionQuota
      ),
      {
        semesterStart: {
          startDate: "desc",
        },
      },
    ],

    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count, refetch: refetchCount } = useCountTrainingCourse({ where })

  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingCourseModal",
    onClose: () => {
      refetch()
      refetchCount()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const handleExport = async (e: any, id: string) => {
    idTrainingCourse.current = id
    const baseUrl = "/mta/template/"
    const url = getMinioUrl(baseUrl + (e === "P2" ? "si-so-p2.xlsx" : "si-so-p7.xlsx"))
    const tableStartCell = e === "P2" ? { row: 11, col: 1 } : { row: 8, col: 1 }
    const result = await sqlTransaction([
      {
        model: "TrainingCourse",
        operation: "findUnique",
        data: {
          where: { id: id },
          include: {
            trainingObjectType: true,
            fixedClass: {
              include: {
                students: true,
              },
            },
          },
        },
      },
    ])
    console.log("result", result)
    if (result.status !== 200) return
    const data: any = result.data[0]
    const rows =
      data?.fixedClass?.map((item: any, index: number) => {
        return {
          cells: [
            { value: index + 1, border: true },
            { value: item.code ?? "", border: true },
            { value: item.name ?? "", border: true },
            {
              value: item.students?.length ?? 0,
              border: true,
              align: "center",
              bold: true,
            },
            { value: item.description ?? "", border: true },
          ],
        }
      }) ?? []
    const totalRow = {
      cells: [
        { value: "TỔNG", border: true, colSpan: 3, align: "center" },
        {
          value:
            initialData?.fixedClass?.reduce((sum, item) => sum + (item.students?.length ?? 0), 0) ??
            0,
          border: true,
          bold: true,
          align: "center",
        },
        { value: "", border: true },
      ],
    }
    exportFromTemplate({
      templateUrl: url,
      sheets: [
        {
          sheet: e === "P2" ? "SiSoP2" : "SiSoP7",
          data: {
            dtdt: initialData?.trainingObjectType?.name ?? "",
            khoa: initialData?.name ?? "",
          },
          tableStartCell: tableStartCell,
          rows: [...rows, totalRow],
        },
      ],
      fileName: `SiSo-${initialData?.name}.xlsx`,
    })
  }

  const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingCourse({
        where: { id },
        data: {
          code: id,
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
  const { data: schoolYearData = [] } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
  })

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={12}>
              {/* <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm"
                                            style={{
                                                marginRight: 8,
                                                height: 32,
                                            }}
                                            prefix={
                                                <Search
                                                    size={15}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="trainingObjectId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                marginRight: 8,
                                            }}
                                            onChange={(val) =>
                                                handleFilterChange('trainingObjectTypeId', val)
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex> */}
            </Col>
            <Col span={6}>
              <Flex justify="end">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN, "THEM") && (
                  <Button onClick={handleModal} type="primary">
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
            id="training-course"
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
                render: (_, record, index) => index + (currentPage - 1) * DEFAULT_PAGINATE_SIZE + 1,
              },
              {
                title: "Mã khoá",
                dataIndex: "code",
                width: 120,
                fixed: "left",
                align: "center",
                type: "input",
              },
              {
                title: "Tên khoá",
                dataIndex: "name",
                width: 200,
                fixed: "left",
                align: "center",
                type: "input",
              },
              {
                title: "Năm bắt đầu",
                align: "center",
                dataIndex: "schoolYearIds",
                width: 150,
                type: "select",
                options: schoolYearData.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                }),
                render: (_, record) =>
                  record.semesterStart?.schoolYear?.name
                    ? record?.semesterStart?.schoolYear?.name
                    : "",
              },
              {
                title: "Ngôn ngữ ĐT",
                align: "center",
                dataIndex: ["trainingLanguage", "name"],
                width: 150,
              },
              {
                title: "Niên khoá",
                align: "center",
                dataIndex: "academicYear",
                width: 100,
              },
              {
                title: "Chỉ tiêu tuyển sinh",
                align: "center",
                dataIndex: "admissionQuota",
                width: 150,
                type: "order",
              },
              {
                title: "Số QĐ tuyển sinh",
                align: "center",
                dataIndex: "admissionDecision",
                width: 150,
              },

              {
                title: "Số QĐ trúng tuyển",
                align: "center",
                dataIndex: "admissionDecisionNumber",
                width: 150,
              },
              {
                title: "Số QĐ công nhận SV",
                align: "center",
                dataIndex: "studentRecognitionDecision",
                width: 150,
              },
              {
                title: "Số quy chế đào tạo",
                align: "center",
                dataIndex: "regulation",
                width: 150,
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 175,
                render: (value, record) => {
                  return !record?.active ? (
                    <Tag color="error">Không hoạt động</Tag>
                  ) : (
                    <Tag color="success">Đang hoạt động</Tag>
                  )
                },
              },
              {
                title: "Thao tác",
                width: 120,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    const menu = (
                      <Menu
                        // BƯỚC 2: Cập nhật onClick để truyền cả e.key và 'id'
                        onClick={(e) => handleExport(e.key, id)}
                      >
                        <Menu.ItemGroup title="Chọn mẫu để xuất">
                          <Menu.Item key="P2">Mẫu P2</Menu.Item>
                          <Menu.Item key="P7">Mẫu P7</Menu.Item>
                        </Menu.ItemGroup>
                      </Menu>
                    )
                    return (
                      <Row className="justify-center gap-2">
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN, "SUA") && (
                          <EditIcon
                            onClick={onOpen.bind(null, id)}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_KHOA_HUAN_LUYEN, "XOA") && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: () => handleDelete(id),
                            }}
                          />
                        )}
                        <Tooltip title="Xuất sĩ số">
                          <Dropdown overlay={menu} trigger={["click"]}>
                            <Button type="text" onClick={(e) => e.preventDefault()}>
                              <FileDown
                                size={16}
                                strokeWidth={1.5}
                                className="text-base text-blue-700 cursor-pointer"
                              />
                            </Button>
                          </Dropdown>
                        </Tooltip>
                      </Row>
                    )
                  }
                  return ""
                },
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

TrainingCoursePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
