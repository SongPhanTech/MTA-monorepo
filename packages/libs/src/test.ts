import { PrismaClient } from "@workspace/db";
import { postDMNhanViens } from "./api/system";

const prisma = new PrismaClient();

const names = [
  "Đặng Quang Lịch",
  "Nguyễn Trọng Luật",
  "Lê Nguyên Tịnh",
  "Lê Văn Tọa",
  "Phan Thị Thùy An",
  "Nguyễn Ngọc Huê",
  "Nguyễn Khắc Hưng",
  "Tạ Đức Tâm",
  "Vũ Minh Hoàng",
  "Đoàn Tùng Anh",
  "Lưu Thị Hà",
  "Hồ Bá Tú",
  "Đỗ Thành Quân",
  "Nguyễn Hồng Điệp",
  "Mai Đức Minh",
  "Vũ Văn Quyết",
  "Trần Văn Kế",
];

const lecturers = await prisma.lecturer.findMany({
  where: {
    userProfile: {
      fullname: {
        in: names,
      },
    },
  },
  include: {
    userProfile: true,
  },
});

for (const lecturer of lecturers) {
  const profileData = lecturer.userProfile;
  const payload = {
    Id: profileData.id,
    sMa: profileData.idCardNumber,
    bLaGiangVien: true,
    bLaCanBoNhanVien: true,
    bLaTaiKhoan: true,
    dNgaySinh: profileData.dateOfBirth
      ? new Date(profileData.dateOfBirth)?.toISOString()
      : null,
    sCCCD: profileData.idCardNumber,
    sHoVaDem: profileData.lastName,
    sTen: profileData.firstName,
    sTenDayDu: profileData.fullname,
    sSDTDiDong: profileData.phoneNumber ?? "",
    sDM_DonViId: lecturer.organizationId,
    sEmail: profileData.email,
    sDM_GioiTinhId: profileData.genderId,
  };
  // console.log(payload);

  const res = await postDMNhanViens(payload, {
    headers: {
      "x-clientid": process.env.KEYCLOAK_CLIENT_ID_LMS || "",
      "x-clientsecret": process.env.KEYCLOAK_CLIENT_SECRET_LMS || "",
    },
  });

  console.log(res.data, payload.sTenDayDu);
}
