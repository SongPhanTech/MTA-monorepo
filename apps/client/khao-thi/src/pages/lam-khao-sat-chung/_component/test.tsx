import { Radio, Table, Typography } from "antd"
import type React from "react"
import { useState } from "react"

const { Text } = Typography

interface RowData {
  key: string
  tt?: string
  content: React.ReactNode
  isSection?: boolean
}

const EvaluationTable: React.FC = () => {
  const [values, setValues] = useState<Record<string, number>>({})

  const onChange = (key: string, value: number) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const columns = [
    {
      title: "TT",
      dataIndex: "tt",
      width: 60,
      align: "center" as const,
    },
    {
      title: "NỘI DUNG ĐÁNH GIÁ",
      dataIndex: "content",
      render: (text: any, record: RowData) =>
        record.isSection ? <Text strong>{text}</Text> : <Text>{text}</Text>,
    },
    ...[1, 2, 3, 4, 5].map((value) => ({
      title: value,
      width: 80,
      align: "center" as const,
      render: (_: any, record: RowData) =>
        !record.isSection && (
          <Radio
            checked={values[record.key] === value}
            onChange={() => onChange(record.key, value)}
          />
        ),
    })),
  ]

  const data: RowData[] = [
    {
      key: "section1",
      content: "I. NỘI DUNG CHƯƠNG TRÌNH ĐÀO TẠO",
      isSection: true,
    },
    {
      key: "1",
      tt: "1",
      content: "Mục tiêu và chuẩn đầu ra của chương trình đào tạo được công bố cho người học.",
    },
    {
      key: "2",
      tt: "2",
      content:
        "Chương trình đào tạo có tỷ lệ giữa kiến thức lý thuyết và kỹ năng thực hành phù hợp.",
    },

    {
      key: "section2",
      content: "II. HOẠT ĐỘNG GIẢNG DẠY CỦA GIẢNG VIÊN",
      isSection: true,
    },
    {
      key: "3",
      tt: "3",
      content: "Giảng viên nêu rõ mục tiêu, chuẩn đầu ra và hình thức kiểm tra đánh giá học phần.",
    },
    {
      key: "4",
      tt: "4",
      content: "Giảng viên đảm bảo giờ lên lớp, nhiệt tình và sẵn sàng giải đáp thắc mắc.",
    },
    {
      key: "5",
      tt: "5",
      content: "Việc đánh giá kết quả học tập đảm bảo khách quan, công bằng và công khai.",
    },

    {
      key: "section3",
      content: "III. CÔNG TÁC TỔ CHỨC, QUẢN LÝ ĐÀO TẠO",
      isSection: true,
    },
    {
      key: "6",
      tt: "6",
      content: "Phân bổ khối lượng học tập hợp lý giữa các học phần trong toàn khoá học.",
    },
    {
      key: "7",
      tt: "7",
      content: "Có sự hài hòa giữa thời gian học chính khoá và các hoạt động ngoại khoá.",
    },

    {
      key: "section4",
      content: "IV. HOẠT ĐỘNG HỖ TRỢ VÀ PHỤC VỤ NGƯỜI HỌC",
      isSection: true,
    },
    {
      key: "8",
      tt: "8",
      content: "Cơ sở vật chất, tài liệu, hệ thống CNTT đáp ứng nhu cầu học tập.",
    },
    {
      key: "9",
      tt: "9",
      content: "Điều kiện sinh hoạt, ăn ở, chăm sóc sức khỏe được đảm bảo.",
    },
    {
      key: "10",
      tt: "10",
      content: "Nhu cầu đời sống tinh thần (văn hóa, thể thao) của người học được đáp ứng.",
    },
  ]

  return (
    <Table
      bordered
      columns={columns}
      dataSource={data}
      pagination={false}
      rowClassName={(record) => (record.isSection ? "section-row" : "")}
    />
  )
}

export default EvaluationTable
