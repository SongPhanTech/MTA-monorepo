import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import {
  useCountTrainingBlockOnCurriculumVersion,
  useFindManyTrainingBlockOnCurriculumVersion,
} from "@workspace/db/hooks"
import { Modal } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface TrainingBlockInput {
  trainingBlockId: string
  trainingBlockName?: string
}

const ModalCurriculumVersionByTrainingBlock = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const { isOpen, onClose, input } = useDisclosure<TrainingBlockInput>({
    tag: "ModalCurriculumVersionByTrainingBlock",
  })

  const { trainingBlockId, trainingBlockName } = input || {}
  const where = {
    trainingBlockId: trainingBlockId || "",
    curriculumVersion: {
      deletedAt: null,
    },
  }

  const { data: count } = useCountTrainingBlockOnCurriculumVersion({
    where: {
      ...where,
    },
  })

  const {
    data = [],
    isLoading,
    isFetching,
  } = useFindManyTrainingBlockOnCurriculumVersion({
    where: {
      ...where,
    },
    include: {
      curriculumVersion: {
        include: {
          curriculum: {
            include: {
              trainingMajor: true,
              managementOrganization: true,
            },
          },
        },
      },
      trainingBlock: true,
    },
    orderBy: {
      priority: "asc",
    },
    take: numberOfPages,
    skip: numberOfPages * (currentPage - 1),
  })

  const uniqueCurriculumVersions = useMemo(() => {
    const map = new Map()
    data.forEach((item) => {
      if (item.curriculumVersion && !map.has(item.curriculumVersion.id)) {
        map.set(item.curriculumVersion.id, item.curriculumVersion)
      }
    })
    return Array.from(map.values())
  }, [data])

  return (
    <Modal
      title={`Danh sách CTĐT có khối kiến thức: ${trainingBlockName || ""}`}
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={null}
      destroyOnClose
    >
      <Table
        rowKey="id"
        loading={isLoading || isFetching}
        dataSource={uniqueCurriculumVersions}
        pagination={{
          current: currentPage,
          pageSize: numberOfPages,
          total: count,
          onChange: (page, pageSize) => {
            setCurrentPage(page)
            setNumberOfPages(pageSize)
          },
        }}
        columns={[
          {
            title: "STT",
            width: 50,
            align: "center",
            render: (_, __, index) => index + 1,
          },
          // {
          //     title: 'Mã CTĐT',
          //     dataIndex: 'code',
          //     width: 120,
          //     align: 'center',
          // },
          {
            title: "Tên CTĐT",
            dataIndex: "name",
            align: "center",
          },
          // {
          //     title: 'Chuyên ngành',
          //     align: 'center',
          //     width: 200,
          //     render: (_, record) => record?.curriculum?.trainingMajor?.name || '-',
          // },
          // {
          //     title: 'Đơn vị quản lý',
          //     align: 'center',
          //     width: 200,
          //     render: (_, record) =>
          //         record?.curriculum?.managementOrganization?.sTen || '-',
          // },
          // {
          //     title: 'Trạng thái',
          //     align: 'center',
          //     width: 120,
          //     render: (_, record) =>
          //         record?.active ? (
          //             <Tag color="success">Đang áp dụng</Tag>
          //         ) : (
          //             <Tag color="error">Ngừng áp dụng</Tag>
          //         ),
          // },
          // {
          //     title: 'Thao tác',
          //     width: 100,
          //     align: 'center',
          //     render: (_, record) => (
          //         <ViewIcon
          //             title="Xem chi tiết"
          //             onClick={() => handleViewDetail(record.id)}
          //             className="text-blue-700 cursor-pointer"
          //         />
          //     ),
          // },
        ]}
      />
    </Modal>
  )
}

export default ModalCurriculumVersionByTrainingBlock
