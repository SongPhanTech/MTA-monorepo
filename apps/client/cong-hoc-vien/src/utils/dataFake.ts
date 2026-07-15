export type SubjectScore = {
  id: number
  name: string
  credits: number
  score10: number | null
  score4: number | null
  scoreLetter: string | null
}

export const fakeScores: SubjectScore[] = [
  {
    id: 1,
    name: "Chuyên đề nghiên cứu 1: Khải + Phý",
    credits: 3,
    score10: 8.5,
    score4: 3.5,
    scoreLetter: "B+",
  },
  {
    id: 2,
    name: "Chuyên đề nghiên cứu 2: Trường + Hỷ",
    credits: 3,
    score10: 9.0,
    score4: 4.0,
    scoreLetter: "A",
  },
  {
    id: 3,
    name: "Chuyên đề nghiên cứu 3",
    credits: 2,
    score10: 7.0,
    score4: 2.5,
    scoreLetter: "C+",
  },
  {
    id: 4,
    name: "Chuyên đề nghiên cứu 4",
    credits: 2,
    score10: 8.0,
    score4: 3.0,
    scoreLetter: "B",
  },
  {
    id: 5,
    name: "Chuyên đề nghiên cứu 5",
    credits: 2,
    score10: 7.5,
    score4: 3.0,
    scoreLetter: "B",
  },
  {
    id: 6,
    name: "Luận văn tốt nghiệp",
    credits: 12,
    score10: 9.2,
    score4: 4.0,
    scoreLetter: "A",
  },
]

type Member = {
  stt: number
  role: string
  name: string
  unit: string
}

export const fakeData: Member[] = [
  { stt: 1, role: "Chủ tịch", name: "Nguyễn Văn A", unit: "ĐH Quốc Gia Hà Nội" },
  { stt: 2, role: "Thư ký", name: "Trần Thị B", unit: "ĐH Bách Khoa Hà Nội" },
  { stt: 3, role: "Phản biện 1", name: "Lê Văn C", unit: "ĐH Sư phạm Hà Nội" },
  { stt: 4, role: "Phản biện 2", name: "Phạm Thị D", unit: "ĐH Y Hà Nội" },
  { stt: 5, role: "Ủy viên", name: "Hoàng Văn E", unit: "ĐH Công Nghiệp Hà Nội" },
]

export type Subject = {
  name: string
  credits: number
  score: number
}

export const dataFake: Subject[] = [
  { name: "Phương pháp luận nghiên cứu khoa học", credits: 2, score: 8.7 },
  { name: "Tiếng Anh", credits: 3, score: 10 },
  { name: "Triết học", credits: 3, score: 8.1 },
  { name: "Vật liệu tiên tiến", credits: 2, score: 7.5 },
  { name: "Chỉ huy, quản lý kỹ thuật quân sự", credits: 3, score: 7.6 },
  { name: "Cơ sở công nghệ chế tạo máy", credits: 3, score: 9.1 },
  { name: "Lý thuyết đàn hồi - dẻo - từ biến", credits: 2, score: 8.1 },
  { name: "Cơ học môi trường liên tục", credits: 2, score: 8.4 },
  { name: "Độ tin cậy ngòi đạn", credits: 2, score: 9 },
  { name: "Phương pháp tính và ứng dụng", credits: 3, score: 8 },
  { name: "Thử nghiệm đạn dược", credits: 2, score: 8.4 },
  { name: "Uy lực đạn", credits: 2, score: 7.9 },
  { name: "Vật lý nổ", credits: 2, score: 8.6 },
  { name: "Nhiệt khí động lực học", credits: 3, score: 8.4 },
  { name: "Phương pháp phần tử hữu hạn trong cơ kỹ thuật", credits: 2, score: 7.8 },
]
