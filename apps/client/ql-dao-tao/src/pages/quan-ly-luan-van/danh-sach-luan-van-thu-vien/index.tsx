import Table from "@components/commons/table"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_PAGE, DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import { ThesisType } from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyThesisSession,
  useUpdateManyStudentThesisRegistration,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Form, message, Row, Select, Tag } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useMemo, useState } from "react"
import useSpinner from "@hooks/spinner"
import { useDisclosure } from "react-hook-disclosure-modal"
import PutLibrarySubmission from "@components/modal/put-luan-van-thu-vien"
import PutLibrarySubmissionCreate from "@components/modal/put-luan-van-thu-vien-create"
import DeleteIcon from "@components/icons/delete"
import { StudentThesisRegistration } from "@workspace/db"

interface SearchParams {
  thesisSessionId?: string
  fixedClassId?: string[]
}

const initialFilters: FilterProps = {
  name: undefined,
  code: undefined,
  title: undefined,
}

export default function LibrarySubmissionPage() {
  const { can } = useAbility()
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()
  const { onOpen: openPutLibrarySubmission } = useDisclosure<{
    thesisProjectId: string
  }>({
    tag: "PutLibrarySubmission",
  })
  const { onOpen: openPutLibrarySubmissionCreate } = useDisclosure<{
    thesisSessionId: string
  }>({
    tag: "PutLibrarySubmissionCreate",
  })

  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGINATE_PAGE)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [trainingCourseId, setTrainingCourseId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterProps>(initialFilters)

  const { mutateAsync: updateManyStudentThesisRegistration } =
    useUpdateManyStudentThesisRegistration({
      onSuccess: () => {
        message.success("Xoá đăng ký luận văn thành công")
      },
      onError: (error: any) => {
        if (error?.info?.message) {
          message.error(error.info.message)
        } else {
          message.error("Đã xảy ra lỗi khi xóa đăng ký luận văn")
        }
      },
      onSettled: () => {
        hideSpinner()
      },
    })

  const { data: thesisSessionData } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    where: { trainingObjectTypeId: trainingObjectId },
    include: {
      trainingObjectType: true,
      trainingCourse: true,
    },
  })

  const { data: fixedClasses } = useFindManyFixedClass(
    { where: { trainingCourseId: trainingCourseId ?? "" } },
    { enabled: !!trainingCourseId }
  )

  const studentWhere = useMemo(() => {
    if (!searchParams.thesisSessionId) return { id: { in: [] } }
    return {
      ...(filters.name
        ? {
            userProfile: {
              fullname: {
                contains: filters.name,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
      ...(filters.code ? { code: { contains: filters.code, mode: "insensitive" as const } } : {}),
      fixedClassId: {
        in:
          searchParams.fixedClassId && searchParams.fixedClassId.length > 0
            ? searchParams.fixedClassId
            : fixedClasses?.map((f) => f.id),
      },
      thesisRegistrations: {
        some: {
          thesisProject: {
            thesisType: ThesisType.THESIS,
            thesisSessionId: searchParams.thesisSessionId,
            ...(filters.title
              ? {
                  title: {
                    contains: filters.title,
                    mode: "insensitive" as const,
                  },
                }
              : {}),
          },
        },
      },
    }
  }, [searchParams, fixedClasses, filters])

  const { data: students = [], isLoading: isLoadingStudents } = useFindManyStudent({
    where: studentWhere,
    include: {
      userProfile: true,
      fixedClass: true,
      thesisRegistrations: {
        orderBy: {
          updatedAt: "asc",
        },
        include: {
          thesisProject: {
            include: {
              supervisor: true,
              coSupervisor: true,
              librarySubmission: {
                include: { documentFile: true },
              },
            },
          },
        },
      },
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
    orderBy: {
      updatedAt: "asc",
    },
  })

  const { data: countStudent } = useCountStudent(
    { where: studentWhere },
    { enabled: !!searchParams.thesisSessionId }
  )

  const getSubmissionStatus = (librarySubmission: any) => {
    if (!librarySubmission) return { label: "Chưa nộp", color: "default" }
    const { isHardcopy, isSoftcopy } = librarySubmission
    if (isHardcopy && isSoftcopy) return { label: "Đã nộp đầy đủ", color: "success" }
    if (isHardcopy || isSoftcopy) return { label: "Nộp một phần", color: "warning" }
    return { label: "Chưa nộp", color: "default" }
  }

  const handleDeleteStudentThesisRegistration = async (ids: string[]) => {
    showSpinner()
    await updateManyStudentThesisRegistration({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    })
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[0, 16]} align="middle" justify="space-between">
            <Col>
              <Form.Item required className="mb-0">
                <Select
                  className="w-56"
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ minWidth: 300 }}
                  options={thesisSessionData?.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  onChange={(value) => {
                    setSearchParams({ thesisSessionId: value as string })
                    setTrainingCourseId(
                      thesisSessionData?.find((x) => x.id === value)?.trainingCourse?.id || null
                    )
                    setCurrentPage(1)
                  }}
                  placeholder="Chọn đợt xét"
                />
              </Form.Item>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={() =>
                  openPutLibrarySubmissionCreate({
                    thesisSessionId: searchParams?.thesisSessionId as string,
                  })
                }
              >
                Thêm mới
              </Button>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            id="library-submission"
            loading={isLoadingStudents}
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            data={students}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "studentCode",
                width: 120,
                align: "center",
                type: "input",
                render: (_, record) => record.code ?? "-",
              },
              {
                title: "Họ tên",
                dataIndex: "studentName",
                width: 180,
                type: "input",
                align: "center",
                render: (_, record) => record.userProfile?.fullname ?? "-",
              },
              {
                title: "Lớp quản lý",
                dataIndex: "fixedClass",
                width: 150,
                align: "center",
                render: (_, record) => record.fixedClass?.name ?? "-",
              },
              {
                title: "Tên đề tài",
                dataIndex: "topicTitle",
                width: 280,
                type: "input",
                align: "center",
                render: (_, record) =>
                  record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                    ?.thesisProject?.title ?? "-",
              },
              {
                title: "GVHD 1",
                dataIndex: "supervisor",
                width: 160,
                align: "center",
                render: (_, record) =>
                  record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                    ?.thesisProject?.supervisor?.name ?? "-",
              },
              {
                title: "GVHD 2",
                dataIndex: "coSupervisor",
                width: 160,
                align: "center",
                render: (_, record) =>
                  record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                    ?.thesisProject?.coSupervisor?.name ?? "-",
              },
              {
                title: "Ngày nộp",
                dataIndex: "submissionDate",
                width: 120,
                align: "center",
                render: (_, record) => {
                  const date =
                    record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                      ?.thesisProject?.librarySubmission?.submissionDate
                  return date ? dayjs(date).format("DD/MM/YYYY") : "-"
                },
              },
              {
                title: "Bản cứng",
                dataIndex: "isHardcopy",
                width: 100,
                align: "center",
                render: (_, record) =>
                  record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                    ?.thesisProject?.librarySubmission?.isHardcopy ? (
                    <Tag color="success">Đã nộp</Tag>
                  ) : (
                    <Tag color="default">Chưa nộp</Tag>
                  ),
              },
              {
                title: "Bản mềm",
                dataIndex: "isSoftcopy",
                width: 100,
                align: "center",
                render: (_, record) =>
                  record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                    ?.thesisProject?.librarySubmission?.isSoftcopy ? (
                    <Tag color="success">Đã nộp</Tag>
                  ) : (
                    <Tag color="default">Chưa nộp</Tag>
                  ),
              },
              {
                title: "Trạng thái",
                dataIndex: "submissionStatus",
                width: 150,
                align: "center",
                fixed: "right",
                render: (_, record) => {
                  const { label, color } = getSubmissionStatus(
                    record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                      ?.thesisProject?.librarySubmission
                  )
                  return <Tag color={color}>{label}</Tag>
                },
              },
              {
                title: "Thao tác",
                width: 80,
                align: "center",
                fixed: "right",
                render: (_, record) => {
                  const thesisProjectId =
                    record.thesisRegistrations?.[record?.thesisRegistrations?.length - 1]
                      ?.thesisProject?.id
                  const studentRegistrationIds = record.thesisRegistrations?.map(
                    (thesisRegistration: StudentThesisRegistration) => thesisRegistration?.id
                  )
                  if (!thesisProjectId) return ""
                  return (
                    <Row className="justify-center gap-2.5">
                      {can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_LUAN_VAN_THU_VIEN,
                        "SUA"
                      ) && (
                        <EditIcon
                          onClick={() => openPutLibrarySubmission({ thesisProjectId })}
                          className="text-sm text-blue-700 cursor-pointer flex"
                        />
                      )}
                      {can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_LUAN_VAN_DANH_SACH_LUAN_VAN_THU_VIEN,
                        "XOA"
                      ) && (
                        <DeleteIcon
                          popConfirm={{
                            onConfirm: (e) => {
                              handleDeleteStudentThesisRegistration(studentRegistrationIds)
                              e?.stopPropagation()
                            },
                            onCancel: (e) => {
                              e?.stopPropagation()
                            },
                          }}
                          className="text-sm text-red-500 cursor-pointer flex"
                        />
                      )}
                    </Row>
                  )
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: countStudent ?? 0,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(DEFAULT_PAGINATE_PAGE)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
      <PutLibrarySubmission />
      <PutLibrarySubmissionCreate />
    </div>
  )
}

LibrarySubmissionPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
