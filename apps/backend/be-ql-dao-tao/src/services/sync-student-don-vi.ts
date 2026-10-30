import { putDMNhanViens } from "@workspace/libs/api/system"
import { studentLsbRoles } from "@workspace/libs/utils"
import { prisma } from ".."
import { formatLsbError, type ErrorExtra } from "../types/error-extra"

const lsbRequestOptions = () => ({
  headers: {
    "x-clientid": process.env.KEYCLOAK_CLIENT_ID_LMS || "",
    "x-clientsecret": process.env.KEYCLOAK_CLIENT_SECRET_LMS || "",
  },
})

export type SyncStudentDonViResult = {
  synced: number
  failed: { studentId: string; message: string }[]
}

export async function syncStudentsDonViFromFixedClass(params: {
  studentIds?: string[]
  fixedClassId?: string
}): Promise<SyncStudentDonViResult> {
  const studentIds = [...new Set(params.studentIds?.filter(Boolean) ?? [])]
  if (!studentIds.length && !params.fixedClassId) {
    return { synced: 0, failed: [] }
  }

  const students = await prisma.student.findMany({
    where: {
      deletedAt: null,
      ...(studentIds.length ? { id: { in: studentIds } } : {}),
      ...(params.fixedClassId ? { fixedClassId: params.fixedClassId } : {}),
    },
    select: {
      id: true,
      userProfile: {
        select: {
          id: true,
          code: true,
          lastName: true,
          firstName: true,
          fullname: true,
          genderId: true,
          dateOfBirth: true,
          idCardNumber: true,
          phoneNumber: true,
          email: true,
          avatar: true,
          officerNumber: true,
          nationalityId: true,
          currentAddress: true,
          sDM_DonViId: true,
          bLaHocVien: true,
          bLaSinhVien: true,
          bLaCanBoNhanVien: true,
          bLaGiangVien: true,
        },
      },
      fixedClass: {
        select: {
          managementOrganizationId: true,
          trainingCourse: {
            select: { trainingObjectType: { select: { type: true } } },
          },
        },
      },
    },
  })

  const failed: { studentId: string; message: string }[] = []
  let synced = 0

  for (const student of students) {
    const profile = student.userProfile
    if (!profile || !student.fixedClass) continue

    const donViId = student.fixedClass.managementOrganizationId ?? null
    const studentRoles = studentLsbRoles(student.fixedClass.trainingCourse?.trainingObjectType?.type)

    try {
      if (
        profile.sDM_DonViId !== donViId ||
        profile.bLaHocVien !== studentRoles.bLaHocVien ||
        profile.bLaSinhVien !== studentRoles.bLaSinhVien
      ) {
        await prisma.userProfile.update({
          where: { id: profile.id },
          data: { sDM_DonViId: donViId, ...studentRoles },
        })
      }

      const lastName = profile.lastName?.trim() || ""
      const firstName = profile.firstName?.trim() || ""
      const lsbRes = await putDMNhanViens(
        {
          Id: profile.id,
          sDM_DonViId: donViId,
          sMa: profile.code || undefined,
          sHoVaDem: lastName || undefined,
          sTen: firstName || undefined,
          sTenDayDu: profile.fullname || `${lastName} ${firstName}`.trim() || undefined,
          sDM_GioiTinhId: profile.genderId || null,
          dNgaySinh: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString() : null,
          sCCCD: profile.idCardNumber || undefined,
          sSDTDiDong: profile.phoneNumber?.trim() || "",
          sEmail: profile.email?.trim() || undefined,
          sAvatarId: profile.avatar || undefined,
          sSoHieuSQ: profile.officerNumber || undefined,
          sDM_QuocGiaId: profile.nationalityId || null,
          sDiaChi: profile.currentAddress || undefined,
          bLaHocVien: studentRoles.bLaHocVien,
          bLaSinhVien: studentRoles.bLaSinhVien,
          bLaCanBoNhanVien: !!profile.bLaCanBoNhanVien,
          bLaGiangVien: !!profile.bLaGiangVien,
        },
        lsbRequestOptions()
      )

      if (lsbRes.status !== 200) {
        const extra = (lsbRes.data as { extra?: ErrorExtra } | undefined)?.extra
        failed.push({
          studentId: student.id,
          message: formatLsbError(extra, `LSB API error: ${lsbRes.status}`),
        })
        continue
      }

      synced += 1
    } catch (error) {
      failed.push({
        studentId: student.id,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { synced, failed }
}
