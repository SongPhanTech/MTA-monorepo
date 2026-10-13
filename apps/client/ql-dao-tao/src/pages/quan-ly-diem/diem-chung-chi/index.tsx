import { BarChartOutlined, DownloadOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { FixedClass, TrainingCourse } from "@workspace/db/client"
import {
  useCountArchivedCertificate,
  useFindManyArchivedCertificate,
  useFindManyFixedClass,
  useFindManyTrainingCourse,
  useFindManyTrainingField,
  useFindManyTrainingMajor,
  useFindManyCertificate,
  useUpdateManyArchivedCertificate,
} from "@workspace/db/hooks"
import {
  exportArchivedCertificateExcel,
  useCertificateScore,
  exportArchivedCertificateMultiExcel,
  exportStudentsMissingCertificateExcel,
  useDeleteArchivedCertificate,
} from "@workspace/libs/api/training"
import { formatDateInSlash, parseVnDateEnd, parseVnDateStart } from "@workspace/libs/timezone"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Input, Modal, Select, Switch, message, Row, Tooltip } from "antd"
import { saveAs } from "file-saver"
import _ from "lodash"
import { InfoIcon } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function ArchivedCertificate() {
  const { can, canSome } = useAbility()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    count: undefined,
    trainingCourseId: undefined,
    fixedClassId: undefined,
    certificateId: undefined,
  })

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [showLanguageScoreColumns, setShowLanguageScoreColumns] = useState(true)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportTrainingCourseId, setExportTrainingCourseId] = useState<string | undefined>()
  const [exportCertificateId, setExportCertificateId] = useState<string | undefined>()
  const [isMultiExportModalOpen, setIsMultiExportModalOpen] = useState(false)
  const [exportTrainingCourseIds, setExportTrainingCourseIds] = useState<string[]>([])
  const [isMissingExportModalOpen, setIsMissingExportModalOpen] = useState(false)

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
    {
      where: {
        trainingObjectTypeId,
        deletedAt: null,
        active: true,
      },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: fixedClassData = [] } = useFindManyFixedClass(
    {
      where: {
        trainingCourse: {
          trainingObjectTypeId,
          deletedAt: null,
          active: true,
          ...(filters.trainingCourseId ? { id: filters.trainingCourseId } : {}),
        },
      },
      include: {
        trainingCourse: true,
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: trainingFieldData = [] } = useFindManyTrainingField()

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    orderBy: { name: "asc" },
  })

  const { data: certificateData = [] } = useFindManyCertificate({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  })

  const { onOpen } = useDisclosure<string>({
    tag: "PutCertificateArchivedModal",
  })

  const { onOpen: onOpenCertificateList } = useDisclosure<{
    studentId: string
    studentName: string
    certificates: any[]
    isEditMode?: boolean
  }>({
    tag: "ModalDanhSachChungChi",
  })

  const { onOpen: onOpenPhienDiemKyHoc } = useDisclosure<{
    isEditMode?: boolean
    archivedCertificateId: string
  }>({
    tag: "ModalPhienDiemKyHoc",
  })

  const { onOpen: onOpenThongKeLop } = useDisclosure<{
    certificateId?: string
    trainingCourseId?: string
  }>({
    tag: "ModalThongKeChungChiTheoLop",
  })

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: updateManyArchivedCertificate } = useUpdateManyArchivedCertificate()
  const { mutateAsync: deleteArchivedCertificates } = useDeleteArchivedCertificate()

  const where = useMemo(() => {
    const conditions: any = {
      deletedAt: null,
    }

    const studentCondition: any = {}

    if (filters.name) {
      studentCondition.userProfile = {
        fullname: {
          contains: filters.name,
          mode: "insensitive" as const,
        },
      }
    }

    if ((filters as any).code) {
      studentCondition.userProfile = {
        ...studentCondition.userProfile,
        code: {
          contains: (filters as any).code,
          mode: "insensitive" as const,
        },
      }
    }

    if ((filters as any).dateOfBirth?.length === 2) {
      studentCondition.userProfile = {
        ...studentCondition.userProfile,
        dateOfBirth: {
          gte: parseVnDateStart(String((filters as any).dateOfBirth[0])) ?? undefined,
          lte: parseVnDateEnd(String((filters as any).dateOfBirth[1])) ?? undefined,
        },
      }
    }

    const fixedClassCondition: any = {}

    const hasValue = (val: any) => {
      if (Array.isArray(val)) return val.length > 0
      return val !== undefined && val !== null && val !== ""
    }

    if (hasValue(filters.trainingCourseId)) {
      if (Array.isArray(filters.trainingCourseId)) {
        fixedClassCondition.trainingCourseId = { in: filters.trainingCourseId }
      } else {
        fixedClassCondition.trainingCourseId = filters.trainingCourseId
      }
    } else {
      fixedClassCondition.trainingCourse = {
        trainingObjectTypeId,
        deletedAt: null,
        active: true,
      }
    }

    if (hasValue((filters as any).trainingMajorId)) {
      const val = (filters as any).trainingMajorId
      fixedClassCondition.curriculumVersion = {
        curriculum: {
          trainingMajorId: Array.isArray(val) ? { in: val } : val,
        },
      }
    }

    if (hasValue((filters as any).trainingFieldId)) {
      const val = (filters as any).trainingFieldId
      fixedClassCondition.curriculumVersion = {
        ...fixedClassCondition.curriculumVersion,
        curriculum: {
          ...fixedClassCondition.curriculumVersion?.curriculum,
          trainingMajor: {
            trainingFieldId: Array.isArray(val) ? { in: val } : val,
          },
        },
      }
    }

    if (hasValue(filters.fixedClassId)) {
      if (Array.isArray(filters.fixedClassId)) {
        studentCondition.fixedClassId = { in: filters.fixedClassId }
      } else {
        studentCondition.fixedClassId = filters.fixedClassId
      }
    }

    if (Object.keys(fixedClassCondition).length > 0) {
      studentCondition.fixedClass = fixedClassCondition
    }

    if (Object.keys(studentCondition).length > 0) {
      conditions.student = studentCondition
    }

    if (filters.certificateId) {
      conditions.certificateId = filters.certificateId
    }
    if (hasValue(filters.certificateStatus)) {
      const val = filters.certificateStatus
      conditions.status = Array.isArray(val) ? { in: val } : val
    }
    if ((filters as any).decisionNumber) {
      conditions.decisionNumber = {
        contains: (filters as any).decisionNumber,
        mode: "insensitive" as const,
      }
    }

    const hasDocumentFile = (filters as any).hasDocumentFile
    if (hasValue(hasDocumentFile)) {
      const value = Array.isArray(hasDocumentFile) ? hasDocumentFile[0] : hasDocumentFile
      if (value === "HAS") {
        conditions.documentFiles = { some: {} }
      } else if (value === "NONE") {
        conditions.documentFiles = { none: {} }
      }
    }

    return conditions
  }, [filters, trainingObjectTypeId])

  // Lấy danh sách ArchivedCertificate
  const { data: dataTable = [], refetch } = useFindManyArchivedCertificate({
    where,
    include: {
      certificate: true,
      studentSubjectScore: true,
      documentFiles: true,
      subjectScores: {
        include: {
          subjectVersion: {
            select: {
              id: true,
              name: true,
              code: true,
              credit: true,
            },
          },
        },
      },
      student: {
        include: {
          userProfile: {
            include: { rank: true },
          },
          curriculumVersion: {
            include: {
              trainingBlocks: {
                include: {
                  subjects: {
                    include: {
                      subject: {
                        select: {
                          id: true,
                          name: true,
                          code: true,
                          credit: true,
                          subjectId: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          fixedClass: {
            include: {
              trainingCourse: {
                include: {
                  trainingObjectType: true,
                },
              },
              curriculumVersion: {
                include: {
                  curriculum: {
                    include: {
                      trainingMajor: {
                        include: {
                          trainingField: true,
                        },
                      },
                    },
                  },
                  trainingBlocks: {
                    include: {
                      subjects: {
                        include: {
                          subject: {
                            select: {
                              id: true,
                              name: true,
                              code: true,
                              credit: true,
                              subjectId: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountArchivedCertificate({
    where,
  })

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
  }

  const canDeleteCertificate = can(
    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_CHUNG_CHI,
    "XOA"
  )

  const handleDeleteCertificates = async (ids: string[]) => {
    if (!ids.length) {
      message.warning("Vui lòng chọn chứng chỉ cần xóa")
      return
    }
    try {
      showSpinner()
      const res = await deleteArchivedCertificates({
        data: { archivedCertificateIds: ids },
      })
      if (res?.status === 200) {
        message.success("Xóa chứng chỉ thành công")
        setSelectedRowKeys((prev) => prev.filter((key) => !ids.includes(String(key))))
        refetch()
        return
      }
      message.error(res?.data?.message || "Không thể xóa chứng chỉ")
    } catch (error: any) {
      message.error(error?.info?.message || error?.data?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleOpenDelete = (ids?: string[]) => {
    const targetIds = ids?.length ? ids : (selectedRowKeys as string[])
    if (!targetIds.length) {
      message.warning("Vui lòng chọn chứng chỉ cần xóa")
      return
    }
    const hasApproved = dataTable.some(
      (item) => targetIds.includes(item.id) && item.status === "APPROVED"
    )
    Modal.confirm({
      title: hasApproved ? "Xóa chứng chỉ đã duyệt?" : "Xác nhận xóa",
      content: hasApproved
        ? "Có chứng chỉ đã được phê duyệt. Hệ thống sẽ gỡ điểm phiên đã ghi từ chứng chỉ đó. Bạn có chắc chắn muốn xóa?"
        : "Bạn có chắc chắn muốn xóa những chứng chỉ đã chọn không?",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => handleDeleteCertificates(targetIds),
    })
  }

  const handleOpenAprove = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn phê duyệt không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        handleApprove("APPROVED")
      },
    })
  }
  const handleOpenReject = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn từ chối không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        handleApprove("REJECTED")
      },
    })
  }
  const { mutateAsync: updateCertificateScore } = useCertificateScore()

  const handleApprove = async (status: "APPROVED" | "REJECTED") => {
    try {
      if (selectedRowKeys?.length > 0) {
        const certificateIds = (selectedRowKeys as string[]).filter((certId) => {
          const cert = dataTable.find((c) => c.id === certId)
          return cert?.status === "PENDING"
        })

        if (status === "REJECTED") {
          if (certificateIds.length === 0) {
            message.warning("Không có chứng chỉ nào cần từ chối")
            return
          }
          await updateManyArchivedCertificate({
            where: {
              id: { in: certificateIds },
            },
            data: { status: "REJECTED" },
          })
          message.success("Từ chối thành công")
          refetch()
          setSelectedRowKeys([])
          return
        }

        if (certificateIds.length === 0) {
          message.warning("Không có chứng chỉ nào cần phê duyệt")
          return
        }

        const res = await updateCertificateScore({
          data: { archivedCertificateIds: certificateIds },
        })
        if (res?.status === 200) {
          message.success("Phê duyệt thành công")
          refetch()
          setSelectedRowKeys([])
          return
        }
      }
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  const handleOpenExportModal = () => {
    const selectedTrainingCourseId = Array.isArray(filters.trainingCourseId)
      ? filters.trainingCourseId[0]
      : filters.trainingCourseId

    setExportTrainingCourseId(selectedTrainingCourseId)
    setIsExportModalOpen(true)
  }

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false)
    setExportTrainingCourseId(undefined)
    setExportCertificateId(undefined)
  }

  const handleOpenMultiExportModal = () => {
    setExportTrainingCourseIds([])
    setIsMultiExportModalOpen(true)
  }

  const handleCloseMultiExportModal = () => {
    setIsMultiExportModalOpen(false)
    setExportTrainingCourseIds([])
  }

  const handleOpenMissingExportModal = () => {
    const selectedTrainingCourseId = Array.isArray(filters.trainingCourseId)
      ? filters.trainingCourseId[0]
      : filters.trainingCourseId

    setExportTrainingCourseId(selectedTrainingCourseId)
    setIsMissingExportModalOpen(true)
  }

  const handleCloseMissingExportModal = () => {
    setIsMissingExportModalOpen(false)
    setExportTrainingCourseId(undefined)
    setExportCertificateId(undefined)
  }

  const handleExportExcel = async () => {
    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn đối tượng đào tạo")
      return
    }

    if (!exportTrainingCourseId) {
      message.warning("Vui lòng chọn khoá học để xuất Excel")
      return
    }

    const extractExportErrorMessage = (error: any) => {
      const status = error?.response?.status
      const rawMessage = error?.response?.data?.message || error?.response?.data?.error

      const detailedMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || error?.message

      if (status && detailedMessage) {
        return `Xuất Excel thất bại: ${detailedMessage}`
      }

      if (status) {
        return `Xuất Excel thất bại`
      }

      if (detailedMessage) {
        return `Xuất Excel thất bại: ${detailedMessage}`
      }

      return "Đã xảy ra lỗi khi xuất Excel, vui lòng thử lại"
    }

    try {
      showSpinner()
      const res = await exportArchivedCertificateExcel({
        trainingObjectTypeId,
        trainingCourseId: exportTrainingCourseId,
        fixedClassId: filters.fixedClassId || undefined,
        certificateId: exportCertificateId || undefined,
      })
      if (res.status === 200) {
        saveAs(res.data, "Danh_sach_diem_chung_chi.xlsx")
        message.success("Xuất Excel thành công")
        handleCloseExportModal()
      } else {
        const error: any = new Error()
        error.response = { status: res.status, data: res.data }
        message.error(extractExportErrorMessage(error))
      }
    } catch (error: any) {
      message.error(extractExportErrorMessage(error))
    } finally {
      hideSpinner()
    }
  }

  const handleExportMultiExcel = async () => {
    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn đối tượng đào tạo")
      return
    }

    if (!exportTrainingCourseIds.length) {
      message.warning("Vui lòng chọn ít nhất một khoá học")
      return
    }

    const allCertificateIds = certificateData.map((item: any) => item.id)

    if (!allCertificateIds.length) {
      message.warning("Không có loại chứng chỉ nào để xuất")
      return
    }

    const extractExportErrorMessage = (error: any) => {
      const status = error?.response?.status
      const rawMessage = error?.response?.data?.message || error?.response?.data?.error

      const detailedMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || error?.message

      if (status && detailedMessage) {
        return `Xuất Excel thất bại: ${detailedMessage}`
      }

      if (status) {
        return `Xuất Excel thất bại`
      }

      if (detailedMessage) {
        return `Xuất Excel thất bại: ${detailedMessage}`
      }

      return "Đã xảy ra lỗi khi xuất Excel, vui lòng thử lại"
    }

    try {
      showSpinner()
      const res = await exportArchivedCertificateMultiExcel({
        trainingObjectTypeId,
        trainingCourseIds: exportTrainingCourseIds,
        certificateIds: allCertificateIds,
      })

      if (res.status === 200) {
        saveAs(res.data, "Danh_sach_diem_chung_chi_nhieu_loai.xlsx")
        message.success("Xuất Excel thành công")
        handleCloseMultiExportModal()
      } else {
        const error: any = new Error()
        error.response = { status: res.status, data: res.data }
        message.error(extractExportErrorMessage(error))
      }
    } catch (error: any) {
      message.error(extractExportErrorMessage(error))
    } finally {
      hideSpinner()
    }
  }

  const handleExportMissingCertificateExcel = async () => {
    if (!trainingObjectTypeId) {
      message.warning("Vui lòng chọn đối tượng đào tạo")
      return
    }

    if (!exportTrainingCourseId) {
      message.warning("Vui lòng chọn khoá học để xuất Excel")
      return
    }

    const extractExportErrorMessage = (error: any) => {
      const status = error?.response?.status
      const rawMessage = error?.response?.data?.message || error?.response?.data?.error

      const detailedMessage = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || error?.message

      if (status && detailedMessage) {
        return `Xuất Excel thất bại: ${detailedMessage}`
      }

      if (status) {
        return `Xuất Excel thất bại`
      }

      if (detailedMessage) {
        return `Xuất Excel thất bại: ${detailedMessage}`
      }

      return "Đã xảy ra lỗi khi xuất Excel, vui lòng thử lại"
    }

    try {
      showSpinner()
      const res = await exportStudentsMissingCertificateExcel({
        trainingObjectTypeId,
        trainingCourseId: exportTrainingCourseId,
        certificateId: exportCertificateId || undefined,
      })
      if (res.status === 200) {
        saveAs(res.data, "Danh_sach_sinh_vien_chua_co_chung_chi.xlsx")
        message.success("Xuất Excel thành công")
        handleCloseMissingExportModal()
      } else {
        const error: any = new Error()
        error.response = { status: res.status, data: res.data }
        message.error(extractExportErrorMessage(error))
      }
    } catch (error: any) {
      message.error(extractExportErrorMessage(error))
    } finally {
      hideSpinner()
    }
  }

  return (
    <Row gutter={[16, 0]}>
      <Col span={24}>
        <Row gutter={[16, 16]} align="top" justify="space-between">
          <Col span={4}>
            <Flex gap={8}>
              <Input
                className="w-full"
                placeholder="Tìm số quyết định"
                value={(filters as any).decisionNumber || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    decisionNumber: e.target.value || undefined,
                  } as any)
                }
                allowClear
              />
            </Flex>
          </Col>
          <Col span={20}>
            <Flex justify="end">
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_CHUNG_CHI, "THEM") && (
                <>
                  <Flex align="center" gap={8} className="mr-3">
                    <span className="text-sm">Điểm ngoại ngữ</span>
                    <Switch
                      checked={showLanguageScoreColumns}
                      onChange={setShowLanguageScoreColumns}
                    />
                  </Flex>
                  <Button
                    onClick={handleOpenExportModal}
                    icon={<DownloadOutlined />}
                    type="primary"
                  >
                    Xuất Excel
                  </Button>
                  <Button
                    className="ml-3"
                    onClick={handleOpenMultiExportModal}
                    icon={<DownloadOutlined />}
                    type="primary"
                  >
                    Chi tiết
                  </Button>
                  <Button
                    className="ml-3"
                    icon={<BarChartOutlined />}
                    onClick={() => {
                      const courseId = Array.isArray(filters.trainingCourseId)
                        ? filters.trainingCourseId[0]
                        : filters.trainingCourseId
                      const certId = Array.isArray(filters.certificateId)
                        ? filters.certificateId[0]
                        : filters.certificateId
                      onOpenThongKeLop({
                        certificateId: certId as string | undefined,
                        trainingCourseId: courseId as string | undefined,
                      })
                    }}
                  >
                    Thống kê
                  </Button>
                  {/* <Button
                    className="ml-3"
                    onClick={handleOpenMissingExportModal}
                    icon={<DownloadOutlined />}
                    type="primary"
                  >
                    Xuất DS SV chưa có CC
                  </Button> */}
                  {canDeleteCertificate && (
                    <Button
                      className="ml-3"
                      onClick={() => handleOpenDelete()}
                      disabled={!selectedRowKeys.length}
                      danger
                    >
                      Xóa
                    </Button>
                  )}
                  <Button
                    className="ml-3"
                    onClick={handleOpenReject}
                    disabled={!selectedRowKeys.length}
                    type="default"
                  >
                    Từ chối
                  </Button>
                  <Button
                    className="ml-3"
                    onClick={handleOpenAprove}
                    disabled={!selectedRowKeys.length}
                    type="primary"
                  >
                    Phê duyệt
                  </Button>
                </>
              )}
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_CHUNG_CHI, "THEM") && (
                <Button onClick={handleModal} type="primary" className="ml-3">
                  Thêm mới
                </Button>
              )}
            </Flex>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Table
          rowKey="id"
          id="training-category"
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          rowSelection={rowSelection}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã học viên",
              dataIndex: "code",
              align: "center",
              width: 130,
              fixed: "left",
              type: "input",
              render: (__, record) => record?.student?.userProfile?.code,
            },
            {
              title: "Họ và tên",
              dataIndex: "name",
              align: "center",
              width: 180,
              fixed: "left",
              type: "input",
              render: (__, record) => {
                return `${record?.student?.userProfile?.fullname || ""}`.trim()
              },
            },
            {
              title: "Ngày sinh",
              align: "center",
              width: 120,
              dataIndex: "dateOfBirth",
              type: "date",
              render: (__, record) => {
                const dob = record.student?.userProfile?.dateOfBirth
                return dob ? formatDateInSlash(dob) : "-"
              },
            },
            {
              title: "Lớp",
              align: "center",
              width: 120,
              dataIndex: "fixedClassId",
              type: "select",
              options: fixedClassData.map((item: FixedClass) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => {
                const fixedClass = record?.student?.fixedClass
                if (!fixedClass) return "-"
                return <Tooltip title={fixedClass?.name}>{fixedClass?.code}</Tooltip>
              },
            },
            {
              title: "Khoá",
              align: "center",
              width: 100,
              dataIndex: "trainingCourseId",
              type: "select",
              options: trainingCourseData.map((item: TrainingCourse) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => {
                const trainingCourse = record?.student?.fixedClass?.trainingCourse
                return trainingCourse ? trainingCourse?.name : "-"
              },
            },
            {
              title: "Ngành",
              align: "center",
              width: 160,
              dataIndex: "trainingFieldId",
              type: "select",
              options: trainingFieldData.map((item: any) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => {
                return (
                  record?.student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                    ?.trainingField?.name || "-"
                )
              },
            },
            {
              title: "Chuyên ngành",
              align: "center",
              width: 180,
              dataIndex: "trainingMajorId",
              type: "select",
              options: trainingMajorData.map((item: any) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => {
                return (
                  record?.student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                  "-"
                )
              },
            },
            {
              title: "Chứng chỉ",
              align: "center",
              width: 160,
              render: (__, record) => record?.certificate?.name || "-",
            },
            {
              title: "Điểm phiên",
              align: "left",
              width: 220,
              render: (__, record) => {
                const scores = (record as any)?.subjectScores || []
                if (!scores.length) return "-"
                return (
                  <div className="flex flex-col gap-0.5 text-xs">
                    {scores.map((s: any) => (
                      <div key={s.id}>
                        {s.subjectVersion?.code
                          ? `${s.subjectVersion.code} - `
                          : ""}
                        {s.subjectVersion?.name || "?"}: <b>{s.finalScore}</b>
                      </div>
                    ))}
                  </div>
                )
              },
            },
            ...((showLanguageScoreColumns
              ? [
                  {
                    title: "Nghe",
                    align: "center",
                    width: 80,
                    render: (__: any, record: any) => record?.listeningScore ?? "-",
                  },
                  {
                    title: "Nói",
                    align: "center",
                    width: 80,
                    render: (__: any, record: any) => record?.speakingScore ?? "-",
                  },
                  {
                    title: "Đọc",
                    align: "center",
                    width: 80,
                    render: (__: any, record: any) => record?.readingScore ?? "-",
                  },
                  {
                    title: "Viết",
                    align: "center",
                    width: 80,
                    render: (__: any, record: any) => record?.writingScore ?? "-",
                  },
                ]
              : []) as any[]),
            {
              title: "Điểm",
              align: "center",
              width: 80,
              render: (__, record) => record?.score ?? "-",
            },
            {
              title: "Nơi cấp",
              align: "center",
              width: 120,
              render: (__, record) => record?.issuedBy || "-",
            },
            {
              title: "Số QĐ",
              align: "center",
              width: 120,
              render: (__, record) => record?.decisionNumber || "-",
            },
            {
              title: "Ngày cấp",
              align: "center",
              width: 110,
              render: (__, record) =>
                record?.issuedDate ? formatDateInSlash(record.issuedDate) : "-",
            },
            {
              title: "Ngày hết hạn",
              align: "center",
              width: 110,
              render: (__, record) =>
                record?.expiredDate ? formatDateInSlash(record.expiredDate) : "-",
            },
            {
              title: "Ghi chú",
              align: "left",
              width: 180,
              render: (__, record) => record?.description || "-",
            },
            {
              title: "Minh chứng",
              align: "center",
              width: 130,
              dataIndex: "hasDocumentFile",
              type: "select",
              options: [
                { label: "Đã có", value: "HAS" },
                { label: "Chưa có", value: "NONE" },
              ],
              render: (__, record) => {
                const hasFile = (record?.documentFiles?.length || 0) > 0
                return (
                  <span style={{ color: hasFile ? "green" : "orange" }}>
                    {hasFile ? "Đã có" : "Chưa chưa"}
                  </span>
                )
              },
            },
            {
              title: "Trạng thái",
              align: "center",
              fixed: "right",
              width: 140,
              dataIndex: "certificateStatus",
              type: "select",
              options: [
                { label: "Chờ duyệt", value: "PENDING" },
                { label: "Đã duyệt", value: "APPROVED" },
                { label: "Từ chối", value: "REJECTED" },
                { label: "Đã huỷ", value: "CANCEL" },
              ],
              render: (__, record) => {
                const statusMap: Record<string, { text: string; color: string }> = {
                  PENDING: { text: "Chờ duyệt", color: "orange" },
                  APPROVED: { text: "Đã duyệt", color: "green" },
                  REJECTED: { text: "Từ chối", color: "red" },
                  CANCEL: { text: "Đã huỷ", color: "gray" },
                }
                const s = statusMap[record?.status] || {
                  text: record?.status,
                  color: "default",
                }
                return <span style={{ color: s.color }}>{s.text}</span>
              },
            },
            {
              title: "Thao tác",
              width: 120,
              align: "center",
              fixed: "right",
              render: (_, record) => {
                const studentName = record?.student?.userProfile?.fullname || ""
                const isApproved = record.status === "APPROVED"
                return (
                  <Row className="justify-center gap-2 flex items-center">
                    <InfoIcon
                      onClick={() => {
                        onOpenCertificateList({
                          studentId: record.studentId,
                          studentName,
                          certificates: [record],
                          isEditMode: false,
                        })
                      }}
                      className="text-sm text-blue-700 cursor-pointer"
                    />
                    <EditIcon
                      onClick={() => {
                        onOpenCertificateList({
                          studentId: record.studentId,
                          studentName,
                          certificates: [record],
                          isEditMode: true,
                        })
                      }}
                      className="text-sm text-green-700 cursor-pointer"
                    />
                    {canDeleteCertificate && (
                      <DeleteIcon
                        title={isApproved ? "Xóa chứng chỉ đã duyệt" : "Xóa"}
                        popConfirm={{
                          title: isApproved ? "Xóa chứng chỉ đã duyệt?" : "Xác nhận xóa dữ liệu?",
                          description: isApproved
                            ? "Hệ thống sẽ gỡ điểm phiên đã ghi từ chứng chỉ này"
                            : "Dữ liệu sẽ bị xóa vĩnh viễn",
                          onConfirm: () => handleDeleteCertificates([record.id]),
                        }}
                      />
                    )}
                  </Row>
                )
              },
            },
          ]}
          data={dataTable}
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
            showTotal: (total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
          }}
        />
      </Col>

      <Modal
        title="Xuất Excel danh sách chứng chỉ"
        open={isExportModalOpen}
        onCancel={handleCloseExportModal}
        onOk={handleExportExcel}
        okText="Xuất Excel"
        cancelText="Hủy"
      >
        <Flex vertical gap={12} className="mt-4">
          <div>
            <div className="mb-1 text-sm font-medium">
              Khoá học <span className="text-red-500">*</span>
            </div>
            <Select
              className="w-full"
              placeholder="Chọn khoá học"
              options={trainingCourseData.map((item: TrainingCourse) => ({
                label: item.name,
                value: item.id,
              }))}
              value={exportTrainingCourseId}
              onChange={(value) => setExportTrainingCourseId(value)}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Loại chứng chỉ</div>
            <Select
              className="w-full"
              placeholder="Tất cả loại chứng chỉ"
              options={certificateData.map((item: any) => ({
                label: item.name,
                value: item.id,
              }))}
              value={exportCertificateId}
              onChange={(value) => setExportCertificateId(value)}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </div>
        </Flex>
      </Modal>

      <Modal
        title="Xuất Excel điểm chứng chỉ nhiều loại"
        open={isMultiExportModalOpen}
        onCancel={handleCloseMultiExportModal}
        onOk={handleExportMultiExcel}
        okText="Xuất Excel"
        cancelText="Hủy"
        okButtonProps={{
          disabled: !exportTrainingCourseIds.length || !certificateData.length,
        }}
      >
        <Flex vertical gap={12} className="mt-4">
          <div>
            <div className="mb-1 text-sm font-medium">
              Khoá học <span className="text-red-500">*</span>
            </div>
            <Select
              className="w-full"
              mode="multiple"
              placeholder="Chọn một hoặc nhiều khoá học"
              options={trainingCourseData.map((item: TrainingCourse) => ({
                label: item.name,
                value: item.id,
              }))}
              value={exportTrainingCourseIds}
              onChange={(values) => setExportTrainingCourseIds(values)}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </div>
        </Flex>
      </Modal>

      <Modal
        title="Xuất Excel danh sách SV chưa có chứng chỉ"
        open={isMissingExportModalOpen}
        onCancel={handleCloseMissingExportModal}
        onOk={handleExportMissingCertificateExcel}
        okText="Xuất Excel"
        cancelText="Hủy"
      >
        <Flex vertical gap={12} className="mt-4">
          <div>
            <div className="mb-1 text-sm font-medium">
              Khoá học <span className="text-red-500">*</span>
            </div>
            <Select
              className="w-full"
              placeholder="Chọn khoá học"
              options={trainingCourseData.map((item: TrainingCourse) => ({
                label: item.name,
                value: item.id,
              }))}
              value={exportTrainingCourseId}
              onChange={(value) => setExportTrainingCourseId(value)}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Loại chứng chỉ</div>
            <Select
              className="w-full"
              placeholder="Chọn loại chứng chỉ thiếu"
              options={certificateData.map((item: any) => ({
                label: item.name,
                value: item.id,
              }))}
              value={exportCertificateId}
              onChange={(value) => setExportCertificateId(value)}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </div>
        </Flex>
      </Modal>
    </Row>
  )
}

ArchivedCertificate.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
