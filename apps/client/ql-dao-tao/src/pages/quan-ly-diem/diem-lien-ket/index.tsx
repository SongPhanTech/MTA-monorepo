import BaseTag from "@components/commons/base-tag"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import ViewIcon from "@components/icons/view"
import { DEFAULT_PAGINATE_SIZE, SCORE_LINK_STATUS } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { formatDate } from "@lib/utils"
import { ScoreLinkStatus } from "@workspace/db"
import {
  useCountScoreLinkSheet,
  useFindManyScoreLinkSheet,
  useUpdateScoreLinkSheet,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const mapStatusToTagProps = (status: ScoreLinkStatus) => {
  switch (status) {
    case "APPROVED":
      return <BaseTag type="success" content="Đã phê duyệt" />
    case "REJECTED":
      return <BaseTag type="error" content="Từ chối" />
    default:
      return <BaseTag type="warning" content="Chờ phê duyệt" />
  }
}

dayjs.locale("vi")
export default function ScoreLinkPage() {
  const { onOpen } = useDisclosure<{ id: string; mode: "view" | "edit" }>({
    tag: "PutScoreLinkSheetModal",
  })
  const { can } = useAbility()
  const canEdit = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_LIEN_KET, "SUA")
  const canDelete = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_LIEN_KET, "XOA")
  const canView = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_LIEN_KET, "XEM")
  const { showSpinner, hideSpinner } = useSpinner()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [status, setStatus] = useState()
  const { mutateAsync: updateScoreLinkSheet } = useUpdateScoreLinkSheet({
    onSuccess: () => {
      message.success("Xóa phiếu thành công")
      refetch()
    },
    onError: (_error: any) => {
      message.error(_error?.info?.message || "Đã xảy ra lỗi")
    },
    onSettled: () => {
      hideSpinner()
    },
  })
  const { data: count = 0 } = useCountScoreLinkSheet()
  const {
    data: scoreLinks,
    isLoading,
    isFetching,
    refetch,
  } = useFindManyScoreLinkSheet({
    where: { active: true, status: status },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          scoreLinkSubjectVersions: true,
        },
      },

      scoreLinkSubjectVersions: {
        include: {
          subjectVersion: true,
          _count: {
            select: {
              scoreLinkStudents: true,
            },
          },

          scoreLinkStudents: {
            include: {
              student: true,
            },
          },
        },
      },

      documents: true,
      fixedClass: true,
      semester: true,
      trainingObjectType: true,
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const columns = useMemo<ColumnsType<any>>(
    () => [
      {
        title: "STT",
        width: 60,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "Lớp quản lí",
        dataIndex: "fixedClass",
        width: 150,
        align: "center",
        render: (_, record) => record.fixedClass?.name || "",
      },
      {
        title: "Số quyết định",
        align: "center",
        width: 150,
        render: (_, record) => record.decision || "",
      },
      {
        title: "Ngày tạo",
        align: "center",
        width: 150,
        render: (_, record) => (record?.createdAt ? formatDate(record?.createdAt) : undefined),
      },
      {
        title: "Số môn",
        width: 100,
        align: "center",
        render: (_, record) => record?._count?.scoreLinkSubjectVersions ?? 0,
      },
      {
        title: "Số sinh viên",
        width: 100,
        align: "center",
        render: (_, record) =>
          record?.scoreLinkSubjectVersions?.[0]?._count?.scoreLinkStudents ?? 0,
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        width: 250,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        align: "center",
        width: 100,
        render: (_, record) => {
          return mapStatusToTagProps(record?.status)
        },
      },
      {
        title: "Thao tác",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Row className="justify-center gap-2">
            <ViewIcon
              onClick={() => onOpen({ mode: "view", id: record?.id })}
              className="text-sm text-gray-700 cursor-pointer"
              style={{
                display: !canView ? "none" : "block",
              }}
            />
            <EditIcon
              style={{
                display: record?.status !== ScoreLinkStatus.APPROVED && canEdit ? "block" : "none",
              }}
              onClick={() => onOpen({ mode: "edit", id: record?.id })}
              className="text-sm text-blue-700 cursor-pointer"
            />
            <DeleteIcon
              style={{
                display: canDelete ? "block" : "none",
              }}
              popConfirm={{
                onConfirm: () => handleDeleteScoreLink(record?.id),
              }}
            />
          </Row>
        ),
      },
    ],
    [canView, canEdit, canDelete]
  )

  const handleDeleteScoreLink = async (id: string) => {
    showSpinner()
    await updateScoreLinkSheet({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Row gutter={[16, 16]} align="top" justify="space-between">
          <Col span={12}>
            <Select
              allowClear
              placeholder="Chọn trạng thái"
              style={{ width: 200 }}
              options={Object.entries(SCORE_LINK_STATUS).map(([value, label]) => ({
                label,
                value,
              }))}
              onChange={(value) => setStatus(value)}
            />
          </Col>
          <Col span={6}>
            <Flex justify="end">
              <Button onClick={() => onOpen()} type="primary">
                Thêm mới
              </Button>
            </Flex>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Table
          columns={columns}
          data={scoreLinks || []}
          loading={isLoading || isFetching}
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
  )
}

ScoreLinkPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
