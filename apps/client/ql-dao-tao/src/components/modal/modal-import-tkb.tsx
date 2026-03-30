import { CloseOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Table from "@components/commons/table"
import { SUBJECT_CLASS_SCHEDULE_TYPE } from "@constants/constants"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import type { $Enums, Prisma, SubjectClassSchedule, SubjectClassTime } from "@workspace/db/client"
import { useImportPhanCongGiangDay } from "@workspace/libs/api/training"
import { getMinioUrl } from "@workspace/libs/utils"
import { dayjs, useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Form, message, Radio, Space, Tag } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type SubjectClassPreviewData = Prisma.SubjectClassGetPayload<{
  include: {
    fixedClasses: {
      select: {
        code: true
        _count: {
          select: {
            students: true
          }
        }
      }
    }
    mainLecturer: {
      select: {
        userProfile: {
          select: {
            fullname: true
          }
        }
      }
    }
    extraLecturer: {
      select: {
        userProfile: {
          select: {
            fullname: true
          }
        }
      }
    }
    enterGradeLecturer: {
      select: {
        userProfile: {
          select: {
            fullname: true
          }
        }
      }
    }
    trainingLocation: {
      select: {
        name: true
      }
    }
    room: {
      select: {
        name: true
      }
    }
    subjectClassTimes: true
    subject: {
      select: {
        managementOrganization: {
          select: {
            sMa: true
          }
        }
        onePoint: true
      }
    }
  }
}>
interface FilterProps {
  file?: File
  semesterId?: string
  fileType?: "THONG_KE_GIAO_VIEN_GIANG_DAY" | "TKB_THEO_LOP_HOC_PHAN"
  previewData?: SubjectClassPreviewData[]
}

const ModalNhapTKB = () => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [form] = Form.useForm<Record<string, unknown>>()

  const fileType = Form.useWatch("fileType", form) as
    | "THONG_KE_GIAO_VIEN_GIANG_DAY"
    | "TKB_THEO_LOP_HOC_PHAN"
  const previewData = (Form.useWatch("previewData", form) as SubjectClassPreviewData[]) || []
  const errorData =
    (Form.useWatch("errorData", form) as {
      message: string
    }[]) || []
  const { isOpen, onClose, input } = useDisclosure<{
    type: $Enums.SubjectClassType
  }>({
    tag: "ModalNhapTKB",
    onClose: form.resetFields,
  })

  const { type } = input || {}

  const { showSpinner, hideSpinner } = useSpinner()
  const { options, getExamTypeLabel } = useExamTypeOptions()
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [errorPagination, setErrorPagination] = useState({ current: 1, pageSize: 10 })
  const [previewPagination, setPreviewPagination] = useState({ current: 1, pageSize: 10 })
  const { id: semesterId } = useSemesterStore()
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      form.setFieldValue("previewData", [])
      return
    }
    setFile(file)
    setFileName(`Dữ liệu thời khoá biểu.${file.name.split(".")[1]}`)
    if (!semesterId || !trainingObjectTypeId) return
    const res = await ImportPhanCongGiangDay({
      data: {
        file: file,
        semesterId,
        trainingObjectTypeId,
        fileType: fileType,
        importType: "XEM_TRUOC",
        type,
      },
    })
    if (res?.status === 200) {
      form.setFieldValue("previewData", (res.data as any)?.data || [])
      form.setFieldValue("errorData", (res.data as any)?.error || [])
      setErrorPagination({ current: 1, pageSize: 10 })
      setPreviewPagination({ current: 1, pageSize: 10 })
    } else {
      message.error(res?.data?.message || "Nhập dữ liệu từ file thất bại")
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileName("")
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
    form.setFieldValue("previewData", [])
    form.setFieldValue("errorData", [])
    setErrorPagination({ current: 1, pageSize: 10 })
    setPreviewPagination({ current: 1, pageSize: 10 })
  }

  const { mutateAsync: ImportPhanCongGiangDay } = useImportPhanCongGiangDay()

  const handleSubmit = async (output?: FilterProps) => {
    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn đối tượng đào tạo")
      return
    }
    if (!file || !semesterId) {
      message.warning("Vui lòng chọn đầy đủ file và học kỳ")
      return
    }
    try {
      showSpinner()
      const res = await ImportPhanCongGiangDay({
        data: {
          file: file,
          semesterId,
          trainingObjectTypeId,
          fileType: output?.fileType,
          type,
        },
      })
      if (res?.status === 200) {
        message.success(res?.data?.message || "Nhập dữ liệu từ file thành công")
        onClose()
        queryClient.invalidateQueries({
          queryKey: ["zenstack", "SubjectClass"],
        })
        queryClient.invalidateQueries({
          queryKey: ["zenstack", "DM_DonVi"],
        })
      } else {
        message.error(res?.data?.message || "Nhập dữ liệu từ file thất bại")
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi nhập dữ liệu từ file")
    } finally {
      hideSpinner()
    }
  }

  const handleCancel = () => {
    handleRemoveFile()
    onClose()
  }

  return (
    <PutFormModal
      form={form}
      onFinish={handleSubmit}
      open={isOpen}
      onCancel={handleCancel}
      title={"Import thời khoá biểu từ file Excel"}
      className="w-[99vw]"
      okButtonProps={{
        disabled: errorData.length > 0,
      }}
      formProps={{
        initialValues: {
          fileType: "THONG_KE_GIAO_VIEN_GIANG_DAY",
        },
      }}
    >
      <FormItem form={form} name="previewData" hidden />
      <FormItem form={form} name="errorData" hidden />
      <Col span={24}>
        <FormItem form={form} name="file" label="File Excel" required>
          <div className="rounded-lg border-[1px] border-solid border-blue-400 bg-blue-50 p-3 mb-4">
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              type="primary"
              className="bg-[#1677ff] mb-4"
            >
              Chọn file
            </Button>

            {fileName ? (
              <Space style={{ marginLeft: 16 }}>
                <Tag
                  closable
                  onClose={handleRemoveFile}
                  closeIcon={<CloseOutlined style={{ color: "red" }} />}
                >
                  {fileName}
                </Tag>
              </Space>
            ) : (
              <span className="ml-3">Chưa có tệp nào được chọn</span>
            )}
            <p className="">Chọn file Excel mẫu đã xuất từ hệ thống</p>
          </div>
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="fileType" label="Mẫu" required>
          <Radio.Group
            options={[
              {
                label: "Mẫu 1: Thống kê các giảng viên đang có giờ dạy (Quân sự)",
                value: "THONG_KE_GIAO_VIEN_GIANG_DAY",
                className: "px-3",
              },
              {
                label: "Mẫu 2: TKB dự kiến theo lớp học phần (Dân sự)",
                value: "TKB_THEO_LOP_HOC_PHAN",
                className: "px-3",
              },
            ]}
            defaultValue={"THONG_KE_GIAO_VIEN_GIANG_DAY"}
            optionType="button"
            buttonStyle="solid"
            className="flex gap-2"
            size="middle"
          />
        </FormItem>
        <p className="text-sm text-gray-500">
          Lưu ý: Mẫu 1 đã chứa nội dung các lớp quản lý được đăng ký vào lớp môn học từ phần mềm
          TKBU
        </p>
        <p className="text-sm text-gray-500">
          Lưu ý: Mẫu 2 chứa kế hoạch lớp môn học dự kiến cho các lớp Dân sự, sinh viên cần đăng ký
          học phần theo kế hoạch này
        </p>
      </Col>
      <Col span={24}>
        <Button
          onClick={() => {
            const fileType = form.getFieldValue("fileType")
            const link =
              fileType === "THONG_KE_GIAO_VIEN_GIANG_DAY"
                ? getMinioUrl("mta/template/MAU1.TKB.GIAO-VIEN-DANH-CHO-QUAN-SU.xls")
                : getMinioUrl("mta/template/MAU2.TKB.LOP-HOC-PHAN-DU-KIEN-DANH-CHO-DAN-SU.xls")
            window.open(link, "_blank")
          }}
        >
          Tải mẫu file Excel
        </Button>
      </Col>
      {errorData.length > 0 && (
        <Col span={24}>
          <p>Danh sách lỗi nhập TKB</p>
          <Table
            data={errorData}
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                render: (_value, _record, index) =>
                  (errorPagination.current - 1) * errorPagination.pageSize + index + 1,
              },
              {
                title: "Mô tả",
                dataIndex: "message",
              },
            ]}
            pagination={{
              current: errorPagination.current,
              pageSize: errorPagination.pageSize,
              defaultPageSize: 10,
              onChange: (page, pageSize) => setErrorPagination({ current: page, pageSize }),
            }}
          />
        </Col>
      )}
      {previewData.length > 0 && (
        <Col span={24}>
          <p>Xem trước dữ liệu TKB</p>
          <Table
            data={previewData}
            scrollable
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                render: (_value, _record, index) =>
                  (previewPagination.current - 1) * previewPagination.pageSize + index + 1,
              },
              {
                title: "Mã LMH",
                dataIndex: "code",
                width: 120,
                align: "center",
                type: "input",
              },
              {
                title: "Tên môn học",
                dataIndex: "name",
                align: "center",
                type: "input",
                render: (_, record) => <p className="text-left">{record?.name}</p>,
              },
              {
                title: "Kíp học",
                dataIndex: "schedule",
                align: "center",
                width: 80,
                type: "select",
                options: Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(([key, value_]) => {
                  return {
                    label: value_,
                    value: key,
                  }
                }),
                render: (value: SubjectClassSchedule) =>
                  SUBJECT_CLASS_SCHEDULE_TYPE[value as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE],
              },
              {
                title: "Lớp QL",
                align: "center",
                render: (_, record) => (
                  <p>
                    {record?.fixedClasses?.map((e: { code: string }) => e.code).join(", ") || "-"}
                  </p>
                ),
              },
              {
                title: "Số SV",
                width: 80,
                align: "center",
                type: "order",
                distinctFilters: ["maxStudent", "credit"],
                render: (_, record) => (
                  <p>
                    {record?.fixedClasses?.reduce(
                      (acc: number, curr: { _count?: { students?: number } }) =>
                        acc + (curr?._count?.students ?? 0),
                      0
                    ) ?? 0}
                  </p>
                ),
              },
              {
                title: "Giảng viên 1",
                align: "center",
                type: "input",
                dataIndex: "mainLecturer",
                render: (__, record) => record?.mainLecturer?.userProfile?.fullname ?? "-",
              },
              {
                title: "Giảng viên 2",
                align: "center",
                type: "input",
                dataIndex: "extraLecturer",
                render: (__, record) => record?.extraLecturer?.userProfile?.fullname ?? "-",
              },
              // {
              //     title: 'Hình thức thi',
              //     dataIndex: 'examType',
              //     align: 'center',
              //     width: 160,
              //     type: 'select',
              //     options: options,
              //     render: (__, record) =>
              //         record.examType && getExamTypeLabel(record.examType),
              // },
              // {
              //     title: 'Khu vực',
              //     dataIndex: 'trainingLocationId',
              //     align: 'center',
              //     width: 150,
              //     type: 'input',
              //     render: (_, record) => record.trainingLocation?.name || '-',
              // },
              {
                title: "Phòng học",
                dataIndex: "roomId",
                align: "center",
                width: 200,
                render: (_, record) => <div>{record.room?.name || "-"}</div>,
              },
              {
                title: "Ngày thi",
                dataIndex: "examDate",
                align: "center",
                width: 100,
                render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
              },
              {
                title: "Thời khoá biểu",
                width: 150,
                align: "center",
                dataIndex: "subjectClassTimes",
                render: (subjectClassTimes: SubjectClassTime[]) => {
                  return subjectClassTimes?.map?.((tkb: SubjectClassTime) => {
                    return (
                      <p>
                        {tkb.dayOfWeek === 8 ? "CN" : `T${tkb.dayOfWeek}`} - {tkb.startPeriod} -{" "}
                        {tkb.endPeriod}
                      </p>
                    )
                  })
                },
              },
              {
                title: "ĐV phụ trách",
                dataIndex: "subject",
                width: 150,
                align: "center",
                type: "tree_select",
                render: (value) => value?.managementOrganization?.sMa || "",
              },
            ]}
            pagination={{
              current: previewPagination.current,
              pageSize: previewPagination.pageSize,
              defaultPageSize: 10,
              onChange: (page, pageSize) => setPreviewPagination({ current: page, pageSize }),
            }}
          />
        </Col>
      )}
    </PutFormModal>
  )
}

export default ModalNhapTKB
