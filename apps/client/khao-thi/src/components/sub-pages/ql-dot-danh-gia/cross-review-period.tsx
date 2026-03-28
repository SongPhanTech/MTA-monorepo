import { RichTextEditor } from "@components/commons/rich-text-editor"
import type { DataTabCrossReviewPeriodType } from "@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/_components/cross-review"
import { Collapse, Form } from "antd"
import { useEffect } from "react"

export type PutRequirementCriterion = {
  criteria: Record<string, any>
  opening: string
  conclusion: string
}

export default function CrossReviewPeriodSubPage({ data }: { data: DataTabCrossReviewPeriodType }) {
  const [form] = Form.useForm<PutRequirementCriterion>()

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        opening: data?.opening || "",
        conclusion: data?.conclusion || "",
        criteria: data?.criteria?.map((item) => ({
          ...item,
          evaluationCriterion: {
            id: item.evaluationCriterion?.id,
            criterionPeriodId: item.evaluationCriterion?.criterionPeriodId,
            currentSituation: item.evaluationCriterion?.currentSituation || "",
            strengths: item.evaluationCriterion?.strengths || "",
            weakness: item.evaluationCriterion?.weakness || "",
            actionPlan: item.evaluationCriterion?.actionPlan || "",
            score: item.evaluationCriterion?.score || "",
          },
        })),
      })
    }
  }, [data, form])

  return (
    <div className="flex flex-col h-[calc(100vh-230px)]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
        <Form form={form} layout="vertical" className="form-evidence">
          <Form.Item label="Mở đầu" name="opening">
            <RichTextEditor id="opening" editable={false} />
          </Form.Item>

          <Form.List name="criteria">
            {(fields) => (
              <>
                {fields.map(({ key, name }, idx: number) => {
                  const item = data.criteria[name]
                  return (
                    <div key={key} style={{ marginBottom: 24 }}>
                      <Collapse
                        items={[
                          {
                            label: (
                              <div>
                                <span className="font-bold">Tiêu chí {item.order}: </span>
                                {item?.name}
                              </div>
                            ),
                            key: item.id,
                            children: (
                              <>
                                <Form.Item
                                  label="1. Mô tả hiện trạng"
                                  name={[name, "evaluationCriterion", "currentSituation"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>

                                <Form.Item
                                  label="2. Điểm mạnh"
                                  name={[name, "evaluationCriterion", "strengths"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>

                                <Form.Item
                                  label="3. Điểm tồn tại"
                                  name={[name, "evaluationCriterion", "weakness"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>

                                <Form.Item
                                  label="4. Kế hoạch hành động"
                                  name={[name, "evaluationCriterion", "actionPlan"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>

                                <Form.Item
                                  label="5. Tự đánh giá"
                                  name={[name, "evaluationCriterion", "score"]}
                                >
                                  <RichTextEditor id={item.id} editable={false} />
                                </Form.Item>
                              </>
                            ),
                          },
                        ]}
                        bordered={true}
                        expandIconPosition="end"
                        className="bg-transparent mb-6"
                      />
                    </div>
                  )
                })}
              </>
            )}
          </Form.List>

          <Form.Item label="Kết luận" name="conclusion">
            <RichTextEditor id="conclusion" editable={false} />
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
