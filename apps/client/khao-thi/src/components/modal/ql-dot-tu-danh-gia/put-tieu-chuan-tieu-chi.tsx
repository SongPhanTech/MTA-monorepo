import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import { STANDARD_CATALOG_TYPE_OPTIONS } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { evaluationPeriodStore } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia"
import { useStore } from "@tanstack/react-store"
import { createId } from "@workspace/db"
import { $Enums } from "@workspace/db/client"
import {
  useFindManyEvaluationStandardSet,
  useFindManyStandardCatalog,
  useFindManyStandardPeriod,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Col, Form, message, Tree } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type TreeNode = {
  key: string
  title: string
  children?: TreeNode[]
}

const filterTree = (nodes: TreeNode[], checkedKeys: string[]): TreeNode[] =>
  nodes
    .map((node) => {
      const children = node.children ? filterTree(node.children, checkedKeys) : []
      return checkedKeys.includes(node.key) || children.length > 0 ? { ...node, children } : null
    })
    .filter(Boolean) as TreeNode[]

const getAllKeys = (nodes: TreeNode[]): string[] =>
  nodes.flatMap((node) => [node.key, ...(node.children ? getAllKeys(node.children) : [])])

const PutTieuChuanTieuChi = () => {
  const {
    isOpen,
    onClose,
    input: { id, refetch } = {},
  } = useDisclosure<{
    id?: string
    refetch?: () => void
  }>({
    tag: "PutTieuChuanTieuChi",
  })

  const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

  const [form] = Form.useForm<{
    standardSetId: string
    objectType: $Enums.StandardCatalogType
  }>()

  const standardSetWatch = Form.useWatch("standardSetId", form)
  const objectTypeWatch = Form.useWatch("objectType", form)

  type TreeData = typeof treeData
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [catalogSelected, setCatalogSelected] = useState<TreeData>([])

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: dataCatalog } = useFindManyStandardCatalog(
    {
      where: {
        standardSetId: standardSetWatch || "",
      },
      select: {
        id: true,
        name: true,
        criteria: {
          select: {
            id: true,
            name: true,
            requirementCriterionCatalog: {
              select: {
                id: true,
                name: true,
                questions: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    },
    {
      enabled: !!standardSetWatch,
    }
  )

  const { data: existingStandards } = useFindManyStandardPeriod(
    {
      where: {
        periodId: selectedEvaluationPeriodId,
      },
      include: {
        criteria: {
          include: {
            analysisCriterions: {
              include: {
                requirementCriterions: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    },
    {
      enabled: !!id && !!selectedEvaluationPeriodId,
    }
  )

  const { data: evaluationStandardSets = [] } = useFindManyEvaluationStandardSet(
    {
      where: {
        objectType: objectTypeWatch,
      },
    },
    {
      enabled: !!objectTypeWatch,
    }
  )

  const treeData = useMemo(() => {
    return (
      dataCatalog?.map(({ criteria, ...standard }) => ({
        key: standard.id,
        title: standard.name,
        name: standard.name,
        children: criteria.map(({ requirementCriterionCatalog, ...cri }) => ({
          key: cri.id,
          title: cri.name,
          ...cri,
          children: requirementCriterionCatalog.map((req) => ({
            key: req.id,
            title: req.name,
            ...req,
          })),
        })),
      })) || []
    )
  }, [dataCatalog])

  useEffect(() => {
    if (id && existingStandards && existingStandards.length > 0) {
      const selectedKeys: string[] = []

      existingStandards.forEach((standard) => {
        const catalogStandard = dataCatalog?.find((s) => s.name === standard.name)
        if (catalogStandard) {
          standard.criteria.forEach((criterion) => {
            const catalogCriterion = catalogStandard.criteria.find((c) => c.name === criterion.name)
            if (catalogCriterion) {
              selectedKeys.push(catalogCriterion.id)
              criterion.analysisCriterions?.requirementCriterions?.forEach((req) => {
                const catalogReq = catalogCriterion.requirementCriterionCatalog.find(
                  (r) => r.name === req.name
                )
                if (catalogReq) {
                  selectedKeys.push(catalogReq.id)
                }
              })
            }
          })
        }
      })

      setCheckedKeys(selectedKeys)
      const filtered = filterTree(treeData, selectedKeys)
      setCatalogSelected(filtered as TreeData)
    } else if (!id) {
      setCatalogSelected([])
      setCheckedKeys([])
    }
  }, [treeData, id, existingStandards, dataCatalog])

  // Reset tree khi đổi loại kho
  useEffect(() => {
    setCheckedKeys([])
    setCatalogSelected([])
  }, [])

  const onCheck = (checked: string[]) => {
    setCheckedKeys(checked)
    const filtered = filterTree(treeData, checked as string[])
    setCatalogSelected(filtered as TreeData)
  }

  const handleSelectAll = () => {
    const allKeys = getAllKeys(treeData)
    setCheckedKeys(allKeys)
    setCatalogSelected(treeData)
  }

  const handleDeselectAll = () => {
    setCheckedKeys([])
    const filtered = filterTree(treeData, [])
    setCatalogSelected(filtered as TreeData)
  }

  const onOk = async () => {
    // Validate: Bắt buộc phải chọn kho tiêu chuẩn
    if (!objectTypeWatch) {
      message.error("Vui lòng chọn kho tiêu chuẩn")
      return
    }

    // Validate: Bắt buộc phải chọn ít nhất một tiêu chuẩn
    if (catalogSelected.length === 0) {
      message.error("Vui lòng chọn ít nhất một tiêu chuẩn")
      return
    }

    const standards = catalogSelected.map((s, i1) => {
      const standardId = createId()
      const criteria = s.children.map((c, i2) => {
        const criterionPeriodId = createId()
        const analysisCriterionId = createId()
        const evaluationCriterionId = createId()

        const requirements = c.children.map(({ name, questions }, i3) => ({
          analysisCriterionId,
          id: createId(),
          order: i3 + 1,
          name,
          questions,
        }))
        return {
          criterionPeriodId,
          analysisCriterionId,
          evaluationCriterionId,
          order: i2 + 1,
          name: c.name,
          requirements,
        }
      })

      return {
        periodId: selectedEvaluationPeriodId,
        id: standardId,
        name: s.name,
        order: i1 + 1,
        criteria,
      }
    })

    try {
      showSpinner()
      const createOperations = [
        {
          model: "StandardPeriod" as const,
          operation: "createMany" as const,
          data: {
            data: standards.map(({ criteria, ...standard }) => standard),
          },
        },
        {
          model: "CriterionPeriod" as const,
          operation: "createMany" as const,
          data: {
            data: standards.flatMap((standard) =>
              standard.criteria.map(
                ({
                  requirements,
                  analysisCriterionId,
                  evaluationCriterionId,
                  criterionPeriodId,
                  ...criterion
                }) => ({
                  id: criterionPeriodId,
                  evaluationStandardId: standard.id,
                  ...criterion,
                })
              )
            ),
          },
        },
        {
          model: "AnalysisCriterion" as const,
          operation: "createMany" as const,
          data: {
            data: standards.flatMap((standard) =>
              standard.criteria.map(({ analysisCriterionId, criterionPeriodId }) => ({
                id: analysisCriterionId,
                criterionPeriodId,
              }))
            ),
          },
        },
        {
          model: "EvaluationCriterion" as const,
          operation: "createMany" as const,
          data: {
            data: standards.flatMap((standard) =>
              standard.criteria.map(({ evaluationCriterionId, criterionPeriodId }) => ({
                id: evaluationCriterionId,
                criterionPeriodId,
              }))
            ),
          },
        },
        {
          model: "RequirementCriterion" as const,
          operation: "createMany" as const,
          data: {
            data: standards.flatMap((standard) =>
              standard.criteria.flatMap(({ requirements }) => requirements)
            ),
          },
        },
        {
          model: "EvaluationPeriod" as const,
          operation: "update" as const,
          data: {
            where: {
              id: selectedEvaluationPeriodId,
            },
            data: {
              status: $Enums.EvaluationPeriodStatus.ASSIGNMENT,
            },
          },
        },
      ]
      const operations = id
        ? [
            {
              model: "RequirementCriterion" as const,
              operation: "deleteMany" as const,
              data: {
                where: {
                  analysisCriterion: {
                    criterionPeriod: {
                      evaluationStandard: {
                        periodId: selectedEvaluationPeriodId,
                      },
                    },
                  },
                },
              },
            },
            {
              model: "AnalysisCriterion" as const,
              operation: "deleteMany" as const,
              data: {
                where: {
                  criterionPeriod: {
                    evaluationStandard: {
                      periodId: selectedEvaluationPeriodId,
                    },
                  },
                },
              },
            },
            {
              model: "EvaluationCriterion" as const,
              operation: "deleteMany" as const,
              data: {
                where: {
                  criterionPeriod: {
                    evaluationStandard: {
                      periodId: selectedEvaluationPeriodId,
                    },
                  },
                },
              },
            },
            {
              model: "CriterionPeriod" as const,
              operation: "deleteMany" as const,
              data: {
                where: {
                  evaluationStandard: {
                    periodId: selectedEvaluationPeriodId,
                  },
                },
              },
            },
            {
              model: "StandardPeriod" as const,
              operation: "deleteMany" as const,
              data: {
                where: {
                  periodId: selectedEvaluationPeriodId,
                },
              },
            },
            ...createOperations,
          ]
        : createOperations

      const res = await sqlTransaction(operations)

      if (res.status !== 200) {
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
        return
      }

      message.success(id ? "Cập nhật thành công" : "Thêm mới thành công")

      if (refetch) {
        refetch()
      }

      onClose()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      form={form}
      title={id ? "Chỉnh sửa tiêu chuẩn tiêu chí" : "Thêm tiêu chuẩn tiêu chí"}
      open={isOpen}
      onCancel={onClose}
      className="w-[50vw] top-2"
      onFinish={onOk}
    >
      <Col span={24}>
        <FormItem form={form} name="objectType" label="Chọn kho tiêu chuẩn" required>
          <Select
            placeholder="Chọn loại kho"
            options={STANDARD_CATALOG_TYPE_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            allowClear
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="standardSetId" label="Chọn bộ tiêu chuẩn, tiêu chí" required>
          <Select
            placeholder="Chọn bộ tiêu chuẩn, tiêu chí"
            options={evaluationStandardSets.map((set) => ({
              label: set.name,
              value: set.id,
            }))}
            disabled={!objectTypeWatch}
            allowClear
          />
        </FormItem>
      </Col>

      {standardSetWatch && (
        <Col span={24}>
          <Form.Item label="Tiêu chuẩn đánh giá của đợt" required>
            <div className="mb-2 flex gap-2">
              <Button type="link" onClick={handleSelectAll} className="p-0">
                Chọn tất cả
              </Button>
              <Button type="link" onClick={handleDeselectAll} className="p-0" danger>
                Bỏ chọn tất cả
              </Button>
            </div>
            <Tree
              checkable
              checkedKeys={checkedKeys}
              treeData={treeData}
              onCheck={(checked) => onCheck(checked as string[])}
            />
          </Form.Item>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutTieuChuanTieuChi
