import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { subjectVersionTypeOptions } from "@workspace/libs/constants"
import {
  academicActionTypeLabels,
  CRITERIA_CALC_TYPES,
  type CriteriaCalcType,
  criteriaCalcTypeOptions,
  subjectAggregateMetricLabels,
  subjectAttemptTypeLabels,
  warningSourceLabels,
} from "@workspace/libs/criteria-calc"
import {
  useCreateCriteriaDefinition,
  useFindManySubject,
  useFindManyTrainingBlock,
  useFindUniqueCriteriaDefinition,
  useUpdateCriteriaDefinition,
} from "@workspace/db/hooks"
import { Alert, Checkbox, Col, Form, Input, InputNumber, message, Radio } from "antd"
import type { Prisma } from "@workspace/db/client"
import {
  useFindManyTrainingObjectTypePermission,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type CriteriaForm = {
  code?: string
  name: string
  calcType: CriteriaCalcType
  description?: string
  active?: boolean
  trainingBlockIds?: string[]
  subjectIds?: string[]
  params?: Record<string, any>
}

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

const scoreOperatorOptions = [
  { value: "LT", label: "Nhỏ hơn (<)" },
  { value: "LTE", label: "Nhỏ hơn hoặc bằng (<=)" },
  { value: "GT", label: "Lớn hơn (>)" },
  { value: "GTE", label: "Lớn hơn hoặc bằng (>=)" },
  { value: "EQ", label: "Bằng (=)" },
]

/** Bỏ các tham số trống để params lưu gọn và qua được kiểm tra zod ở backend */
function cleanParams(params: Record<string, any> = {}): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== false &&
        !(Array.isArray(value) && value.length === 0)
    )
  )
}

