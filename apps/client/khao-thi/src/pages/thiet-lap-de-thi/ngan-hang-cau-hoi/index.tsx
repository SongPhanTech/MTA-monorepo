import DefaultLayout from "@layouts/default-layout"
import { useFindManyDM_DonVi } from "@workspace/db/hooks"
import { softDeleteExamFramework } from "@/utils/soft-delete-exam-framework"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Flex, Input, message, Row, Space } from "antd"
import { BookOpen, Building2, Database, FileText } from "lucide-react"
import { type Key, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import QuestionBankTree from "./_component/question-bank-tree"
import QuestionList from "./_component/question-list"
// import { sqlTransaction } from "@workspace/libs/api/model"
// import { queryClient } from "@api/index"
import { whereActiveOrganization } from "@workspace/libs/org-tree"

export type PutQuestionBankInput = {
  id?: string
  subjectVersionId?: string
}

export type PutExamFrameworkInput = {
  id?: string
  subjectVersionId?: string
}

export default function QuestionBank() {
  const [searchName, setSearchName] = useState("")
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
  // Bỏ lưu tại kho: môn học chứa khung đề, khung đề chứa câu hỏi
  // const [selectedQuestionBankId, setSelectedQuestionBankId] = useState<string | null>(null)
  const [selectedExamFramework, setSelectedExamFramework] = useState<{
    id: string
    subjectVersionId: string
  } | null>(null)

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: donViData = [] } = useFindManyDM_DonVi({
    where: {
      ...whereActiveOrganization,
      iLoaiDonVi: {
        in: [5, 6, 7],
      },
    },
    include: {
      subjects: {
        include: {
          subjectVersion: {
            include: {
              // questionBanks: {
              //   where: {
              //     deletedAt: null,
              //   },
              // },
              examFramework: {
                where: { active: true, deletedAt: null },
                orderBy: { createdAt: "asc" },
              },
              _count: {
                select: {
                  examFramework: {
                    where: { active: true },
                  },
                },
              },
            },
            where: {
              deletedAt: null,
              ...(trainingObjectTypeId && {
                trainingObjectTypeId,
              }),
            },
          },
        },
        where: {
          deletedAt: null,
        },
      },
    },
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  // const { onOpen: onOpenPutQuestionBank } = useDisclosure<PutQuestionBankInput>({
  //   tag: "PutQuestionBank",
  // })

  const { onOpen: onOpenExamFramework } = useDisclosure<PutExamFrameworkInput>({
    tag: "ModalTaoKhungDe",
  })

  const { onOpen: onOpenNganHangKhungDe } = useDisclosure<{ subjectVersionId?: string }>({
    tag: "AddNganHangKhungDe",
  })

  // const handleDeleteQuestionBank = async (id: string) => {
  //   try {
  //     const res = await sqlTransaction([
  //       {
  //         model: "ExamBankQuestion",
  //         operation: "deleteMany",
  //         data: {
  //           where: {
  //             question: {
  //               questionBankId: id,
  //             },
  //           },
  //         },
  //       },
  //       {
  //         model: "Question",
  //         operation: "deleteMany",
  //         data: {
  //           where: {
  //             questionBankId: id,
  //           },
  //         },
  //       },
  //       {
  //         model: "QuestionBank",
  //         operation: "delete",
  //         data: {
  //           where: {
  //             id: id,
  //           },
  //         },
  //       },
  //     ])

  //     if (res.status !== 200) {
  //       message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  //       return
  //     }

  //     message.success("Xóa thành công")
  //     setSelectedQuestionBankId(null)
  //     queryClient.invalidateQueries({
  //       queryKey: ["zenstack", "QuestionBank"],
  //     })
  //     queryClient.invalidateQueries({
  //       queryKey: ["zenstack", "DM_DonVi"],
  //     })
  //   } catch (error: any) {
  //     if (error?.info?.message) {
  //       message.error(error?.info?.message)
  //       return
  //     }
  //     message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
  //   }
  // }

  const handleDeleteExamFramework = async (id: string) => {
    try {
      await softDeleteExamFramework(id)

      message.success("Xóa khung đề thành công")
      if (selectedExamFramework?.id === id) setSelectedExamFramework(null)
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    }
  }

  return (
    <div>
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Flex justify="space-between" align="center">
            <Space size="middle">
              <Input
                placeholder="Tìm theo tên hoặc mã (Đơn vị, Nhóm môn học, Môn học, Khung đề)"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-96"
                allowClear
              />
            </Space>
          </Flex>
        </Col>

        <Col span={24}>
          <div className="flex gap-4">
            <span className="flex gap-2 items-center justify-end">
              <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
              Đơn vị
            </span>
            <span className="flex gap-2 items-center justify-end">
              <BookOpen className="w-4 h-4 flex-shrink-0 text-purple-600" />
              Nhóm môn học
            </span>
            <span className="flex gap-2 items-center justify-end">
              <FileText className="w-4 h-4 flex-shrink-0 text-orange-600" />
              Môn học
            </span>
            <span className="flex gap-2 items-center justify-end">
              <Database className="w-4 h-4 flex-shrink-0 text-green-600" />
              Khung đề
            </span>
          </div>
        </Col>

        <Col span={8}>
          <QuestionBankTree
            searchName={searchName}
            expandedKeys={expandedKeys}
            setExpandedKeys={setExpandedKeys}
            setSelectedExamFramework={setSelectedExamFramework}
            donViData={donViData}
            onOpenExamFramework={onOpenExamFramework}
            handleDeleteExamFramework={handleDeleteExamFramework}
            onOpenNganHangKhungDe={onOpenNganHangKhungDe}
          />
        </Col>

        <Col span={16}>
          {selectedExamFramework ? (
            <QuestionList
              examFrameworkId={selectedExamFramework.id}
              subjectVersionId={selectedExamFramework.subjectVersionId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Database className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Chọn khung đề</h3>
              <p className="text-gray-500 text-center max-w-md mb-4 text-sm">
                Vui lòng chọn một khung đề từ cây dữ liệu bên trái để xem và quản lý câu hỏi
              </p>
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}

QuestionBank.getLayout = function getLayout(page: React.ReactNode) {
  return <DefaultLayout>{page}</DefaultLayout>
}
