import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import type { StudentSubjectScore, SubjectVersion } from "@workspace/db/client"
import {
  useCreateManyStudentSubjectScore,
  useDeleteManyStudentSubjectScore,
  useFindManyStudentSubjectScore,
  useFindManySubjectVersion,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Col, Form, InputNumber, message } from "antd"
import { useWatch } from "antd/es/form/Form"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type NhapDiemFormType = {
  subjectClassStudent: StudentSubjectScore[]
  listSelected: SubjectVersion[]
}
dayjs.locale("vi")
const NhapDiemThuCong = () => {
  const [form] = Form.useForm<NhapDiemFormType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "NhapDiemThuCong",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: createManyStudentSubjectScore } = useCreateManyStudentSubjectScore()
  const { mutateAsync: deleteManyStudentSubjectScore } = useDeleteManyStudentSubjectScore()
  const { data: studentSubjectScoreData = [] } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId: id,
        manualFinalScore: {
          gt: 0,
        },
      },
      include: {
        subjectVersion: true,
      },
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  )
  async function onOk(output?: NhapDiemFormType) {
    if (!output) return
    if (output?.subjectClassStudent?.length <= 0) {
      message.error("Vui lòng thêm môn nhập điểm")
      return
    }
    const validate = output?.subjectClassStudent.find((i) => !i.manualFinalScore)
    if (validate) {
      message.error("Vui lòng nhập điểm")
      return
    }
    try {
      showSpinner()
      await sqlTransaction([
        {
          model: "StudentSubjectScore",
          operation: "deleteMany",
          data: {
            where: {
              studentId: id as string,
              manualFinalScore: { gt: 0 },
            },
          },
        },
        {
          model: "StudentSubjectScore",
          operation: "createMany",
          data: {
            data:
              output?.subjectClassStudent.map((i) => ({
                studentId: id as string,
                subjectVersionId: i?.id as string,
                finalScore: i?.manualFinalScore as number,
                manualFinalScore: i?.manualFinalScore as number,
              })) || [],
          },
        },
      ])
      message.success("Thêm điểm thành công")
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

  const { data: listSubjectVersion = [] } = useFindManySubjectVersion()

  const onChange = (option: SubjectVersion[]) => {
    form.setFieldsValue({
      subjectClassStudent: option,
    })
  }

  const subjectClassStudentData = useWatch("subjectClassStudent", form) || []

  useEffect(() => {
    if (
      studentSubjectScoreData &&
      studentSubjectScoreData.length > 0 &&
      subjectClassStudentData.length === 0
    ) {
      form.setFieldsValue({
        listSelected: studentSubjectScoreData.map((i) => i.subjectVersion),
        subjectClassStudent: studentSubjectScoreData,
      })
    }
  }, [studentSubjectScoreData, form, subjectClassStudentData])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Nhập điểm trực tiếp"}
      className="w-[1000px]"
    >
      <Col span={24}>
        <FormItem form={form} name="listSelected">
          <Select
            mode="multiple"
            allowClear
            placeholder="Chọn môn học"
            options={listSubjectVersion.map((item) => {
              return {
                ...item,
                key: item.id,
                value: item.id,
                label: item.name,
              }
            })}
            onChange={(value, option) => {
              onChange(option as SubjectVersion[])
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="subjectClassStudent">
          <Table
            // filters={filters}
            // setFilters={setFilters}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã môn học",
                dataIndex: "code",
                type: "input",
                width: 150,
              },
              {
                title: "Tên môn học",
                dataIndex: "name",
                type: "input",
              },
              {
                title: "Điểm",
                dataIndex: "name",
                type: "input",
                width: 200,
                render: (record, __, index) => (
                  <Form.Item
                    className="w-full mb-0"
                    name={["subjectClassStudent", index, "manualFinalScore"]}
                    label=""
                  >
                    <InputNumber min={1} max={10} className="w-full" placeholder="Nhập điểm" />
                  </Form.Item>
                ),
              },
            ]}
            data={subjectClassStudentData}
            pagination={false}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default NhapDiemThuCong
