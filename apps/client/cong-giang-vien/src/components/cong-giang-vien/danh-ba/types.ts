import type { Prisma } from "@workspace/db/client"

export type DonViDanhBa = Prisma.DM_DonViGetPayload<{
  include: {
    lecturers: {
      include: {
        organization: {
          select: {
            sTen: true
          }
        }
        lecturerType: {
          select: {
            name: true
          }
        }
        userProfile: {
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
          }
        }
      }
    }
  }
}>

export type LecturerDanhBa = DonViDanhBa["lecturers"][number]

export type DanhBaRow = {
  key: string
  maCanBo: string
  hoTen: string
  hocHam: string
  email: string
  soDienThoai: string
  donVi: string
  viTriViecLam: string
}
