// biome-ignore assist/source/organizeImports: <code fix>

import { Modal } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import ExpandableContent from "@components/commons/expandable-content/ExpandableContent"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import type { SubjectVersionHistory } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useEffect, useState } from "react"

dayjs.locale("vi")

const ModalViewHistoryChange = () => {
  const { isOpen, onClose } = useDisclosure<string>({
    tag: "ModalViewHistoryChange",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [dataHistory, setDataHistory] = useState<SubjectVersionHistory[]>([])
  const [countHistory, setCountHistory] = useState(0)
  const { showSpinner, hideSpinner } = useSpinner()
  const fetchData = async () => {
    showSpinner()
    try {
      const dataHistory = await sqlTransaction([
        {
          model: "SubjectVersionHistory",
          operation: "findMany",
          data: {
            include: {
              subjectVersion: {
                select: {
                  name: true,
                },
              },
              updatedBy: {
                select: {
                  fullname: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
          },
        },
      ])
      const fullDataHistory = await sqlTransaction([
        {
          model: "SubjectVersionHistory",
          operation: "findMany",
        },
      ])
      if (dataHistory.status !== 200 || fullDataHistory.status !== 200) {
        return
      }
      setDataHistory(dataHistory.data[0] as SubjectVersionHistory[])
      setCountHistory((fullDataHistory.data[0] as SubjectVersionHistory[]).length)
    } catch (error) {
    } finally {
      hideSpinner()
    }
  }
  useEffect(() => {
    fetchData()
  }, [currentPage, numberOfPages])
  // useEffect(() => {
  //     async function fetchData() {}
  //     fetchData()
  // }, [])
  // const { data = [], refetch } = useFindManySubjectVersionHistory(
  //     {
  //         where: {
  //             subjectVersion: {},
  //         },
  //         include: {
  //             subjectVersion: {
  //                 select: {
  //                     name: true,
  //                 },
  //             },
  //             updatedBy: {
  //                 select: {
  //                     fullname: true,
  //                 },
  //             },
  //         },
  //         orderBy: {
  //             createdAt: 'desc',
  //         },
  //         take: numberOfPages,
  //         skip: (currentPage - 1) * numberOfPages,
  //     },
  //     { enabled: !!isOpen }
  // )
  // const { data: count } = useCountSubjectVersionHistory({
  //     where: {
  //         subjectVersion: {},
  //     },
  // })

  return (
    <Modal
      title="Lịch sử thay đổi"
      open={isOpen}
      onCancel={onClose}
      width="90vw"
      style={{ maxHeight: "80vh", overflowY: "auto" }}
      footer={null}
    >
      <Table
        columns={[
          {
            title: "STT",
            dataIndex: "index",
            width: 30,
            align: "center",
            fixed: "left",
            render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
          },
          {
            title: "Thời gian thay đổi",
            dataIndex: "createdAt",
            width: 60,
            align: "center",
            render: (_, record) => {
              if (!record.createdAt) return ""
              const date = new Date(record.createdAt)
              return date.toLocaleString("vi-VN")
            },
          },
          {
            title: "Người thay đổi",
            dataIndex: "updatedBy",
            align: "center",
            width: 60,
            render: (_, record) => {
              return (
                // @ts-expect-error
                <div className="truncate">{record.updatedBy?.fullname || ""}</div>
              )
            },
          },
          {
            title: "Môn học",
            dataIndex: "subjectVersion",
            width: 60,
            align: "center",
            render: (_, record) => {
              // @ts-expect-error
              return record.subjectVersion?.name || ""
            },
          },
          {
            title: "Thao tác",
            dataIndex: "action",
            width: 60,
            align: "center",
            render: (_, record) => {
              return record.action || ""
            },
          },
          {
            title: "Nội dung thay đổi",
            dataIndex: "content",
            width: 160,
            align: "left",
            render: (_, record) => {
              return <ExpandableContent htmlContent={record.content} />
            },
          },
        ]}
        data={dataHistory}
        pagination={{
          current: currentPage,
          pageSize: numberOfPages,
          total: countHistory || 0,
          onChange: (page, pageSize) => {
            if (numberOfPages === pageSize) {
              setCurrentPage(page)
            } else {
              setCurrentPage(1)
              setNumberOfPages(pageSize)
            }
            fetchData()
          },
        }}
      />
    </Modal>
  )
}

export default ModalViewHistoryChange
