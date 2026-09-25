import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { StudentGraduationApplication } from "@workspace/db/client"
import { ApplicationStatus } from "@workspace/db/client"
import {
  useCreateManyStudentGraduationApplication,
  useFindManyStudent,
  useFindUniqueStudentGraduationApplication,
  useUpdateStudentGraduationApplication,
} from "@workspace/db/hooks"
import { Col, Form, message, Select } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import { useApplicationStatusOptions } from "@hooks/applicationStatus"
import { debounce } from "lodash"
import { useCallback, useEffect, useState } from "react"

export type PutGraduationApplication = StudentGraduationApplication & {
  studentIds?: string[]
}
dayjs.locale("vi")

const PutGraduationApplication = () => {
  const { applicationStatusOptions } = useApplicationStatusOptions()
  const [form] = Form.useForm<PutGraduationApplication>()
  const { isOpen, onClose, input } = useDisclosure<{ id: string; graduationSessionId: string }>({
    tag: "PutGraduationApplication",
    onClose: () => {
      form.resetFields()
      setSelectedStudents([])
      setSearchText("")
    },
  })
  const [searchText, setSearchText] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: graduationApplication } = useFindUniqueStudentGraduationApplication(
    { where: { id: input?.id } },
    { enabled: !!input?.id }
  )

  const currentStudentId = graduationApplication?.studentId
  const selectedStudentIds = input?.id
    ? currentStudentId
      ? [currentStudentId]
      : []
    : selectedStudents

  const { data: students, refetch } = useFindManyStudent(
    {
      where: {
        OR: [
          ...(selectedStudentIds.length ? [{ id: { in: selectedStudentIds } }] : []),
          {
            AND: [
              ...(searchText
                ? [
                    {
                      OR: [
                        {
                          userProfile: {
                            code: { contains: searchText, mode: "insensitive" as const },
                          },
                        },
                        {
                          userProfile: {
                            fullname: { contains: searchText, mode: "insensitive" as const },
                          },
                        },
                      ],
                    },
                  ]
                : []),
              {
                graduationApplications: {
                  none: {
                    sessionId: input?.graduationSessionId,
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        userProfile: true,
      },
      take: 500,
    },
    { enabled: isOpen && !!input?.graduationSessionId && (!input?.id || !!currentStudentId) }
  )

  const debouncedRefetch = useCallback(
    debounce(() => {
      refetch()
    }, 500),
    []
  )

  const handleSearch = (value: string) => {
    setSearchText(value)
    debouncedRefetch()
  }

  const handleStudentChange = (value: string | string[]) => {
    if (Array.isArray(value)) {
      setSelectedStudents(value)
    } else {
      // Trường hợp chỉnh sửa (single select)
      form.setFieldValue("studentId", value)
    }
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (graduationApplication) {
      form.setFieldsValue({
        ...graduationApplication,
        applicationDate: graduationApplication.applicationDate
          ? dayjs(graduationApplication.applicationDate)
          : undefined,
        studentId: graduationApplication.studentId,
      })
    } else {
      form.setFieldsValue({
        applicationDate: dayjs(),
      })
    }
  }, [graduationApplication])

  const { mutateAsync: createManyGraduationApplication } =
    useCreateManyStudentGraduationApplication()
  const { mutateAsync: updateGraduationApplication } = useUpdateStudentGraduationApplication()
  async function onOk(output?: PutGraduationApplication) {
    if (!output) return

    try {
      showSpinner()
      if (input?.id) {
        const payload = {
          status: input?.id ? output.status : ApplicationStatus.SUBMITTED,
          sessionId: input?.graduationSessionId || "",
          studentId: output.studentId,
          applicationDate: output.applicationDate,
        }

        await updateGraduationApplication({
          data: payload,
          where: { id: input.id },
        })
        message.success("Cập nhật thành công")
      } else {
        if (selectedStudents.length === 0) {
          message.error("Vui lòng chọn ít nhất một sinh viên")
          return
        }

        const payload = selectedStudents.map((studentId) => ({
          status: output.status,
          sessionId: input?.graduationSessionId || "",
          studentId,
          applicationDate: output.applicationDate,
        }))

        await createManyGraduationApplication({
          data: payload,
        })
        message.success(`Đã thêm ${selectedStudents.length} sinh viên`)
      }

      queryClient.invalidateQueries({
        queryKey: ["studentGraduationApplications"],
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
      title={input?.id ? "Chỉnh sửa đơn xét tốt nghiệp" : "Thêm mới đơn xét tốt nghiệp"}
      className="w-[50vw]"
    >
      <Col span={12}>
        <FormItem
          form={form}
          name={input?.id ? "studentId" : "studentIds"}
          label={input?.id ? "Sinh viên" : "Danh sách sinh viên"}
          required
        >
          <Select
            mode={input?.id ? undefined : "multiple"}
            placeholder={input?.id ? "Chọn sinh viên" : "Chọn nhiều sinh viên"}
            options={students?.map((item) => ({
              label: [item.userProfile?.code, item.userProfile?.fullname]
                .filter(Boolean)
                .join(" - "),
              value: item.id,
            }))}
            onSearch={handleSearch}
            onChange={handleStudentChange}
            {...(input?.id
              ? {
                  showSearch: false,
                  allowClear: false,
                  showArrow: false,
                  open: false,
                }
              : {})}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="applicationDate" label="Ngày gửi đơn">
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            defaultValue={dayjs()}
          />
        </FormItem>
      </Col>
      {!!input?.id && (
        <Col span={12}>
          <FormItem form={form} name="status" label="Trạng thái">
            <Select placeholder="Chọn trạng thái" options={applicationStatusOptions} allowClear />
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutGraduationApplication
