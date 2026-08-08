import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { $Enums, type ClassRegisterSession, type TrainingCourse } from "@workspace/db/client"
import {
  useCreateClassRegisterSession,
  useDeleteManyClassRegisterSessionCredit,
  useFindManyTrainingCourse,
  useFindUniqueClassRegisterSession,
  useUpdateClassRegisterSession,
} from "@workspace/db/hooks"
import { invalidateRegistrationCaches } from "@workspace/libs/api/invalidate-class-register-cache"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, InputNumber, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutClassRegisterSession = ClassRegisterSession & {
  trainingCourses: string[]
  /** Key = tên xếp loại; mỗi bậc nhập TC tối đa riêng cho hệ 4 và hệ 10 */
  creditLimit: Record<
    string,
    {
      classification: string
      base4Min: number | null
      base4Max: number | null
      base10Min: number | null
      base10Max: number | null
      maxCreditBase4: number | null
      maxCreditBase10: number | null
    }
  >
}

type CreditLimitTableRow = {
  classification: string
  rankOrder: number
  base4Min: number | null
  base4Max: number | null
  base10Min: number | null
  base10Max: number | null
}

dayjs.locale("vi")

const formatScoreRange = (min: number | null, max: number | null) => {
  if (min == null && max == null) return "—"
  if (min == null) return `≤ ${max}`
  if (max == null) return `≥ ${min}`
  return `${min} – ${max}`
}

