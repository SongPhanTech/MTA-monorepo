import PutFormModal from "@components/commons/put-modal"
import TreeSelect from "@components/commons/tree-select"
import useSpinner from "@hooks/spinner"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import { useFindManyEvidence, useFindManyEvidenceCategory } from "@workspace/db/hooks"
import type { ItemProps } from "@workspace/libs/utils"
import { Col, Form, message } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutEvidenceType = {
  evidences: string
}

const PinEvidenceToPeriod = () => {
  const [form] = Form.useForm<PutEvidenceType>()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    changeValue: (value: { value: string; label: string }) => void
  }>({
    tag: "PinEvidenceToPeriod",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const [items, setItems] = useState<ItemProps[]>([])
  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId
  async function onOk(output?: PutEvidenceType) {
    if (!output) return
    try {
      showSpinner()

      if (input?.id) {
        for (const item of items) {
          input.changeValue(item)
        }
      }
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
  const { data: listEvidenceCategory } = useFindManyEvidenceCategory()
  const { data: listEvidence } = useFindManyEvidence({
    where: {
      analysisFormEvidence: {
        some: {
          requirementCriterion: {
            analysisCriterion: {
              lecturer: {
                userProfile: {
                  id: idProfile,
                },
              },
              criterionPeriod: {
                evaluationStandard: {
                  periodId: selectedEvaluationPeriodId,
                },
              },
            },
          },
        },
      },
    },
    include: {
      analysisFormEvidence: {
        include: {
          requirementCriterion: {
            include: {
              analysisCriterion: {
                include: {
                  criterionPeriod: {
                    include: {
                      evaluationStandard: {
                        include: {
                          period: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const treeData = useMemo(() => {
    if (!listEvidenceCategory || !listEvidence) return []
    return listEvidenceCategory
      .map((cat) => {
        const children = listEvidence
          .filter((evi) => evi.categoryId === cat.id)
          .map((evi) => ({
            title: evi.name,
            label: evi.name,
            value: evi.id,
            key: evi.id,
          }))
        return {
          title: cat.name,
          label: cat.name,
          value: cat.id,
          key: cat.id,
          selectable: false,
          children,
        }
      })
      .filter((cat) => cat.children.length > 0)
  }, [listEvidenceCategory, listEvidence])

  const handleChange = (selectedIds: string[]) => {
    if (selectedIds?.length && listEvidence) {
      setItems(
        selectedIds.map((id) => {
          const found = listEvidence.find((e) => e.id === id)
          return {
            value: id,
            label: found?.name ?? id,
            key: id,
          }
        })
      )
    } else {
      setItems([])
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Thêm minh chứng cho tiêu chí"}
      className="w-[700px]"
    >
      <Col span={24}>
        <Form.Item name="evidences" label="Minh chứng">
          <TreeSelect
            multiple
            maxTagCount="responsive"
            placeholder="Chọn minh chứng"
            treeData={treeData}
            onChange={handleChange}
          />
        </Form.Item>
      </Col>
    </PutFormModal>
  )
}

export default PinEvidenceToPeriod
