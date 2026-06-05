import { useSession } from "@workspace/auth/react"
import { useFindUniqueUserProfile } from "@workspace/db/hooks"

const useGiangVien = () => {
  //fa330b1b-4326-4018-b3d9-3cd79344f660" id giảng viên
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId || "fa330b1b-4326-4018-b3d9-3cd79344f660"

  const { data, isLoading } = useFindUniqueUserProfile(
    {
      where: { id: profileId ?? "" },
      select: { bLaGiangVien: true },
    },
    { enabled: !!profileId }
  )

  return {
    isGiangVien: !!data?.bLaGiangVien,
    isLoading: !!profileId && isLoading,
  }
}

export { useGiangVien }
