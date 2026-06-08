import { Table } from "antd"

interface ProgressRow {
  key: string
  type: "faculty" | "department" | "lecturer" | "total"
  name: string
  completed: number
  total: number
  indent: number
}

export function SurveyProgressTable({ data }: { data: ProgressRow[] }) {
  console.log("SurveyProgressTable", data)
  return (
    <Table
      bordered
      pagination={false}
      dataSource={data}
      rowKey="key"
      columns={[
        {
          title: "Đơn vị",
          dataIndex: "name",
          render: (_, row) => (
            <div
              style={{
                paddingLeft: row.indent * 32,
                fontWeight: row.type === "faculty" || row.type === "total" ? 700 : 400,
                fontStyle: row.type === "lecturer" ? "italic" : "normal",
              }}
            >
              {row.name}
            </div>
          ),
        },
        {
          title: "Ý kiến",
          align: "center",
          render: (_, row) => {
            const color =
              row.completed === row.total ? "#52c41a" : row.completed > 0 ? "#faad14" : "#ff4d4f"

            return (
              <span style={{ color }}>
                {row.completed}/{row.total}
              </span>
            )
          },
        },
      ]}
    />
  )
}
