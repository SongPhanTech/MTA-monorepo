import { useSession } from "@workspace/auth/react"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"

const useGiangVien = () => {
  const { data: me, status: sessionStatus } = useSession()
  const profileId = me?.sDM_NhanVienId

  const { data, isLoading: profileLoading } = useFindUniqueUserProfile(
    {
      where: { id: profileId ?? "" },
      select: { bLaGiangVien: true },
    },
    { enabled: !!profileId }
  )

  return {
    isGiangVien: !!data?.bLaGiangVien,
    isLoading: sessionStatus === "loading" || profileLoading,
  }
}

export { useGiangVien }
