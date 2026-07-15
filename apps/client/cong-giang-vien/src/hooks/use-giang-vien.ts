import { useSession } from "@workspace/auth/react"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"

const BYPASS_GUARD = process.env.NODE_ENV !== "production"

const useGiangVien = () => {
  const { data: me, status: sessionStatus } = useSession()
  const profileId = me?.sDM_NhanVienId
  const profileCheckEnabled = sessionStatus === "authenticated" && !!profileId

  const { data, isPending, isFetching, isFetched } = useFindUniqueUserProfile(
    {
      where: { id: profileId ?? "" },
      select: { bLaGiangVien: true },
    },
    { enabled: profileCheckEnabled }
  )

  if (BYPASS_GUARD) {
    return { isGiangVien: true, isLoading: false }
  }

  const isSessionLoading = !sessionStatus || sessionStatus === "loading"

  const isProfileLoading =
    sessionStatus === "authenticated" && !!profileId && (isPending || isFetching || !isFetched)

  const accessResolved = sessionStatus === "authenticated" && (!profileId || isFetched)

  return {
    isGiangVien: accessResolved && !!profileId && !!data?.bLaGiangVien,
    isLoading: isSessionLoading || isProfileLoading,
  }
}

export { useGiangVien }
