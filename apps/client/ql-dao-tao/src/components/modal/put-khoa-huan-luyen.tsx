import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import type {
  SchoolYear,
  TrainingCourse,
  TrainingCourseRegulation,
  TrainingObjectType,
} from "@workspace/db/client"
import {
  useCreateTrainingCourse,
  useFindManySchoolYear,
  useFindManySemester,
  useFindManyTrainingCourse,
  useFindManyTrainingLanguage,
  useFindUniqueTrainingCourse,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Radio,
  Row,
  Switch,
  Tooltip,
} from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import type { DocumentFile } from "@workspace/db/client"
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from "@workspace/ui"
import { BadgeHelpIcon, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutTrainingCourse = TrainingCourse & {
  schoolYearId: string | undefined
  trainingCourseClone: string | null
  trainingCourseRegulation: TrainingCourseRegulation[]
  documentFiles: DocumentFile[]
}
dayjs.locale("vi")
const PutTrainingCourseModal = () => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [form] = Form.useForm<PutTrainingCourse>()
  const isGeneralInfoLocked = Form.useWatch("isGeneralInfoLocked", form)
  const isRegulationLocked = Form.useWatch("isRegulationLocked", form)
  const isScoreConfigLocked = Form.useWatch("isScoreConfigLocked", form)
  const isRetakeExam = Form.useWatch("isRetakeExam", form)
  const scoreToPass = Form.useWatch("scoreToPass", form)
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingCourseModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [isValidating, setIsValidating] = useState(false)
  const [trainingCourseRegulationDelete, setTrainingCourseRegulation] = useState<
    TrainingCourseRegulation[]
  >([])
  const [document, setDocument] = useState<DocumentFile[]>([])

  const { data: trainingCourses = [] } = useFindManyTrainingCourse({
    where: { trainingObjectTypeId },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission({
    where: { active: true },
    orderBy: { name: "asc" },
  })
  const { data: trainingLanguageData = [] } = useFindManyTrainingLanguage({
    where: { active: true },
    orderBy: { name: "asc" },
  })
  const { data: selectedTrainingCourse } = useFindUniqueTrainingCourse(
    {
      where: {
        id: selectedId,
      },
      include: {
        trainingCourseRegulation: true,
        academicRankingConvert: {
          include: {
            downgradeRules: {
              include: {
                conditions: true,
              },
            },
            rankingCondition: true,
          },
        }, // xếp loại học lực, xếp loại tốt nghiệp
        scholarships: {
          include: {
            criteria: true,
          },
        }, // học bổng
        academicWarningRule: true, // cảnh báo học tập,
        academicActionConfig: {
          include: {
            ruleSets: {
              include: {
                conditions: true,
              },
            },
          },
        }, // xử lý học tập
        scoreConverts: true,
      },
    },
    { enabled: !!selectedId }
  )
  const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
  const checkDuplicateStartSemester = (
    output: PutTrainingCourse
  ): { isDuplicate: boolean; message: string } => {
    const { semesterStartId, trainingObjectTypeId } = output

    if (!semesterStartId || !trainingObjectTypeId) {
      return { isDuplicate: false, message: "" }
    }
    const duplicate = trainingCourses.find(
      (course) =>
        course.id !== id &&
        course.semesterStartId === semesterStartId &&
        course.trainingObjectTypeId === trainingObjectTypeId
    )

    if (duplicate) {
      return {
        isDuplicate: true,
        message: `Đã tồn tại khoá (${duplicate.code} - ${duplicate.name}) bắt đầu ở học kỳ này trong cùng đối tượng đào tạo.`,
      }
    }

    return { isDuplicate: false, message: "" }
  }

  async function performSave(output: PutTrainingCourse) {
    const {
      trainingObjectTypeId,
      semesterStartId,
      trainingCourseClone,
      schoolYearId,
      trainingCourseRegulation,
      trainingLanguageId,
      ...rest
    } = output
    try {
      showSpinner()
      const data = {
        trainingObjectType: { connect: { id: trainingObjectTypeId } },
        semesterStart: { connect: { id: semesterStartId } },
        ...(trainingLanguageId
          ? { trainingLanguage: { connect: { id: trainingLanguageId } } }
          : {}),
        ...rest,
      }
      if (id) {
        const listUpdate = trainingCourseRegulation.filter((i) => i?.id)
        const listCreate = trainingCourseRegulation.filter((i) => !i?.id)

        let listSqlTransaction: any = [
          {
            model: "TrainingCourse",
            operation: "update",
            data: {
              where: {
                id: id,
              },
              data: {
                ...data,
                documentFiles: {
                  upsert: (output.documentFiles || [])
                    .filter((file) => !!file.id)
                    .map((file) => ({
                      where: { id: file.id },
                      create: {
                        name: file.name,
                        path: file.path,
                        mimeType: file.mimeType,
                        size: file.size,
                        curriculum: { connect: { id } },
                      },
                      update: {
                        name: file.name,
                        path: file.path,
                        mimeType: file.mimeType,
                        size: file.size,
                      },
                    })),
                  create: (output.documentFiles || [])
                    .filter((file) => !file.id)
                    .map((file) => ({
                      name: file.name,
                      path: file.path,
                      mimeType: file.mimeType,
                      size: file.size,
                    })),
                  disconnect: document
                    .filter((existing) => !output.documentFiles?.some((f) => f.id === existing.id))
                    .map((file) => ({ id: file.id })),
                },
              },
            },
          },
        ]

        if (listUpdate?.length) {
          listSqlTransaction = [
            ...listSqlTransaction,
            ...listUpdate.map((i) => {
              return {
                model: "TrainingCourseRegulation",
                operation: "update",
                data: {
                  where: {
                    id: i?.id,
                  },
                  data: {
                    ...i,
                    trainingCourseId: id,
                  },
                },
              }
            }),
          ]
        }
        if (listCreate?.length) {
          listSqlTransaction = [
            ...listSqlTransaction,
            ...listCreate.map((i) => {
              return {
                model: "TrainingCourseRegulation",
                operation: "create",
                data: {
                  data: {
                    ...i,
                    trainingCourseId: id,
                  },
                },
              }
            }),
          ]
        }

        if (trainingCourseRegulationDelete?.length) {
          listSqlTransaction = [
            ...listSqlTransaction,
            ...trainingCourseRegulationDelete.map((i) => {
              return {
                model: "TrainingCourseRegulation",
                operation: "delete",
                data: {
                  where: {
                    id: i?.id,
                  },
                },
              }
            }),
          ]
        }

        const res = await sqlTransaction(listSqlTransaction)
        if (res) {
          message.success("Cập nhật thành công")
        }
      } else {
        await createTrainingCourse({
          data: {
            ...data,
            documentFiles: {
              create: (output.documentFiles || []).map((file) => ({
                name: file.name,
                path: file.path,
                mimeType: file.mimeType,
                size: file.size,
              })),
            },
            trainingCourseRegulation: {
              createMany: {
                data: trainingCourseRegulation.map((i) => ({
                  name: i.name,
                  code: i.code,
                  value: i.value,
                  description: i.description,
                })),
              },
            },
            scoreConverts: {
              create: selectedTrainingCourse?.scoreConverts.map((sc) => ({
                classification: sc.classification,
                base10Min: sc.base10Min,
                base10Max: sc.base10Max,
                description: sc.description,
                letter: sc.letter,
                base4: sc.base4,
                pass: sc.pass,
                improvementRegister: sc.improvementRegister,
              })),
            },
            academicRankingConvert: {
              create: selectedTrainingCourse?.academicRankingConvert.map((e) => ({
                baseScore: e.baseScore,
                classification: e.classification,
                context: e.context,
                description: e.description,
                graduated: e.graduated,
                rankOrder: e.rankOrder,
                base10Max: e.base10Max,
                base10Min: e.base10Min,
                base4Max: e.base4Max,
                base4Min: e.base4Min,
                downgradeRules: {
                  create: e.downgradeRules.map((dr) => ({
                    conditions: {
                      create: dr.conditions.map((c) => ({
                        field: c.field,
                        operator: c.operator,
                        // invert: c.invert,
                        value: c.value,
                        tuple: c.tuple,
                      })),
                    },
                  })),
                },
                rankingCondition: {
                  create: e.rankingCondition.map((rc) => ({
                    field: rc.field,
                    operator: rc.operator,
                    // invert: rc.invert,
                    value: rc.value,
                    tuple: rc.tuple,
                  })),
                },
              })),
            },
            scholarships: {
              create: selectedTrainingCourse?.scholarships.map((s) => ({
                name: s.name,
                description: s.description,
                rankOrder: s.rankOrder,
                baseAmount: s.baseAmount,
                multiplier: s.multiplier,
                effectiveFrom: s.effectiveFrom,
                effectiveTo: s.effectiveTo,
                criteria: {
                  create: s.criteria.map((c) => ({
                    field: c.field,
                    operator: c.operator,
                    value: c.value,
                    tuple: c.tuple,
                    bonusValue: c.bonusValue,
                  })),
                },
              })),
            },
            academicWarningRule: {
              create: selectedTrainingCourse?.academicWarningRule.map((awr) => ({
                field: awr.field,
                operator: awr.operator,
                // invert: awr.invert,
                threshold: awr.threshold,
                tuple: awr.tuple,
                severity: awr.severity,
                yearCondition: awr.yearCondition,
                semesterCondition: awr.semesterCondition,
                description: awr.description,
              })),
            },
            academicActionConfig: {
              create: selectedTrainingCourse?.academicActionConfig.map((aac) => ({
                name: aac.name,
                description: aac.description,
                actionType: aac.actionType,
                ruleSets: {
                  create: aac.ruleSets.map((rs) => ({
                    conditions: {
                      create: rs.conditions.map((c) => ({
                        field: c.field,
                        operator: c.operator,
                        // invert: c.invert,
                        value: c.value,
                        tuple: c.tuple,
                        yearCondition: c.yearCondition,
                        isPriorityStudent: c.isPriorityStudent,
                      })),
                    },
                  })),
                },
              })),
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["TrainingCourse"],
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

  async function onOk(output?: PutTrainingCourse) {
    if (!output) return
    const validation = checkDuplicateStartSemester(output)
    if (validation.isDuplicate) {
      Modal.confirm({
        title: "Cảnh báo trùng lặp",
        content: `${validation.message}Bạn có muốn tiếp tục tạo mới không?`,
        okText: "Tiếp tục",
        cancelText: "Hủy",
        onOk() {
          performSave(output)
        },
      })
      return
    }
    await performSave(output)
  }

  const schoolYearIdForm = Form.useWatch("schoolYearId", form)

  const { data: dataSchoolYear = [] } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
  })
  const { data: semesterData = [] } = useFindManySemester({
    where: schoolYearIdForm ? { schoolYearId: schoolYearIdForm } : undefined,
    include: { schoolYear: true },
    orderBy: { startDate: "desc" },
  })
  const { data: trainingCourse } = useFindUniqueTrainingCourse(
    {
      where: { id },
      include: {
        semesterStart: true,
        trainingCourseRegulation: true,
        documentFiles: true,
      },
    },
    {
      enabled: !!id,
    }
  )

  const handleSelectChange = async (value: string) => {
    setSelectedId(value)
  }
  const validateCoefficientSum = useCallback(
    (_: any, value: any) => {
      const coef1 = form.getFieldValue("coef_1") || 0
      const coef2 = form.getFieldValue("coef_2") || 0
      const coef3 = form.getFieldValue("coef_3") || 0

      const sum = Number.parseFloat(coef1) + Number.parseFloat(coef2) + Number.parseFloat(coef3)

      const roundedSum = Math.round(sum * 10) / 10

      if (roundedSum !== 1) {
        return Promise.reject(new Error("Tổng các hệ số phải bằng 1"))
      }

      return Promise.resolve()
    },
    [form]
  )

  const validateCoefficient = useCallback(
    (fieldName: string) => (_: any, value: any) => {
      if (value === undefined || value === null) {
        return Promise.resolve()
      }
      const numValue = Number.parseFloat(value)
      if (Number.isNaN(numValue) || numValue < 0 || numValue > 1) {
        return Promise.reject(new Error("Hệ số phải nằm trong khoảng 0 đến 1"))
      }

      return Promise.resolve()
    },
    []
  )

  // Hàm debounce để tránh gọi validate quá nhiều lần
  const debouncedValidate = useCallback(
    (fields: string[]) => {
      if (isValidating) return

      setIsValidating(true)
      form.validateFields(fields).finally(() => {
        setIsValidating(false)
      })
    },
    [form, isValidating]
  )
  const listForm = Form.useWatch("trainingCourseRegulation", form) ?? []
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (trainingCourse) {
      form.setFieldsValue({
        ...trainingCourse,
        admissionStartDate: trainingCourse.admissionStartDate
          ? dayjs(trainingCourse.admissionStartDate)
          : undefined,
        admissionEndDate: trainingCourse.admissionEndDate
          ? dayjs(trainingCourse.admissionEndDate)
          : undefined,
        schoolYearId: trainingCourse.semesterStart?.schoolYearId,
        examScoreToPass: trainingCourse.examScoreToPass,
      })
      setDocument(trainingCourse?.documentFiles)
    } else if (selectedTrainingCourse) {
      form.setFieldsValue({
        trainingObjectTypeId,
        coef_1: selectedTrainingCourse.coef_1,
        coef_2: selectedTrainingCourse.coef_2,
        coef_3: selectedTrainingCourse.coef_3,
        scoreToTakeExam: selectedTrainingCourse.scoreToTakeExam,
        scoreToPass: selectedTrainingCourse.scoreToPass,
        examScoreToPass: selectedTrainingCourse.examScoreToPass,
        scoreToPassConditional: selectedTrainingCourse.scoreToPassConditional,
        scoreToTakeGraduation: selectedTrainingCourse.scoreToTakeGraduation,
        scoreToPassGraduation: selectedTrainingCourse.scoreToPassGraduation,
        maxTrainingTime: selectedTrainingCourse.maxTrainingTime,
        // regulation: selectedTrainingCourse.regulation,
        trainingCourseRegulation: selectedTrainingCourse.trainingCourseRegulation,
        baseScore: selectedTrainingCourse.baseScore,
        maxReExamScore: selectedTrainingCourse.maxReExamScore,
        reduceReExamScore: selectedTrainingCourse.reduceReExamScore,
        scoreToRetain: selectedTrainingCourse.scoreToRetain,
      })
    } else {
      form.setFieldsValue({
        active: true,
        trainingCourseRegulation: [],
      })
    }
  }, [trainingCourse, selectedTrainingCourse])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa Khoá" : "Thêm mới Khoá"}
      className="w-[1000px]"
      formProps={{
        onValuesChange(changedValues, values) {
          if (changedValues?.semesterStartId && !values.schoolYearId) {
            const semester = semesterData.find((i) => i.id === changedValues?.semesterStartId)
            form.setFieldsValue({
              schoolYearId: semester?.schoolYearId,
            })
          }
        },
      }}
    >
      <Row gutter={16} className="px-6 mt-3">
        <Col span={24} className="flex items-center justify-between text-base font-semibold mb-1">
          <span className="underline-offset-2 underline">Thông tin chung</span>
          <Form.Item name="isGeneralInfoLocked" valuePropName="checked" className="mb-0">
            <Switch checkedChildren="Đã khoá" unCheckedChildren="Cho phép sửa" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="trainingObjectTypeId" label="Đối tượng đào tạo" required>
            <Select
              placeholder="Chọn đối tượng đào tạo"
              options={trainingObjectTypeData.map((i: TrainingObjectType) => {
                return {
                  value: i.id,
                  label: i.name,
                }
              })}
              {...(isGeneralInfoLocked
                ? {
                    showSearch: false,
                    allowClear: false,
                    showArrow: false,
                    open: false,
                  }
                : {})}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="code" label="Mã khoá học" required>
            <Input placeholder="Nhập mã khoá học" readOnly={isGeneralInfoLocked} />
          </FormItem>
        </Col>

        <Col span={8}>
          <FormItem form={form} name="name" label="Tên khoá học" required>
            <Input placeholder="Nhập tên khoá học" readOnly={isGeneralInfoLocked} />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="schoolYearId" label="Năm học bắt đầu">
            <Select
              placeholder="Chọn năm học bắt đầu"
              options={dataSchoolYear.map((i: SchoolYear) => {
                return {
                  value: i.id,
                  label: i.name,
                }
              })}
              {...(isGeneralInfoLocked
                ? {
                    showSearch: false,
                    allowClear: false,
                    showArrow: false,
                    open: false,
                  }
                : {})}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="semesterStartId" label="Kỳ học bắt đầu" required>
            <Select
              placeholder="Chọn kỳ học bắt đầu"
              options={semesterData.map((i) => {
                return {
                  value: i.id,
                  label: [i?.name].filter(Boolean).join(" - "),
                }
              })}
              {...(isGeneralInfoLocked
                ? {
                    showSearch: false,
                    allowClear: false,
                    showArrow: false,
                    open: false,
                  }
                : {})}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} label="Ngôn ngữ đào tạo" name="trainingLanguageId">
            <Select
              placeholder="Chọn ngôn ngữ đào tạo"
              options={trainingLanguageData.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
              {...(isGeneralInfoLocked
                ? {
                    showSearch: false,
                    allowClear: false,
                    showArrow: false,
                    open: false,
                  }
                : {})}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="academicYear" label="Niên khoá">
            <Input placeholder="Nhập niên khoá" readOnly={isGeneralInfoLocked} />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="maxTrainingTime" label="Thời gian đào tạo tối đa">
            <InputNumber
              type="number"
              style={{ width: "100%" }}
              min={0}
              step={1}
              placeholder="Nhập thời gian đào tạo"
              readOnly={isGeneralInfoLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name={"active"} label="Trạng thái" required>
            <Radio.Group buttonStyle="solid" disabled={isGeneralInfoLocked}>
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      </Row>

      <Row gutter={16} className="px-6">
        <Col span={24} className="flex items-center justify-between text-base font-semibold mb-1">
          <span className="underline-offset-2 underline">Quyết định/Quy chế</span>
          <Form.Item name="isRegulationLocked" valuePropName="checked" className="mb-0">
            <Switch checkedChildren="Đã khoá" unCheckedChildren="Cho phép sửa" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="admissionQuota" label="Chỉ tiêu tuyển sinh">
            <InputNumber
              type="number"
              min={0}
              step={1}
              placeholder="300"
              className="w-full"
              readOnly={isRegulationLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="admittedStudent" label="Số lượng trúng tuyển">
            <InputNumber
              type="number"
              min={0}
              step={1}
              placeholder="300"
              className="w-full"
              readOnly={isRegulationLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="enrolledStudent" label="Số lượng nhập học">
            <InputNumber
              type="number"
              min={0}
              step={1}
              placeholder="300"
              className="w-full"
              readOnly={isRegulationLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="admissionStartDate" label="Ngày nhập học">
            <DatePicker
              format={{
                format: "DD/MM/YYYY",
                type: "mask",
              }}
              className="w-full"
              readOnly={isRegulationLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="admissionEndDate" label="Ngày kết thúc">
            <DatePicker
              format={{
                format: "DD/MM/YYYY",
                type: "mask",
              }}
              className="w-full"
              readOnly={isRegulationLocked}
            />
          </FormItem>
        </Col>

        <Col span={8}>
          <FormItem form={form} name="admissionDecision" label="Số QĐ tuyển sinh">
            <Input placeholder="Mã/số QĐ" readOnly={isRegulationLocked} />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="studentRecognitionDecision" label="Số QĐ công nhận SV">
            <Input placeholder="Mã/số QĐ" readOnly={isRegulationLocked} />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem form={form} name="regulation" label="Số QĐ quy chế đào tạo">
            <Input placeholder="Mã/số QĐ" readOnly={isRegulationLocked} />
          </FormItem>
        </Col>

        <Col span={8}>
          <FormItem form={form} name="admissionDecisionNumber" label="Số QĐ trúng tuyển">
            <Input placeholder="Số QĐ" readOnly={isRegulationLocked} />
          </FormItem>
        </Col>
      </Row>

      <Row gutter={[10, 10]} className="px-6">
        <Col span={24} className="flex items-center justify-between text-base font-semibold mb-1 ">
          <span className="underline-offset-2 underline">Thông tin điểm</span>
          <div className="flex items-center gap-3">
            <Form.Item name="isScoreConfigLocked" valuePropName="checked" className="mb-0">
              <Switch checkedChildren="Đã khoá" unCheckedChildren="Cho phép sửa" />
            </Form.Item>
            <Form.Item name="isRetakeExam" valuePropName="checked" className="mb-0">
              <Switch checkedChildren="Cho phép thi lại" unCheckedChildren="Không cho thi lại" />
            </Form.Item>
          </div>
        </Col>
        {!id && (
          <Col span={8}>
            <FormItem
              form={form}
              name="trainingCourseClone"
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="text-primary font-bold">Sao chép tham số cấu hình</span>
                  <Tooltip
                    placement="topLeft"
                    title="Sao chép tài liệu đính kèm, tham số bổ sung, bảng chuyển đổi điểm, xếp loại học tập, học bổng, cảnh báo học tập, xử lý học tập từ Khoá đã chọn sang Khoá hiện tại"
                  >
                    <BadgeHelpIcon size={16} style={{ margin: "0 0 -1px" }} />
                  </Tooltip>
                </div>
              }
            >
              <Select
                placeholder="Chọn khoá để sao chép"
                options={trainingCourses.map((i) => {
                  return {
                    value: i.id,
                    label: i.name,
                  }
                })}
                onChange={handleSelectChange}
                {...(isScoreConfigLocked
                  ? {
                      showSearch: false,
                      allowClear: false,
                      showArrow: false,
                      open: false,
                    }
                  : {})}
              />
            </FormItem>
          </Col>
        )}
        <Col span={8}>
          <FormItem form={form} name="baseScore" label="Hệ điểm" required>
            <Select
              placeholder="Chọn hệ điểm"
              options={[
                {
                  label: "Hệ 10",
                  value: "Base10",
                },
                {
                  label: "Hệ 4",
                  value: "Base4",
                },
              ]}
              {...(isScoreConfigLocked
                ? {
                    showSearch: false,
                    allowClear: false,
                    showArrow: false,
                    open: false,
                  }
                : {})}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="scoreToTakeExam"
            label={
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                Điểm TX/ĐK tối thiểu
                <Tooltip
                  placement="topLeft"
                  title="Điểm thường xuyên, định kỳ tối thiểu để được thi kết thúc học phần. Thấp hơn điểm này sẽ bị cấm thi."
                >
                  <BadgeHelpIcon size={16} style={{ margin: "0 0 -1px" }} />
                </Tooltip>
              </div>
            }
            required
            rules={[
              {
                required: true,
                message: "Vui lòng nhập điểm tối thiểu được thi",
              },
              {
                validator: (_: any, value: any) => {
                  if (value === undefined || value === null) {
                    return Promise.resolve()
                  }
                  const numValue = Number.parseFloat(value)
                  if (Number.isNaN(numValue) || numValue < 0) {
                    return Promise.reject(new Error("Điểm tối thiểu phải lớn hơn 0"))
                  }

                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              // min={0}
              type="number"
              placeholder="Nhập điểm tối thiểu được thi"
              className="w-full"
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="examScoreToPass"
            label={
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                Điểm thi tối thiểu
                <Tooltip
                  placement="topLeft"
                  title="Điểm thi tối thiểu để được qua môn. Nếu điểm thi thấp hơn điểm, điểm học phần sẽ được đặt bằng điểm thi."
                >
                  <BadgeHelpIcon size={16} style={{ margin: "0 0 -1px" }} />
                </Tooltip>
              </div>
            }
            required
            rules={[
              {
                required: true,
                message: "Vui lòng nhập điểm thi tối thiểu để qua",
              },
              {
                validator: (_: any, value: any) => {
                  if (value === undefined || value === null) {
                    return Promise.resolve()
                  }
                  const numValue = Number.parseFloat(value)
                  if (Number.isNaN(numValue) || numValue < 0) {
                    return Promise.reject(new Error("Điểm thi tối thiểu để qua phải lớn hơn 0"))
                  }

                  if (scoreToPass && numValue > scoreToPass) {
                    return Promise.reject(
                      new Error("Điểm thi tối thiểu để qua phải nhỏ hơn điểm qua môn")
                    )
                  }

                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              // min={0}
              type="number"
              placeholder="Nhập điểm thi tối thiểu để qua"
              className="w-full"
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="scoreToPass"
            label="Điểm học phần tối thiểu để qua môn"
            required
            rules={[
              {
                required: true,
                message: "Vui lòng nhập điểm tối thiểu để qua",
              },
              {
                validator: (_: any, value: any) => {
                  if (value === undefined || value === null) {
                    return Promise.resolve()
                  }
                  const numValue = Number.parseFloat(value)
                  if (Number.isNaN(numValue) || numValue < 0) {
                    return Promise.reject(new Error("Điểm tối thiểu để qua phải lớn hơn 0"))
                  }

                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              // min={0}
              type="number"
              placeholder="Nhập điểm tối thiểu để qua"
              className="w-full"
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="scoreToPassConditional"
            label="Điểm học phần tối thiểu để qua môn điều kiện"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập điểm tối thiểu để qua môn điều kiện",
              },
              {
                validator: (_: any, value: any) => {
                  if (value === undefined || value === null) {
                    return Promise.resolve()
                  }
                  const numValue = Number.parseFloat(value)
                  if (Number.isNaN(numValue) || numValue < 0) {
                    return Promise.reject(
                      new Error("Điểm tối thiểu để qua môn điều kiện phải lớn hơn 0")
                    )
                  }

                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              type="number"
              placeholder="Nhập điểm tối thiểu để qua môn điều kiện"
              className="w-full"
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        {/* <Col span={8}>
                    <FormItem
                        form={form}
                        name="scoreToTakeGraduation"
                        label="Điểm liệt môn tốt nghiệp"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập điểm liệt môn tốt nghiệp',
                            },
                            {
                                validator: (_: any, value: any) => {
                                    if (value === undefined || value === null) {
                                        return Promise.resolve()
                                    }
                                    const numValue = Number.parseFloat(value)
                                    if (Number.isNaN(numValue) || numValue < 0) {
                                        return Promise.reject(
                                            new Error('Điểm liệt môn tốt nghiệp phải lớn hơn 0')
                                        )
                                    }

                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Nhập điểm liệt môn tốt nghiệp"
                            className="w-full"
                            readOnly={isScoreConfigLocked}
                        />
                    </FormItem>
                </Col> */}
        <Col span={8}>
          <FormItem
            form={form}
            name="scoreToPassGraduation"
            label="Điểm học phần tối thiểu để qua môn tốt nghiệp"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập điểm để qua môn tốt nghiệp",
              },
              {
                validator: (_: any, value: any) => {
                  if (value === undefined || value === null) {
                    return Promise.resolve()
                  }
                  const numValue = Number.parseFloat(value)
                  if (Number.isNaN(numValue) || numValue < 0) {
                    return Promise.reject(new Error("Điểm để qua môn tốt nghiệp phải lớn hơn 0"))
                  }

                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              type="number"
              placeholder="Nhập điểm để qua môn tốt nghiệp"
              className="w-full"
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="coef_1"
            label="Hệ số điểm thường xuyên"
            rules={[
              {
                validator: validateCoefficient("coef_1"),
              },
            ]}
          >
            <InputNumber
              type="number"
              min={0}
              max={1}
              step={0.1}
              placeholder="Nhập hệ số điểm thường xuyên"
              className="w-full"
              onChange={() => {
                setTimeout(() => debouncedValidate(["coef_2", "coef_3"]), 300)
              }}
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="coef_2"
            label="Hệ số điểm định kỳ"
            rules={[
              {
                validator: validateCoefficient("coef_2"),
              },
            ]}
          >
            <InputNumber
              type="number"
              min={0}
              max={1}
              step={0.1}
              placeholder="Nhập hệ số điểm định kỳ"
              className="w-full"
              onChange={() => {
                setTimeout(() => debouncedValidate(["coef_1", "coef_3"]), 300)
              }}
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="coef_3"
            label="Hệ số điểm điểm thi"
            rules={[
              {
                validator: validateCoefficient("coef_3"),
              },
              {
                validator: validateCoefficientSum,
              },
            ]}
          >
            <InputNumber
              type="number"
              min={0}
              max={1}
              step={0.1}
              placeholder="Nhập hệ số điểm điểm thi"
              className="w-full"
              onChange={() => {
                setTimeout(() => debouncedValidate(["coef_1", "coef_2"]), 300)
              }}
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem
            form={form}
            name="scoreToRetain"
            label={
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                Điểm giữ lại khi lưu ban
                <Tooltip
                  placement="topLeft"
                  title="Những học phần mà năm học trước đã đạt điểm lớn hơn điểm này sẽ được bảo lưu"
                >
                  <BadgeHelpIcon size={16} style={{ margin: "0 0 -1px" }} />
                </Tooltip>
              </div>
            }
            rules={[
              {
                required: true,
                message: "Vui lòng nhập điểm giữ lại khi lưu ban",
              },
              {
                validator: (_: any, value: any) => {
                  if (value === undefined || value === null) {
                    return Promise.resolve()
                  }
                  const numValue = Number.parseFloat(value)
                  if (Number.isNaN(numValue) || numValue < 0) {
                    return Promise.reject(new Error("Điểm giữ lại khi lưu ban phải lớn hơn 0"))
                  }

                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              type="number"
              placeholder="Nhập điểm giữ lại khi lưu ban"
              className="w-full"
              readOnly={isScoreConfigLocked}
            />
          </FormItem>
        </Col>
        {isRetakeExam && (
          <>
            <Col span={8}>
              <FormItem form={form} name="maxReExamScore" label="Điểm học phần tối đa khi thi lại">
                <InputNumber
                  min={0}
                  type="number"
                  placeholder="Nhập điểm tối đa khi thi lại"
                  className="w-full"
                  readOnly={isScoreConfigLocked}
                />
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem
                form={form}
                name="reduceReExamScore"
                label={
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Trừ điểm khi thi lại
                    <Tooltip
                      placement="topLeft"
                      title={
                        <span>
                          Điểm học phần sẽ bị hạ [x] điểm.
                          <br />
                          Cận dưới=Điểm học phần tối thiểu để qua môn
                        </span>
                      }
                    >
                      <BadgeHelpIcon size={16} style={{ margin: "0 0 -1px" }} />
                    </Tooltip>
                  </div>
                }
              >
                <InputNumber
                  min={0}
                  type="number"
                  placeholder="Nhập điểm trừ khi thi lại"
                  className="w-full"
                  readOnly={isScoreConfigLocked}
                />
              </FormItem>
            </Col>
          </>
        )}
      </Row>

      <Col span={24} className="px-6">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold underline-offset-2 underline">
            Tham số bổ sung
          </div>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              form.setFieldsValue({
                trainingCourseRegulation: [
                  ...form.getFieldValue("trainingCourseRegulation"),
                  {
                    code: "",
                    name: "",
                  },
                ],
              })
            }}
            disabled={isScoreConfigLocked}
          >
            Thêm tham số
          </Button>
        </div>
        <FormItem form={form} name="trainingCourseRegulation">
          <Table
            rowKey="id"
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã tham số",
                dataIndex: "code",
                width: 200,
                render: (record, __, index) => (
                  <Form.Item
                    className="w-full mb-0"
                    name={["trainingCourseRegulation", index, "code"]}
                    label=""
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập mã tham số",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập mã tham số" readOnly={isScoreConfigLocked} />
                  </Form.Item>
                ),
              },
              {
                title: "Tên tham số",
                dataIndex: "name",
                render: (record, __, index) => (
                  <Form.Item
                    className="w-full mb-0"
                    name={["trainingCourseRegulation", index, "name"]}
                    label=""
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên tham số",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập tên tham số" readOnly={isScoreConfigLocked} />
                  </Form.Item>
                ),
              },

              {
                title: "Giá trị",
                dataIndex: "value",
                width: 180,
                render: (record, __, index) => (
                  <Form.Item
                    className="w-full mb-0"
                    name={["trainingCourseRegulation", index, "value"]}
                    label=""
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập giá trị",
                      },
                    ]}
                  >
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={10}
                      placeholder="Nhập giá trị"
                      readOnly={isScoreConfigLocked}
                    />
                  </Form.Item>
                ),
              },
              {
                title: "Mô tả chi tiết",
                dataIndex: "description",
                width: 200,
                render: (record, __, index) => (
                  <Form.Item
                    className="w-full mb-0"
                    name={["trainingCourseRegulation", index, "description"]}
                    label=""
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Nhập mô tả chi tiết"
                      readOnly={isScoreConfigLocked}
                    />
                  </Form.Item>
                ),
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                render: (__, record, index: number) => {
                  return (
                    <Row className="justify-center gap-2">
                      {!isScoreConfigLocked && (
                        <Trash2
                          size={16}
                          strokeWidth={1.5}
                          className={"text-red-600 cursor-pointer"}
                          onClick={(e) => {
                            e.stopPropagation()
                            const result = listForm.splice(index, 1)
                            if (record?.id) {
                              setTrainingCourseRegulation([
                                ...trainingCourseRegulationDelete,
                                ...result,
                              ])
                            }
                            form.setFieldsValue({
                              trainingCourseRegulation: listForm,
                            })
                          }}
                        />
                      )}
                    </Row>
                  )
                },
              },
            ]}
            dataSource={form.getFieldValue("trainingCourseRegulation")}
            bordered
            data={listForm}
            pagination={false}
          />
        </FormItem>
        <Col span={24}>
          <FormItem form={form} name="documentFiles" label="Tài liệu đính kèm">
            <DocumentPaths
              form={form}
              data={document}
              relationId={id || ""}
              relationType="trainingCourseId"
              titleForm="documentFiles"
            />
          </FormItem>
        </Col>
      </Col>
    </PutFormModal>
  )
}

export default PutTrainingCourseModal
