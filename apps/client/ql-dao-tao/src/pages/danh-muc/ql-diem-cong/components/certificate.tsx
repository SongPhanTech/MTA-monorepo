import TableCollapse from "@components/commons/tableCollapse"
import CreateIcon from "@components/icons/create"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import {
  useCountCertificate,
  useFindManyCertificate,
  useUpdateCertificate,
  useUpdateCertificateOnSubject,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import _ from "lodash"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function Certificate() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [_selectedRowKeys, _setSelectedRowKeys] = useState<React.Key[]>([])
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    finalScore: undefined,
    count: undefined,
    subjects: undefined,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen, onClose } = useDisclosure<string>({
    tag: "PutCertificateScoreModal",
  })

  const { onOpen: onOpenCertificateOnSubject } = useDisclosure<{
    id: string
    certificateId: string
  }>({
    tag: "PutCertificateOnSubjectScoreModal",
  })

  const handleModal = () => {
    onOpen()
  }

  // const { convertScore } = useScoreConverter(
  //     data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts
  // )

  const { mutateAsync: updateCertificate } = useUpdateCertificate()
  const { mutateAsync: updateCertificateOnSubject } = useUpdateCertificateOnSubject()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateCertificate({
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

  async function handleDeleteCertificateOnSubject(id: string) {
    try {
      showSpinner()
      await updateCertificateOnSubject({
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

  const where = useMemo(() => {
    return filters.name && filters.name !== ""
      ? {
          name: {
            contains: filters.name,
            mode: "insensitive" as const,
          },
        }
      : {}
  }, [filters])

  const { data: dataTable = [], refetch } = useFindManyCertificate({
    where,
    include: {
      subjects: {
        include: {
          subject: true,
          certificate: {
            include: {
              archivedCertificate: true,
            },
          },
        },
      },
      archivedCertificate: true,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountCertificate({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  return (
    <div>
      <Row gutter={[4, 0]}>
        <Col span={24}>
          <Row gutter={[4, 4]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "THEM") && (
                  <Button onClick={handleModal} type="primary">
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <TableCollapse
            rowKey="id"
            id="training-category"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            headerTitleKey={({ code, name }) => `${[code, name].filter(Boolean).join(" - ")}`}
            columns={[
              // {
              //     title: 'Tên chứng chỉ',
              //     dataIndex: 'name',
              //     align: 'center',
              //     width: 200,
              //     type: 'input',
              //     render: (__, record) => {
              //         return record?.certificate?.name || ''
              //     },
              // },
              {
                title: "Môn học phiên điểm",
                dataIndex: "subjects",
                // width: 300,
                align: "center",
                type: "input",
                render: (__, record) => {
                  return record?.subject?.name || ""
                },
              },
              {
                title: "Điểm phiên",
                dataIndex: "finalScore",
                width: 200,
                align: "center",
                type: "order",
                // Chứng chỉ Đạt/Không đạt: môn được ghi nhận miễn, điểm phiên không dùng
                render: (__, record) =>
                  record?.certificate?.isUsingScore === false ? "Miễn" : record?.finalScore,
              },

              {
                title: "Thao tác",
                width: 100,
                align: "center",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id, certificateId, certificate }) => {
                  return (
                    <Row className="justify-center gap-2">
                      {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "SUA") && (
                        <EditIcon
                          disabled={certificate?.archivedCertificate?.length > 0}
                          onClick={() => {
                            onOpenCertificateOnSubject({
                              id: id,
                              certificateId: certificateId,
                            })
                          }}
                        />
                      )}
                      {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "XOA") && (
                        <DeleteIcon
                          disabled={certificate?.archivedCertificate?.length > 0}
                          popConfirm={{
                            onConfirm: () => handleDeleteCertificateOnSubject(id),
                          }}
                        />
                      )}
                    </Row>
                  )
                },
              },
            ]}
            childrenFieldName="subjects"
            defaultExpandAll
            headerRight={({ id, archivedCertificate, subjects }) => (
              <div className="flex gap-2.5 w-[85px] items-center">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_DANH_MUC_XU_LY_HOC_TAP, "THEM") && (
                  <CreateIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenCertificateOnSubject({
                        id: "",
                        certificateId: id,
                      })
                    }}
                    title="Thêm mới cấu hình"
                  />
                )}
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "SUA") && (
                  <EditIcon
                    onClick={() => {
                      onOpen(id)
                    }}
                  />
                )}
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QL_DIEM_CONG, "XOA") && (
                  <DeleteIcon
                    disabled={archivedCertificate?.length > 0 || subjects?.length > 0}
                    popConfirm={{
                      onConfirm: () => handleDelete(id),
                    }}
                  />
                )}
              </div>
            )}
            data={dataTable}
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  )
}
