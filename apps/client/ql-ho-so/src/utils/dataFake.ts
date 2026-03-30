const workHistoryData = [
  {
    from: "9/2014",
    to: "2/2015",
    position: "Chiến sĩ c56 d15 Trường SQLQ 1",
    rank: "B2",
    partyPosition: "Đoàn viên",
  },
  {
    from: "3/2015",
    to: "8/2018",
    position: "Học viện c32 d3 Trường QSPB",
    rank: "H1, 2, 3",
    partyPosition: "Đảng viên",
  },
  {
    from: "8/2018",
    to: "",
    position: "Trung đội trường c2 d15 f3 QK1 (số:08/QĐĐ-FA; ngày 24/8/2018)",
    rank: "1/ (8/2018)",
    partyPosition: "Đảng viên",
  },
  {
    from: "1/2021",
    to: "",
    position: "Phó Đại đội trường c1 d15 f3 QK1",
    rank: "2/ (5/2020)",
    partyPosition: "Đảng viên",
  },
]

interface TableRow {
  school?: string
  major?: string
  duration?: string
  type?: string
  certificate?: string
}

interface WorkRow {
  duration?: string
  detail?: string
}

interface TableRow2 {
  relationship?: string
  fullName?: string
  yearOfBirth?: string
  details?: string
}

const data: TableRow[] = [
  // dữ liệu thực tế ở đây, ví dụ:
  {
    school: "ĐH Quốc Gia",
    major: "CNTT",
    duration: "01/2018 - 06/2022",
    type: "Chính quy",
    certificate: "Kỹ sư",
  },
  // thêm hoặc bớt dòng ở đây
]

const data2: WorkRow[] = [
  // thêm dữ liệu ở đây nếu có
  {
    duration: "123",
    detail: "ádasdasd",
  },
]

const data3: TableRow2[] = [
  // Example data - you can add or remove rows here
  {
    relationship: "Cha",
    fullName: "Nguyễn Văn A",
    yearOfBirth: "1970",
    details: "Hà Nội, Kỹ sư xây dựng, Công ty Xây dựng ABC, Thành viên Mặt trận Tổ quốc",
  },
  {
    relationship: "Mẹ",
    fullName: "Trần Thị B",
    yearOfBirth: "1972",
    details: "Hà Nội, Giảng viên, Trường THPT XYZ, Thành viên Hội Phụ nữ",
  },
  // Add more rows as needed
]

export { workHistoryData, data, data2, data3 }
