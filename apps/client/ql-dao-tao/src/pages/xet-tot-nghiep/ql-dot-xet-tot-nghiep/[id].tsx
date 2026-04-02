import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import EditIcon from "@components/icons/edit"
import ViewIcon from "@components/icons/view"
import GraduationDecision from "@components/sub-pages/graduationDecision"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useAcademicRankingBaseTypeOptions } from "@hooks/academicRankingBaseType"
import { useApplicationStatusOptions } from "@hooks/applicationStatus"
import { useCriteriaFieldOptions } from "@hooks/criteriaField"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { ApplicationStatus, GraduationSessionStatus, StudentStatus } from "@workspace/db/client"
import {
  useCountStudentGraduationApplication,
  useFindManyCertificate,
  useFindManyFixedClass,
  useFindManyStudentGraduationApplication,
  useFindManyTrainingCourse,
  useFindUniqueGraduationSession,
  useUpdateManyStudent,
  useUpdateManyStudentGraduationApplication,
  useUpdateStudentGraduationApplication,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { graduationApplicationInit, useGraduationCheck } from "@workspace/libs/api/training"
import { ROUTER_PATH } from "@workspace/router"
import { Button, Col, Flex, Modal, message, Row, Tag, Tooltip } from "antd"
import type { TableRowSelection } from "antd/es/table/interface"
import dayjs from "dayjs"
import { BookPlus, SearchCheck, X } from "lucide-react"
import { useRouter } from "next/router"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function StudentGraduationApplication() {
  const router = useRouter()
  const { applicationStatusOptions, getApplicationStatusLabel, getApplicationStatusColor } =
    useApplicationStatusOptions()
  const { getAcademicRankingBaseTypeLabel } = useAcademicRankingBaseTypeOptions()
  const { getCriteriaFieldLabel } = useCriteriaFieldOptions()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const graduationSessionId = router.query.id as string
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    applicationDate: undefined,
    statusApplication: undefined,
  })
  const [showDecision, setShowDecision] = useState(false)
  const [trainingCourseSelected, setTrainingCourseSelected] = useState<string>()
  const [fixedClassSelected, setFixedClassSelected] = useState<string>()
  const [requiredCertificateIds, setRequiredCertificateIds] = useState<string[]>([])

  const { showSpinner, hideSpinner } = useSpinner()

  const where = useMemo(
    () => ({
      sessionId: graduationSessionId,
      deletedAt: null,
      student: {
        ...(filters.code && filters.code !== ""
          ? {
              code: {
                contains: filters.code,
                mode: "insensitive" as const,
              },
            }
          : {}),
        userProfile: {
          ...(filters.name && filters.name !== ""
            ? {
                fullname: {
                  contains: filters.name,
                  mode: "insensitive" as const,
                },
              }
            : {}),
        },
        fixedClass: {
          ...(filters.fixedClassName
            ? {
                name: {
                  contains: filters.fixedClassName,
                  mode: "insensitive" as const,
                },
              }
            : {}),
          ...(filters.fixedClassCode
            ? {
                name: {
                  contains: filters.fixedClassCode,
                  mode: "insensitive" as const,
                },
              }
            : {}),
        },
      },
      ...(filters.applicationDate?.length === 2
        ? {
            applicationDate: {
              gte: dayjs(filters.applicationDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.applicationDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.statusApplication
        ? {
            status: { in: filters.statusApplication },
          }
        : {}),
      ...(filters.graduation?.length
        ? { OR: filters.graduation.map((v) => ({ graduation: v })) }
        : {}),
      ...(filters.gpaCmp
        ? {
            gpa: {
              ...(filters.gpaCmp.gte
                ? {
                    gte: Number(filters.gpaCmp.gte),
                  }
                : {}),
              ...(filters.gpaCmp.lte
                ? {
                    lte: Number(filters.gpaCmp.lte),
                  }
                : {}),
            },
          }
        : {}),
      ...(filters.reason
        ? { reason: { contains: filters.reason, mode: "insensitive" as const } }
        : {}),
    }),
    [graduationSessionId, filters]
  )

  const { data: studentGraduationApplicationData, refetch } =
    useFindManyStudentGraduationApplication(
      {
        where,
        include: {
          rank: true,
          downgraded: {
            include: {
              from: true,
              conditions: true,
            },
          },
          student: {
            include: {
              userProfile: {
                include: {
                  ethnicity: true,
                  gender: true,
                  newProvinceHometown: true,
                },
              },
              fixedClass: true,
              archivedCertificate: {
                where: {
                  deletedAt: null,
                  status: "APPROVED",
                },
                include: {
                  certificate: true,
                },
              },
            },
          },
          trainingMajor: true,
          diplomaType: true,
        },
        orderBy: { createdAt: "asc" },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
        distinct: ["studentId"],
      },
      {
        enabled: !!graduationSessionId,
      }
    )

  const { data: count, refetch: refetchCount } = useCountStudentGraduationApplication(
    { where: { ...where, deletedAt: null } },
    { enabled: !!graduationSessionId }
  )

  const { data: initialValue } = useFindUniqueGraduationSession(
    { where: { id: graduationSessionId } },
    { enabled: !!graduationSessionId }
  )

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
    {
      where: {
        trainingObjectTypeId: initialValue?.trainingObjectTypeId,
        fixedClass: {
          some: {
            students: {
              some: {
                status: "ENROLLED",
              },
            },
          },
        },
      },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },
    {
      enabled: !!graduationSessionId,
    }
  )

  const { data: fixedClassData = [] } = useFindManyFixedClass(
    {
      where: {
        trainingCourseId: trainingCourseSelected,
        students: { some: { status: "ENROLLED" } },
      },
    },
    { enabled: !!graduationSessionId && !!trainingCourseSelected }
  )

  // Lấy danh sách chứng chỉ để filter
  const { data: certificatesData = [] } = useFindManyCertificate({
    orderBy: { name: "asc" },
  })

  const handleInitApplication = async () => {
    if (!trainingCourseSelected && !fixedClassSelected) {
      message.error("Vui lòng chọn Khoá hoặc Lớp đào tạo")
      return
    }

    showSpinner()
    try {
      const { status, data } = await graduationApplicationInit({
        sessionId: graduationSessionId,
        trainingCourseId: trainingCourseSelected,
        fixedClassId: fixedClassSelected,
      })

      if (status === 200) {
        message.success(data.message)
        refetch()
        refetchCount()
      } else {
        message.error(data.message)
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng thử lại")
      console.error(error)
    } finally {
      hideSpinner()
    }
  }

  const data = useMemo(() => {
    if (!studentGraduationApplicationData) return []

    const hasRequiredCerts = requiredCertificateIds.length > 0

    return studentGraduationApplicationData.map((item) => {
      // Chỉ tính toán nếu có chứng chỉ yêu cầu
      let hasAllRequiredCerts = true
      let studentCertificateSet: Set<string> | null = null

      if (hasRequiredCerts) {
        studentCertificateSet = new Set(
          item.student?.archivedCertificate?.map((ac: any) => ac.certificateId) || []
        )
        hasAllRequiredCerts = requiredCertificateIds.every((certId) =>
          studentCertificateSet?.has(certId)
        )
      }

      return {
        ...item,
        gpa: item.gpa?.toNumber(),
        trainingMajor: item.trainingMajor?.name,
        diplomaType: item.diplomaType?.name,
        hasAllRequiredCerts,
        // Lưu Set thay vì object để tiết kiệm bộ nhớ
        _studentCertificateSet: studentCertificateSet,
      }
    })
  }, [studentGraduationApplicationData, requiredCertificateIds])

  console.log("data: ", data)

  const { onOpen } = useDisclosure<{
    id: string | null
    graduationSessionId: string | undefined
  }>({
    tag: "PutGraduationApplication",
  })

  const { onOpen: onOpenModalPreviewReason } = useDisclosure<{
    id: string
  }>({
    tag: "ModalPreviewReason",
  })

  const handleModal = () => {
    onOpen({ id: null, graduationSessionId })
  }

  const { onOpen: onOpenModalLearningResult } = useDisclosure<string>({
    tag: "ModalLearningResult",
  })

  const handleOpenModalLearningResult = (record: any) => {
    onOpenModalLearningResult(record.student.id)
  }

  const { mutateAsync: updateStudentGraduationApplication } =
    useUpdateStudentGraduationApplication()
  const { mutateAsync: updateManyStudentGraduationApplication } =
    useUpdateManyStudentGraduationApplication()
  const { mutateAsync: updateManyStudent } = useUpdateManyStudent()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateStudentGraduationApplication({
        where: { id },
        data: { deletedAt: new Date() },
      })
      message.success("Xóa thành công")
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

  const { mutateAsync: graduationCheck } = useGraduationCheck()
  const handleMutationGraduationCheck = async () => {
    try {
      showSpinner()
      const res = await graduationCheck({
        data: {
          sessionId: graduationSessionId,
          applicationIds: selectedRowKeys,
        },
      })
      await refetch()
      await refetchCount()
      if (res?.status === 400) {
        message.error(res?.data?.message || "Đã xảy ra lỗi khi xét tốt nghiệp")
        return
      }
      if (res.status === 200) {
        message.success("Xét tốt nghiệp thành công")
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi xét tốt nghiệp")
      console.error(error)
    } finally {
      hideSpinner()
    }
  }

  const handleRejectAll = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sinh viên để từ chối")
      return
    }

    Modal.confirm({
      title: "Xác nhận từ chối",
      content: `Bạn có chắc chắn muốn từ chối ${selectedRowKeys.length} sinh viên đã chọn?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          showSpinner()
          await updateManyStudentGraduationApplication({
            where: { id: { in: selectedRowKeys } },
            data: { status: ApplicationStatus.REJECTED },
          })
          await refetch()
          setSelectedRowKeys([])
          message.success("Từ chối thành công")
        } catch (error) {
          message.error("Đã xảy ra lỗi khi từ chối")
          console.error(error)
        } finally {
          hideSpinner()
        }
      },
    })
  }

  const handleApproved = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sinh viên để duyệt")
      return
    }

    const graduationRecords =
      data?.filter(
        (record) =>
          selectedRowKeys.includes(record.id) &&
          record.status === ApplicationStatus.IN_REVIEW &&
          record.graduation === true
      ) || []

    Modal.confirm({
      title: "Xác nhận duyệt",
      content: `Bạn có chắc chắn muốn chấp nhận ${graduationRecords.length} sinh viên tốt nghiệp?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          showSpinner()
          const createDecision = graduationRecords
            .filter(
              (record) =>
                record.id && record.student?.id && record.gpa !== undefined && record.rank?.id
            )
            .map((record) => {
              const createData = {
                application: { connect: { id: record.id } },
                student: { connect: { id: record.student.id } },
                finalGpa: record.gpa ?? 0,
                decisionDate: new Date(),
                finalRanking: { connect: { id: record.rank?.id } },
                trainingMajor: { connect: { id: record.trainingMajorId } },
                ...(record.diplomaTypeId
                  ? { diplomaType: { connect: { id: record.diplomaTypeId } } }
                  : {}),
              }

              return {
                model: "GraduationDecision" as const,
                operation: "upsert" as const,
                data: {
                  where: {
                    applicationId: record.id,
                    studentId: record.student.id,
                  },
                  create: createData,
                  update: createData,
                },
              }
            })
          await sqlTransaction(createDecision)
          await updateManyStudentGraduationApplication({
            where: { id: { in: graduationRecords.map((record) => record.id) } },
            data: { status: ApplicationStatus.APPROVED },
          })
          await updateManyStudent({
            where: { id: { in: graduationRecords.map((record) => record.id) } },
            data: { status: StudentStatus.GRADUATED },
          })
          await refetch()
          message.success("Duyệt thành công")
        } catch (error) {
          message.error("Đã xảy ra lỗi khi duyệt")
          console.error(error)
        } finally {
          hideSpinner()
        }
      },
    })
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as string[])
  }

  const renderCell: NonNullable<TableRowSelection<any>["renderCell"]> = (
    _checked,
    _record,
    _index,
    originNode
  ) => (
    <span
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {originNode}
    </span>
  )

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record: any) => ({
      disabled:
        record.status === ApplicationStatus.REJECTED ||
        record.status === ApplicationStatus.APPROVED ||
        (requiredCertificateIds.length > 0 && !record.hasAllRequiredCerts),
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
      },
    }),
    renderCell,
  }

  // Tạo cột động cho mỗi chứng chỉ được chọn - tối ưu không tạo JSX trong title
  const certificateColumns = useMemo(() => {
    if (requiredCertificateIds.length === 0) return []

    return requiredCertificateIds.map((certId) => {
      const cert = certificatesData.find((c) => c.id === certId)
      const shortName = cert?.name?.substring(0, 10) || "CC"
      const hasEllipsis = (cert?.name?.length || 0) > 10

      return {
        // title: shortName + (hasEllipsis ? '...' : ''),
        title: cert?.name || "Chứng chỉ",
        key: `cert_${certId}`,
        width: 80,
        align: "center" as const,
        ellipsis: { showTitle: true },
        render: (_: any, record: any) => {
          // Sử dụng Set đã lưu thay vì tạo lại
          const hasCert = record._studentCertificateSet?.has(certId) ?? false
          return hasCert ? (
            <CheckCircleFilled style={{ color: "#22c55e", fontSize: 18 }} />
          ) : (
            <CloseCircleFilled style={{ color: "#ef4444", fontSize: 18 }} />
          )
        },
      }
    })
  }, [requiredCertificateIds, certificatesData])

  return (
    <Row gutter={[16, 0]} className="mt-4">
      <Col span={24} className="!p-0">
        <Flex vertical gap={16}>
          <Col span={24}>
            <Flex align="center" justify="space-between" className="px-4">
              <h2 className="text-xl font-bold">{initialValue?.name}</h2>
              <div className="flex align-middle items-center gap-2">
                <Button
                  type="primary"
                  className="mr-8"
                  onClick={() => setShowDecision(!showDecision)}
                >
                  {showDecision ? "Ẩn kết quả" : "Xem kết quả"}
                </Button>
                <div>Khoá</div>
                <Select
                  className="min-w-32"
                  value={trainingCourseSelected}
                  onChange={(value) => setTrainingCourseSelected(value)}
                  options={trainingCourseData.map((c) => {
                    return {
                      value: c.id,
                      label: c.name,
                    }
                  })}
                  popupMatchSelectWidth={false}
                />
                <div>Lớp</div>
                <Select
                  className="min-w-32"
                  value={fixedClassSelected}
                  onChange={(value) => setFixedClassSelected(value)}
                  options={fixedClassData.map((c) => {
                    return {
                      value: c.id,
                      label: c.name,
                    }
                  })}
                  popupMatchSelectWidth={false}
                />
                <Button
                  type="primary"
                  disabled={!trainingCourseSelected && !fixedClassSelected}
                  onClick={() => handleInitApplication()}
                >
                  Khởi tạo
                </Button>
              </div>
            </Flex>
            {showDecision && <GraduationDecision sessionId={graduationSessionId} />}
          </Col>
          <Flex>
            <Col span={24}>
              <div className="bg-white rounded-lg shadow-sm px-4">
                <Row gutter={[16, 0]}>
                  <Col span={24}>
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                      <Col span={12}>
                        <Flex align="center" gap={8}>
                          <span className="whitespace-nowrap font-medium">
                            Điều kiện chứng chỉ:
                          </span>
                          <Select
                            mode="multiple"
                            className="min-w-[300px]"
                            placeholder="Chọn chứng chỉ bắt buộc"
                            value={requiredCertificateIds}
                            onChange={(values) => {
                              setRequiredCertificateIds(values)
                              setSelectedRowKeys([]) // Reset selection khi thay đổi điều kiện
                            }}
                            options={certificatesData.map((c) => ({
                              value: c.id,
                              label: c.name,
                            }))}
                            allowClear
                            maxTagCount={2}
                            maxTagPlaceholder={(omitted) => `+${omitted.length} khác`}
                          />
                          {requiredCertificateIds.length > 0 && (
                            <Tag color="blue">{requiredCertificateIds.length} chứng chỉ</Tag>
                          )}
                        </Flex>
                      </Col>
                      <Col span={12}>
                        <Flex justify="end" gap={4} className="ml-auto">
                          <Button
                            onClick={handleRejectAll}
                            type="primary"
                            disabled={initialValue?.status !== GraduationSessionStatus.IN_REVIEW}
                          >
                            <X />
                            Từ chối
                          </Button>
                          <Button
                            onClick={handleModal}
                            type="primary"
                            disabled={
                              initialValue?.status !== GraduationSessionStatus.OPEN_FOR_APPLICATION
                            }
                          >
                            <BookPlus />
                            Thêm
                          </Button>
                          <Button
                            type="primary"
                            className="h-[32px] px-4"
                            onClick={handleMutationGraduationCheck}
                            disabled={initialValue?.status !== GraduationSessionStatus.IN_REVIEW}
                          >
                            <SearchCheck />
                            Xét
                          </Button>
                          <Tooltip placement="topLeft" title="Duyệt những đơn đã được xét và đạt">
                            <Button
                              type="primary"
                              className="h-[32px] px-4"
                              onClick={handleApproved}
                              disabled={selectedRowKeys.length === 0}
                            >
                              <BookPlus />
                              Duyệt
                            </Button>
                          </Tooltip>
                        </Flex>
                      </Col>
                    </Row>
                  </Col>
                  <Col span={24}>
                    <Table
                      rowKey="id"
                      id="student-graduation-application"
                      rowSelection={{
                        type: "checkbox",
                        ...rowSelection,
                      }}
                      onRow={(record) => {
                        return {
                          onClick: () => {
                            const isDisabled =
                              record.status === ApplicationStatus.REJECTED ||
                              record.status === ApplicationStatus.APPROVED ||
                              (requiredCertificateIds.length > 0 && !record.hasAllRequiredCerts)

                            if (isDisabled) return

                            if (selectedRowKeys.includes(record.id)) {
                              setSelectedRowKeys(selectedRowKeys.filter((key) => key !== record.id))
                            } else {
                              setSelectedRowKeys([...selectedRowKeys, record.id])
                            }
                          },
                        }
                      }}
                      filters={filters}
                      setFilters={(value) => {
                        setFilters(value)
                        setCurrentPage(1)
                      }}
                      columns={[
                        {
                          title: "STT",
                          width: 40,
                          align: "center",
                          fixed: "left",
                          render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                        },
                        {
                          title: "Mã SV",
                          align: "center",
                          dataIndex: "code",
                          width: 100,
                          fixed: "left",
                          type: "input",
                          render: (_, record) => record.student?.code || "",
                        },
                        {
                          title: "Họ và tên",
                          width: 150,
                          dataIndex: "name",
                          type: "input",
                          render: (_, record) => record.student?.userProfile?.fullname,
                        },
                        {
                          title: "Ngày sinh",
                          width: 80,
                          align: "center",
                          render: (_, record) =>
                            record?.student?.userProfile?.dateOfBirth
                              ? dayjs(record?.student?.userProfile?.dateOfBirth).format(
                                  "DD/MM/YYYY"
                                )
                              : "",
                        },
                        {
                          title: "Lớp",
                          width: 120,
                          align: "center",
                          dataIndex: "fixedClassCode",
                          type: "input",
                          render: (_, record) => (
                            <Tooltip title={record?.student?.fixedClass?.name}>
                              {record?.student?.fixedClass?.code}
                            </Tooltip>
                          ),
                        },
                        {
                          title: "SĐT",
                          width: 100,
                          align: "center",
                          render: (_, record) => record?.student?.userProfile?.phoneNumber,
                        },
                        {
                          title: "Giới tính",
                          dataIndex: ["student", "userProfile", "gender"],
                          align: "center",
                          width: 60,
                          render: (_, record) => record?.student?.userProfile?.gender?.sTen,
                        },
                        {
                          title: "Nơi sinh",
                          width: 100,
                          align: "center",
                          render: (_, record) =>
                            record?.student?.userProfile?.newProvinceHometown?.sTen,
                        },
                        {
                          title: "Dân tộc",
                          width: 80,
                          align: "center",
                          render: (_, record) => record.student?.userProfile?.ethnicity?.sTen || "",
                        },
                        {
                          title: "Ngày nộp đơn",
                          dataIndex: "applicationDate",
                          align: "center",
                          type: "date",
                          width: 120,
                          render: (_, record) =>
                            record.applicationDate
                              ? dayjs(record.applicationDate).format("DD/MM/YYYY")
                              : "",
                        },
                        // Cột chứng chỉ động
                        ...certificateColumns,
                        {
                          title: "Kết quả",
                          width: 90,
                          align: "center",
                          dataIndex: "graduation",
                          type: "select",
                          options: [
                            { value: true, label: "Đạt" },
                            { value: false, label: "Không đạt" },
                          ],
                          render: (_, record) =>
                            record?.graduation ? (
                              <Tag color="green">Đạt</Tag>
                            ) : (
                              <Tag color="red">Không đạt</Tag>
                            ),
                        },
                        {
                          title: "Ghi chú",
                          width: 220,
                          align: "center",
                          dataIndex: "reason",
                          type: "input",
                          render: (_, record) => {
                            if (record?.downgraded) {
                              return (
                                <span>
                                  Hạ bậc ($
                                  {record.downgraded.from.classification}
                                  ):{" "}
                                  {record.downgraded.conditions?.map((condition: any) =>
                                    getCriteriaFieldLabel(condition.field)
                                  ) || [].filter(Boolean).join(", ")}
                                </span>
                              )
                            }
                            if (record?.reason) {
                              let reasons = record.reason.split(/\r?\n|\\n/).filter(Boolean)
                              if (reasons.length <= 1) {
                                reasons = record.reason
                                  .split("\n")
                                  .filter(Boolean)
                                  .map((s: string) => s.trim())
                              }
                              const visibleReasons = reasons.slice(0, 2)

                              return (
                                <div className="text-left">
                                  <ul
                                    style={{
                                      paddingLeft: 0,
                                      margin: 0,
                                      listStyle: "none",
                                    }}
                                  >
                                    {visibleReasons.map((r: string, i: number) => (
                                      <li key={i}>- {r}</li>
                                    ))}
                                  </ul>
                                  {reasons.length > 2 && (
                                    <div
                                      className="flex justify-end text-xs text-green-700 cursor-pointer"
                                      onClick={() =>
                                        onOpenModalPreviewReason({
                                          id: record.id,
                                        })
                                      }
                                    >
                                      Xem thêm ({reasons.length - 2})
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            return null
                          },
                        },
                        {
                          title: "ĐTBTL",
                          width: 80,
                          align: "center",
                          dataIndex: "gpaCmp",
                          type: "cmp",
                          render: (_, record) => {
                            if (record?.gpa) {
                              return record.gpa
                            }
                            return null
                          },
                        },
                        {
                          title: "Hệ số xét",
                          width: 60,
                          align: "center",
                          render: (_, record) => {
                            if (record?.rank?.baseScore) {
                              return (
                                <span>
                                  {getAcademicRankingBaseTypeLabel(record.rank.baseScore)}
                                </span>
                              )
                            }
                            return null
                          },
                        },
                        {
                          title: "Xếp loại",
                          width: 100,
                          align: "center",
                          fixed: "right",
                          render: (_, record) => {
                            if (record?.rank?.classification) {
                              return <span>{record.rank.classification}</span>
                            }
                            return null
                          },
                        },
                        {
                          title: "Trạng thái",
                          dataIndex: "statusApplication",
                          align: "center",
                          width: 140,
                          fixed: "right",
                          type: "select",
                          options: applicationStatusOptions.map((i) => ({
                            value: i.value,
                            label: i.label,
                          })),
                          render: (_, record) => {
                            const label = getApplicationStatusLabel(record.status)
                            const color = getApplicationStatusColor(record.status)
                            return <Tag color={color}>{label}</Tag>
                          },
                        },
                        {
                          title: "Thao tác",
                          width: 100,
                          align: "center",
                          fixed: "right",
                          render: (_, record) => {
                            if (record.id) {
                              return (
                                <Row className="justify-center gap-2">
                                  <ViewIcon
                                    title="KQHT theo CTĐT"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenModalLearningResult(record)
                                    }}
                                  />
                                  {/*<RejectIcon
                                                                        popConfirm={{
                                                                            onConfirm: (e) => {
                                                                                e?.stopPropagation()
                                                                                handleReject(
                                                                                    record.id
                                                                                )
                                                                            },
                                                                            onCancel: (e) => {
                                                                                e?.stopPropagation()
                                                                            },
                                                                        }}
                                                                        onClick={(e) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                        disabled={
                                                                            initialValue?.status !==
                                                                            GraduationSessionStatus.IN_REVIEW
                                                                        }
                                                                    />*/}
                                  <EditIcon
                                    disabled={record.status === ApplicationStatus.APPROVED}
                                    onClick={(e) => {
                                      onOpen({
                                        id: record.id,
                                        graduationSessionId,
                                      })
                                      e.stopPropagation()
                                    }}
                                    className="text-sm text-blue-700 cursor-pointer"
                                  />
                                  {/* <DeleteIcon
                                                                        disabled={
                                                                            record.status ===
                                                                            ApplicationStatus.APPROVED
                                                                        }
                                                                        popConfirm={{
                                                                            onConfirm: (e) => {
                                                                                handleDelete(
                                                                                    record.id
                                                                                )
                                                                                e?.stopPropagation()
                                                                            },
                                                                            onCancel: (e) => {
                                                                                e?.stopPropagation()
                                                                            },
                                                                        }}
                                                                        onClick={(e) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    /> */}
                                </Row>
                              )
                            }
                            return ""
                          },
                        },
                      ]}
                      pagination={{
                        current: currentPage,
                        pageSize: numberOfPages,
                        total: count,
                        onChange: (page, pageSize) => {
                          if (numberOfPages === pageSize) {
                            setCurrentPage(page)
                          } else {
                            setCurrentPage(1)
                            setNumberOfPages(pageSize)
                          }
                        },
                      }}
                      data={data}
                    />
                  </Col>
                </Row>
              </div>
            </Col>
          </Flex>
        </Flex>
      </Col>
    </Row>
  )
}

StudentGraduationApplication.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      unLayout={true}
      breadcrumbList={[
        { title: "Xét tốt nghiệp" },
        {
          title: "Đợt xét tốt nghiệp",
          href: ROUTER_PATH.QL_DAO_TAO.XET_TOT_NGHIEP_QL_DOT_XET_TOT_NGHIEP,
        },
        { title: "Quyết định tốt nghiệp" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
