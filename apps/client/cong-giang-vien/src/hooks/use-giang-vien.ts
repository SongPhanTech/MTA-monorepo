import { useSession } from "@workspace/auth/react"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"

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

  const isSessionLoading =
    !sessionStatus || sessionStatus === "loading" || sessionStatus === "unauthenticated"

  const isProfileLoading =
    sessionStatus === "authenticated" && !!profileId && (isPending || isFetching || !isFetched)

  const accessResolved = sessionStatus === "authenticated" && (!profileId || isFetched)

  return {
    isGiangVien: accessResolved && !!profileId && !!data?.bLaGiangVien,
    isLoading: isSessionLoading || isProfileLoading,
  }
}

export { useGiangVien }
