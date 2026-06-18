// Danh sách tài liệu đính kèm (chỉ-đọc) cho màn chi tiết môn học: xem trước + tải về.
import { DownloadOutlined, EyeOutlined, PaperClipOutlined } from "@ant-design/icons"
import type { DocumentFile } from "@workspace/db/client"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Empty, List, Tooltip } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

interface DanhSachTaiLieuProps {
  taiLieu: DocumentFile[]
}

const DanhSachTaiLieu = ({ taiLieu }: DanhSachTaiLieuProps) => {
  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  if (!taiLieu.length) {
    return <Empty description="Chưa có tài liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  const xemTruoc = (file: DocumentFile) =>
    onOpenPreview({
      uri: getMinioUrl(file.path),
      name: file.name,
      mimeType: file.name.split(".").pop() || file.mimeType || "",
    })

  return (
    <List
      dataSource={taiLieu}
      renderItem={(file) => (
        <List.Item
          actions={[
            <Tooltip title="Xem trước" key="preview">
              <Button type="text" icon={<EyeOutlined />} onClick={() => xemTruoc(file)} />
            </Tooltip>,
            <Tooltip title="Tải về" key="download">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                href={getMinioUrl(file.path)}
                target="_blank"
                rel="noopener noreferrer"
              />
            </Tooltip>,
          ]}
        >
          <List.Item.Meta
            avatar={<PaperClipOutlined className="text-cgv-green-dark" />}
            title={
              <span className="cursor-pointer text-cgv-green-dark" onClick={() => xemTruoc(file)}>
                {file.name}
              </span>
            }
          />
        </List.Item>
      )}
    />
  )
}

export default DanhSachTaiLieu
