import { DownloadOutlined, EyeOutlined, FileOutlined } from "@ant-design/icons"
import { useFindManyEvidence, useFindManyEvidenceCategory, useFindUniqueEvidence } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Descriptions, Modal, Skeleton, Tree, Typography } from "antd"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
const ViewMinhChungModal = () => {
  const { isOpen, onClose, input } = useDisclosure<{ evidenceId: string }>({
    tag: "ViewMinhChungModal",
  })

  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
  }>({
    tag: "XemTaiLieu",
  })

  const { data, isLoading } = useFindUniqueEvidence(
    {
      where: { id: input?.evidenceId ?? "" },
      include: { evidenceFile: true, category: true },
    },
    { enabled: !!input?.evidenceId }
  )

  const { data: listEvidenceCategory = [] } = useFindManyEvidenceCategory()
  const { data: listEvidence = [] } = useFindManyEvidence()

  const treeData = useMemo(() => {
    return listEvidenceCategory.map((cat) => ({
      title: cat.name,
      key: cat.id,
      selectable: false,
      children: listEvidence
        .filter((evi) => evi.categoryId === cat.id)
        .map((evi) => ({
          title: evi.name,
          key: evi.id,
        })),
    }))
  }, [listEvidenceCategory, listEvidence])

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      title="Chi tiết minh chứng"
      width={600}
      destroyOnClose
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : data ? (
        <Descriptions column={1} bordered size="small">
          {data.suffix && (
            <Descriptions.Item label="Mã minh chứng">{data.suffix}</Descriptions.Item>
          )}
          <Descriptions.Item label="Tên minh chứng">
            <Typography.Text strong>{data.name}</Typography.Text>
          </Descriptions.Item>
          {(data as any).category?.name && (
            <Descriptions.Item label="Nhóm minh chứng">
              {(data as any).category.name}
            </Descriptions.Item>
          )}
          {data.information && (
            <Descriptions.Item label="Số ngày tháng ban hành">{data.information}</Descriptions.Item>
          )}
          {data.issuer && <Descriptions.Item label="Nơi ban hành">{data.issuer}</Descriptions.Item>}
          {data.description && (
            <Descriptions.Item label="Mô tả">{data.description}</Descriptions.Item>
          )}
          <Descriptions.Item label="Vị trí trong danh mục">
            <Tree
              defaultExpandAll
              selectedKeys={input?.evidenceId ? [input.evidenceId] : []}
              treeData={treeData}
              selectable
              className="max-h-[250px] overflow-y-auto"
            />
          </Descriptions.Item>
          <Descriptions.Item label={`Bằng chứng đính kèm`}>
            {data.evidenceFile && data.evidenceFile.length > 0 ? (
              <div className="flex flex-col gap-2">
                {data.evidenceFile.map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 truncate">
                      <FileOutlined className="text-blue-500 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        onClick={() =>
                          onOpenPreview({
                            uri: getMinioUrl(file.path),
                            name: file.name,
                            mimeType: file.name.split(".").pop() || file.mimeType,
                          })
                        }
                      >
                        <EyeOutlined /> Xem
                      </button>
                      <a
                        href={getMinioUrl(file.path)}
                        target="_blank"
                        rel="noreferrer"
                        download={file.name}
                        className="text-green-600 hover:text-green-800 flex items-center gap-1"
                      >
                        <DownloadOutlined /> Tải về
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">Chưa có bằng chứng đính kèm</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Modal>
  )
}

export default ViewMinhChungModal
