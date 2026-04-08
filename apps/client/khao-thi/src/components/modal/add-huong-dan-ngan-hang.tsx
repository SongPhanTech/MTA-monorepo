import { DownloadOutlined } from "@ant-design/icons"
import { env } from "@workspace/libs/utils"
import { Button, message, Modal, Table, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text, Paragraph } = Typography

const questionTypes = [
  { code: "TL", label: "Câu hỏi tự luận" },
  { code: "TN", label: "Trắc nghiệm một lựa chọn" },
  { code: "TNN", label: "Trắc nghiệm nhiều lựa chọn" },
  { code: "DK", label: "Câu hỏi điền khuyết" },
  { code: "SX", label: "Câu hỏi sắp xếp thứ tự" },
]

const difficultyLevels = [
  { code: "NB", label: "Mức độ nhận biết" },
  { code: "TH", label: "Mức độ thông hiểu" },
  { code: "VD", label: "Mức độ vận dụng" },
  { code: "VDC", label: "Mức độ vận dụng cao" },
]

const exampleColumns = [
  {
    title: "Câu hỏi",
    dataIndex: "question",
    width: 180,
    render: (text: string) => (
      <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{text}</span>
    ),
  },
  {
    title: "Đáp án",
    dataIndex: "answer",
    width: 280,
    render: (text: string) => (
      <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{text}</span>
    ),
  },
  {
    title: "Loại câu hỏi",
    dataIndex: "type",
    width: 100,
    align: "center" as const,
  },
  {
    title: "Độ khó",
    dataIndex: "difficult",
    width: 80,
    align: "center" as const,
  },
  {
    title: "Điểm",
    dataIndex: "point",
    width: 80,
    align: "center" as const,
  },
]

const exampleData = [
  {
    key: "1",
    question: "Trình bày khái niệm thế giới quan.",
    answer:
      "Thế giới quan là hệ thống những quan điểm, quan niệm chung nhất của con người về thế giới...",
    type: "TL",
    difficult: "NB",
    point: "8,5 đ",
  },

  {
    key: "2",
    question: "Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. TP.HCM\nC. Đà Nẵng\nD. Huế",
    answer: "A. Hà Nội",
    type: "TN",
    difficult: "NB",
    point: "1 đ",
  },

  {
    key: "3",
    question: "Chọn các số nguyên tố:\nA. 2\nB. 3\nC. 4\nD. 5",
    answer: "A. 2\nB. 3\nD. 5",
    type: "TNN",
    difficult: "TH",
    point: "1 đ",
  },

  {
    key: "4",
    question: "Việt Nam có thủ đô là __.",
    answer: "1. Hà Nội",
    type: "DK",
    difficult: "NB",
    point: "1 đ",
  },

  {
    key: "5",
    question: "__ là thủ đô của __.",
    answer: "1. Hà Nội\n2. Việt Nam",
    type: "DK",
    difficult: "TH",
    point: "2 đ",
  },

  {
    key: "6",
    question:
      "Sắp xếp quá trình phản ánh của ý thức theo đúng thứ tự?\nA. Hành động thực tiễn\nB. Nhận thức (ý thức)\nC. Thế giới vật chất",
    answer: "C → B → A",
    type: "SX",
    difficult: "VDC",
    point: "1 đ",
  },
]

const AddHuongDanNganHang = () => {
  const { isOpen, onClose } = useDisclosure({
    tag: "AddHuongDanNganHang",
  })

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_ASSET_PREFIX}/files/file-mau-import-cau-hoi.docx`
      )
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "file-mau-import-cau-hoi.docx"
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)

      message.success("Tải xuống thành công")
    } catch (error) {
      message.error("Không thể tải file mẫu")
    }
  }

  return (
    <Modal
      title="Hướng dẫn nhập ngân hàng câu hỏi"
      open={isOpen}
      onCancel={onClose}
      width={780}
      className="top-2"
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
        {/* ===== I. HƯỚNG DẪN ===== */}
        <Title level={5} style={{ marginTop: 0 }}>
          I. HƯỚNG DẪN
        </Title>

        <Paragraph>
          Hệ thống hỗ trợ nhận dạng file <Text strong>.docx</Text>
        </Paragraph>

        <Paragraph>
          Nội dung file word cần được <Text strong>loại bỏ các nội dung thừa</Text> và bắt buộc phải
          tuân theo <Text strong>quy chuẩn dữ liệu trước khi upload</Text>.
        </Paragraph>

        <Button
          icon={<DownloadOutlined />}
          style={{ marginBottom: 16, borderColor: "#13c2c2", color: "#13c2c2" }}
          onClick={handleDownloadTemplate}
        >
          Tải xuống file .docx mẫu
        </Button>

        <Paragraph strong style={{ marginBottom: 8 }}>
          Quy chuẩn dữ liệu:
        </Paragraph>

        <Paragraph style={{ marginBottom: 4 }}>
          File Word phải có bảng với 5 cột theo thứ tự:{" "}
          <Text strong>Câu hỏi, Đáp án, Loại câu hỏi, Độ khó, Điểm</Text>
        </Paragraph>

        <Paragraph style={{ marginBottom: 4 }}>
          - Cột <Text code>Loại câu hỏi</Text> sử dụng một trong các ký tự sau:
        </Paragraph>
        <ul style={{ marginLeft: 24, marginBottom: 8 }}>
          {questionTypes.map(({ code, label }) => (
            <li key={code}>
              <Text code style={{ color: "#cf1322" }}>
                {code}
              </Text>{" "}
              – {label}
            </li>
          ))}
        </ul>

        <Paragraph style={{ marginBottom: 4 }}>
          - Cột <Text code>Độ khó</Text> sử dụng một trong các ký tự sau:
        </Paragraph>
        <ul style={{ marginLeft: 24, marginBottom: 16 }}>
          {difficultyLevels.map(({ code, label }) => (
            <li key={code}>
              <Text code style={{ color: "#cf1322" }}>
                {code}
              </Text>{" "}
              – {label}
            </li>
          ))}
        </ul>

        {/* ===== II. VÍ DỤ ===== */}
        <Title level={5}>II. VÍ DỤ</Title>

        <Table
          columns={exampleColumns}
          dataSource={exampleData}
          pagination={false}
          size="small"
          bordered
          style={{ marginBottom: 16 }}
        />
      </div>
    </Modal>
  )
}

export default AddHuongDanNganHang
