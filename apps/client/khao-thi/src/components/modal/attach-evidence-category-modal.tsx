import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import TreeSelect from "@components/commons/tree-select"
import useSpinner from "@hooks/spinner"
import { useFindManyEvidenceCategory, useUpdateEvidenceCategory } from "@workspace/db/hooks"
import { Col, Form, message } from "antd"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type AttachEvidenceCategoryType = {
  categoryIds: string[]
}

export interface TreeSelectItem {
  title: string
  label: string
  value: string
  key: string
  children?: TreeSelectItem[]
}

const AttachEvidenceCategoryModal = () => {
  const [form] = Form.useForm<AttachEvidenceCategoryType>()
  const {
    isOpen,
    onClose,
    input: periodId,
  } = useDisclosure<string>({
    tag: "AttachEvidenceCategoryModal",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateEvidenceCategory } = useUpdateEvidenceCategory()

  const { data: listCategory } = useFindManyEvidenceCategory({
    where: {
      deletedAt: null,
    },
    include: {
      evidences: {
        where: { deletedAt: null },
      },
      evaluationPeriods: {
        where: { id: periodId || "" },
        select: { id: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  const treeData = useMemo<TreeSelectItem[]>(() => {
    return (listCategory || []).map((cat) => ({
      title: cat.name,
      label: cat.name,
      value: cat.id,
      key: cat.id,
      children: (cat.evidences || []).map((ev) => ({
        title: ev.suffix ? `[${ev.suffix}] ${ev.name}` : ev.name,
        label: ev.suffix ? `[${ev.suffix}] ${ev.name}` : ev.name,
        value: `${cat.id}___${ev.id}`,
        key: `${cat.id}___${ev.id}`,
      })),
    }))
  }, [listCategory])

  const currentlyAttachedIds = useMemo<string[]>(() => {
    if (!listCategory || !periodId) return []
    return listCategory
      .filter((cat) => cat.evaluationPeriods && cat.evaluationPeriods.length > 0)
      .map((cat) => cat.id)
  }, [listCategory, periodId])

  useEffect(() => {
    if (isOpen && periodId) {
      form.setFieldsValue({
        categoryIds: currentlyAttachedIds,
      })
    }
  }, [isOpen, periodId, currentlyAttachedIds, form])

  async function onOk(output?: AttachEvidenceCategoryType) {
    if (!output || !periodId) return
    try {
      showSpinner()
      const rawSelected = output.categoryIds || []

      const selectedCategoryIds = Array.from(
        new Set(rawSelected.map((val) => (val.includes("___") ? val.split("___")[0] : val)))
      )

      const toConnect = selectedCategoryIds.filter((id) => !currentlyAttachedIds.includes(id))
      const toDisconnect = currentlyAttachedIds.filter((id) => !selectedCategoryIds.includes(id))

      await Promise.all([
        ...toConnect.map((catId) =>
          updateEvidenceCategory({
            where: { id: catId },
            data: {
              evaluationPeriods: {
                connect: [{ id: periodId }],
              },
            },
          })
        ),
        ...toDisconnect.map((catId) =>
          updateEvidenceCategory({
            where: { id: catId },
            data: {
              evaluationPeriods: {
                disconnect: [{ id: periodId }],
              },
            },
          })
        ),
      ])

      message.success("Cập nhật danh mục minh chứng thành công")
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "EvidenceCategory"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "EvaluationPeriod"],
      })
      onClose()
    } catch (error: unknown) {
      const errInfo = (error as { info?: { message?: string } })?.info
      if (errInfo?.message) {
        message.error(errInfo.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title="Gán minh chứng vào đợt tự đánh giá"
      className="w-[650px]"
    >
      <Col span={24}>
        <FormItem form={form} label="Danh mục minh chứng" name="categoryIds" required>
          <TreeSelect
            treeData={treeData}
            treeCheckable={true}
            placeholder="Chọn nhóm hoặc chọn từng minh chứng lẻ (có thể chọn tất cả)"
            allowClear
            className="w-full"
            maxTagCount="responsive"
            treeDefaultExpandAll={false}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default AttachEvidenceCategoryModal
