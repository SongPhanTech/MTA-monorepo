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
          File Word phải theo định dạng <Text strong>text (không dùng bảng)</Text>
        </Paragraph>

        <Paragraph strong>Quy tắc:</Paragraph>

        <ul style={{ marginLeft: 24, marginBottom: 16 }}>
          <li>
            Bắt đầu mỗi câu bằng <Text code>Câu X:</Text>
          </li>
          <li>
            Format: <Text code>( Loại câu hỏi- Độ khó) ( Điểm đ)</Text>
          </li>
          <li>Các đáp án xuống dòng (A, B, C...)</li>
          <li>
            Đáp án bắt đầu bằng <Text code>*Đáp án:</Text>
          </li>
          <li>Giữ nguyên xuống dòng, không gộp text</li>
        </ul>

        <Paragraph style={{ marginBottom: 4 }}>
          - Phần <Text code>Loại câu hỏi</Text> sử dụng một trong các ký tự sau:
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
          - Phần <Text code>Độ khó</Text> sử dụng một trong các ký tự sau:
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

        <Paragraph style={{ marginBottom: 4 }}>
          - Phần <Text code>Điểm</Text> phải nằm trong dấu ngoặc đơn và có đơn vị{" "}
          <Text code>đ</Text>:
        </Paragraph>

        <ul style={{ marginLeft: 24, marginBottom: 16 }}>
          <li>
            Ví dụ: <Text code>(1 đ)</Text>, <Text code>(0.25 đ)</Text>, <Text code>(8.5 đ)</Text>
          </li>
          <li>Cho phép số thập phân: 0.25, 0.5, 0.75...</li>
          <li>
            Tối đa: <Text strong>9.75 điểm</Text>
          </li>
          <li>
            Format bắt buộc: <Text code>( số đ )</Text> (không thiếu dấu ngoặc hoặc chữ "đ")
          </li>
        </ul>

        {/* ===== II. VÍ DỤ ===== */}
        <Title level={5}>II. VÍ DỤ</Title>

        <div
          style={{
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 6,
            whiteSpace: "pre-wrap",
            fontFamily: "Times New Roman, serif",
          }}
        >
          {`Câu 1: (TN-NB) (8.25 đ) Kế hoạch Barbarossa của Đức Quốc Xã nhằm tấn công quốc gia nào?
A. Ba Lan
B. Pháp
C. Anh
D. Liên Xô

*Đáp án: D. Liên Xô

Câu 2: (TNN-NB) (0.25 đ) Những nội dung nào thuộc vấn đề cơ bản của triết học?
A. Vật chất và ý thức cái nào có trước
B. Con người sống bao lâu
C. Con người có khả năng nhận thức thế giới hay không
D. Sự phát triển của công nghệ

*Đáp án:
A. Vật chất và ý thức cái nào có trước.
C. Con người có khả năng nhận thức thế giới

Câu 3: (DK-NB) (0.25 đ) Triết học nghiên cứu những quy luật chung nhất của ______, xã hội và tư duy.

*Đáp án: 1. tự nhiên

Câu 4: (SX-NB) (0.25 đ) Sắp xếp đúng trình tự quá trình nhận thức:

A. Thực tiễn
B. Tư duy trừu tượng
C. Trực quan sinh động

*Đáp án: C → B → A

Câu 5: (TL-TH) (0.5 đ) Phân tích vấn đề cơ bản của triết học

*Đáp án: Gợi ý: Trình bày 2 mặt (vật chất – ý thức, khả năng nhận thức) và ý nghĩa của nó.`}
        </div>
      </div>
    </Modal>
  )
}

export default AddHuongDanNganHang
