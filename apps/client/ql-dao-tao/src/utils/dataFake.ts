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
        name: 'Chuyên đề nghiên cứu 1: Khải + Phý',
        credits: 3,
        score10: 8.5,
        score4: 3.5,
        scoreLetter: 'B+',
    },
    {
        id: 2,
        name: 'Chuyên đề nghiên cứu 2: Trường + Hỷ',
        credits: 3,
        score10: 9.0,
        score4: 4.0,
        scoreLetter: 'A',
    },
    {
        id: 3,
        name: 'Chuyên đề nghiên cứu 3',
        credits: 2,
        score10: 7.0,
        score4: 2.5,
        scoreLetter: 'C+',
    },
    {
        id: 4,
        name: 'Chuyên đề nghiên cứu 4',
        credits: 2,
        score10: 8.0,
        score4: 3.0,
        scoreLetter: 'B',
    },
    {
        id: 5,
        name: 'Chuyên đề nghiên cứu 5',
        credits: 2,
        score10: 7.5,
        score4: 3.0,
        scoreLetter: 'B',
    },
    {
        id: 6,
        name: 'Luận văn tốt nghiệp',
        credits: 12,
        score10: 9.2,
        score4: 4.0,
        scoreLetter: 'A',
    },
]

type Member = {
    stt: number
    role: string
    name: string
    unit: string
}

export const fakeData: Member[] = [
    { stt: 1, role: 'Chủ tịch', name: 'Nguyễn Văn A', unit: 'ĐH Quốc Gia Hà Nội' },
    { stt: 2, role: 'Thư ký', name: 'Trần Thị B', unit: 'ĐH Bách Khoa Hà Nội' },
    { stt: 3, role: 'Phản biện 1', name: 'Lê Văn C', unit: 'ĐH Sư phạm Hà Nội' },
    { stt: 4, role: 'Phản biện 2', name: 'Phạm Thị D', unit: 'ĐH Y Hà Nội' },
    { stt: 5, role: 'Ủy viên', name: 'Hoàng Văn E', unit: 'ĐH Công Nghiệp Hà Nội' },
]
