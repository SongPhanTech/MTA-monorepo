import { PlusOutlined } from "@ant-design/icons"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { store } from "@pages/thiet-lap-de-thi/khung-de"
import { useStore } from "@tanstack/react-store"
import { useFindManyExamMatrix } from "@workspace/db/hooks"
import { softDeleteExamMatrix } from "@/utils/soft-delete-exam-framework"
import { Button, Col, message, Row, Typography } from "antd"
import clsx from "clsx"
import { LayoutGrid } from "lucide-react"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import TableChuongMuc from "./table-chuong-muc"

export default function MaTranDePage({ id }: { id?: string }) {
  const matrixId = useStore(store, (s) => s.matrixId)
  const { onOpen } = useDisclosure<{
    id?: string
  }>({
    tag: "PutMaTranDeModal",
  })

  const { data: examMatrix = [] } = useFindManyExamMatrix(
    {
      where: {
        examFrameworkId: id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    {
      enabled: !!id,
    }
  )

  const handleDeleteExamMatrix = async (matrixId: string) => {
    try {
      await softDeleteExamMatrix(matrixId)

      message.success("Xoá ma trận đề thành công!")
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!")
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!examMatrix.length) {
      store.setState((s) => ({ ...s, matrixId: undefined }))
      return
    }

    const currentId = store.state.matrixId
    const exists = examMatrix.some((m) => m.id === currentId)

    if (exists) return

    const defaultMatrix = examMatrix.find((m) => m.isDefault) ?? examMatrix[0]

    store.setState((s) => ({ ...s, matrixId: defaultMatrix.id }))
  }, [examMatrix])

  return (
    <Row gutter={[8, 8]}>
      <Col span={5}>
        <div className="pb-2.5">
          <div className="max-h-[calc(100vh-150px)] overflow-y-auto">
            {examMatrix.map((matrix) => (
              <div
                key={matrix.id}
                onClick={() => {
                  store.setState((s) => ({ ...s, matrixId: matrix.id }))
                }}
                className={clsx(
                  "p-2.5 border rounded-[5px] first:mt-0 mt-2 mr-2 cursor-pointer transition-all",
                  matrixId === matrix.id
                    ? "bg-[rgb(238,252,253)] border-[rgb(179,240,243)]"
                    : "bg-gray-100 border-gray-300 hover:border-gray-400"
                )}
              >
                <div className="mb-2">
                  <Typography.Text strong>{matrix.name}</Typography.Text>
                </div>
                <div className="flex justify-end items-center gap-2">
                  <EditIcon className="text-blue-600" onClick={() => onOpen({ id: matrix.id })} />
                  <DeleteIcon
                    popConfirm={{
                      onConfirm: () => handleDeleteExamMatrix(matrix.id),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mr-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onOpen()}
              className="mt-2 w-full"
            >
              Tạo mới ma trận đề
            </Button>
          </div>
        </div>
      </Col>

      <Col span={19}>
        {matrixId ? (
          <TableChuongMuc matrixId={matrixId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-[80vh] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="w-24 h-30 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <LayoutGrid className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chọn ma trận đề</h3>
            <p className="text-gray-500 text-center max-w-md mb-4 text-sm">
              Vui lòng chọn một ma trận đề bên trái để xem và quản lý khung đề
            </p>
          </div>
        )}
      </Col>
    </Row>
  )
}
