import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import { useGetSurveysOfProfile } from "@workspace/libs/api/exam"
import dayjs from "dayjs"
import { useMemo } from "react"

const useKhaoSatChuaLam = () => {
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId

  const { data, isLoading } = useGetSurveysOfProfile(
    profileId as string,
    { limit: 200 },
    { query: { enabled: !!profileId } }
  )

  const mapKhoaTheoLopHocPhan = useMemo(() => {
    const map = new Map<string, string>()
    if (data?.status !== 200) return map

    const danhSachApi = data.data?.data
    if (!Array.isArray(danhSachApi)) return map

    const now = dayjs()
    for (const ks of danhSachApi) {
      if (ks.surveyTopic?.type !== $Enums.SurveyType.CLUSTER) continue

      const lopHocPhanId = ks.subjectClass?.id
      if (!lopHocPhanId) continue

      if (ks.surveySessions?.some((phien) => phien.isCompleted)) continue

      if (ks.startDate && now.isBefore(dayjs(ks.startDate))) continue
      if (ks.endDate && now.isAfter(dayjs(ks.endDate))) continue

      map.set(lopHocPhanId, ks.id)
    }
    return map
  }, [data])

  return { mapKhoaTheoLopHocPhan, isLoading, profileId }
}

export { useKhaoSatChuaLam }
