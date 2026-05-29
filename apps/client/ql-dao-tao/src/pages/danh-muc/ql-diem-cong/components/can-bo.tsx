import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import useSpinner from "@hooks/spinner"
import { useFindManyOfficerBonusScore, useUpsertOfficerBonusScore } from "@workspace/db/hooks"
import { Button, Col, Form, InputNumber, message, Row } from "antd"
import { useEffect } from "react"

const POSITIONS = [
  { position: "CLASS_MONITOR", label: "Lớp trưởng" },
  { position: "UNION_SECRETARY", label: "Bí thư" },
  { position: "UNION_LEADER", label: "Bí thư LCĐ" },
  { position: "DEPUTY_UNION_SECRETARY", label: "Phó bí thư LCĐ" },
] as const

// điểm cộng theo từng chức vụ, key = position
type FormValues = Record<string, number | undefined>

export default function CanBoBonus() {
  const [form] = Form.useForm<FormValues>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { data = [] } = useFindManyOfficerBonusScore({})
  const { mutateAsync: upsertOfficerBonusScore } = useUpsertOfficerBonusScore()

  useEffect(() => {
    const values: FormValues = {}
    for (const { position } of POSITIONS) {
      values[position] = data.find((d) => d.position === position)?.bonusScore ?? 0
    }
    form.setFieldsValue(values)
  }, [data])

  async function onSave(values: FormValues) {
    try {
      showSpinner()
      await Promise.all(
        POSITIONS.map(({ position }) => {
          const bonusScore = Number(values[position] ?? 0)
          return upsertOfficerBonusScore({
            where: { position },
            create: { position, bonusScore },
            update: { bonusScore },
          })
        })
      )
      queryClient.invalidateQueries({ queryKey: ["OfficerBonusScore"] })
      message.success("Lưu điểm cộng cán bộ thành công")
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Form
      form={form}
      layout="horizontal"
      labelAlign="left"
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      onFinish={onSave}
      className="mt-4 max-w-[640px]"
    >
      <div className="mb-4 text-gray-500">
        Điểm cộng (hệ 10) sẽ tự động cộng vào điểm trung bình học kỳ của sinh viên giữ chức vụ tương
        ứng khi xét học bổng. Điểm hệ 4 được quy đổi tương ứng.
      </div>
      <Row gutter={[16, 0]}>
        {POSITIONS.map(({ position, label }) => (
          <Col span={24} className="mb-4" key={position}>
            <FormItem form={form} name={position} label={label}>
              <InputNumber
                type="number"
                className="w-full"
                min={0}
                max={10}
                step={0.1}
                placeholder="Nhập điểm cộng (hệ 10)"
              />
            </FormItem>
          </Col>
        ))}

        <Col span={24}>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  )
}
