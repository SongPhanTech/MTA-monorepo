import DatePicker from "@components/commons/date-picker"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { DiplomaVerificationApplication, DocumentFile } from "@workspace/db/client"
import { useCreateDiplomaVerificationApplication } from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, Form, Input, InputNumber, message, Row } from "antd"
import { useEffect, useState } from "react"

export type PutDiplomaVerificationApplication = DiplomaVerificationApplication & {
  attachments?: DocumentFile[]
  diplomaFront?: [DocumentFile]
  diplomaBack?: [DocumentFile]
}

export default function ĐONANGKY() {
  const { can, canSome } = useAbility()
  const [form] = Form.useForm<PutDiplomaVerificationApplication>()
  const [attachments, setAttachments] = useState<DocumentFile[]>([])
  const [documentFront, setDocumentFront] = useState<DocumentFile | null>(null)
  const [documentBack, setDocumentBack] = useState<DocumentFile | null>(null)

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createDiplomaVerificationApplication } =
    useCreateDiplomaVerificationApplication()
  async function onOk(output?: PutDiplomaVerificationApplication) {
    if (!output) return
    try {
      showSpinner()

      const data = {
        fullname: output.fullname,
        idCardNumber: output.idCardNumber,
        dateOfBirth: output.dateOfBirth,
        phoneNumber: output.phoneNumber,
        email: output.email,
        reason: output.reason,
        originalDiplomaNumber: output.originalDiplomaNumber,
        diplomaNumber: output.diplomaNumber,
        trainingMajor: output.trainingMajor,
        trainingLevel: output.trainingLevel,
        trainingForm: output.trainingForm,
        trainingCourseStartYear: output.trainingCourseStartYear,
        trainingCourseEndYear: output.trainingCourseEndYear,
        diplomaIssueDate: output.diplomaIssueDate,
        classification: output.classification,
        attachments: {
          create: (output.attachments || []).map((file) => ({
            name: file.name,
            path: file.path,
            mimeType: file.mimeType,
            size: file.size,
          })),
        },
        diplomaFront: output.diplomaFront?.[0]
          ? {
              create: {
                name: output.diplomaFront[0].name,
                path: output.diplomaFront[0].path,
                mimeType: output.diplomaFront[0].mimeType,
                size: output.diplomaFront[0].size,
              },
            }
          : undefined,

        diplomaBack: output.diplomaBack?.[0]
          ? {
              create: {
                name: output.diplomaBack[0].name,
                path: output.diplomaBack[0].path,
                mimeType: output.diplomaBack[0].mimeType,
                size: output.diplomaBack[0].size,
              },
            }
          : undefined,
      }
      await createDiplomaVerificationApplication({
        data,
      })
      form.resetFields()
      message.success("Thêm mới thành công")
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    form.setFieldsValue({
      attachments: [],
      diplomaFront: undefined,
      diplomaBack: undefined,
    })
    setAttachments([])
    setDocumentFront(null)
    setDocumentBack(null)
  }, [])

  return (
    <div className="flex justify-center w-full p-5">
      <div className="max-w-[1300px] w-full">
        <Form form={form} layout="vertical" onFinish={onOk}>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem form={form} name="fullname" label="Họ và tên" required>
                <Input placeholder="Nhập họ và tên" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="idCardNumber" label="Căn cước công dân" required>
                <Input placeholder="Nhập căn cước công dân" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="dateOfBirth" label="Ngày sinh">
                <DatePicker
                  format={{
                    format: "DD/MM/YYYY",
                    type: "mask",
                  }}
                  className="w-full"
                  placeholder="Chọn ngày sinh"
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="phoneNumber" label="Số điện thoại" required>
                <Input placeholder="Nhập số điện thoại" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="email" label="Email" required>
                <Input placeholder="Nhập email" />
              </FormItem>
            </Col>

            <Col span={12}>
              <FormItem form={form} name="diplomaNumber" label="Số hiệu văn bằng" required>
                <Input placeholder="Nhập số hiệu văn bằng" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                form={form}
                name="originalDiplomaNumber"
                label="Số vào sổ gốc văn bằng"
                required
              >
                <Input placeholder="Nhập số vào sổ gốc văn bằng" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="trainingMajor" label="Chuyên ngành đào tạo">
                <Input placeholder="Nhập chuyên ngành đào tạo" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="trainingLevel" label="Bậc đào đạo">
                <Input placeholder="Nhập bậc đào tạo" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="trainingForm" label="Hình thức đào tạo">
                <Input placeholder="Nhập hình thức đào tạo" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="classification" label="Xếp loại tốt nghiệp">
                <Input placeholder="Nhập xếp loại tốt nghiệp" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="trainingCourseStartYear" label="Năm khoá học bắt đầu">
                <InputNumber type="number" min={0} placeholder="Nhập năm bắt đầu" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="trainingCourseEndYear" label="Năm khoá học kết thúc">
                <Input placeholder="Nhập năm kết thúc" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem form={form} name="diplomaIssueDate" label="Ngày cấp bằng">
                <DatePicker
                  format={{
                    format: "DD/MM/YYYY",
                    type: "mask",
                  }}
                  className="w-full"
                  placeholder="Chọn ngày cấp bằng"
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem form={form} name="reason" label="Lý do làm đơn" required>
                <Input.TextArea placeholder="Nhập lý do" />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem form={form} name="attachments" label="Tài liệu đính kèm">
                <DocumentPaths
                  form={form}
                  data={attachments}
                  relationId={""}
                  relationType="diplomaVerificationId"
                  titleForm="attachments"
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem form={form} name="diplomaFront" label="Ảnh mặt trước văn bằng">
                <DocumentPaths
                  form={form}
                  data={documentFront ? [documentFront] : []}
                  relationId={""}
                  relationType="diplomaVerificationFrontId"
                  titleForm={"diplomaFront"}
                  multiple={false}
                  accept="image/*,.pdf"
                  text="ảnh"
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <FormItem form={form} name="diplomaBack" label="Ảnh mặt sau văn bằng">
                <DocumentPaths
                  form={form}
                  data={documentBack ? [documentBack] : []}
                  relationId={""}
                  relationType="diplomaVerificationBackId"
                  titleForm={"diplomaBack"}
                  multiple={false}
                  accept="image/*,.pdf"
                  text="ảnh"
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <Flex justify="end" className="mt-6">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_VAN_BANG_DON_DANG_KY_XAC_MINH, "THEM") && (
                  <Button type="primary" onClick={() => form.submit()}>
                    Tạo đơn
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  )
}

ĐONANGKY.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
