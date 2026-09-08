import {
  NestedCollapsibleTable,
  type NestedColumn,
} from "@components/commons/nested-collapsible-table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import {
  CAP_DON_VI_OPTIONS,
  LOAI_DON_VI_OPTIONS,
  NHOM_DON_VI_OPTIONS,
  type PutDMDonViInput,
} from "@components/modal/put-danh-muc-don-vi"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { DM_DonVi } from "@workspace/db/client"
import { useFindManyDM_DonVi, useUpdateDM_DonVi } from "@workspace/db/hooks"
import { Button, Col, Flex, Input, message, Row, Tag, Tooltip } from "antd"
import { Plus } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const getOptionLabel = (
  options: Array<{ value: number; label: string }>,
  value?: number | null
) => {
  if (value === null || value === undefined) return "-"
  return options.find((item) => item.value === value)?.label ?? String(value)
}

export default function DanhMucDonViPage() {
  const [keyword, setKeyword] = useState("")
  const { showSpinner, hideSpinner } = useSpinner()

  const {
    data = [],
    isLoading,
    isFetching,
    refetch,
  } = useFindManyDM_DonVi({
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const { onOpen } = useDisclosure<PutDMDonViInput>({
    tag: "PutDMDonViModal",
  })

  const { mutateAsync: updateDM_DonVi } = useUpdateDM_DonVi()

  const treeData = useMemo(() => {
    const normalizeParent = (item: DM_DonVi) => ({
      ...item,
      sParentId: !item.sParentId || item.sParentId === "0" ? null : item.sParentId,
    })

    if (!keyword.trim()) {
      return data.map(normalizeParent)
    }

    const map = new Map(data.map((item) => [item.Id, item]))
    const matchedIds = new Set<string>()

    const markMatchedAndAncestors = (item: DM_DonVi) => {
      matchedIds.add(item.Id)
      let parentId = item.sParentId
      while (parentId && parentId !== "0" && map.has(parentId)) {
        matchedIds.add(parentId)
        parentId = map.get(parentId)?.sParentId ?? null
      }
    }

    const search = keyword.trim().toLowerCase()
    data.forEach((item) => {
      const matched =
        item.sMa?.toLowerCase().includes(search) ||
        item.sTen?.toLowerCase().includes(search) ||
        item.sTenVietTat?.toLowerCase().includes(search) ||
        item.sCode?.toLowerCase().includes(search)
      if (matched) markMatchedAndAncestors(item)
    })

    return data.filter((item) => matchedIds.has(item.Id)).map(normalizeParent)
  }, [data, keyword])

  async function handleDelete(Id: string) {
    try {
      showSpinner()
      await updateDM_DonVi({
        where: { Id },
        data: {
          bDeleted: true,
        },
      })
      message.success("Xóa thành công")
      refetch()
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

  const columns: NestedColumn<DM_DonVi>[] = useMemo(
    () => [
      {
        title: "Mã",
        dataIndex: "sMa",
        width: 140,
        align: "left",
        render: (value) => value || "-",
      },
      {
        title: "Tên đơn vị",
        dataIndex: "sTen",
        align: "left",
        render: (value) => value || "-",
      },
      {
        title: "Tên viết tắt",
        dataIndex: "sTenVietTat",
        width: 140,
        align: "center",
        render: (value) => value || "-",
      },
      {
        title: "Nhóm",
        dataIndex: "iNhomDonVi",
        width: 180,
        align: "left",
        render: (value) => getOptionLabel(NHOM_DON_VI_OPTIONS, value),
      },
      {
        title: "Cấp",
        dataIndex: "iCapDonVi",
        width: 200,
        align: "left",
        render: (value) => getOptionLabel(CAP_DON_VI_OPTIONS, value),
      },
      {
        title: "Loại",
        dataIndex: "iLoaiDonVi",
        width: 160,
        align: "left",
        render: (value) => getOptionLabel(LOAI_DON_VI_OPTIONS, value),
      },
      {
        title: "Địa chỉ",
        dataIndex: "sDiaChi",
        width: 200,
        align: "left",
        render: (value) => value || "-",
      },
      {
        title: "Trạng thái",
        dataIndex: "bActive",
        width: 140,
        align: "center",
        fixed: "right",
        render: (value) =>
          value === false ? (
            <Tag color="error">Ngừng hoạt động</Tag>
          ) : (
            <Tag color="success">Đang hoạt động</Tag>
          ),
      },
      {
        title: "Thao tác",
        width: 120,
        align: "center",
        fixed: "right",
        render: (_, record) => (
          <Row className="justify-center gap-2 no-row-click">
            <Tooltip title="Thêm đơn vị con">
              <Plus
                size={16}
                className="text-green-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen({ sParentId: record.Id })
                }}
              />
            </Tooltip>
            <EditIcon
              onClick={(e) => {
                e.stopPropagation()
                onOpen({ Id: record.Id })
              }}
              className="text-sm text-blue-700 cursor-pointer"
            />
            <DeleteIcon
              popConfirm={{
                title: "Bạn có chắc muốn xóa đơn vị này?",
                onConfirm: (e) => {
                  e?.stopPropagation()
                  handleDelete(record.Id)
                },
                onCancel: (e) => e?.stopPropagation(),
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Row>
        ),
      },
    ],
    [onOpen]
  )

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex justify="space-between" gap={12} wrap="wrap">
            <Input.Search
              allowClear
              placeholder="Tìm theo mã, tên đơn vị..."
              className="max-w-md"
              onSearch={setKeyword}
              onChange={(e) => {
                if (!e.target.value) setKeyword("")
              }}
            />
            <Button type="primary" onClick={() => onOpen()}>
              Thêm mới
            </Button>
          </Flex>
        </Col>
        <Col span={24}>
          <NestedCollapsibleTable
            mode="tree"
            buildFromParentId
            parentIdKey="sParentId"
            rowKey="Id"
            data={treeData}
            columns={columns}
            loading={isLoading || isFetching}
            defaultExpandAllRows={!!keyword.trim()}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  )
}

DanhMucDonViPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
