import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import { SubjectType } from "@pages/chuong-trinh-dao-tao/ql-mon-hoc"
import { emptyObjectIf } from "@workspace/constant"
import {
  useCountSubjectVersion,
  useFindManySubjectVersion,
  useFindUniqueSubjectVersion,
  useUpdateSubjectVersion,
} from "@workspace/db/hooks"
import { Col, Modal, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const PutSubjectTienQuyetSongHanh = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    title: string
    keyEnum: string
    type: "above" | "below"
  }>({
    tag: "PutSubjectTienQuyetSongHanh",
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { showSpinner, hideSpinner } = useSpinner()
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    credit: undefined,
  })

  const where = useMemo(
    () => ({
      id: {
        not: input?.id,
      },
      ...(filters.name && {
        name: {
          contains: filters.name,
          mode: "insensitive" as const,
        },
      }),
      ...(filters.code && {
        code: {
          contains: filters.code,
          mode: "insensitive" as const,
        },
      }),
    }),
    [input?.id, filters.code, filters.name]
  )

  const { data: initialValue } = useFindUniqueSubjectVersion(
    {
      where: {
        id: input?.id,
      },
      include: {
        ...(input?.keyEnum === SubjectType.prerequisite && {
          prerequisiteSubject: true,
          dependentSubject: true,
        }),
        ...(input?.keyEnum === SubjectType.parallel && {
          coRequisiteSubject: true,
          depCoRequisiteSubject: true,
        }),
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  const { data = [] } = useFindManySubjectVersion(
    {
      where,
      orderBy: [
        ...emptyObjectIf(
          [
            {
              credit: filters.credit,
            },
          ],
          !!filters.credit
        ),
        {
          name: "asc",
        },
      ],
    },
    {
      enabled: !!input?.id,
    }
  )

  const { data: count } = useCountSubjectVersion(
    {
      where: {
        ...where,
        deletedAt: null,
      },
      orderBy: [
        ...emptyObjectIf(
          [
            {
              credit: filters.credit,
            },
          ],
          !!filters.credit
        ),
        {
          name: "asc",
        },
      ],
    },
    {
      enabled: !!input?.id,
    }
  )

  const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()

  const relationFieldMap: Record<string, { above: string; below: string }> = {
    prerequisite: {
      above: "prerequisiteSubject",
      below: "dependentSubject",
    },
    parallel: {
      above: "coRequisiteSubject",
      below: "depCoRequisiteSubject",
    },
  }

  const getRelationField = (keyEnum: string, type: "above" | "below"): string => {
    return relationFieldMap[keyEnum]?.[type] ?? ""
  }

  const field = getRelationField(input?.keyEnum ?? "", input?.type ?? "above")

  useEffect(() => {
    if (initialValue && field) {
      const selectedIds = (initialValue as any)?.[field]?.map((item: any) => item.id) ?? []
      setSelectedRowKeys(selectedIds)
    }
  }, [initialValue, field])

  const handleSave = async () => {
    if (!input?.id) return

    try {
      showSpinner()

      const relationData = selectedRowKeys.map((id) => ({ id: id as string }))
      const field = getRelationField(input.keyEnum, input.type)

      const payload = field
        ? {
            [field]: {
              set: relationData,
            },
          }
        : {}

      await updateSubjectVersion({
        data: payload,
        where: { id: input.id },
      })

      message.success("Cập nhật thành công")

      queryClient.invalidateQueries({
        queryKey: ["SubjectVersion"],
      })
      onClose()
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
    <Modal
      open={isOpen}
      onOk={handleSave}
      onCancel={onClose}
      maskClosable={true}
      title={input?.title}
      className="w-[45vw]"
      okText="Lưu"
      cancelText="Hủy"
    >
      <Col span={24}>
        <Table
          data={data}
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys)
            },
            getCheckboxProps: (record) => ({
              value: record.id,
            }),
          }}
          rowKey="id"
          columns={[
            {
              title: "Mã môn học",
              align: "center",
              dataIndex: "code",
              width: 120,
              type: "input",
            },
            {
              title: "Tên môn học",
              align: "center",
              dataIndex: "name",
              width: 150,
              type: "input",
            },
            {
              title: "STC",
              align: "center",
              width: 100,
              dataIndex: "credit",
              type: "order",
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
    </Modal>
  )
}

export default PutSubjectTienQuyetSongHanh
