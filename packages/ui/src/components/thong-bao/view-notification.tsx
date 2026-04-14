import { useFindUniqueNotification } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Col, Modal } from "antd"
import dayjs from "dayjs"
import { CalendarIcon } from "lucide-react"
import { useDisclosure } from "react-hook-disclosure-modal"

const ViewNotificationModal = () => {
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "ViewNotificationModal",
  })
  console.log("id", id)
  const { onOpen: onOpenPreview } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string | null
  }>({
    tag: "XemTaiLieu",
  })
  const { data } = useFindUniqueNotification(
    {
      where: { id },
      include: {
        attachments: true,
      },
    },
    { enabled: !!id }
  )

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      maskClosable={true}
      title={`${data?.title || "Xem thông báo"}`}
      className="w-[85vw]"
      okButtonProps={{
        hidden: true,
      }}
      cancelButtonProps={{
        hidden: true,
      }}
    >
      <Col span={24} className="flex items-center gap-1 mb-2 text-xs text-gray-500">
        <CalendarIcon size={14} />{" "}
        {data?.publishedAt ? dayjs(data.publishedAt).format("DD/MM/YYYY") : ""}{" "}
      </Col>
      <Col span={24}>
        <p
          dangerouslySetInnerHTML={{
            __html: data?.content || "",
          }}
        />
      </Col>
      {data?.attachments && data?.attachments?.length > 0 && (
        <Col span={24}>
          <h3 className="font-semibold mb-2 mt-4">Tệp đính kèm:</h3>
          <p className="flex flex-col gap-1">
            {data?.attachments.map((item) => (
              <p
                className="text-primary cursor-pointer hover:underline"
                key={item.id}
                onClick={() =>
                  onOpenPreview({
                    uri: getMinioUrl(item.path),
                    name: item.name,
                    mimeType: item?.name?.split(".").pop() || item.mimeType,
                  })
                }
              >
                {item.name}
              </p>
            ))}
          </p>
        </Col>
      )}
    </Modal>
  )
}

export { ViewNotificationModal }
