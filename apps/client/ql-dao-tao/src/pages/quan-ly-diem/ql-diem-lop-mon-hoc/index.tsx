import FormItem from "@components/commons/form-item"
import NhapDiem from "@components/sub-pages/nhap-diem"
import DefaultLayout from "@layouts/default-layout"
import { formatDate } from "@lib/utils"
import { Store, useStore } from "@tanstack/react-store"
import { useSession } from "@workspace/auth/react"
import {
  useFindFirstSubjectClassHistory,
  useFindUniqueSubjectClass,
  useUpdateSubjectClass,
} from "@workspace/db/hooks"
import { formatLecturerName } from "@workspace/libs"
import { Checkbox, Col, Form, Input, Row, Tabs, type TabsProps } from "antd"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"
import DanhSachLopMonHoc from "@/components/sub-pages/danh-sach-lop-mon-hoc"

export type DiemLopMonHocProps = {
  role?: "GV" | "P2/P7" | "P13"
  score?: "TX/ĐK" | "THI"
  setActiveKey?: (key: string) => void
}
type SubmitFormType = {
  isLockExamScore?: boolean
  scoreSubmitted?: boolean
  scoreChecked?: boolean
}
export type DiemLopMonHocStoreState = {
  selectedSubjectClassId?: string
}

export const diemLopMonHocStore = new Store<DiemLopMonHocStoreState>({
  selectedSubjectClassId: undefined,
})

