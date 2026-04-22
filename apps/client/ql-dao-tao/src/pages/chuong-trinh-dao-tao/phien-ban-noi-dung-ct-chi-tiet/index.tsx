import TreeSelectDepartment from "@components/commons/department-select/TreeSelectDepartment"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import ViewIcon from "@components/icons/view"
import PutVersionSubjectDetailModal, {
  HistorySubjectVersionType,
} from "@components/modal/put-phien-ban-chi-tiet-mon-hoc"
import PutSubjectListModal from "@components/modal/put-danh-sach-mon-hoc"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import { useExamTypeOptions } from "@hooks/examType"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { emptyObjectIf } from "@workspace/constant"
import type { ExamType, Prisma } from "@workspace/db/client"
import {
  useCountSubjectVersion,
  useCreateSubjectVersionHistory,
  useFindManySubjectVersion,
  useUpdateManySubjectVersion,
  useUpdateSubject,
  useUpdateSubjectVersion,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Form, Input, message, Popconfirm, Row, Tooltip, Typography } from "antd"
import { saveAs } from "file-saver"
import _ from "lodash"
import { BookPlus, Download, History, LockKeyhole, LockKeyholeOpen, Search } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import * as XLSX from "xlsx"

export default function SubjectList() {
  const { can, canSome } = useAbility()
  const [expandAll, setExpandAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLocked, setIsLocked] = useState(true)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    managementOrganizationIds: undefined,
    examType: undefined,
    active: undefined,
    code: "",
    name: "",
    credit: undefined,
    period: undefined,
    numberOfTheory: undefined,
    numberOfPractical: undefined,
    numberOfSelfStudy: undefined,
    numberOfPractice: undefined,
    numberOfReview: undefined,
    numberOfExam: undefined,
    numberOfOther: undefined,
    isTeaching: undefined,
  })

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { getExamTypeLabel, options: examTypeFilters } = useExamTypeOptions()
  const { mutateAsync: updateManySubjectVersion } = useUpdateManySubjectVersion()

  async function handleToggleLock() {
    try {
      showSpinner()
      await updateManySubjectVersion({
        data: { isLocked: !isLocked },
      })
      message.success(isLocked ? "Mở khoá thành công" : "Khoá thành công")
      setIsLocked(!isLocked)
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

  const where: Prisma.SubjectVersionWhereInput = useMemo(() => {
    return {
      trainingObjectTypeId,
      deletedAt: null,
      ...(filters.name && {
        name: { contains: filters.name, mode: "insensitive" as const },
      }),
      ...(filters.code && {
        code: { contains: filters.code, mode: "insensitive" as const },
      }),
      ...(filters.examType
        ? {
            examType: { in: filters.examType },
          }
        : {}),
      ...(filters.managementOrganizationIds?.length
        ? { managementOrganizationId: { in: filters.managementOrganizationIds } }
        : {}),
      ...(filters.active?.length === 1
        ? {
            active: filters.active[0],
          }
        : {}),
      ...(filters.isTeaching !== undefined &&
        filters.isTeaching.length === 1 && {
          subjectClass: filters.isTeaching[0]
            ? { some: { active: true, deletedAt: null } }
            : { none: {} },
        }),
      ...(filters.searchText
        ? {
            name: {
              contains: filters.searchText,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }
  }, [filters, trainingObjectTypeId])

  const { data: subjectVersionData, refetch } = useFindManySubjectVersion({
    where,
    include: {
      subject: true,
      managementOrganization: true,
      subjectClass: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
      trainingBlocks: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
      trainingObjectType: true,
    },
    orderBy: [
      ...emptyObjectIf([{ credit: filters.credit }], !!filters.credit),
      ...emptyObjectIf([{ period: filters.period }], !!filters.period),
      ...emptyObjectIf([{ numberOfTheory: filters.numberOfTheory }], !!filters.numberOfTheory),
      ...emptyObjectIf(
        [{ numberOfPractical: filters.numberOfPractical }],
        !!filters.numberOfPractical
      ),
      ...emptyObjectIf(
        [{ numberOfSelfStudy: filters.numberOfSelfStudy }],
        !!filters.numberOfSelfStudy
      ),
      ...emptyObjectIf(
        [{ numberOfPractice: filters.numberOfPractice }],
        !!filters.numberOfPractice
      ),
      ...emptyObjectIf([{ numberOfReview: filters.numberOfReview }], !!filters.numberOfReview),
      ...emptyObjectIf([{ numberOfExam: filters.numberOfExam }], !!filters.numberOfExam),
      ...emptyObjectIf([{ numberOfOther: filters.numberOfOther }], !!filters.numberOfOther),
      {
        createdAt: "desc",
      },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { refetch: refetchSubjectsForExport } = useFindManySubjectVersion(
    {
      where,
      include: {
        subject: true,
        managementOrganization: true,
        subjectClass: {
          where: { deletedAt: null },
          select: { id: true },
          take: 1,
        },
        trainingObjectType: true,
      },
    },
    {
      enabled: false,
    }
  )

  const { data: count } = useCountSubjectVersion({
    where,
  })

  useEffect(() => {
    if (subjectVersionData) {
      const hasAnyUnlockedVersion = subjectVersionData.some((version) => version.isLocked === false)
      setIsLocked(!hasAnyUnlockedVersion)
    }
  }, [subjectVersionData])

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const { onOpen: onOpenHistory } = useDisclosure<{
    id: string
    isLocked: boolean
  }>({
    tag: "ModalViewHistoryChange",
  })

  const { onOpen: onOpenSubjectVersion } = useDisclosure<{
    subjectId: string
    subjectVersionId?: string
    isLocked?: boolean
  }>({
    tag: "PutVersionSubjectDetailModal",
  })

  const { onOpen: onOpenDetailSubject } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "ModalChiTietMonHoc",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpenSubjectVersion({ subjectId: "", subjectVersionId: undefined, isLocked: false })
  }

  const handleHistory = () => {
    onOpenHistory()
  }

  const handleModalSubjectVersion = (
    subjectId: string,
    subjectVersionId: string,
    isLocked: boolean
  ) => {
    onOpenSubjectVersion({ subjectId, subjectVersionId, isLocked })
  }

  const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
  const { mutateAsync: updateSubject } = useUpdateSubject()
  const { mutateAsync: createSubjectVersionHistory } = useCreateSubjectVersionHistory()

  async function handleDelete(record: any) {
    try {
      showSpinner()
      await updateSubjectVersion({
        where: {
          id: record.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      const historyData = {
        subjectVersion: {
          connect: {
            id: record.id,
          },
        },
        content: "Xóa môn học",
        action: HistorySubjectVersionType.DELETE,
        updatedBy: {
          connect: {
            id: window?.contextData?.userId,
          },
        },
      }
      await createSubjectVersionHistory({ data: historyData })
      message.success("Xóa thành công")
      refetch()
    } catch (error: any) {
      if (error?.info?.message) {
        // message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  async function handleDeleteSubject(id: string) {
    try {
      showSpinner()
      await updateSubject({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      message.success("Xóa thành công")
      refetch()
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
  const handleExportExcel = async () => {
    const res = await refetchSubjectsForExport()
    const subjects = res.data

    if (!subjects?.length) {
      message.warning("Không có dữ liệu để xuất")
      return
    }

    const dataExport: any[] = []

    subjects.forEach((version: any) => {
      dataExport.push({
        "Đơn vị quản lý": version.managementOrganization?.sTen || "",
        "Mã môn học": version.code,
        "Tên môn học": version.name,
        "Mã TKB": version.codeTkb,
        "Số tín chỉ": version.credit,
        "Số tiết": version.period,
        "Lý thuyết": version.numberOfTheory,
        "Bài tập": version.numberOfPractical,
        "Thảo luận": version.numberOfSelfStudy,
        "Thực hành": version.numberOfPractice,
        Ôn: version.numberOfReview,
        Thi: version.numberOfExam,
        "Hình thức thi": getExamTypeLabel(version.examType),
        "Mô tả": version.description,
        "Đã mở LMH": version.subjectClass?.length ? "Có" : "Chưa",
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(dataExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachMonHoc")

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })

    const trainingObjectTypeName =
      subjects?.find((v: any) => v.trainingObjectType?.id === trainingObjectTypeId)
        ?.trainingObjectType?.name || ""

    saveAs(blob, `DanhSachMonHoc${trainingObjectTypeName}.xlsx`)
  }

  const handleFilterChange = (key: string, value: string | ExamType[] | boolean) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const pageTitle = "Quản lý phiên bản nội dung chương trình CTMH"

  return (
    <div>
      <Row>
        <Col span={24} className="mb-0">
          <Typography.Title level={4}>{pageTitle}</Typography.Title>
        </Col>
      </Row>
      <Row gutter={[8, 0]}>
        <Col span={24}>
          <Row gutter={[8, 8]} align="top" justify="space-between">
            <Col span={12}>
              <Flex>
                <Col span={8}>
                  <Form.Item name="searchText">
                    <Input
                      id="search"
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          searchText: e.target.value,
                        })
                      }
                      className="py-0 h-8"
                      placeholder="Tìm kiếm môn học"
                      prefix={
                        <Search
                          size={15}
                          style={{
                            color: "rgba(0, 0, 0, 0.25)",
                          }}
                        />
                      }
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    className="mb-0"
                    name="managementOrganizationIds"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign="left"
                  >
                    <TreeSelectDepartment
                      treeCheckable={false}
                      multiple={true}
                      onChange={(val) => handleFilterChange("managementOrganizationIds", val)}
                    />
                  </Form.Item>
                </Col>
              </Flex>
            </Col>

            <Col span={12}>
              <Flex justify="end" gap={4}>
                {/* <Button onClick={handleExportExcel} icon={<Download size={14} />}>
                  Xuất Excel
                </Button> */}
                <Button onClick={handleModal} type="primary">
                  <BookPlus />
                  Thêm mới
                </Button>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            className="mt-0"
            dataSource={subjectVersionData}
            tableLayout="fixed"
            scroll={{ x: 1600, y: "calc(100vh - 300px)" }}
            columns={[
              {
                title: <Tooltip title="Mã môn học">Mã MH</Tooltip>,
                dataIndex: "code",
                width: 90,
                align: "center",
                fixed: "left",
              },
              {
                title: "Tên môn",
                dataIndex: "name",
                width: 250,
                fixed: "left",
                ellipsis: true,
              },
              {
                title: "Đơn vị quản lý",
                dataIndex: ["managementOrganization", "sTen"],
                width: 220,
                ellipsis: true,
              },
              {
                title: <Tooltip title="Mã thời khóa biểu">Mã TKB</Tooltip>,
                dataIndex: "codeTkb",
                width: 100,
                align: "center",
              },
              {
                title: "Số tín chỉ",
                dataIndex: "credit",
                width: 80,
                align: "center",
              },
              {
                title: "Số tiết",
                dataIndex: "period",
                width: 80,
                align: "center",
              },
              {
                title: <Tooltip title="Lý thuyết">LT</Tooltip>,
                dataIndex: "numberOfTheory",
                width: 70,
                align: "center",
              },
              {
                title: <Tooltip title="Bài tập">BT</Tooltip>,
                dataIndex: "numberOfPractical",
                width: 70,
                align: "center",
              },
              {
                title: <Tooltip title="Thảo luận">ThL</Tooltip>,
                dataIndex: "numberOfSelfStudy",
                width: 70,
                align: "center",
              },
              {
                title: <Tooltip title="Thí nghiệm, Thực hành">TN, TH</Tooltip>,
                dataIndex: "numberOfPractice",
                width: 90,
                align: "center",
              },
              {
                title: "Ôn",
                dataIndex: "numberOfReview",
                width: 70,
                align: "center",
              },
              {
                title: <Tooltip title="Kiểm tra, Thi">KT, Thi</Tooltip>,
                dataIndex: "numberOfExam",
                width: 80,
                align: "center",
              },
              {
                title: "Hình thức thi",
                dataIndex: "examType",
                width: 120,
                align: "center",
                render: (value) => getExamTypeLabel(value),
              },
              {
                title: "Thao tác",
                width: 110,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                  "THEM",
                  "SUA",
                  "XOA"
                ),
                render: (_, record) => {
                  const { id: subjectVersionId, subjectId, subjectClass, trainingBlocks } = record
                  return (
                    <Flex justify="center" gap={12}>
                      {can(
                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                        "XEM"
                      ) && (
                        <ViewIcon
                          onClick={() => onOpenDetailSubject({ subjectVersionId })}
                          className="text-blue-700 cursor-pointer"
                        />
                      )}
                      {!isLocked && (
                        <>
                          {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                            "SUA"
                          ) && (
                            <EditIcon
                              onClick={() =>
                                onOpenSubjectVersion({ subjectId, subjectVersionId, isLocked })
                              }
                              className="text-blue-700 cursor-pointer"
                            />
                          )}
                          {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                            "XOA"
                          ) && (
                            <DeleteIcon
                              disabled={subjectClass?.length > 0 || trainingBlocks?.length > 0}
                              popConfirm={{
                                onConfirm: () => handleDelete(record),
                              }}
                            />
                          )}
                        </>
                      )}
                    </Flex>
                  )
                },
              },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
      <PutSubjectListModal />
      <PutVersionSubjectDetailModal />
    </div>
  )
}

SubjectList.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
