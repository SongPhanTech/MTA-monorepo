import { PrismaClient } from '@workspace/db'
import NV from '../DM_NhanVien.json'
import { postDMNhanViens } from './api/system'

const prisma = new PrismaClient()

const profiles = await prisma.userProfile.findMany({
    where: {
        id: {
            notIn: NV.map((nhanvien) => nhanvien.Id.toLowerCase()),
        },
    },
})

for (const profileData of profiles) {
    const res = await postDMNhanViens(
        {
            Id: profileData.id,
            sMa: profileData.idCardNumber,
            bLaHocVien: profileData.bLaHocVien || undefined,
            bLaSinhVien: profileData.bLaHocVien || undefined,
            bLaTaiKhoan: profileData.bLaNguoiDung || undefined,
            bLaGiangVien: profileData.bLaGiangVien || undefined,
            bLaCanBoNhanVien: profileData.bLaCanBoNhanVien || undefined,
            dNgaySinh: profileData.dateOfBirth
                ? new Date(profileData.dateOfBirth)?.toISOString()
                : null,
            sCCCD: profileData.idCardNumber,
            sHoVaDem: profileData.lastName,
            sTen: profileData.firstName,
            sTenDayDu: profileData.fullname,
            sSDTDiDong: profileData.phoneNumber ?? '',
            sEmail: profileData.email || `${profileData.idCardNumber}@gmail.com`,
            sDM_GioiTinhId: profileData.genderId,
        },
        {
            headers: {
                'x-clientid': process.env.KEYCLOAK_CLIENT_ID_LMS || '',
                'x-clientsecret': process.env.KEYCLOAK_CLIENT_SECRET_LMS || '',
            },
        }
    )

    if (typeof res.data !== 'string') {
        break
    }

    await prisma.userProfile.update({
        where: { id: profileData.id },
        data: { id: res.data as string },
    })
}
