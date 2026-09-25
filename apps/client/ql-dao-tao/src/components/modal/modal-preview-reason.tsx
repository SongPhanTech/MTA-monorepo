import { useFindUniqueStudentGraduationApplication } from "@workspace/db/hooks"
import { Divider, Empty, Modal, Tag, Typography } from "antd"
import { useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const ModalPreviewReason = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "ModalPreviewReason",
  })

  const { data } = useFindUniqueStudentGraduationApplication(
    {
      where: {
        id: input?.id,
      },
      include: {
        student: {
          include: {
            userProfile: {
              select: {
                fullname: true,
                code: true,
              },
            },
          },
        },
        downgraded: {
          include: {
            from: true,
            conditions: true,
          },
        },
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  const reasons = useMemo(() => {
    if (!data?.reason) return []
    let parsed = data.reason.split(/\r?\n|\\n/).filter(Boolean)
    if (parsed.length <= 1) {
      parsed = data.reason
        .split("\n")
        .filter(Boolean)
        .map((s: string) => s.trim())
    }
    return parsed
  }, [data?.reason])

  return (
    <Modal
      open={isOpen}
      title="Ghi chú xét tốt nghiệp"
      onCancel={onClose}
      className="top-8"
      width={620}
      footer={null}
      maskClosable={true}
    >
      <div className="mb-3">
        <Typography.Text strong className="text-base">
          {data?.student?.userProfile?.code} - {data?.student?.userProfile?.fullname}
        </Typography.Text>
        {data?.graduation !== undefined && (
          <Tag color={data.graduation ? "green" : "red"} className="ml-3">
            {data.graduation ? "Đạt" : "Không đạt"}
          </Tag>
        )}
      </div>

      <Divider className="my-2" />

      {data?.downgraded && (
        <div className="mb-3 rounded-md bg-orange-50 border border-orange-200 px-3 py-2">
          <Typography.Text strong className="text-orange-700 text-sm">
            Hạ bậc ({data.downgraded.from?.classification}):
          </Typography.Text>
          <Typography.Text className="text-orange-600 text-sm ml-1">
            {data.downgraded.conditions
              ?.map((c: any) => c.field)
              .filter(Boolean)
              .join(", ")}
          </Typography.Text>
        </div>
      )}

      {reasons.length > 0 ? (
        <div className="overflow-y-auto pr-1" style={{ maxHeight: "60vh" }}>
          <Typography.Text strong className="text-sm text-gray-500 mb-2 block">
            Tổng cộng {reasons.length} ghi chú
          </Typography.Text>
          <div className="flex flex-col gap-2">
            {reasons.map((reason: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 border border-gray-100"
              >
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-semibold mt-0.5">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-800 leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Empty description="Không có ghi chú" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Modal>
  )
}

export default ModalPreviewReason
