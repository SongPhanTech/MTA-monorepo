import Table from "@components/commons/table"
import { Tag } from "antd"
import { useFindManySubjectClass } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import dayjs from "dayjs"

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  OFFICIAL: "blue",
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  OFFICIAL: "Chính thức",
}

export default function SubjectClassList({ selectedFixedClass }: { selectedFixedClass?: string }) {
  const { id: semesterId } = useSemesterStore()

  const { data = [] } = useFindManySubjectClass(
    {
      where: {
        semesterId,
        deletedAt: null,
        fixedClasses: {
          some: {
            id: selectedFixedClass,
          },
        },
      },
      include: {
        subject: true,
      },
      orderBy: { createdAt: "asc" },
    },
    {
      enabled: !!selectedFixedClass && !!semesterId,
    }
  )

  return (
    <Table
      filters={{}}
      setFilters={() => {}}
      columns={[
        {
          title: "STT",
          width: 50,
          align: "center",
          render: (_, __, index) => index + 1,
        },
        {
          title: "Mã lớp học phần",
          align: "center",
          width: 150,
          render: (_, record) => record.code,
        },
        {
          title: "Tên môn học",
          render: (_, record) => record.subject?.name ?? record.name,
        },
        {
          title: "Ngày bắt đầu",
          align: "center",
          width: 130,
          render: (_, record) =>
            record.startDate ? dayjs(record.startDate).format("DD/MM/YYYY") : "--",
        },
        {
          title: "Ngày kết thúc",
          align: "center",
          width: 130,
          render: (_, record) =>
            record.endDate ? dayjs(record.endDate).format("DD/MM/YYYY") : "--",
        },
        {
          title: "Trạng thái",
          align: "center",
          width: 130,
          render: (_, record) => (
            <Tag color={STATUS_COLOR[record.status] ?? "default"}>
              {STATUS_LABEL[record.status] ?? record.status}
            </Tag>
          ),
        },
      ]}
      rowKey="id"
      data={data}
      pagination={false}
    />
  )
}
