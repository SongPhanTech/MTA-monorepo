import PutFormModal from "@components/commons/put-modal"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import type { StudentSubjectScore } from "@workspace/db/client"
import {
  useCountArchivedAward,
  useFindFirstTrainingCourse,
  useFindManyArchivedAward,
  useUpdateStudentSubjectScore,
} from "@workspace/db/hooks"
import { calcFinalScore } from "@workspace/libs/utils"
import { Col, Flex, Form, Input, message, Row } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import _ from "lodash"
import { useCallback, useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutStudentSubjectScore = StudentSubjectScore
interface FilterProps {
  searchText: string | ""
}

dayjs.locale("vi")

const PutAddOlympicScoreModal = () => {
  const [form] = Form.useForm<PutStudentSubjectScore>()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { isOpen, onClose, input } = useDisclosure<any>({
    tag: "PutAddOlympicScoreModal",
    onClose: form.resetFields,
  })
  const [filters, setFilters] = useState<FilterProps>({
    searchText: "",
  })

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

  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()

  const buildWhereCondition = () => {
    const baseWhere: any = {
      // studentId: input?.studentId,
      deletedAt: null,
      status: "APPROVED",
    }
    if (filters.searchText) {
      baseWhere.award = {
        OR: [
          { name: { contains: filters.searchText, mode: "insensitive" } },
          // { code: { contains: filters.searchText, mode: 'insensitive' } },
        ],
      }
    }
    return baseWhere
  }

  const whereCondition = buildWhereCondition()

  const { data: dataTable = [], refetch } = useFindManyArchivedAward({
    where: whereCondition,
    include: {
      award: true,
    },
    orderBy: {
      code: "asc",
    },
    skip: (currentPage - 1) * numberOfPages,
    take: numberOfPages,
  })

  const { data: count } = useCountArchivedAward({
    where: whereCondition,
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
      const listAward = []
      const existingAwards =
        input?.subjectClassStudent?.awards?.map((a: any) => a.archivedAward) || []
      const currentTableAwards = dataTable || []
      const allAvailableAwards = [...existingAwards, ...currentTableAwards]
      for (const key of selectedRowKeys) {
        const item = allAvailableAwards.find((item: any) => item.id === key)
        if (item) {
          listAward.push({ archivedAward: item })
        }
      }
      if (!trainingCourse) return
      const finalScore = calcFinalScore(
        trainingCourse,
        {
          ...input.subjectClassStudent,
          awards: listAward,
        },
        "NORMAL"
      )
      await updateStudentSubjectScore({
        data: {
          ...rest,
          finalScore,
          awards: {
            createMany: {
              data: selectedRowKeys.map((id) => ({
                archivedAwardId: id as string,
              })),
              skipDuplicates: true,
            },
            deleteMany: {
              studentSubjectScoreId: input.id,
              archivedAwardId: {
                notIn: selectedRowKeys as string[],
              },
            },
          },
        },
        where: { id: input.id },
      })
      message.success("Cập nhật thành công")
      if (input?.refetch) {
        await input.refetch()
      }
      onClose()
    } catch (error) {
      console.log(error)
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      return newFilters
    })
  }

  // useEffect(() => {
  //     debouncedRefetch(   )
  // }, [whereCondition, refetch])

  useEffect(() => {
    if (input?.list?.length) {
      setSelectedRowKeys(input?.list)
    } else if (isOpen) {
      setSelectedRowKeys([])
    }
  }, [input, isOpen])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Thêm điểm cộng cho sinh viên"}
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
              render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
            },
            {
              title: "Tên giải thưởng",
              dataIndex: ["award", "name"],
              align: "center",
            },
            {
              title: "Điểm cộng",
              dataIndex: "bonusScore",
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

export default PutAddOlympicScoreModal
