import { formatDate } from '@lib/utils'
import type { EvaluationCriterionComment, UserProfile } from '@workspace/db'
import { Clock, MessageSquare } from 'lucide-react'

interface CommentListProps {
    comments: (EvaluationCriterionComment & {
        reviewer: UserProfile
    })[]
}

const CommentList = ({ comments }: CommentListProps) => {
    if (!comments || comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-pink-100 rounded-full blur-xl opacity-50" />
                    <div className="relative text-6xl">💬</div>
                </div>
                <div className="text-lg font-semibold text-gray-600 mb-2">Chưa có phản hồi</div>
                <div className="text-sm text-gray-400 max-w-md text-center">
                    Người đánh giá chưa để lại bất kỳ nhận xét nào cho tiêu chí này
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                                Phản hồi từ ban tư vấn
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 px-4 py-2 rounded-full">
                            <span className="text-red-600 font-bold text-sm">
                                {comments.length}
                            </span>
                            <span className="text-gray-600 text-xs ml-1.5">phản hồi</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="p-6 space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar">
                {comments.map((comment, index) => (
                    <div
                        key={comment.id}
                        className="group relative bg-white rounded-2xl border border-gray-200 hover:border-red-300 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 overflow-hidden"
                        style={{
                            animationDelay: `${index * 50}ms`,
                            animation: 'slideInUp 0.4s ease-out forwards',
                        }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-full blur opacity-50 group-hover:opacity-70 transition-opacity" />
                                        <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg">
                                            {comment.reviewer?.fullname?.charAt(0).toUpperCase() ||
                                                'N'}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-base mb-1 group-hover:text-red-600 transition-colors">
                                            {comment.reviewer?.fullname || 'Người đánh giá'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="font-medium">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-red-50 to-pink-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold border border-red-100">
                                    Đánh giá
                                </div>
                            </div>

                            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
                                <div className="relative z-10">
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #ef4444, #ec4899);
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #dc2626, #db2777);
                }

                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #ef4444 #f1f5f9;
                }
            `}</style>
        </div>
    )
}

export default CommentList
