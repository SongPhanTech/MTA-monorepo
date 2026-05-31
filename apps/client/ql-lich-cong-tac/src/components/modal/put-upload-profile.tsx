import { UploadOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { $Enums } from "@workspace/db"
import { Button, Col, Form, message, Upload } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutUploadProfile = {
  file: File
}
const PutUploadProfileModal = () => {
  const [form] = Form.useForm<PutUploadProfile>()
  const {
    isOpen,
    onClose,
    input: code,
  } = useDisclosure<string>({
    tag: "PutUploadProfileModal",
    onClose: form.resetFields,
  })
  const [typeId, _setTypeId] = useState<string>()

  const { showSpinner, hideSpinner } = useSpinner()

  const _userTypeData = $Enums.UserType

  async function onOk(output?: PutUploadProfile) {
    if (!output) return
    try {
      showSpinner()
      const fileList = output.file
      const file = Array.isArray(fileList) ? fileList[0]?.originFileObj : null
      const formData = new FormData()

      formData.append("file", file)
      if (typeId !== undefined) {
        formData.append("type", typeId)
      }
      // const res = await fetchUploadFile(
      //   formData,
      //   "api/UserProfile/upload-excel-create-user-profile"
      // );
      // const data = await res.json();
      // console.log(res.ok);
      // if (res.ok) {
      //   message.success("Tải lên thành công!");
      // } else {
      //   message.error(data.message || "Tải lên thất bại!");
      // }
      // const response = await fetchUploadExcelCreateUserProfile({
      //     body: formData,
      //     headers: {
      //         'Content-Type': 'multipart/form-data',
      //     },
      // })
      // console.log(response)
      message.success("Tải lên thành công!")

      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["UserProfile"],
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
      title={"Tải file nhập thông tin"}
      className="w-[30vw]"
    >
      {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="type"
                    label="Đối tượng"
                    required
                >
                    <Select placeholder='Chọn đối tượng' options={userTypeData.map((i: UserType) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col> */}

      <Col span={24}>
        <FormItem
          form={form}
          name="file"
          label="Tệp Excel"
          required
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            return Array.isArray(e) ? e : e?.fileList
          }}
        >
          <Upload
            beforeUpload={() => false} // Không upload ngay, chỉ chọn file
            maxCount={1} // Chỉ cho chọn 1 file
            accept=".xlsx,.xls" // Chỉ chấp nhận file Excel
          >
            <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
          </Upload>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutUploadProfileModal
