import { formatDate } from "@lib/utils"
import type { EvaluationCriterionComment } from "@workspace/db"
import { Clock } from "lucide-react"

interface CommentListProps {
  comments: (EvaluationCriterionComment & {
    reviewer?: { fullname?: string | null } | null
  })[]
  lecturerUserProfileId?: string | null
}

const CommentList = ({ comments, lecturerUserProfileId }: CommentListProps) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-2 text-gray-400">
        <div className="relative mb-2">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-xl opacity-50" />
          <div className="relative text-6xl">💬</div>
        </div>
        <div className="text-lg font-semibold text-gray-600 mb-2">Chưa có phản hồi</div>
        <div className="text-sm text-gray-400 max-w-md text-center">
          Chưa có bất kỳ nhận xét nào cho tiêu chí này
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="p-2 space-y-3 max-h-[300px] overflow-y-auto">
        {comments.map((comment) => {
          const isFromRecipient =
            lecturerUserProfileId && comment.reviewerId === lecturerUserProfileId

          return (
            <div key={comment.id} className="bg-white rounded-lg border border-gray-200">
              <div className="p-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        isFromRecipient ? "bg-green-500" : "bg-blue-500"
                      }`}
                    >
                      {comment.reviewer?.fullname?.charAt(0).toUpperCase() || "N"}
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {comment.reviewer?.fullname ||
                          (isFromRecipient ? "Người thực hiện" : "Người đánh giá")}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-2 py-1 rounded text-xs font-medium border ${
                      isFromRecipient
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}
                  >
                    {isFromRecipient ? "Phản hồi" : "Đánh giá"}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div
                    className="text-gray-700 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: comment.content || "<i>Chưa có phản hồi</i>",
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CommentList
