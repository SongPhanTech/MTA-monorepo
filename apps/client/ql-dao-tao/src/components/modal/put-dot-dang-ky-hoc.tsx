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
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { invalidateRegistrationCaches } from "@workspace/libs/api/invalidate-class-register-cache"
import { Col, Form, Input, InputNumber, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutClassRegisterSession = ClassRegisterSession & {
  trainingCourses: string[]
  creditLimit: Record<
    string,
    {
      baseScore: $Enums.AcademicRankingBaseType
      base10Min: number | null
      base10Max: number | null
      base4Min: number | null
      base4Max: number | null
      minCredit: number | null
      maxCredit: number | null
    }
  >
}
dayjs.locale("vi")

const getClassificationKey = (baseMin: number | null, baseMax: number | null) => {
  return `${baseMin ?? 0}-${baseMax ?? 0}`
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

  const tableData = useMemo(
    () => trainingCourses.flatMap((e) => e.academicRankingConvert).uniqueByKey("classification"),
    [trainingCourses]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
        trainingCourses: initialValue?.trainingCourses?.map((item) => item.id),
        startDate: dayjs(initialValue?.startDate),
        endDate: dayjs(initialValue?.endDate),
        creditLimit: initialValue.creditLimit.reduce(
          (pre, cur) => ({
            ...pre,
            [getClassificationKey(
              cur.baseScore === "Base10" ? cur.base10Min : cur.base4Min,
              cur.baseScore === "Base10" ? cur.base10Max : cur.base4Max
            )]: {
              minCredit: cur.minCredit,
              maxCredit: cur.maxCredit,
              baseScore: cur.baseScore,
              base10Min: cur.base10Min,
              base10Max: cur.base10Max,
              base4Min: cur.base4Min,
              base4Max: cur.base4Max,
            },
          }),
          {}
        ),
      })
    } else if (tableData.length > 0) {
      form.setFieldsValue({
        active: true,
        tuitionPerCredit: 350000,
        creditLimit: tableData.reduce(
          (pre, cur) => ({
            ...pre,
            [getClassificationKey(
              cur.baseScore === "Base10" ? cur.base10Min : cur.base4Min,
              cur.baseScore === "Base10" ? cur.base10Max : cur.base4Max
            )]: {
              minCredit: 0,
              maxCredit: 25,
              baseScore: cur.baseScore,
              base10Min: cur.base10Min,
              base10Max: cur.base10Max,
              base4Min: cur.base4Min,
              base4Max: cur.base4Max,
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
  async function onOk(output?: PutClassRegisterSession) {
    console.log("output: ", output)

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
      if (id) {
        await deleteManyClassRegisterSessionCredit({
          where: { classRegisterSessionId: id },
        })
        // Ghép lại metadata xếp loại (baseScore, min/max) từ bảng xếp loại —
        // Form chỉ bind maxCredit nên submit có thể thiếu field → match GPA sai / cache cũ.
        const creditLimitCreates = Object.entries(output.creditLimit || {}).map(([key, item]) => {
          const fromTable = tableData.find((row) => {
            const rowKey = getClassificationKey(
              row.baseScore === "Base10" ? row.base10Min : row.base4Min,
              row.baseScore === "Base10" ? row.base10Max : row.base4Max
            )
            return rowKey === key
          })
          return {
            baseScore:
              item.baseScore ?? fromTable?.baseScore ?? $Enums.AcademicRankingBaseType.Base10,
            base10Min: item.base10Min ?? fromTable?.base10Min ?? null,
            base10Max: item.base10Max ?? fromTable?.base10Max ?? null,
            base4Min: item.base4Min ?? fromTable?.base4Min ?? null,
            base4Max: item.base4Max ?? fromTable?.base4Max ?? null,
            minCredit: item.minCredit ?? 0,
            maxCredit: item.maxCredit ?? 25,
          }
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
        const creditLimitCreates = Object.entries(output.creditLimit || {}).map(([key, item]) => {
          const fromTable = tableData.find((row) => {
            const rowKey = getClassificationKey(
              row.baseScore === "Base10" ? row.base10Min : row.base4Min,
              row.baseScore === "Base10" ? row.base10Max : row.base4Max
            )
            return rowKey === key
          })
          return {
            baseScore:
              item.baseScore ?? fromTable?.baseScore ?? $Enums.AcademicRankingBaseType.Base10,
            base10Min: item.base10Min ?? fromTable?.base10Min ?? null,
            base10Max: item.base10Max ?? fromTable?.base10Max ?? null,
            base4Min: item.base4Min ?? fromTable?.base4Min ?? null,
            base4Max: item.base4Max ?? fromTable?.base4Max ?? null,
            minCredit: item.minCredit ?? 0,
            maxCredit: item.maxCredit ?? 25,
          }
        })
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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đợt đăng ký học" : "Thêm mới đợt đăng ký học"}
      className="w-[50vw]"
    >
      {/* <Col span={12}>
                <FormItem form={form} name="code" label="Mã đợt đăng ký" required>
                    <Input placeholder="Nhập mã đợt đăng ký" />
                </FormItem>
            </Col> */}
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
        <span>Giới hạn đăng ký tín chỉ</span>
        <Table
          data={tableData}
          columns={[
            {
              title: "Xếp loại",
              align: "center",
              dataIndex: "classification",
            },
            {
              title: "Từ điểm",
              align: "center",
              render: (_, record) =>
                record?.baseScore === $Enums.AcademicRankingBaseType.Base10
                  ? record?.base10Min
                  : record?.base4Min,
            },
            {
              title: "Đến điểm",
              align: "center",
              render: (_, record) =>
                record?.baseScore === $Enums.AcademicRankingBaseType.Base10
                  ? record?.base10Max
                  : record?.base4Max,
            },
            // {
            //   title: "TC Tối thiểu",
            //   align: "center",
            //   render: (_, record) => (
            //     <FormItem
            //       form={form}
            //       label="Tín chỉ tối thiểu"
            //       name={[
            //         "creditLimit",
            //         getClassificationKey(
            //           record.baseScore === "Base10" ? record.base10Min : record.base4Min,
            //           record.baseScore === "Base4" ? record.base10Max : record.base4Max
            //         ),
            //         "minCredit",
            //       ]}
            //     >
            //       <InputNumber
            //         className="w-full"
            //         min={0}
            //         // defaultValue={0}
            //         placeholder="Nhập tín chỉ tối thiểu"
            //       />
            //     </FormItem>
            //   ),
            // },
            {
              title: "TC Tối đa",
              align: "center",
              render: (_, record) => (
                <FormItem
                  form={form}
                  // label="Tín chỉ tối đa"
                  name={[
                    "creditLimit",
                    getClassificationKey(
                      record.baseScore === "Base10" ? record.base10Min : record.base4Min,
                      record.baseScore === "Base10" ? record.base10Max : record.base4Max
                    ),
                    "maxCredit",
                  ]}
                >
                  <InputNumber
                    className="w-full"
                    min={0}
                    // defaultValue={25}
                    placeholder="Nhập tín chỉ tối đa"
                  />
                </FormItem>
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