export default function QuanLyDiemLopMonHoc({
  role = "P2/P7",
  score = "TX/ĐK",
}: DiemLopMonHocProps) {
  const [form] = Form.useForm<SubmitFormType>()
  const [activeKey, setActiveKey] = useState("1")
  const { data: userSession } = useSession()
  const { selectedSubjectClassId } = useStore(diemLopMonHocStore)
  const { data } = useFindUniqueSubjectClass(
    {
      where: {
        id: selectedSubjectClassId,
      },
      include: {
        mainLecturer: {
          include: {
            userProfile: {
              select: {
                id: true,
                fullname: true,
                academicDegreeType: true,
                academicRankType: true,
              },
            },
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
        subjectClassHistory: {
          include: {
            updatedBy: {
              select: {
                id: true,
                fullname: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    },
    {
      enabled: !!selectedSubjectClassId,
      refetchOnWindowFocus: false,
    }
  )

  const { data: subjectClassHistoryIsLockExamScore } = useFindFirstSubjectClassHistory({
    where: {
      subjectClassId: selectedSubjectClassId || "",
      isLockExamScore: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      updatedBy: {
        select: {
          fullname: true,
        },
      },
      isLockExamScore: true,
    },
  })

  const { data: subjectClassHistoryScoreSubmitted } = useFindFirstSubjectClassHistory({
    where: {
      subjectClassId: selectedSubjectClassId || "",
      scoreSubmitted: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      updatedBy: {
        select: {
          fullname: true,
        },
      },
      scoreSubmitted: true,
      isLockExamScore: true,
    },
  })

  const { data: subjectClassHistoryScoreChecked } = useFindFirstSubjectClassHistory({
    where: {
      subjectClassId: selectedSubjectClassId || "",
      scoreChecked: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
      updatedBy: {
        select: {
          fullname: true,
        },
      },
      scoreChecked: true,
    },
  })
  const p13HistoryDisplay = useMemo(() => {
    const parts: string[] = []

    if (data?.isLockExamScore && subjectClassHistoryIsLockExamScore?.createdAt) {
      const timestamp = dayjs(subjectClassHistoryIsLockExamScore.createdAt).format(
        "HH:mm DD/MM/YYYY"
      )
      const author = subjectClassHistoryIsLockExamScore.updatedBy?.fullname ?? "-"
      parts.push(`Khoá: ${timestamp} bởi ${author}`)
    }

    if (data?.scoreSubmitted && subjectClassHistoryScoreSubmitted?.createdAt) {
      const timestamp = dayjs(subjectClassHistoryScoreSubmitted.createdAt).format(
        "HH:mm DD/MM/YYYY"
      )
      const author = subjectClassHistoryScoreSubmitted.updatedBy?.fullname ?? "-"
      parts.push(`Nhận phiếu điểm: ${timestamp} bởi ${author}`)
    }

    return parts.join(" | ")
  }, [
    data?.isLockExamScore,
    data?.scoreSubmitted,
    subjectClassHistoryIsLockExamScore,
    subjectClassHistoryScoreSubmitted,
  ])

  const items = useMemo(() => {
    let baseMenu: TabsProps["items"] = [
      {
        label: "Danh sách lớp môn học",
        key: "1",
        children: <DanhSachLopMonHoc role={role} setActiveKey={setActiveKey} score={score} />,
      },
    ]

    if (role === "GV") {
      if (score === "TX/ĐK") {
        baseMenu = [
          ...baseMenu,
          {
            label: "Nhập điểm quá trình",
            key: "2",
            children: <NhapDiem role={role} loadData={activeKey !== "1"} score={"TX/ĐK"} />,
            disabled: !data,
          },
        ]
      }

      if (score === "THI") {
        baseMenu = [
          ...baseMenu,
          {
            label: "Nhập điểm thi",
            key: "2",
            children: <NhapDiem role={role} score="THI" loadData={activeKey !== "1"} />,
            disabled: !data,
          },
        ]
      }
    }

    if (role === "P2/P7" || role === "P13") {
      baseMenu = [
        ...baseMenu,
        {
          label: "Điểm",
          key: "2",
          children: <NhapDiem role={role} loadData={activeKey !== "1"} />,
          disabled: !data,
        },
      ]
    }
    return baseMenu
  }, [data, role, score, activeKey])

  const reasonDate = useCallback(() => {
    if (score === "TX/ĐK" && (data?.scoreDeadLineStart || data?.scoreDeadline)) {
      if (dayjs()?.isAfter(data?.scoreDeadline)) {
        return (
          <Input
            size="small"
            className="bg-red-600 text-white"
            placeholder="Hạn nhập điểm"
            value={`Ngoài hạn nhập điểm quá trình, ${formatDate(data?.scoreDeadLineStart || "")} đến ${formatDate(data?.scoreDeadline || "")}`}
          />
        )
      }
      return (
        <Input
          className="pointer-events-none"
          placeholder="Hạn nhập điểm"
          size="small"
          value={`${data?.scoreDeadLineStart && formatDate(data?.scoreDeadLineStart)} đến ${data?.scoreDeadline && formatDate(data?.scoreDeadline || "")}`}
        />
      )
    }

    if (score === "THI" && data?.examScoreDeadline) {
      if (dayjs()?.isAfter(data?.examScoreDeadline)) {
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
    }

    return <Input placeholder="Hạn nhập điểm" className="pointer-events-none" size="small" />
  }, [data, score])

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
    <Row gutter={[8, 4]}>
      <Col span={12}>
        <div className="flex items-center mb-2 w-full">
          <div className="min-w-[150px] w-[150px]">Lớp môn học:</div>
          <div className="w-[300px]">
            <Input
              size="small"
              placeholder="Mã lớp MH"
              className="pointer-events-none"
              value={data?.code}
            />
          </div>
          <div className="ml-3 w-full">
            <Input
              size="small"
              placeholder="Tên lớp MH"
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
              value={formatLecturerName(data?.mainLecturer)}
            />
          </div>
        </div>
        <div className="flex items-center w-full">
          <div className="min-w-[150px] w-[150px]">Đơn vị quản lý</div>
          <div className="w-full">
            <Input
              size="small"
              className="w-full pointer-events-none"
              placeholder="Giảng viên"
              value={
                data?.subject?.managementOrganization
                  ? `${data?.subject?.managementOrganization?.sMa} - ${data?.subject?.managementOrganization?.sTen}`
                  : ""
              }
            />
          </div>
        </div>
      </Col>
      <Col span={12}>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValue) => {
            updateSubjectClass({
              where: { id: selectedSubjectClassId || "" },
              data: {
                ...changedValue,
                subjectClassHistory: {
                  create: {
                    isLockExamScore:
                      typeof changedValue?.isLockExamScore === "boolean"
                        ? changedValue.isLockExamScore
                        : undefined,
                    scoreChecked:
                      typeof changedValue?.scoreChecked === "boolean"
                        ? changedValue.scoreChecked
                        : undefined,
                    scoreSubmitted:
                      typeof changedValue?.scoreSubmitted === "boolean"
                        ? changedValue.scoreSubmitted
                        : undefined,
                    updatedById: userSession?.sDM_NhanVienId,
                  },
                },
              },
            })
          }}
        >
          <div className="flex flex-row items-center gap-2 mb-2 w-full">
            <div className="min-w-[120px]">Hạn nhập điểm</div>
            <div className="w-full">{reasonDate()}</div>
            <div className="min-w-[120px]">Khoá điểm quá trình</div>
            <Checkbox disabled checked={data?.isLockScore} />
          </div>
          <div className="flex items-center mb-2 w-full h-6">
            <div className="flex items-center mr-9 ">
              <FormItem
                form={form}
                name="isLockExamScore"
                className="min-w-[200px] !mb-0"
                valuePropName="checked"
              >
                <Checkbox disabled={role !== "P13" || !selectedSubjectClassId}>
                  P13 đã khoá
                </Checkbox>
              </FormItem>
            </div>
            <div className="flex items-center w-full">
              <FormItem
                form={form}
                name="scoreSubmitted"
                className="min-w-[200px] !mb-0"
                valuePropName="checked"
              >
                <Checkbox disabled={role !== "P13" || !selectedSubjectClassId}>
                  P13 đã nhận Phiếu điểm
                </Checkbox>
              </FormItem>
              <div className="w-full">
                <Input size="small" className="pointer-events-none" value={p13HistoryDisplay} />
              </div>
            </div>
          </div>
          <div className="flex items-center mb-2 w-full h-6">
            <div className="flex items-center w-full">
              <FormItem
                form={form}
                name="scoreChecked"
                className="min-w-[250px]"
                valuePropName="checked"
              >
                <Checkbox disabled={role !== "P2/P7" || !selectedSubjectClassId}>
                  P2/P7 kiểm tra lại phiếu điểm
                </Checkbox>
              </FormItem>
              <div className="w-full">
                <Input
                  size="small"
                  className="pointer-events-none"
                  value={
                    subjectClassHistoryScoreChecked
                      ? `P2/P7 đã kiểm tra :  ${subjectClassHistoryScoreChecked?.createdAt ? dayjs(subjectClassHistoryScoreChecked.createdAt).format("HH:mm DD/MM/YYYY") : ""}  ${subjectClassHistoryScoreChecked?.updatedBy?.fullname ?? "-"}`
                      : ""
                  }
                />
              </div>
            </div>
          </div>
        </Form>
      </Col>
      <Col span={24}>
        <Tabs
          className="-mt-3"
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          items={items}
        />
      </Col>
    </Row>
  )
}

QuanLyDiemLopMonHoc.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