/** Form thêm/sửa tiêu chí tự định nghĩa (CriteriaDefinition.source = CUSTOM) */
const PutCriteriaDefinition = () => {
  const [form] = Form.useForm<CriteriaForm>()
  const calcType = Form.useWatch("calcType", form)
  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<{ id?: string }>({
    tag: "PutCriteriaDefinition",
    onClose: form.resetFields,
  })
  const id = input?.id

  const { data: initialValue } = useFindUniqueCriteriaDefinition(
    {
      where: { id },
      include: { trainingBlocks: { select: { id: true } }, subjects: { select: { id: true } } },
    },
    { enabled: !!id && isOpen }
  )

  // Đối tượng đào tạo: chỉ dùng để lọc danh sách khối kiến thức / môn học (không lưu vào tiêu chí)
  const { id: storeTrainingObjectTypeId } = useTrainingObjectTypeStore()
  const [trainingObjectTypeId, setTrainingObjectTypeId] = useState<string | undefined>()
  useEffect(() => {
    if (isOpen) setTrainingObjectTypeId(storeTrainingObjectTypeId || undefined)
  }, [isOpen, storeTrainingObjectTypeId])
  const { data: trainingObjectTypes = [] } = useFindManyTrainingObjectTypePermission(
    { select: { id: true, name: true } },
    { enabled: isOpen }
  )

  const isSubjectScope = isOpen && calcType === CRITERIA_CALC_TYPES.SUBJECT_AGGREGATE
  // Mục đã lưu (có thể khác đối tượng đang lọc) luôn được nạp để hiển thị đúng tên khi sửa
  const savedBlockIds = useMemo(
    () => initialValue?.trainingBlocks.map((item) => item.id) ?? [],
    [initialValue]
  )
  const savedSubjectIds = useMemo(
    () => initialValue?.subjects.map((item) => item.id) ?? [],
    [initialValue]
  )
  const selectedBlockIds: string[] = Form.useWatch("trainingBlockIds", form) ?? []
  const selectedSubjectIds: string[] = Form.useWatch("subjectIds", form) ?? []
  // Nhãn của mọi mục đã từng hiển thị: mục đã chọn vẫn giữ tên khi đổi bộ lọc
  const labelCache = useRef(new Map<string, { value: string; label: string; searchString?: string }>())

  const { data: trainingBlocks = [] } = useFindManyTrainingBlock(
    {
      where: trainingObjectTypeId
        ? { OR: [{ trainingObjectTypeId }, { id: { in: savedBlockIds } }] }
        : undefined,
      select: { id: true, name: true, code: true, trainingObjectType: { select: { name: true } } },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    },
    { enabled: isSubjectScope }
  )
  const { data: subjects = [] } = useFindManySubject(
    {
      where: trainingObjectTypeId
        ? {
            OR: [
              { subjectVersion: { some: { trainingObjectTypeId } } },
              { id: { in: savedSubjectIds } },
            ],
          }
        : undefined,
      select: {
        id: true,
        code: true,
        name: true,
        subjectVersion: {
          where: trainingObjectTypeId ? { trainingObjectTypeId } : undefined,
          select: { code: true },
        },
      },
      orderBy: { name: "asc" },
    },
    { enabled: isSubjectScope }
  )

  /** Ghép danh sách đang lọc với các mục đã chọn nằm ngoài bộ lọc */
  const withSelected = (
    options: Array<{ value: string; label: string; searchString?: string }>,
    selected: string[]
  ) => {
    for (const option of options) labelCache.current.set(option.value, option)
    const visible = new Set(options.map((option) => option.value))
    const extra = selected
      .filter((value) => !visible.has(value))
      .map((value) => labelCache.current.get(value) ?? { value, label: value })
    return [...options, ...extra]
  }

  const trainingBlockOptions = useMemo(
    () =>
      trainingBlocks.map((item) => ({
        value: item.id,
        label: `${item.code ? `${item.code} - ` : ""}${item.name}${
          trainingObjectTypeId ? "" : ` (${item.trainingObjectType?.name ?? ""})`
        }`,
      })),
    [trainingBlocks, trainingObjectTypeId]
  )
  const subjectOptions = useMemo(
    () =>
      subjects.map((item) => {
        // Mã môn: mã môn gốc nếu có, nếu không thì các mã phiên bản (thuộc đối tượng đang lọc)
        const versionCodes = [...new Set(item.subjectVersion.map((version) => version.code))]
        const codes = item.code ? [item.code] : versionCodes
        const codeLabel = codes.length ? `[${codes.join(", ")}] ` : ""
        return {
          value: item.id,
          label: `${codeLabel}${item.name}`,
          searchString: `${[...codes, ...versionCodes].join(" ")} ${item.name}`,
        }
      }),
    [subjects]
  )

  const { mutateAsync: createCriteria } = useCreateCriteriaDefinition()
  const { mutateAsync: updateCriteria } = useUpdateCriteriaDefinition()

  useEffect(() => {
    if (!isOpen) return
    if (initialValue) {
      form.setFieldsValue({
        code: initialValue.code ?? undefined,
        name: initialValue.name,
        calcType: initialValue.calcType as CriteriaCalcType,
        description: initialValue.description ?? undefined,
        active: initialValue.active,
        trainingBlockIds: initialValue.trainingBlocks.map((item) => item.id),
        subjectIds: initialValue.subjects.map((item) => item.id),
        params: (initialValue.params ?? {}) as Record<string, any>,
      })
    } else if (!id) {
      form.setFieldsValue({
        active: true,
        calcType: CRITERIA_CALC_TYPES.SUBJECT_AGGREGATE,
        params: { metric: "COUNT_SUBJECTS", scoreBase: "Base10" },
      })
    }
  }, [initialValue, id, isOpen, form])

  async function onFinish(values: CriteriaForm) {
    const params = cleanParams(values.params)
    const isSubjectAggregate = values.calcType === CRITERIA_CALC_TYPES.SUBJECT_AGGREGATE
    if (isSubjectAggregate && (params.scoreOperator == null) !== (params.scoreThreshold == null)) {
      message.error("Điều kiện điểm phải có cả toán tử và ngưỡng")
      return
    }
    // Phạm vi môn chỉ áp dụng cho kiểu tính theo môn học
    const trainingBlockIds = isSubjectAggregate ? (values.trainingBlockIds ?? []) : []
    const subjectIds = isSubjectAggregate ? (values.subjectIds ?? []) : []
    const data = {
      code: values.code?.trim() || null,
      name: values.name.trim(),
      calcType: values.calcType,
      params,
      description: values.description,
      active: values.active ?? true,
    }
    try {
      showSpinner()
      if (id) {
        await updateCriteria({
          where: { id },
          data: {
            ...data,
            trainingBlocks: { set: trainingBlockIds.map((item) => ({ id: item })) },
            subjects: { set: subjectIds.map((item) => ({ id: item })) },
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCriteria({
          data: {
            ...data,
            source: "CUSTOM",
            trainingBlocks: { connect: trainingBlockIds.map((item) => ({ id: item })) },
            subjects: { connect: subjectIds.map((item) => ({ id: item })) },
          },
        })
        message.success("Thêm mới thành công")
      }
      onClose()
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onFinish}
      onCancel={onClose}
      width={900}
      title={id ? "Sửa tiêu chí tự định nghĩa" : "Thêm tiêu chí tự định nghĩa"}
      formProps={{
        onValuesChange: (changed) => {
          // đổi kiểu tính → bỏ tham số của kiểu cũ
          // (setFieldValue thay thế hẳn, setFieldsValue sẽ gộp sâu và giữ tham số cũ)
          if ("calcType" in changed) {
            form.setFieldValue(
              "params",
              changed.calcType === CRITERIA_CALC_TYPES.SUBJECT_AGGREGATE
                ? { metric: "COUNT_SUBJECTS", scoreBase: "Base10" }
                : {}
            )
          }
        },
      }}
    >
      <Col span={8}>
        <FormItem form={form} name="code" label="Mã">
          <Input placeholder="VD: SO_MON_THI_TN_DUOI_7" />
        </FormItem>
      </Col>
      <Col span={16}>
        <FormItem form={form} name="name" label="Tên tiêu chí" required>
          <Input placeholder="VD: Số môn thi tốt nghiệp dưới 7.0" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="calcType" label="Kiểu tính" required>
          <Select options={criteriaCalcTypeOptions} allowClear={false} />
        </FormItem>
      </Col>
      {id && (
        <Col span={12}>
          <FormItem form={form} name="active" label="Trạng thái">
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}

      {calcType === CRITERIA_CALC_TYPES.SUBJECT_AGGREGATE && (
        <>
          <Col span={24}>
            <Alert
              type="info"
              showIcon
              className="mb-2"
              message="Tập môn = môn trong CTĐT của sinh viên, lọc theo các điều kiện dưới đây. Mỗi môn chỉ tính một lần."
            />
          </Col>
          <Col span={12}>
            <FormItem form={form} name={["params", "metric"]} label="Giá trị cần tính" required>
              <Select options={toOptions(subjectAggregateMetricLabels)} allowClear={false} />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name={["params", "scoreBase"]} label="Thang điểm">
              <Radio.Group>
                <Radio value="Base10">Hệ 10</Radio>
                <Radio value="Base4">Hệ 4</Radio>
              </Radio.Group>
            </FormItem>
          </Col>
          <Col span={12}>
            <Form.Item label="Đối tượng đào tạo (lọc danh sách)" className="m-0">
              <Select
                value={trainingObjectTypeId}
                onChange={(value) => setTrainingObjectTypeId(value)}
                placeholder="Tất cả đối tượng"
                options={trainingObjectTypes.map((item) => ({ value: item.id, label: item.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="trainingBlockIds" label="Khối kiến thức (gồm khối con)">
              <Select
                mode="multiple"
                placeholder="Bỏ trống = toàn bộ CTĐT"
                options={withSelected(trainingBlockOptions, selectedBlockIds)}
              />
            </FormItem>
          </Col>
          <Col span={24}>
            <FormItem form={form} name="subjectIds" label="Môn học cụ thể (tìm theo mã hoặc tên)">
              <Select
                mode="multiple"
                placeholder="Bỏ trống = không giới hạn môn"
                options={withSelected(subjectOptions, selectedSubjectIds)}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name={["params", "subjectVersionTypes"]}
              label="Loại học phần (VD: Luận văn/đề án = ĐATN)"
            >
              <Select mode="multiple" placeholder="Tất cả" options={subjectVersionTypeOptions} />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name={["params", "attemptTypes"]}
              label="Chỉ môn có lần học thuộc loại"
            >
              <Select
                mode="multiple"
                placeholder="Không lọc"
                options={toOptions(subjectAttemptTypeLabels)}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name={["params", "graduationOnly"]}
              valuePropName="checked"
              label=" "
            >
              <Checkbox>Chỉ môn tốt nghiệp</Checkbox>
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name={["params", "includeConditionalSubjects"]}
              valuePropName="checked"
              label=" "
            >
              <Checkbox>Tính cả môn điều kiện (GDQP, GDTC...)</Checkbox>
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name={["params", "scoreOperator"]} label="Điều kiện điểm môn">
              <Select placeholder="Không lọc theo điểm" options={scoreOperatorOptions} />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name={["params", "scoreThreshold"]} label="Ngưỡng điểm môn">
              <InputNumber className="w-full" min={0} step={0.1} placeholder="VD: 7" />
            </FormItem>
          </Col>
        </>
      )}

      {calcType === CRITERIA_CALC_TYPES.ACADEMIC_DECISION_COUNT && (
        <>
          <Col span={12}>
            <FormItem form={form} name={["params", "actionTypes"]} label="Loại quyết định">
              <Select
                mode="multiple"
                placeholder="Tất cả loại"
                options={toOptions(academicActionTypeLabels)}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <Alert type="info" showIcon message="Chỉ đếm quyết định đã được duyệt." />
          </Col>
        </>
      )}

      {calcType === CRITERIA_CALC_TYPES.WARNING_COUNT && (
        <>
          <Col span={12}>
            <FormItem form={form} name={["params", "sources"]} label="Nguồn">
              <Select
                mode="multiple"
                placeholder="Cả cảnh báo học tập và cảnh cáo học đường"
                options={toOptions(warningSourceLabels)}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name={["params", "minLevel"]} label="Chỉ đếm từ mức">
              <InputNumber className="w-full" min={1} step={1} placeholder="Mặc định: 1" />
            </FormItem>
          </Col>
        </>
      )}

      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="VD: Quy chế khoản 2d – điểm ĐATN dưới 9 đối với loại xuất sắc" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutCriteriaDefinition
