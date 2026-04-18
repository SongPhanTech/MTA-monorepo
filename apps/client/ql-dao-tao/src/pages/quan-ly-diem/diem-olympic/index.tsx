import { DownloadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { ExportStatsArchivedAwardModal } from "@components/modal"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useArchivedCertificateStatusOptions } from "@hooks/paymentStatus"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { formatDate } from "@lib/utils"
import { ArchivedCertificateStatus, type ArchivedAwardOnStudentSubjectScore } from "@workspace/db"
import {
  useCountArchivedAward,
  useFindManyArchivedAward,
  useUpdateArchivedAward,
  useUpdateManyArchivedAward,
  useUpdateManyArchivedAwardOnStudentSubjectScore,
} from "@workspace/db/hooks"
import { useApproveAwardScore, useAwardScore } from "@workspace/libs/api/training"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Modal, message, Row, Tag, Tooltip } from "antd"
import _ from "lodash"
import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function ArchivedAward() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    count: undefined,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const {
    archivedCertificateStatusOptions,
    getArchivedCertificateStatusStatusLabel,
    getArchivedCertificateStatusColor,
  } = useArchivedCertificateStatusOptions()

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen } = useDisclosure<string>({
    tag: "PutArchivedAwardModal",
  })

  const { onOpen: onOpenExport } = useDisclosure<string>({
    tag: "ExportStatsArchivedAwardModal",
  })

  const handleModal = () => {
    onOpen()
  }

  const handleExportModal = () => {
    onOpenExport()
  }
  const { mutateAsync: updateArchivedAward } = useUpdateArchivedAward({
    onSuccess: () => {
      message.success("Xóa thành công")
    },
    onError: (_error: any) => {
      if (_error?.info?.message) {
        message.error(_error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    },
    onSettled: () => {
      hideSpinner()
    },
  })
  const { mutateAsync: updateManyArchivedAward } = useUpdateManyArchivedAward()
  const { mutateAsync: updateManyArchivedAwardOnStudentSubjectScore } =
    useUpdateManyArchivedAwardOnStudentSubjectScore()
  const { mutateAsync: approveAwardScore } = useApproveAwardScore()

  async function handleDelete(id: string) {
    showSpinner()
    await updateArchivedAward({
      where: { id },
      data: {
        status: ArchivedCertificateStatus.CANCEL,
        studentSubjectScore: {
          updateMany: {
            where: {},
            data: {
              status: ArchivedCertificateStatus.CANCEL,
            },
          },
        },
      },
    })
  }

  const where = useMemo(() => {
    return {
      ...(filters.archivedAwardStatus ? { status: { in: filters.archivedAwardStatus } } : {}),
      award: {
        ...(filters.awardName
          ? {
            name: {
              contains: filters.awardName,
              mode: "insensitive" as const,
            },
          }
          : {}),
      },
      ...(filters.bonusScoreStatus
        ? {
          studentSubjectScore: {
            some: {
              status: { in: filters.bonusScoreStatus },
            },
          },
        }
        : {}),
      student: {
        fixedClass: {
          ...(filters.fixedClassCode
            ? {
              code: {
                contains: filters.fixedClassCode,
                mode: "insensitive" as const,
              },
            }
            : {}),
          trainingCourse: { trainingObjectTypeId },
        },
        ...(filters.name
          ? {
            userProfile: {
              fullname: {
                contains: filters.name,
                mode: "insensitive" as const,
              },
            },
          }
          : {}),
      },
    }
  }, [filters, trainingObjectTypeId])

  const { data: dataTable = [], refetch } = useFindManyArchivedAward({
    where,
    include: {
      studentSubjectScore: {
        include: {
          studentSubjectScore: {
            select: {
              finalScore: true,
              subjectVersion: {
                select: { name: true },
              },
              subjectClass: {
                select: {
                  code: true,
                  name: true,
                  semester: {
                    select: { code: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      award: true,
      student: {
        select: {
          code: true,
          userProfile: {
            select: {
              fullname: true,
              dateOfBirth: true,
            },
          },
          fixedClass: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { data: count } = useCountArchivedAward({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const handleOpenAprove = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn phê duyệt những giải thường được chọn không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        handleApprove("APPROVED")
      },
    })
  }
  const handleOpenReject = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn từ chối những giải thường được chọn không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        handleApprove("REJECTED")
      },
    })
  }

  const { mutateAsync: updateAwardScore } = useAwardScore()

  const handleApprove = async (status: "APPROVED" | "REJECTED") => {
    try {
      if (selectedRowKeys?.length > 0) {
        if (status === "REJECTED") {
          await updateManyArchivedAwardOnStudentSubjectScore({
            where: { archivedAwardId: { in: selectedRowKeys as string[] } },
            data: { status: "REJECTED" },
          })
          await updateManyArchivedAward({
            where: { id: { in: selectedRowKeys as string[] } },
            data: { status: "REJECTED" },
          })
          await message.success("Từ chối thành công")
          refetch()
          setSelectedRowKeys([])
          return
        }

        const res = await approveAwardScore({
          data: { archivedAwardIds: selectedRowKeys as string[] },
        })
        if (res?.status === 200) {
          message.success("Phê duyệt thành công")
          refetch()
          setSelectedRowKeys([])
          return
        }
      }
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Row gutter={[16, 16]} align="top" justify="space-between">
          <Col span={24} className="mt-3">
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={8}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: '#52c41a', // Màu xanh lá đậm chuẩn
                    borderRadius: '2px',
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#434343' }}>
                  Điểm đã được cộng
                </span>
              </Flex>
              <Flex justify="end">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC, "DUYET") && (
                  <>
                    <Button
                      onClick={handleOpenReject}
                      disabled={!selectedRowKeys.length}
                      type="default"
                    >
                      Từ chối
                    </Button>
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC, "DUYET") && (
                      <Button
                        className="ml-3"
                        onClick={handleOpenAprove}
                        disabled={!selectedRowKeys.length}
                        type="primary"
                      >
                        Phê duyệt
                      </Button>
                    )}
                  </>
                )}
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC, "THEM") && (
                  <Button onClick={handleModal} type="primary" className="ml-3">
                    Thêm mới
                  </Button>
                )}
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC, "XEM") && (
                  <Button onClick={handleExportModal} type="primary" className="ml-3">
                    <DownloadOutlined />
                    Xuất thống kê
                  </Button>
                )}
              </Flex>
            </Flex>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Table
          rowKey="id"
          id="training-category"
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          rowSelection={{
            selectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: !record.studentSubjectScore.some(
                (item: ArchivedAwardOnStudentSubjectScore) => item.status === "PENDING"
              ),
            }),
            onChange: (newSelectedRowKeys: React.Key[]) => {
              setSelectedRowKeys(newSelectedRowKeys)
            },
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
              title: "Họ và tên",
              width: 200,
              dataIndex: "name",
              type: "input",
              align: "left",
              fixed: "left",
              render: (__, record) => {
                return record?.student?.userProfile?.fullname
              },
            },
            {
              title: "Ngày sinh",
              width: 100,
              align: "center",
              render: (__, record) => {
                if (!record?.student?.userProfile?.dateOfBirth) return "-"
                return formatDate(record?.student?.userProfile?.dateOfBirth)
              },
            },
            {
              title: "Lớp",
              width: 150,
              dataIndex: "fixedClassCode",
              type: "input",
              align: "center",
              render: (__, record) => {
                if (!record?.student?.fixedClass?.name) return "-"
                return (
                  <Tooltip title={record?.student?.fixedClass?.name}>
                    {record?.student?.fixedClass?.code}
                  </Tooltip>
                )
              },
            },
            {
              title: "Tên giải thưởng",
              width: 180,
              dataIndex: "awardName",
              align: "center",
              type: "input",
              render: (__, record) => {
                return record?.award?.name || ""
              },
            },
            {
              title: "Ngày nhận",
              align: "center",
              width: 100,
              render: (__, record) => {
                return record?.date ? formatDate(record?.date) : ""
              },
            },
            // {
            //     title: 'Trạng thái',
            //     dataIndex: 'archivedAwardStatus',
            //     width: 150,
            //     align: 'center',
            //     type: 'select',
            //     options: archivedCertificateStatusOptions,
            //     render: (_, record) => {
            //         const label = getArchivedCertificateStatusStatusLabel(
            //             record?.status
            //         )
            //         const color = getArchivedCertificateStatusColor(record?.status)
            //         return <Tag color={color}>{label}</Tag>
            //     },
            // },
            {
              title: "Điểm cộng",
              align: "center",
              width: 70,
              render: (__, record) => {
                return record?.bonusScore || "-"
              },
            },
            {
              title: "Môn học cộng điểm",
              width: 150,
              align: "center",
              render: (__, record) => {
                return record?.studentSubjectScore[0]?.studentSubjectScore?.subjectVersion?.name
              },
            },
            {
              title: "Học kỳ cộng điểm",
              width: 120,
              align: "center",
              render: (__, record) => {
                return (
                  <Tooltip
                    title={
                      record?.studentSubjectScore[0]?.studentSubjectScore?.subjectClass?.semester
                        ?.name
                    }
                  >
                    {
                      record?.studentSubjectScore[0]?.studentSubjectScore?.subjectClass?.semester
                        ?.code
                    }
                  </Tooltip>
                )
              },
            },
            {
              title: "Lớp MH",
              width: 120,
              align: "center",
              render: (__, record) => {
                return (
                  <Tooltip
                    title={record?.studentSubjectScore[0]?.studentSubjectScore?.subjectClass?.name}
                  >
                    {record?.studentSubjectScore[0]?.studentSubjectScore?.subjectClass?.code}
                  </Tooltip>
                )
              },
            },
            {
              title: "Điểm HP",
              width: 70,
              align: "center",
              render: (__, record) => {
                // 1. Lấy trạng thái cộng điểm
                const status = record?.studentSubjectScore[0]?.status;

                // 2. Lấy giá trị điểm
                const score = record?.studentSubjectScore[0]?.studentSubjectScore?.finalScore?.toNumber();

                if (score === undefined || score === null) return "-";

                // 3. Logic tô màu: Chỉ lấy màu khi trạng thái là APPROVED
                const isApproved = status === "APPROVED";
                const color = isApproved ? getArchivedCertificateStatusColor(status) : "inherit";

                return (
                  <span
                    style={{
                      color: color,
                      fontWeight: isApproved ? "bold" : "normal" // In đậm nếu đã duyệt để dễ phân biệt
                    }}
                  >
                    {score}
                  </span>
                );
              },
            },
            {
              title: "Trạng thái cộng điểm",
              dataIndex: "bonusScoreStatus",
              width: 150,
              align: "center",
              type: "select",
              options: archivedCertificateStatusOptions,
              render: (_, record) => {
                const status = record?.studentSubjectScore[0]?.status
                const label = getArchivedCertificateStatusStatusLabel(status)
                const color = getArchivedCertificateStatusColor(status)
                return <Tag color={color}>{label}</Tag>
              },
            },
            {
              title: "Thao tác",
              width: 100,
              align: "center",
              fixed: "right",
              hidden: !canSome(
                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC,
                "SUA",
                "XOA"
              ),
              render: (_, { id, status }) => {
                return (
                  <Row className="justify-center gap-2">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC, "SUA") &&
                      status === "PENDING" && (
                        <EditIcon
                          onClick={onOpen.bind(null, id)}
                          className="text-sm text-blue-700 cursor-pointer"
                        />
                      )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_OLYMPIC, "XOA") &&
                      status === "PENDING" && (
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
            showTotal: (total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
          }}
        />
      </Col>
      <ExportStatsArchivedAwardModal />
    </Row>
  )
}

ArchivedAward.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