const PutClassRegisterSession = () => {
  const [form] = Form.useForm<PutClassRegisterSession>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutClassRegisterSession",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { id: semesterId } = useSemesterStore()
  const { data: initialValue } = useFindUniqueClassRegisterSession(
    { where: { id }, include: { trainingCourses: true, creditLimit: true } },
    { enabled: !!id }
  )

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: trainingCourses = [] } = useFindManyTrainingCourse({
    where: {
      active: true,
      trainingObjectTypeId,
    },
    include: {
      academicRankingConvert: {
        select: {
          classification: true,
          base10Max: true,
          base10Min: true,
          base4Max: true,
          base4Min: true,
          baseScore: true,
          rankOrder: true,
        },
        where: {
          context: "STUDYING",
        },
        orderBy: {
          rankOrder: "asc",
        },
      },
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  /**
   * Gộp bậc xếp loại từ cấu hình các khóa trong đợt.
   * Khoảng điểm chỉ đọc — user chỉ nhập TC tối đa cho từng hệ.
   */
  const tableData = useMemo(() => {
    const byClassification = new Map<string, CreditLimitTableRow>()

    for (const course of trainingCourses) {
      for (const rank of course.academicRankingConvert) {
        const key = rank.classification
        const existing = byClassification.get(key) ?? {
          classification: key,
          rankOrder: rank.rankOrder,
          base4Min: null,
          base4Max: null,
          base10Min: null,
          base10Max: null,
        }

        existing.rankOrder = Math.min(existing.rankOrder, rank.rankOrder)

        if (rank.baseScore === $Enums.AcademicRankingBaseType.Base4) {
          existing.base4Min = rank.base4Min ?? existing.base4Min
          existing.base4Max = rank.base4Max ?? existing.base4Max
        } else if (rank.baseScore === $Enums.AcademicRankingBaseType.Base10) {
          existing.base10Min = rank.base10Min ?? existing.base10Min
          existing.base10Max = rank.base10Max ?? existing.base10Max
        } else {
          existing.base4Min = rank.base4Min ?? existing.base4Min
          existing.base4Max = rank.base4Max ?? existing.base4Max
          existing.base10Min = rank.base10Min ?? existing.base10Min
          existing.base10Max = rank.base10Max ?? existing.base10Max
        }

        byClassification.set(key, existing)
      }
    }

    return [...byClassification.values()].sort((a, b) => a.rankOrder - b.rankOrder)
  }, [trainingCourses])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      const saved = initialValue.creditLimit

      const creditLimit = tableData.reduce(
        (pre, row) => {
          const savedBase4 = saved.find(
            (cur) =>
              cur.baseScore === $Enums.AcademicRankingBaseType.Base4 &&
              cur.base4Min === row.base4Min &&
              cur.base4Max === row.base4Max
          )
          const savedBase10 = saved.find(
            (cur) =>
              cur.baseScore === $Enums.AcademicRankingBaseType.Base10 &&
              cur.base10Min === row.base10Min &&
              cur.base10Max === row.base10Max
          )
          // Fallback dữ liệu cũ: 1 bản ghi / bậc, chỉ có 1 hệ
          const legacy =
            savedBase4 ||
            savedBase10 ||
            saved.find(
              (cur) =>
                (row.base4Min != null && cur.base4Min === row.base4Min) ||
                (row.base10Min != null && cur.base10Min === row.base10Min)
            )

          return {
            ...pre,
            [row.classification]: {
              classification: row.classification,
              base4Min: row.base4Min,
              base4Max: row.base4Max,
              base10Min: row.base10Min,
              base10Max: row.base10Max,
              maxCreditBase4:
                savedBase4?.maxCredit ??
                (legacy?.baseScore === $Enums.AcademicRankingBaseType.Base4
                  ? legacy.maxCredit
                  : null) ??
                (row.base4Min != null ? 25 : null),
              maxCreditBase10:
                savedBase10?.maxCredit ??
                (legacy?.baseScore === $Enums.AcademicRankingBaseType.Base10
                  ? legacy.maxCredit
                  : null) ??
                (row.base10Min != null ? 25 : null),
            },
          }
        },
        {} as PutClassRegisterSession["creditLimit"]
      )

      form.setFieldsValue({
        ...initialValue,
        trainingCourses: initialValue?.trainingCourses?.map((item) => item.id),
        startDate: dayjs(initialValue?.startDate),
        endDate: dayjs(initialValue?.endDate),
        creditLimit,
      })
    } else if (tableData.length > 0) {
      form.setFieldsValue({
        active: true,
        tuitionPerCredit: 350000,
        creditLimit: tableData.reduce(
          (pre, row) => ({
            ...pre,
            [row.classification]: {
              classification: row.classification,
              base4Min: row.base4Min,
              base4Max: row.base4Max,
              base10Min: row.base10Min,
              base10Max: row.base10Max,
              maxCreditBase4: row.base4Min != null || row.base4Max != null ? 25 : null,
              maxCreditBase10: row.base10Min != null || row.base10Max != null ? 25 : null,
            },
          }),
          {}
        ),
      })
    }
  }, [initialValue, tableData])

  const { mutateAsync: createClassRegisterSession } = useCreateClassRegisterSession()
  const { mutateAsync: updateClassRegisterSession } = useUpdateClassRegisterSession()
  const { mutateAsync: deleteManyClassRegisterSessionCredit } =
    useDeleteManyClassRegisterSessionCredit()

  /** Mỗi bậc → tối đa 2 bản ghi: Base4 + Base10 (nếu có khoảng điểm tương ứng). */
  const buildCreditLimitCreates = (creditLimit: PutClassRegisterSession["creditLimit"]) => {
    const creates: Array<{
      baseScore: $Enums.AcademicRankingBaseType
      base4Min: number | null
      base4Max: number | null
      base10Min: number | null
      base10Max: number | null
      minCredit: number
      maxCredit: number
    }> = []

    for (const [key, item] of Object.entries(creditLimit || {})) {
      const fromTable = tableData.find((row) => row.classification === key)
      const base4Min = item.base4Min ?? fromTable?.base4Min ?? null
      const base4Max = item.base4Max ?? fromTable?.base4Max ?? null
      const base10Min = item.base10Min ?? fromTable?.base10Min ?? null
      const base10Max = item.base10Max ?? fromTable?.base10Max ?? null

      if (base4Min != null || base4Max != null) {
        creates.push({
          baseScore: $Enums.AcademicRankingBaseType.Base4,
          base4Min,
          base4Max,
          base10Min: null,
          base10Max: null,
          minCredit: 0,
          maxCredit: item.maxCreditBase4 ?? 25,
        })
      }

      if (base10Min != null || base10Max != null) {
        creates.push({
          baseScore: $Enums.AcademicRankingBaseType.Base10,
          base4Min: null,
          base4Max: null,
          base10Min,
          base10Max,
          minCredit: 0,
          maxCredit: item.maxCreditBase10 ?? 25,
        })
      }
    }

    return creates
  }

  async function onOk(output?: PutClassRegisterSession) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        code: output.code,
        name: output.name.trim(),
        startDate: dayjs(output.startDate).toDate(),
        endDate: dayjs(output.endDate).toDate(),
        semesterId: semesterId || "",
        active: output.active,
        description: output.description,
        tuitionPerCredit: output.tuitionPerCredit || 0,
      }
      const creditLimitCreates = buildCreditLimitCreates(output.creditLimit)

      if (id) {
        await deleteManyClassRegisterSessionCredit({
          where: { classRegisterSessionId: id },
        })
        await updateClassRegisterSession({
          data: {
            ...data,
            trainingCourses: {
              set:
                output.trainingCourses?.length > 0
                  ? output.trainingCourses.map((item) => ({ id: item }))
                  : [],
            },
            creditLimit: {
              create: creditLimitCreates,
            },
          },
          where: { id },
        })
        try {
          await invalidateRegistrationCaches(id)
        } catch (cacheErr) {
          console.warn("Không reset được cache cổng đăng ký", cacheErr)
        }
        message.success("Cập nhật thành công")
      } else {
        const created = await createClassRegisterSession({
          data: {
            ...data,
            trainingCourses: {
              connect:
                output.trainingCourses?.length > 0
                  ? output.trainingCourses.map((item) => ({ id: item }))
                  : [],
            },
            creditLimit: {
              create: creditLimitCreates,
            },
          },
        })
        if (created?.id) {
          try {
            await invalidateRegistrationCaches(created.id)
          } catch (cacheErr) {
            console.warn("Không reset được cache cổng đăng ký", cacheErr)
          }
        }
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["ClassRegisterSessions"],
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

  const maxCreditField = (
    classification: string,
    field: "maxCreditBase4" | "maxCreditBase10",
    disabled: boolean
  ) => (
    <FormItem form={form} name={["creditLimit", classification, field]} className="mb-0">
      <InputNumber
        className="w-full"
        min={0}
        step={1}
        precision={0}
        disabled={disabled}
        placeholder={disabled ? "—" : "TC tối đa"}
      />
    </FormItem>
  )

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đợt đăng ký học" : "Thêm mới đợt đăng ký học"}
      className="w-[70vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên đợt đăng ký" required>
          <Input placeholder="Nhập tên đợt đăng ký" />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="trainingCourses" label="Khoá" required>
          <Select
            mode="multiple"
            maxTagCount={"responsive"}
            placeholder="Chọn khoá"
            options={trainingCourses.map((i: TrainingCourse) => ({
              value: i.id,
              label: i.name,
            }))}
            allowClear
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} required name="tuitionPerCredit" label="Học phí (theo tín chỉ)">
          <InputNumber
            className="w-full"
            min={0}
            placeholder="Nhập học phí (theo tín chỉ)"
            suffix="VNĐ"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value ? Number(value?.replace(/(,*)/g, "")) : 0) as unknown as 0}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="startDate" label="Ngày mở đợt" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY HH:mm",
              type: "mask",
            }}
            className="w-full"
            placeholder="Chọn ngày mở đợt"
            showTime={{ format: "HH:mm" }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="endDate" label="Ngày kết thúc đợt" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY HH:mm",
              type: "mask",
            }}
            className="w-full"
            placeholder="Chọn ngày kết thúc đợt"
            showTime={{ format: "HH:mm" }}
            disabledDate={(current) => {
              const startTime = form.getFieldValue("startDate")
              if (!startTime) return false
              return current && current < dayjs(startTime).subtract(1, "d")
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem hidden form={form} name="creditLimit" />
        <div className="mb-2">
          <span className="font-medium">Giới hạn đăng ký tín chỉ</span>
          <div className="text-xs text-gray-500 mt-1">
            Khoảng điểm lấy từ cấu hình xếp loại học tập. Nhập số tín chỉ tối đa riêng cho khóa hệ 4
            và khóa hệ 10. Khi SV đăng ký, hệ thống lấy GPA học kỳ gần nhất và so theo hệ điểm của
            khóa SV.
          </div>
        </div>
        <Table
          data={tableData}
          columns={[
            {
              title: "Xếp loại",
              align: "center",
              width: 120,
              dataIndex: "classification",
            },
            {
              title: "Điểm hệ 4",
              align: "center",
              width: 110,
              render: (_, record) => formatScoreRange(record.base4Min, record.base4Max),
            },
            {
              title: "TC tối đa (hệ 4)",
              align: "center",
              width: 130,
              render: (_, record) =>
                maxCreditField(
                  record.classification,
                  "maxCreditBase4",
                  record.base4Min == null && record.base4Max == null
                ),
            },
            {
              title: "Điểm hệ 10",
              align: "center",
              width: 110,
              render: (_, record) => formatScoreRange(record.base10Min, record.base10Max),
            },
            {
              title: "TC tối đa (hệ 10)",
              align: "center",
              width: 130,
              render: (_, record) =>
                maxCreditField(
                  record.classification,
                  "maxCreditBase10",
                  record.base10Min == null && record.base10Max == null
                ),
            },
          ]}
        />
      </Col>
      {id && (
        <Col span={12}>
          <FormItem form={form} name="active" label="Trạng thái">
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang mở</Radio>
              <Radio value={false}>Đã đóng</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutClassRegisterSession
