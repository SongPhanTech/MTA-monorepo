import { useSession } from "@workspace/auth/react"
import { useFindFirstLecturer } from "@workspace/db/hooks"

const useLecturerHienTai = () => {
  const { data: me, status: sessionStatus } = useSession()
  const profileId = me?.sDM_NhanVienId

  const { data: lecturer, isLoading: lecturerLoading } = useFindFirstLecturer(
    {
      where: { userProfileId: profileId ?? "", deletedAt: null },
      select: { id: true, organizationId: true },
    },
    { enabled: !!profileId }
  )

  return {
    lecturerId: lecturer?.id,
    organizationId: lecturer?.organizationId ?? undefined,
    isLoading: sessionStatus === "loading" || lecturerLoading,
  }
}

export { useLecturerHienTai }
