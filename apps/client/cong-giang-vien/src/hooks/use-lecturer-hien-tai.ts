import { useSession } from "@workspace/auth/react"
import { useFindFirstLecturer } from "@workspace/db/hooks"

const useLecturerHienTai = () => {
  const { data: me, status: sessionStatus } = useSession()
  const profileId = me?.sDM_NhanVienId

  const { data: lecturer, isLoading: lecturerLoading } = useFindFirstLecturer(
    { where: { userProfileId: profileId ?? "" }, select: { id: true } },
    { enabled: !!profileId }
  )

  return {
    lecturerId: lecturer?.id,
    isLoading: sessionStatus === "loading" || lecturerLoading,
  }
}

export { useLecturerHienTai }
