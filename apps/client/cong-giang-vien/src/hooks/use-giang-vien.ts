import { useSession } from "@workspace/auth/react"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"

const useGiangVien = () => {
  const { data: me, status: sessionStatus } = useSession()
  const profileId = me?.sDM_NhanVienId
  const profileCheckEnabled = sessionStatus === "authenticated" && !!profileId

  const { data, isPending: profilePending } = useFindUniqueUserProfile(
    {
      where: { id: profileId ?? "" },
      select: { bLaGiangVien: true },
    },
    { enabled: profileCheckEnabled }
  )

  const isSessionLoading = !sessionStatus || sessionStatus === "loading"
  const isProfileLoading = profileCheckEnabled && profilePending

  return {
    isGiangVien: !!data?.bLaGiangVien,
    isLoading: isSessionLoading || isProfileLoading,
  }
}

export { useGiangVien }
