import type { Prisma } from "@workspace/db/client"

export type DonViDanhBa = Prisma.DM_DonViGetPayload<{
  include: {
    userProfiles: {
      where: {
        lecturer: { is: { active: true; deletedAt: null } }
      }
      select: {
        fullname: true
        email: true
        phoneNumber: true
        gender: {
          select: {
            sTen: true
          }
        }
        academicDegreeType: {
          select: {
            sTen: true
          }
        }
        academicRankType: {
          select: {
            sTen: true
          }
        }
        lecturer: {
          select: {
            code: true
            lecturerType: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }
  }
}>

export type LecturerDanhBa = DonViDanhBa["userProfiles"][number]

export type DanhBaRow = {
  key: string
  maCanBo: string
  hoTen: string
  email: string
  soDienThoai: string
  donVi: string
  gioiTinh: string
}
