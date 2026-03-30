import PutFormModal from "@components/commons/put-modal"
import Table from "@components/commons/table"
import {
  DEFAULT_PAGINATE_SIZE,
  FIXED_CLASS_STUDENT_STATUS,
  GENDER_MEAN,
} from "@constants/constants"
import useSpinner from "@hooks/spinner"
import type { Prisma } from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyFixedClass,
  useFindManyStudent,
  useUpdateManyStudent,
} from "@workspace/db/hooks"
import { Select } from "@workspace/ui"
import { Button, Col, Flex, Form, Input, message, Popconfirm, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import { ArrowBigLeftDash, ArrowBigRightDash } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const SCROLL_DELAY = 300
const HIGHLIGHT_DURATION = 3000

const ModalChuyenLop = () => {
  const [currentPageNotClass, setCurrentPageNotClass] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [selectedRowsInClass, setSelectedRowsInClass] = useState<string[]>([])
  const [transferredStudentIds, setTransferredStudentIds] = useState<string[]>([])
  const [highlightedRows, setHighlightedRows] = useState<string[]>([])
  const tableLeftRef = useRef<HTMLDivElement>(null)
  const tableRightRef = useRef<HTMLDivElement>(null)
  const scrollTimerRef = useRef<NodeJS.Timeout>()
  const highlightTimerRef = useRef<NodeJS.Timeout>()
  const [filter, setFilter] = useState<{
    search?: string
    searchClassArrive?: string
    fixedClassId?: string
    fixedClassArriveId?: string
  }>({
    search: "",
    searchClassArrive: "",
    fixedClassId: undefined,
    fixedClassArriveId: undefined,
  })

  const { isOpen, onClose } = useDisclosure({
    tag: "ModalChuyenLop",
  })

  const [form] = Form.useForm()

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: fixedClasses = [] } = useFindManyFixedClass({
    where: {
      active: true,
      deletedAt: null,
    },
    include: {
      trainingCourse: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  const { data = [], refetch } = useFindManyStudent(
    {
      where: {
        ...(filter.search
          ? {
              userProfile: {
                fullname: {
                  contains: filter.search,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        fixedClassId: filter.fixedClassId,
      },
      include: {
        userProfile: {
          select: {
            firstName: true,
            lastName: true,
            fullname: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        fixedClass: {
          include: {
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: {
                      include: {
                        trainingField: {
                          select: {
                            name: true,
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
        curriculumVersion: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!filter.fixedClassId,
    }
  )

  const { data: count } = useCountStudent(
    {
      where: {
        ...(filter.search
          ? {
              userProfile: {
                fullname: {
                  contains: filter.search,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        fixedClassId: filter.fixedClassId,
      },
    },
    {
      enabled: !!filter.fixedClassId,
    }
  )

  const { data: studentClassArrives = [], refetch: refetchClassArrives } = useFindManyStudent(
    {
      where: {
        ...(filter.searchClassArrive
          ? {
              userProfile: {
                fullname: {
                  contains: filter.searchClassArrive,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        fixedClassId: filter.fixedClassArriveId,
      },
      include: {
        userProfile: {
          select: {
            firstName: true,
            lastName: true,
            fullname: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        fixedClass: {
          include: {
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: {
                      include: {
                        trainingField: {
                          select: {
                            name: true,
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
        curriculumVersion: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!filter.fixedClassArriveId,
    }
  )

  const { data: countStudentClassArrives } = useCountStudent(
    {
      where: {
        ...(filter.searchClassArrive
          ? {
              userProfile: {
                fullname: {
                  contains: filter.searchClassArrive,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        fixedClassId: filter.fixedClassArriveId,
      },
    },
    {
      enabled: !!filter.fixedClassArriveId,
    }
  )

  const debouncedRefetch = useMemo(
    () =>
      _.debounce(() => {
        refetch()
      }, 500),
    [refetch]
  )

  const debouncedRefetchStudentClassArrive = useMemo(
    () =>
      _.debounce(() => {
        refetchClassArrives()
      }, 500),
    [refetchClassArrives]
  )

  useEffect(() => {
    return () => {
      debouncedRefetch.cancel()
      debouncedRefetchStudentClassArrive.cancel()
      clearTimeout(scrollTimerRef.current)
      clearTimeout(highlightTimerRef.current)
    }
  }, [debouncedRefetch, debouncedRefetchStudentClassArrive])

  const handleSearch = useCallback(
    (key: string, value: string) => {
      setFilter((prev) => {
        const newFilter = { ...prev, [key]: value }
        debouncedRefetch()
        return newFilter
      })
    },
    [debouncedRefetch]
  )

  const handleSearchStudentClassArrive = useCallback(
    (key: string, value: string) => {
      setFilter((prev) => {
        const newFilter = { ...prev, [key]: value }
        debouncedRefetchStudentClassArrive()
        return newFilter
      })
    },
    [debouncedRefetchStudentClassArrive]
  )

  const { mutateAsync: updateManyStudents } = useUpdateManyStudent()

  const fixedClassOptions = useMemo(
    () =>
      fixedClasses.map((fixedClass) => ({
        label: `${fixedClass.name} - ${fixedClass.trainingCourse?.name || ""}`,
        value: fixedClass.id,
      })),
    [fixedClasses]
  )

  const scrollAndHighlightRows = useCallback(
    (rowIds: string[], targetRef: React.RefObject<HTMLDivElement>) => {
      setHighlightedRows(rowIds)

      clearTimeout(scrollTimerRef.current)
      clearTimeout(highlightTimerRef.current)

      scrollTimerRef.current = setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })

        highlightTimerRef.current = setTimeout(() => {
          setHighlightedRows([])
        }, HIGHLIGHT_DURATION)
      }, SCROLL_DELAY)
    },
    []
  )

  const getRowClassName = useCallback(
    (record: any) => (highlightedRows.includes(record.id) ? "bg-green-100" : ""),
    [highlightedRows]
  )

  const onOk = async () => {
    setSelectedRows([])
    setSelectedRowsInClass([])
    setTransferredStudentIds([])
    setFilter({
      search: "",
      searchClassArrive: "",
      fixedClassId: undefined,
      fixedClassArriveId: undefined,
    })
    onClose()
  }

  const updateStudentsToNewClass = useCallback(async () => {
    if (!filter.fixedClassArriveId) {
      message.error("Vui lòng chọn lớp đến")
      return
    }
    if (filter.fixedClassId === filter.fixedClassArriveId) {
      message.error("Lớp đến không được trùng với lớp hiện tại")
      return
    }
    try {
      showSpinner()
      const targetClass = fixedClasses.find((fc) => fc.id === filter.fixedClassArriveId)

      const updateData: Prisma.XOR<
        Prisma.StudentUpdateManyMutationInput,
        Prisma.StudentUncheckedUpdateManyInput
      > = {
        fixedClassId: filter.fixedClassArriveId,
      }

      if (targetClass?.curriculumVersionId) {
        updateData.curriculumVersionId = targetClass?.curriculumVersionId
      }

      await updateManyStudents({
        where: {
          id: {
            in: selectedRows,
          },
        },
        data: updateData,
      })

      message.success("Cập nhật thành công")
      setTransferredStudentIds((prev) => [...prev, ...selectedRows])
      const transferredIds = [...selectedRows]
      setSelectedRows([])
      refetch()
      refetchClassArrives()

      scrollAndHighlightRows(transferredIds, tableRightRef)
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }, [
    filter.fixedClassArriveId,
    filter.fixedClassId,
    selectedRows,
    fixedClasses,
    updateManyStudents,
    showSpinner,
    hideSpinner,
    refetch,
    refetchClassArrives,
    scrollAndHighlightRows,
  ])

  const removeStudentsFromClass = useCallback(async () => {
    try {
      showSpinner()
      await updateManyStudents({
        where: {
          id: {
            in: selectedRowsInClass,
          },
        },
        data: {
          fixedClassId: filter.fixedClassId,
          curriculumVersionId: fixedClasses.find((fc) => fc.id === filter.fixedClassId)
            ?.curriculumVersionId,
        },
      })

      message.success("Cập nhật thành công")
      setTransferredStudentIds((prev) => prev.filter((id) => !selectedRowsInClass.includes(id)))
      const removedIds = [...selectedRowsInClass]
      setSelectedRowsInClass([])
      refetch()
      refetchClassArrives()

      scrollAndHighlightRows(removedIds, tableLeftRef)
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }, [
    selectedRowsInClass,
    filter.fixedClassId,
    fixedClasses,
    updateManyStudents,
    showSpinner,
    hideSpinner,
    refetch,
    refetchClassArrives,
    scrollAndHighlightRows,
  ])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      maskClosable={true}
      onCancel={onClose}
      title="Chuyển lớp"
      className="w-[100vw]"
    >
      <Row gutter={16}>
        <Col span={11} ref={tableLeftRef}>
          <Flex gap={8} className="mb-4">
            <Select
              placeholder="Chọn lớp quản lý"
              value={filter.fixedClassId}
              onChange={(value) => {
                setFilter({
                  ...filter,
                  fixedClassId: value,
                })
                setCurrentPage(1)
              }}
              className="w-96 flex-1 min-w-0"
              allowClear
              options={fixedClassOptions}
            />

            <Input
              placeholder="Tìm kiếm theo tên..."
              value={filter.search}
              className="w-72 flex-1 min-w-0"
              onChange={(e) => {
                handleSearch("search", e.target.value)
                setCurrentPage(1)
              }}
              allowClear
            />
          </Flex>
          <Table
            rowKey="id"
            rowClassName={getRowClassName}
            rowSelection={{
              selectedRowKeys: selectedRows,
              onChange: (selectedKeys: any) => setSelectedRows(selectedKeys),
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "code",
                width: 120,
                align: "center",
              },
              {
                title: "Họ và tên",
                width: 150,
                align: "center",
                render: (record) =>
                  record.userProfile
                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                    : "",
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 100,
                render: (record) =>
                  record.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Giới tính",
                align: "center",
                width: 80,
                render: (__, record) =>
                  record?.userProfile?.gender
                    ? GENDER_MEAN[record.userProfile.gender as keyof typeof GENDER_MEAN]
                    : "",
              },
              {
                title: "Ngành",
                width: 150,
                align: "center",
                render: (record) => {
                  return record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                    ?.trainingField?.name
                },
              },
              {
                title: "Chuyên ngành",
                width: 180,
                align: "center",
                render: (record) => {
                  return record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name
                },
              },
              {
                title: "CTĐT",
                width: 150,
                align: "center",
                render: (record) => {
                  const curriculum = record.curriculumVersion
                  return curriculum ? curriculum.name : ""
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                render: (_, record) => {
                  const statusInfo =
                    FIXED_CLASS_STUDENT_STATUS[
                      record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                    ]
                  return statusInfo ? (
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  ) : (
                    <Tag color="default">Không xác định</Tag>
                  )
                },
              },
            ]}
            data={data}
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
        <Col span={2} className="flex items-center justify-center">
          <Flex align="center" justify="center" vertical>
            <Tooltip placement="top" title="Chuyển sinh viên sang lớp mới">
              <Popconfirm
                title="Xác nhận chuyển lớp"
                description={`Bạn có chắc chắn muốn chuyển ${selectedRows.length} sinh viên sang lớp mới?`}
                onConfirm={updateStudentsToNewClass}
                okText="Xác nhận"
                cancelText="Hủy"
                disabled={!selectedRows?.length}
              >
                <Button disabled={!selectedRows?.length} className="mb-2">
                  <ArrowBigRightDash className="cursor-pointer" />
                </Button>
              </Popconfirm>
            </Tooltip>
            <Tooltip placement="top" title="Chuyển sinh viên về lớp cũ">
              <Popconfirm
                title="Xác nhận chuyển lại"
                description={`Bạn có chắc chắn muốn chuyển ${selectedRowsInClass.length} sinh viên về lớp cũ?`}
                onConfirm={removeStudentsFromClass}
                okText="Xác nhận"
                cancelText="Hủy"
                disabled={!selectedRowsInClass?.length}
              >
                <Button disabled={!selectedRowsInClass?.length} className="mb-2">
                  <ArrowBigLeftDash className="cursor-pointer" />
                </Button>
              </Popconfirm>
            </Tooltip>
          </Flex>
        </Col>
        <Col span={11} ref={tableRightRef}>
          <Flex gap={8} className="mb-4">
            <Select
              placeholder="Chọn lớp đến"
              value={filter.fixedClassArriveId}
              onChange={(value) => {
                setFilter({
                  ...filter,
                  fixedClassArriveId: value,
                })
                setCurrentPageNotClass(1)
              }}
              className="w-96 flex-1 min-w-0"
              allowClear
              options={fixedClassOptions}
            />
            <Input
              placeholder="Tìm kiếm theo tên..."
              value={filter.searchClassArrive}
              className="w-72 flex-1 min-w-0"
              onChange={(e) => {
                handleSearchStudentClassArrive("searchClassArrive", e.target.value)
                setCurrentPageNotClass(1)
              }}
              allowClear
            />
          </Flex>
          <Table
            rowKey="id"
            rowClassName={getRowClassName}
            rowSelection={{
              selectedRowKeys: selectedRowsInClass,
              onChange: (selectedKeys: any) => setSelectedRowsInClass(selectedKeys),
              getCheckboxProps: (record) => ({
                disabled: !transferredStudentIds.includes(record.id),
              }),
            }}
            columns={[
              {
                title: "STT",
                width: 50,
                align: "center",
                fixed: "left",
                render: (_, __, index) =>
                  index + 1 + (currentPageNotClass - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "code",
                width: 120,
                align: "center",
              },
              {
                title: "Họ và tên",
                width: 150,
                align: "center",
                render: (record) =>
                  record.userProfile
                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                    : "",
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 100,
                render: (record) =>
                  record.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Giới tính",
                align: "center",
                width: 80,
                render: (__, record) =>
                  record?.userProfile?.gender
                    ? GENDER_MEAN[record.userProfile.gender as keyof typeof GENDER_MEAN]
                    : "",
              },
              {
                title: "Ngành",
                width: 150,
                align: "center",
                render: (record) => {
                  return record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                    ?.trainingField?.name
                },
              },
              {
                title: "Chuyên ngành",
                width: 180,
                align: "center",
                render: (record) => {
                  return record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name
                },
              },
              {
                title: "CTĐT",
                width: 150,
                align: "center",
                render: (record) => {
                  const curriculum = record.curriculumVersion
                  return curriculum ? curriculum.name : ""
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                render: (_, record) => {
                  const statusInfo =
                    FIXED_CLASS_STUDENT_STATUS[
                      record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                    ]
                  return statusInfo ? (
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  ) : (
                    <Tag color="default">Không xác định</Tag>
                  )
                },
              },
            ]}
            data={studentClassArrives}
            pagination={{
              current: currentPageNotClass,
              pageSize: numberOfPages,
              total: countStudentClassArrives,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPageNotClass(page)
                } else {
                  setCurrentPageNotClass(1)
                  setNumberOfPages(pageSize)
                }
              },
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </PutFormModal>
  )
}

export default ModalChuyenLop
