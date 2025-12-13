import { PrismaClient } from "../generated/prisma-client";

const prisma = new PrismaClient();

const org = await prisma.dM_DonVi.findFirstOrThrow({
  where: { sMa: "V4" },
});

const data = [
  {
    id: "51",
    name: "Học phần bắt buộc",
  },
  {
    id: "54",
    name: "Học phần bổ sung bắt buộc",
  },
  {
    id: "55",
    name: "Học phần bổ sung tự chọn",
  },
  {
    id: "53",
    name: "Chuyên đề tiến sĩ",
  },
  {
    id: "84",
    name: "Chuyên ngành",
  },
  {
    id: "86",
    name: "Chuyên ngành",
  },
  {
    id: "04",
    name: "Chuyên ngành bắt buộc",
  },
  {
    id: "35",
    name: "Chuyên ngành bắt buộc",
  },
  {
    id: "95",
    name: "Chuyên ngành bắt buộc",
  },
  {
    id: "05",
    name: "Chuyên ngành tự chọn",
  },
  {
    id: "36",
    name: "Chuyên ngành tự chọn",
  },
  {
    id: "94",
    name: "Chuyên ngành tự chọn",
  },
  {
    id: "47",
    name: "Chuyên ngành tự chọn - Nhóm chuyên sâu 1",
  },
  {
    id: "48",
    name: "Chuyên ngành tự chọn - Nhóm chuyên sâu 2",
  },
  {
    id: "49",
    name: "Chuyên ngành tự chọn - Nhóm chuyên sâu 3",
  },
  {
    id: "50",
    name: "Chuyên ngành tự chọn - Nhóm chuyên sâu 4",
  },
  {
    id: "21",
    name: "Chuyên ngành tự chọn 1",
  },
  {
    id: "22",
    name: "Chuyên ngành tự chọn 2",
  },
  {
    id: "02",
    name: "Cơ sở ngành bắt buộc",
  },
  {
    id: "83",
    name: "Cơ sở ngành",
  },
  {
    id: "33",
    name: "Cơ sở ngành bắt buộc",
  },
  {
    id: "92",
    name: "Cơ sở ngành bắt buộc",
  },
  {
    id: "34",
    name: "Cơ sở ngành tự chọn",
  },
  {
    id: "93",
    name: "Cơ sở ngành tự chọn",
  },
  {
    id: "03",
    name: "Cơ sở ngành tự chọn",
  },
  {
    id: "56",
    name: "Chuyên ngành tự chọn - Nhóm chuyên sâu 5",
  },
  {
    id: "57",
    name: "Chuyên ngành tự chọn - Nhóm chuyên sâu 6",
  },
  {
    id: "100",
    name: "Đề án tốt nghiệp",
  },
  {
    id: "81",
    name: "Giáo dục đại cương",
  },
  {
    id: "15",
    name: "Giáo dục thể chất",
  },
  {
    id: "80",
    name: "Giáo dục đại cương",
  },
  {
    id: "14",
    name: "Giáo dục quốc phòng",
  },
  {
    id: "09",
    name: "Hướng chuyên sâu Công nghệ phần mềm",
  },
  {
    id: "19",
    name: "Hướng chuyên sâu Điều khiển công nghiệp",
  },
  {
    id: "07",
    name: "Hướng chuyên sâu Hệ thống thông tin",
  },
  {
    id: "06",
    name: "Hướng chuyên sâu Khoa học máy tính",
  },
  {
    id: "08",
    name: "Hướng chuyên sâu Mạng máy tính và truyền thông",
  },
  {
    id: "20",
    name: "Hướng chuyên sâu Thiết bị điện - điện tử",
  },
  {
    id: "23",
    name: "Hướng chuyên sâu Tự động hóa",
  },
  {
    id: "38",
    name: "Hoạt động khoa học",
  },
  {
    id: "97",
    name: "Hoạt động khoa học",
  },
  {
    id: "32",
    name: "Học phần chung",
  },
  {
    id: "82",
    name: "Học phần chung",
  },
  {
    id: "96",
    name: "Học phần chung",
  },
  {
    id: "01",
    name: "Kiến thức chung",
  },
  {
    id: "87",
    name: "Kiến thức chung",
  },
  {
    id: "88",
    name: "Kiến thức chuyên ngành",
  },
  {
    id: "98",
    name: "Luận văn, đề án tốt nghiệp",
  },
  {
    id: "37",
    name: "Luận văn tốt nghiệp",
  },
  {
    id: "52",
    name: "Học phần tự chọn",
  },
  {
    id: "12",
    name: "Cơ sở ngành tự chọn 1",
  },
  {
    id: "13",
    name: "Cơ sở ngành tự chọn  2",
  },
  {
    id: "11",
    name: "Tự chọn thiết kế",
  },
  {
    id: "10",
    name: "Thực tập",
  },
  {
    id: "85",
    name: "Thực tập",
  },
  {
    id: "90",
    name: "Thực tập",
  },
  {
    id: "89",
    name: "Thi tốt nghiệp",
  },
  {
    id: "99",
    name: "Thực tập tốt nghiệp",
  },
  {
    id: "24",
    name: "Giáo dục đại cương",
  },
  {
    id: "25",
    name: "Cơ sở ngành",
  },
  {
    id: "26",
    name: "Kỹ thuật chuyên ngành",
  },
  {
    id: "27",
    name: "Quân sự chuyên ngành",
  },
  {
    id: "28",
    name: "CHQLKT",
  },
  {
    id: "29",
    name: "Công tác Đảng, công tác chính trị",
  },
  {
    id: "30",
    name: "Thực tập, diễn tập",
  },
  {
    id: "31",
    name: "Đồ án tốt nghiệp, thi tốt nghiệp",
  },
  {
    id: "39",
    name: "Giáo dục đại cương",
  },
  {
    id: "40",
    name: "Cơ sở ngành",
  },
  {
    id: "41",
    name: "Kỹ thuật chuyên ngành",
  },
  {
    id: "42",
    name: "Quân sự chuyên ngành",
  },
  {
    id: "43",
    name: "CHQLKT",
  },
  {
    id: "44",
    name: "Công tác Đảng, công tác chính trị",
  },
  {
    id: "45",
    name: "Thực tập, diễn tập",
  },
  {
    id: "46",
    name: "Đồ án tốt nghiệp, thi tốt nghiệp",
  },
  {
    id: "58",
    name: "Khoa học xã hội nhân văn, quản lý nhà nước",
  },
  {
    id: "59",
    name: "Khoa học quân sự",
  },
  {
    id: "60",
    name: "Chỉ huy, quản lý kỹ thuật",
  },
  {
    id: "61",
    name: "Tham quan đơn vị",
  },
  {
    id: "62",
    name: "Diễn tập cuối khóa",
  },
  {
    id: "63",
    name: "Khóa luận tốt nghiệp",
  },
  {
    id: "64",
    name: "Chuyên ngành",
  },
  {
    id: "65",
    name: "Cơ sở ngành ",
  },
  {
    id: "66",
    name: "Chuyên ngành ",
  },
  {
    id: "67",
    name: "Tham quan đơn vị",
  },
  {
    id: "68",
    name: "Diễn tập cuối khóa",
  },
  {
    id: "69",
    name: "Khóa luận tốt nghiệp",
  },
  {
    id: "70",
    name: "Kiến thức chung",
  },
  {
    id: "71",
    name: "Cơ sở và chuyên ngành",
  },
  {
    id: "72",
    name: "Thực tập chuyên ngành",
  },
  {
    id: "73",
    name: "Diễn tập",
  },
  {
    id: "74",
    name: "Luận văn tốt nghiệp",
  },
  {
    id: "75",
    name: "Cơ sở ngành",
  },
  {
    id: "76",
    name: "Chuyên ngành ",
  },
  {
    id: "77",
    name: "Tham quan đơn vị",
  },
  {
    id: "78",
    name: "Diễn tập cuối khóa",
  },
  {
    id: "79",
    name: "Khóa luận tốt nghiệp",
  },
  {
    id: "91",
    name: "Bồi dưỡng chuyên ngành",
  },
];

const result = await prisma.trainingBlock.createMany({
  data: data.map(({ id, name }) => ({
    id,
    name,
  })),
  skipDuplicates: true,
});
