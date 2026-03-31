import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { buildOrgTree } from "@lib/utils"
import type { DM_DonVi, DocumentFile, TrainingObjectType } from "@workspace/db/client"
import {
  useCountTrainingField,
  useFindManyDM_DonVi,
  useFindManyTrainingField,
  useUpdateTrainingField,
} from "@workspace/db/hooks"
import { whereOrganization } from "@workspace/libs/constants"
import { getMinioUrl } from "@workspace/libs/utils"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useFindManyTrainingObjectTypePermission } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TrainingFieldPage() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    trainingObjectTypes: undefined,
    name: "",
    code: "",
    organization: undefined,
    publishDate: undefined,
    active: undefined,
    decisionNo: "",
  })

  const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission()

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
      ...(filters.active
        ? {
            active: {
              equals: filters.active[0],
            },
          }
        : {}),
      ...(filters.decisionNo && filters.decisionNo !== ""
        ? {
            decisionNo: {
              contains: filters.decisionNo,
              mode: "insensitive" as const,
            },
          }
        : {}),

      trainingObjectTypes: {
        some: {
          trainingObjectTypeId: {
            in: filters.trainingObjectTypes?.length
              ? filters.trainingObjectTypes
              : trainingObjectTypeData.map((item) => item.id),
          },
        },
      },
      ...(filters.organization
        ? {
            organizationId: {
              in: filters.organization,
            },
          }
        : {}),
      ...(filters.publishDate?.length === 2
        ? {
            publishDate: {
              gte: dayjs(filters.publishDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.publishDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
    }),
    [
      filters.code,
      filters.name,
      filters.trainingObjectTypes,
      filters.organization,
      filters.publishDate,
      filters.active,
      filters.decisionNo,
      trainingObjectTypeData,
    ]
  )
  const { data = [] } = useFindManyTrainingField({
    where,
    include: {
      organization: true,
      documentFiles: true,
      trainingObjectTypes: {
        include: {
          trainingObjectType: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountTrainingField({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingFieldModal",
  })
  const onDownload = async (url: string, fileName: string) => {
    const response = await fetch(url)
    if (!response.ok) return message.error("Lỗi khi tải file")
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = blobUrl
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateTrainingField } = useUpdateTrainingField()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingField({
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

  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(manageOrgData)

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_NGANH, "THEM") && (
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
            id="training-category"
            data={data}
            filters={filters}
            setFilters={(value) => {
              if (value.active?.length === 0 || value.active?.length === 2) {
                value.active = undefined
              }
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
                title: "Mã ngành",
                dataIndex: "code",
                align: "center",
                fixed: "left",
                width: 150,
                type: "input",
              },
              {
                title: "Tên ngành",
                dataIndex: "name",
                width: 200,
                fixed: "left",
                align: "center",
                type: "input",
              },
              {
                title: "Đối tượng đào tạo",
                dataIndex: "trainingObjectTypes",
                align: "center",
                width: 175,
                type: "select",
                options: trainingObjectTypeData.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                }),
                render: (trainingObjectTypes) =>
                  trainingObjectTypes
                    .map(
                      ({ trainingObjectType }: { trainingObjectType: TrainingObjectType }) =>
                        trainingObjectType.name
                    )
                    .join("; "),
              },
              {
                title: "Đơn vị quản lý",
                dataIndex: "organization",
                align: "center",
                width: 150,
                type: "tree_select",
                options: treeData,
                render: (organization: DM_DonVi) => (organization?.sTen ? organization?.sTen : ""),
              },
              {
                title: "Số quyết định",
                dataIndex: "decisionNo",
                align: "center",
                width: 150,
                type: "input",
              },
              {
                title: "Ngày ban hành",
                align: "center",
                width: 150,
                dataIndex: "publishDate",
                type: "date",
                render: (__, { publishDate }) =>
                  publishDate ? dayjs(publishDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Tài liệu đính kèm",
                width: 200,

                fixed: "left",
                align: "center",
                type: "input",
                render: (__, record) =>
                  record.documentFiles?.length > 0
                    ? record.documentFiles.map((file: DocumentFile, index: number) => (
                        // Dùng React.Fragment hoặc span để bọc và cung cấp key
                        <span key={file.id || index}>
                          {/** biome-ignore lint/a11y/useValidAnchor: <explanation> */}
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              onDownload(getMinioUrl(file.path), file.name)
                            }}
                          >
                            {file.name}
                          </a>
                          {/* Thêm dấu phẩy nếu đây không phải là file cuối cùng */}
                          {index < record.documentFiles.length - 1 ? ", " : ""}
                        </span>
                      ))
                    : "",
              },
              {
                title: "Mô tả",
                width: 150,
                align: "center",
                dataIndex: "description",
                render: (value: string) => {
                  return (
                    <Tooltip title={value}>
                      <div className="line-clamp-2">{value}</div>
                    </Tooltip>
                  )
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 130,
                type: "select",
                dataIndex: "active",
                options: [
                  { label: "Đang hoạt động", value: true },
                  { label: "Không hoạt động", value: false },
                ],
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
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_NGANH,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_NGANH, "SUA") && (
                          <EditIcon
                            onClick={onOpen.bind(null, id)}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_NGANH, "SUA") && (
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
          />
        </Col>
      </Row>
    </div>
  )
}

TrainingFieldPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
