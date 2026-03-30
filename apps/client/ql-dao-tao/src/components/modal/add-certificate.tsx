import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { StudentSubjectScore } from "@workspace/db/client"
import {
  useCountArchivedCertificate,
  useFindFirstTrainingCourse,
  useFindManyArchivedCertificate,
  useUpdateStudentSubjectScore,
} from "@workspace/db/hooks"
import { Col, Flex, Form, Input, message, Row } from "antd"
import dayjs from "dayjs"
import { useCallback, useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { calcFinalScore } from "@workspace/libs/utils"
import _ from "lodash"
export type PutStudentSubjectScore = StudentSubjectScore
interface FilterProps {
  searchText: string | ""
}

dayjs.locale("vi")

const PutAddCertificateScoreModal = () => {
  const [form] = Form.useForm<PutStudentSubjectScore>()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { isOpen, onClose, input } = useDisclosure<any>({
    tag: "PutAddCertificateScoreModal",
    onClose: form.resetFields,
  })
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()
  const { data: trainingCourse } = useFindFirstTrainingCourse({
    where: {
      fixedClass: {
        some: {
          students: {
            some: {
              id: input.studentId,
            },
          },
        },
      },
    },
  })

  const { data: dataTable = [], refetch } = useFindManyArchivedCertificate({
    where: {
      OR: [
        // { name: { contains: filters.searchText, mode: 'insensitive' } },
        { code: { contains: filters.searchText, mode: "insensitive" } },
      ],
    },
    include: {},
    orderBy: {
      // name: 'asc',
    },
  })

  const { data: count } = useCountArchivedCertificate({
    where: {
      OR: [
        // { name: { contains: filters.searchText, mode: 'insensitive' } },
        { code: { contains: filters.searchText, mode: "insensitive" } },
      ],
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  async function onOk({ ...rest }: PutStudentSubjectScore) {
    try {
      showSpinner()
      const listCertificates = []
      for (const key of selectedRowKeys) {
        const item = dataTable.find((item) => item.id === key)
        if (item) {
          listCertificates.push({ archivedCertificate: item })
        }
      }
      if (!trainingCourse) return
      const finalScore = calcFinalScore(
        trainingCourse,
        {
          ...input.subjectClassStudent,
          certificates: listCertificates,
        },
        "NORMAL"
      )
      await updateStudentSubjectScore({
        data: {
          ...rest,
          finalScore,
          certificates: {
            createMany: {
              data: selectedRowKeys.map((id) => ({
                archivedCertificateId: id as string,
              })),
              skipDuplicates: true,
            },
            deleteMany: {
              studentSubjectScoreId: input.id,
              archivedCertificateId: {
                notIn: selectedRowKeys as string[],
              },
            },
          },
        },
        where: { id: input.id },
      })
      message.success("Cập nhật thành công")
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  useEffect(() => {
    if (input?.list?.length) {
      setSelectedRowKeys(input?.list)
    }
  }, [input])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Thêm chứng chỉ cho sinh viên"}
      className="w-[1000px]"
    >
      <Row gutter={[16, 16]} align="top" justify="space-between">
        <Col span={24} className="mt-3">
          <Flex justify="space-between">
            <Col span={24}>
              <Form.Item className="mb-0" name="searchText">
                <Input
                  id="search"
                  onChange={(e) => handleFilterChange("searchText", e.target.value)}
                  placeholder="Tìm kiếm"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Flex>
        </Col>

        {/* <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file danh sách
                                </Button>
                            </Flex>
                        </Col> */}
      </Row>
      <Col span={24}>
        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
          }}
          id="training-category"
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Tên chứng chỉ",
              dataIndex: "name",
              align: "center",
            },
            {
              title: "Điểm tương đương",
              dataIndex: "finalScore",
              width: 200,
              align: "center",
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
    </PutFormModal>
  )
}

export default PutAddCertificateScoreModal
