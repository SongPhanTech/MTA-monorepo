import KyThi from "@components/sub-pages/danh-sach-ky-thi"
import NhapDiemPhach from "@components/sub-pages/nhap-diem-phach"
import SinhPhach from "@components/sub-pages/sinh-phach"
import DefaultLayout from "@layouts/default-layout"
import { formatDate } from "@lib/utils"
import { Store, useStore } from "@tanstack/react-store"
import { useFindFirstSubjectClass, useUpdateSubjectClass } from "@workspace/db/hooks"
import { Col, Form, Input, Row, Tabs, type TabsProps } from "antd"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"

export type DiemTheoPhachProps = {
  type?: "DANH_PHACH" | "NHAP_DIEM_THEO_PHACH"
}
type SubmitFormType = {
  isLockExamScore?: boolean
  scoreSubmitted?: boolean
  scoreChecked?: boolean
  isLockExamScoreOld?: boolean
  scoreSubmittedOld?: boolean
  scoreCheckedOld?: boolean
}
export type DiemLopMonHocStoreState = {
  selectedSubjectClassId?: string
}

export const kythiStore = new Store<{
  examId?: string
  subjectClassId?: string[]
}>({
  examId: undefined,
  subjectClassId: [],
})

export const diemPhongThiStore = new Store<{
  selectedExamListId?: string
}>({
  selectedExamListId: undefined,
})

export default function DiemTheoPhach({ type = "NHAP_DIEM_THEO_PHACH" }: DiemTheoPhachProps) {
  const [form] = Form.useForm<SubmitFormType>()
  const [activeKey, setActiveKey] = useState("1")
  const { examId, subjectClassId } = useStore(kythiStore)
  const { data } = useFindFirstSubjectClass(
    {
      where: { examId },
      include: {
        mainLecturer: {
          include: {
            userProfile: true,
          },
        },
        subject: {
          include: {
            managementOrganization: true,
          },
        },
        subjectClassStudent: {
          include: {
            student: {
              include: {
                userProfile: true,
                fixedClass: {
                  include: {
                    trainingCourse: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!examId,
      refetchOnWindowFocus: false,
    }
  )

  const items = useMemo(() => {
    let baseMenu: TabsProps["items"] = [
      {
        label: "Kỳ thi",
        key: "1",
        children: <KyThi setActiveKey={setActiveKey} />,
      },
    ]

    if (type === "DANH_PHACH") {
      baseMenu = [
        ...baseMenu,
        {
          label: "Đánh phách",
          key: "2",
          children: <SinhPhach />,
          disabled: !examId,
        },
      ]
    }

    if (type === "NHAP_DIEM_THEO_PHACH") {
      baseMenu = [
        ...baseMenu,
        {
          label: "Nhập điểm theo phách",
          key: "2",
          children: <NhapDiemPhach />,
          disabled: !examId,
        },
      ]
    }

    return baseMenu
  }, [type, examId])

  const reasonDate = useCallback(() => {
    if (dayjs()?.isAfter(data?.examScoreDeadline) && !data?.enteredExamScore) {
      return (
        <Input
          size="small"
          className="bg-red-600 text-white pointer-events-none"
          placeholder="Hạn nhập điểm"
          value={`Ngoài hạn nhập điểm quá trình, ${formatDate(data?.scoreDeadLineStart || "")} đến ${formatDate(data?.scoreDeadline || "")}`}
        />
      )
    }
    return (
      <Input
        size="small"
        className="pointer-events-none"
        placeholder="Hạn nhập điểm"
        value={`${data?.scoreDeadLineStart && formatDate(data?.scoreDeadLineStart)} đến ${data?.scoreDeadline && formatDate(data?.scoreDeadline || "")}`}
      />
    )
  }, [data])

  const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        isLockExamScore: data?.isLockExamScore,
        scoreSubmitted: data?.scoreSubmitted,
        scoreChecked: data?.scoreChecked,
      })
    }
  }, [data, form])
  return (
    <Row gutter={[16, 4]}>
      <Col span={24}>
        <div className="flex items-center mb-2 w-full">
          <div className="min-w-[150px] w-[150px]">Môn học:</div>
          <div className="w-[300px]">
            <Input
              size="small"
              placeholder="Mã MH"
              className="pointer-events-none"
              value={data?.code}
            />
          </div>
          <div className="ml-3 w-full">
            <Input
              size="small"
              placeholder="Tên môn học"
              className="pointer-events-none"
              value={data?.name}
            />
          </div>
        </div>
        <div className="flex items-center mb-2 w-full">
          <div className="min-w-[150px] w-[150px]">Giảng viên:</div>
          <div className="w-full">
            <Input
              className="w-full pointer-events-none"
              placeholder="Giảng viên"
              size="small"
              value={
                data?.mainLecturer
                  ? `${data?.mainLecturer?.userProfile?.lastName} ${data?.mainLecturer?.userProfile?.firstName}`
                  : ""
              }
            />
          </div>
        </div>
        <div className="flex items-center w-full">
          <div className="min-w-[150px] w-[150px]">Đơn vị quản lý</div>
          <div className="w-full">
            <Input
              size="small"
              className="w-full pointer-events-none"
              placeholder="Đơn vị quản lý"
              value={
                data?.subject?.managementOrganization
                  ? `${data?.subject?.managementOrganization?.sMa} - ${data?.subject?.managementOrganization?.sTen}`
                  : ""
              }
            />
          </div>
        </div>
      </Col>
      <Col span={0}>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValue) => {
            updateSubjectClass({
              where: { id: "" },
              data: {
                ...changedValue,
              },
            })
          }}
        ></Form>
      </Col>
      <Col span={24}>
        <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
      </Col>
    </Row>
  )
}

DiemTheoPhach.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
