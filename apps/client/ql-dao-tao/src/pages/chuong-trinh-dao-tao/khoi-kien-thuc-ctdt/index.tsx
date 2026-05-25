import {
  NestedCollapsibleTable,
  type NestedColumn,
} from "@components/commons/nested-collapsible-table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import ViewIcon from "@components/icons/view"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { Prisma } from "@workspace/db/client"
import {
  useFindManyTrainingBlock,
  useFindManyTrainingBlockOnCurriculumVersion,
  useUpdateTrainingBlock,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, message, Row, Tag, Tooltip } from "antd"
import { BookPlus } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import ModalCurriculumVersionByTrainingBlock from "@/components/modal/modal-ctdt-theo-kkt"

type TrainingBlockType = Prisma.TrainingBlockGetPayload<{}> & {
  children?: TrainingBlockType[]
}

export default function TrainingBlock() {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { can, canSome } = useAbility()
  const [filters, setFilters] = useState<FilterProps>({
    code: undefined,
    name: undefined,
    active: undefined,
  })

  const { data: trainingBlockData = [] } = useFindManyTrainingBlock(
    {
      where: {
        ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" } } : {}),
        ...(filters.name ? { name: { contains: filters.name, mode: "insensitive" } } : {}),
        ...(filters.active?.length === 1 ? { active: filters.active[0] } : {}),
        trainingObjectTypeId,
      },
      orderBy: { priority: "asc" },
    },
    {
      enabled: !!trainingObjectTypeId,
    }
  )

  const { data: trainingBlockOnCurriculumData = [] } = useFindManyTrainingBlockOnCurriculumVersion(
    {
      where: {
        trainingBlock: { trainingObjectTypeId },
        curriculumVersion: { deletedAt: null },
      },
      include: {
        curriculumVersion: true,
        subjects: {
          where: { deletedAt: null },
          select: { id: true, subjectId: true },
        },
      },
    },
    {
      enabled: !!trainingObjectTypeId,
    }
  )

  const curriculumVersionCountMap = useMemo(() => {
    const countMap = new Map<string, number>()

    trainingBlockOnCurriculumData.forEach((item) => {
      if (item.trainingBlockId && item.curriculumVersion) {
        const curriculumVersionsByBlock = trainingBlockOnCurriculumData.filter(
          (d) => d.trainingBlockId === item.trainingBlockId
        )
        const uniqueVersions = new Set(curriculumVersionsByBlock.map((d) => d.curriculumVersionId))
        countMap.set(item.trainingBlockId, uniqueVersions.size)
      }
    })

    return countMap
  }, [trainingBlockOnCurriculumData])

  const subjectCountMap = useMemo(() => {
    const setMap = new Map<string, Set<string>>()

    trainingBlockOnCurriculumData.forEach((item) => {
      if (!item.trainingBlockId) return
      if (!setMap.has(item.trainingBlockId)) {
        setMap.set(item.trainingBlockId, new Set())
      }
      ;(item.subjects as any[] ?? []).forEach((s: any) => {
        if (s.subjectId) setMap.get(item.trainingBlockId)!.add(s.subjectId)
      })
    })

    const countMap = new Map<string, number>()
    setMap.forEach((val, key) => countMap.set(key, val.size))
    return countMap
  }, [trainingBlockOnCurriculumData])

  const lockedTrainingBlockIds = useMemo(() => {
    const lockedIds = new Set<string>()
    trainingBlockOnCurriculumData.forEach((item) => {
      if (item.trainingBlockId && (item.curriculumVersion as any)?.isLock) {
        lockedIds.add(item.trainingBlockId)
      }
    })
    return lockedIds
  }, [trainingBlockOnCurriculumData])

  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingBlock",
  })
  const { onOpen: onOpenDrawer } = useDisclosure<{
    trainingBlockId: string
    trainingBlockName?: string
    defaultTab?: "curriculumVersions" | "subjects"
  }>({
    tag: "DrawerTrainingBlockDetail",
  })

  const handleOpenDrawer = (
    record: any,
    defaultTab: "curriculumVersions" | "subjects" = "curriculumVersions"
  ) => {
    onOpenDrawer({
      trainingBlockId: record.id,
      trainingBlockName: record.name,
      defaultTab,
    })
  }
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateTrainingBlock } = useUpdateTrainingBlock()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingBlock({
        where: { id },
        data: { deletedAt: new Date() },
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
  const treeColumns: NestedColumn<TrainingBlockType>[] = [
    {
      title: "Mã khối kiến thức",
      dataIndex: "code",
      width: 150,
      align: "center",
    },
    {
      title: "Tên khối kiến thức",
      dataIndex: "name",
      align: "center",
    },
    {
      title: "Trạng thái",
      align: "center",
      width: 150,
      dataIndex: "active",
      render: (_: any, record: TrainingBlockType) =>
        !record?.active ? (
          <Tag color="error">Ngừng đào tạo</Tag>
        ) : (
          <Tag color="success">Đang đào tạo</Tag>
        ),
    },
    {
      title: "Số lượng CTĐT",
      align: "center",
      width: 130,
      render: (_: any, record: TrainingBlockType) => {
        const count = curriculumVersionCountMap.get(record.id) || 0
        return (
          <span
            className={count > 0 ? "text-blue-600 cursor-pointer hover:underline" : ""}
            onClick={() => count > 0 && handleOpenDrawer(record, "curriculumVersions")}
          >
            {count}
          </span>
        )
      },
    },
    {
      title: "Số lượng học phần",
      align: "center",
      width: 150,
      render: (_: any, record: TrainingBlockType) => {
        const count = subjectCountMap.get(record.id) ?? 0
        return (
          <span
            className={count > 0 ? "text-blue-600 cursor-pointer hover:underline" : ""}
            onClick={() => count > 0 && handleOpenDrawer(record, "subjects")}
          >
            {count}
          </span>
        )
      },
    },
    {
      title: "Thao tác",
      width: 150,
      align: "center",
      className: "no-row-click",
      hidden: !canSome(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
        "SUA",
        "XOA"
      ),
      render: (_: any, record: TrainingBlockType) => {
        if (!record?.id) return ""

        const hasChildren = record?.children && record.children.length > 0
        const isBlockLocked = lockedTrainingBlockIds.has(record.id)

        return (
          <Row className="justify-center gap-2">
            <ViewIcon
              title="Chi tiết khối kiến thức"
              onClick={() => handleOpenDrawer(record, "curriculumVersions")}
            />
            {can(
              QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
              "SUA"
            ) && (
              <EditIcon
                onClick={onOpen.bind(null, record?.id)}
                className="text-sm text-blue-700 cursor-pointer"
              />
            )}
            {can(
              QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
              "XOA"
            ) && (
              <Tooltip
                title={
                  hasChildren
                    ? "Không thể xóa vì có khối kiến thức con"
                    : isBlockLocked
                      ? "Không thể xóa vì đang được dùng trong CTĐT đã khoá"
                      : "Xóa"
                }
                placement="top"
              >
                <DeleteIcon
                  popConfirm={{ onConfirm: () => handleDelete(record?.id) }}
                  disabled={hasChildren || isBlockLocked}
                />
              </Tooltip>
            )}
          </Row>
        )
      },
    },
  ]

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={6}>
              <Flex justify="end">
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_KHOI_KIEN_THUC_CTDT,
                  "THEM"
                ) && (
                  <Button onClick={() => onOpen()} type="primary">
                    <BookPlus />
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24} className="mt-2">
          <NestedCollapsibleTable
            filters={filters}
            data={trainingBlockData || []}
            columns={treeColumns}
            mode="tree"
            childrenKey="children"
            defaultExpandAllRows={true}
            rowKey="id"
            buildFromParentId={true}
            parentIdKey="parentId"
          />
        </Col>
      </Row>
      <ModalCurriculumVersionByTrainingBlock />
    </div>
  )
}

TrainingBlock.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}