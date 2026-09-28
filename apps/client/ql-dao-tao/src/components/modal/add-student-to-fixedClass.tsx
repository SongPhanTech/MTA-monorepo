import { queryClient } from "@api/index"
import PutFormModal from "@components/commons/put-modal"
import {
  DEFAULT_PAGINATE_SIZE,
  FIXED_CLASS_STUDENT_STATUS,
  GENDER_MEAN,
} from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { StudentStatus, type Student } from "@workspace/db/client"
import { useCountStudent, useFindManyStudent, useFindUniqueFixedClass } from "@workspace/db/hooks"
import { syncStudentDonViFromFixedClass } from "@lib/sync-student-don-vi"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Button, Col, Divider, Flex, Form, Input, message, Row, Tag, Tooltip } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import Table from "@components/commons/table"
import _ from "lodash"
import { ArrowBigLeftDash, ArrowBigRightDash, Search } from "lucide-react"
import { useRouter } from "next/router"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { SqlTransactionBodyItem } from "@workspace/libs/api/schemas"

dayjs.locale("vi")

interface FilterProps {
  searchText: string | undefined
  trainingObjectTypeId: string | undefined
}
const AddStudentToFixedClassModal = () => {
  const router = useRouter()
  const fixedClassId = router.query.id as string
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPagesNotClass, setNumberOfPagesNotClass] = useState(DEFAULT_PAGINATE_SIZE)
  const [currentPageNotClass, setCurrentPageNotClass] = useState(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [selectedRowKeysInClass, setSelectedRowKeysInClass] = useState<string[]>([])
  // Danh sách thay đổi tạm thời (chưa lưu DB): SV chờ thêm vào lớp / chờ xoá khỏi lớp
  const [stagedAdd, setStagedAdd] = useState<any[]>([])
  const [stagedRemove, setStagedRemove] = useState<any[]>([])
  const [form] = Form.useForm<{ list: Student[] }>()

  const resetStaged = () => {
    setStagedAdd([])
    setStagedRemove([])
    setSelectedRowKeys([])
    setSelectedRowKeysInClass([])
  }

  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "AddStudentToFixedClassModal",
    onClose: () => {
      form.resetFields()
      resetStaged()
    },
  })

  const { onOpen: onOpenModalConfirm, onClose: onCloseModalConfirm } = useDisclosure<string>({
    tag: "ConfirmModal",
    onOk: (value: any) => {
      saveChanges()
    },
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
    trainingObjectTypeId: undefined,
  })
  const { data: dataStudentNotClass = [], refetch } = useFindManyStudent({
    where: {
      fixedClassId: null,
      OR: filters.searchText
        ? [
            {
              userProfile: {
                code: {
                  contains: filters.searchText,
                  mode: "insensitive",
                },
              },
            },
            {
              userProfile: {
                fullname: {
                  contains: filters.searchText,
                  mode: "insensitive" as const,
                },
              },
            },
          ]
        : undefined,
    },
    include: {
      userProfile: true,
      fixedClass: {
        include: {
          trainingCourse: true,
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
            },
          },
        },
      },
      curriculumVersion: {
        include: {
          curriculum: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPagesNotClass,
    skip: (currentPageNotClass - 1) * numberOfPagesNotClass,
  })

  const { data: countNotClass } = useCountStudent({
    where: {
      fixedClassId: null,
      userProfile: filters.searchText
        ? {
            fullname: {
              contains: filters.searchText,
              mode: "insensitive",
            },
          }
        : {},
    },
  })

  const { data = [] } = useFindManyStudent({
    where: {
      fixedClassId,
      userProfile: filters.searchText
        ? { fullname: { contains: filters.searchText, mode: "insensitive" } }
        : {},
    },
    include: {
      userProfile: true,
      fixedClass: {
        include: {
          trainingCourse: true,
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
            },
          },
        },
      },
      curriculumVersion: {
        include: {
          curriculum: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountStudent({
    where: {
      fixedClassId,
      userProfile: filters.searchText
        ? {
            fullname: {
              contains: filters.searchText,
              mode: "insensitive",
            },
          }
        : {},
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  const { data: fixedClass } = useFindUniqueFixedClass(
    {
      where: { id: fixedClassId },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const stagedAddIds = stagedAdd.map((s) => s.id)
  const stagedRemoveIds = stagedRemove.map((s) => s.id)

  // Danh sách hiển thị: gộp các thay đổi tạm (chưa lưu) vào dữ liệu từ server.
  // SV vừa chuyển được đưa lên đầu bảng đích để dễ nhìn thấy.
  const dataStudentNotClassDisplay = [
    ...stagedRemove,
    ...dataStudentNotClass.filter((s) => !stagedAddIds.includes(s.id)),
  ]
  const dataInClassDisplay = [...stagedAdd, ...data.filter((s) => !stagedRemoveIds.includes(s.id))]

  // Bấm "Lưu" mới thực sự ghi xuống DB
  async function onOk() {
    if (stagedAdd.length === 0 && stagedRemove.length === 0) {
      message.warning("Chưa có thay đổi nào để lưu")
      return
    }
    // Lớp có CTĐT -> xác nhận trước khi lưu (sẽ đổi CTĐT cho SV được thêm vào lớp)
    if (fixedClass?.curriculumVersionId) {
      onOpenModalConfirm(
        "Thay đổi CTĐT cho tất cả các sinh viên này, sinh viên bảo lưu sẽ không được thay đổi CTĐT?"
      )
    } else {
      await saveChanges()
    }
  }

  const saveChanges = async () => {
    const addIds = stagedAdd.map((s) => s.id)
    const removeIds = stagedRemove.map((s) => s.id)
    const cvId = fixedClass?.curriculumVersionId
    const ops: SqlTransactionBodyItem[] = []

    if (addIds.length) {
      ops.push({
        model: "Student",
        operation: "updateMany",
        data: {
          where: { id: { in: addIds } },
          data: { fixedClassId },
        },
      })
      if (cvId) {
        ops.push({
          model: "Student",
          operation: "updateMany",
          data: {
            where: {
              id: { in: addIds },
              status: { not: StudentStatus.DEFERRED_STUDY },
            },
            data: { curriculumVersionId: cvId },
          },
        })
      }
      ops.push({
        model: "Student",
        operation: "updateMany",
        data: {
          where: {
            id: { in: addIds },
            status: StudentStatus.DEFERRED_STUDY,
          },
          data: { status: StudentStatus.ENROLLED },
        },
      })
    }

    if (removeIds.length) {
      ops.push({
        model: "Student",
        operation: "updateMany",
        data: {
          where: { id: { in: removeIds } },
          data: { fixedClassId: null },
        },
      })
    }

    try {
      showSpinner()
      const res = await sqlTransaction(ops)

      if (res.status !== 200) {
        throw new Error("Failed with status: " + res.status)
      }

      await queryClient.invalidateQueries({
        queryKey: ["zenstack", "Student"],
      })
      if (addIds.length) {
        await syncStudentDonViFromFixedClass({ studentIds: addIds })
      }
      message.success("Cập nhật thành công")
      onCloseModalConfirm()
      onClose()
    } catch (error) {
      console.error("Lỗi khi cập nhật sinh viên:", error)
      message.error("Cập nhật thất bại, vui lòng thử lại!")
    } finally {
      hideSpinner()
    }
  }

  // Chuyển SV sang lớp (chỉ tạm thời, chưa lưu DB)
  const handleAddStudentToClass = () => {
    if (!selectedRowKeys.length) return
    const selectedSet = new Set(selectedRowKeys)
    // SV đang chờ xoá mà được chuyển lại vào lớp -> huỷ thao tác xoá
    setStagedRemove((prev) => prev.filter((s) => !selectedSet.has(s.id)))
    // SV chưa có lớp -> đưa vào danh sách chờ thêm
    const toAdd = dataStudentNotClass.filter(
      (s) => selectedSet.has(s.id) && !stagedAddIds.includes(s.id)
    )
    setStagedAdd((prev) => [...prev, ...toAdd])
    setSelectedRowKeys([])
  }

  // Chuyển SV ra khỏi lớp (chỉ tạm thời, chưa lưu DB)
  const handleRemoveStudentFromClass = () => {
    if (!selectedRowKeysInClass.length) return
    const selectedSet = new Set(selectedRowKeysInClass)
    // SV đang chờ thêm mà được chuyển lại ra ngoài -> huỷ thao tác thêm
    setStagedAdd((prev) => prev.filter((s) => !selectedSet.has(s.id)))
    // SV đang trong lớp -> đưa vào danh sách chờ xoá
    const toRemove = data.filter((s) => selectedSet.has(s.id) && !stagedRemoveIds.includes(s.id))
    setStagedRemove((prev) => [...prev, ...toRemove])
    setSelectedRowKeysInClass([])
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Thêm sinh viên vào lớp"}
      className="w-[100vw]"
    >
      <Col span={24} className="my-2">
        <Flex>
          <Input
            id="search"
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            placeholder="Tìm kiếm theo tên,mã định danh"
            style={{
              width: 300,
              marginRight: 8,
              height: 32,
            }}
            prefix={
              <Search
                size={16}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            allowClear
          />
        </Flex>
      </Col>
      <Row gutter={[16, 16]}>
        <Col span={11}>
          <Divider orientation="left" orientationMargin={0}>
            Danh sách sinh viên chưa có lớp
          </Divider>
          <Table
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys: any) => setSelectedRowKeys(selectedKeys),
            }}
            columns={[
              {
                title: "STT",
                width: 60,
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
                render: (_, record) => record.userProfile?.code || "",
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
            data={dataStudentNotClassDisplay}
            scroll={{ x: "max-content" }}
            pagination={{
              current: currentPageNotClass,
              pageSize: numberOfPagesNotClass,
              total: (countNotClass ?? 0) - stagedAdd.length + stagedRemove.length,

              onChange: (page, pageSize) => {
                if (numberOfPagesNotClass === pageSize) {
                  setCurrentPageNotClass(page)
                } else {
                  setCurrentPageNotClass(1)
                  setNumberOfPagesNotClass(pageSize)
                }
              },
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
        <Col span={1} className="flex items-center justify-center">
          <Flex align="center" justify="center" vertical>
            <Tooltip title="Chỉnh sửa danh sách SV trong lớp" placement="top">
              <Button
                disabled={!selectedRowKeys?.length}
                className="mb-2"
                onClick={handleAddStudentToClass}
              >
                <ArrowBigRightDash className="cursor-pointer" />
              </Button>
            </Tooltip>
            <Tooltip title="Xoá SV khỏi lớp" placement="top">
              <Button
                disabled={!selectedRowKeysInClass?.length}
                className="mb-2"
                onClick={handleRemoveStudentFromClass}
              >
                <ArrowBigLeftDash className="cursor-pointer" />
              </Button>
            </Tooltip>
          </Flex>
        </Col>
        <Col span={12}>
          <Divider orientation="left" orientationMargin={0}>
            Danh sách sinh viên trong lớp
          </Divider>
          <Table
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedRowKeysInClass,
              onChange: (selectedRowKeysInClass: any) =>
                setSelectedRowKeysInClass(selectedRowKeysInClass),
            }}
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
                dataIndex: "code",
                width: 120,
                align: "center",
                render: (_, record) => record.userProfile?.code || "",
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
                  return (
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField
                      ?.name || ""
                  )
                },
              },
              {
                title: "Chuyên ngành",
                width: 180,
                align: "center",
                render: (record) => {
                  return (
                    record?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""
                  )
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
            data={dataInClassDisplay}
            scroll={{ x: "max-content" }}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: (count ?? 0) + stagedAdd.length - stagedRemove.length,
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
      </Row>
    </PutFormModal>
  )
}

export default AddStudentToFixedClassModal
