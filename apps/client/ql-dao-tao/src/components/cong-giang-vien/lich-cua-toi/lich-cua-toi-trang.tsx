import HeaderLichCuaToi from "@components/cong-giang-vien/lich-cua-toi/header-lich-cua-toi"
import TabLichCaNhan from "@components/cong-giang-vien/lich-cua-toi/tab-lich-ca-nhan"
import TabLichGiangDay from "@components/cong-giang-vien/lich-cua-toi/tab-lich-giang-day"
import TabTatCaLich from "@components/cong-giang-vien/lich-cua-toi/tab-tat-ca-lich"
import type { TabLichCuaToi } from "@components/cong-giang-vien/lich-cua-toi/types"
import { type ComponentType, useState } from "react"

const TAB_NOI_DUNG: Record<TabLichCuaToi, ComponentType> = {
  "tat-ca": TabTatCaLich,
  "giang-day": TabLichGiangDay,
  "ca-nhan": TabLichCaNhan,
}

const LichCuaToiTrang = () => {
  const [tabHienTai, setTabHienTai] = useState<TabLichCuaToi>("tat-ca")

  const NoiDungTab = TAB_NOI_DUNG[tabHienTai]

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col gap-3 overflow-hidden">
      <HeaderLichCuaToi tabHienTai={tabHienTai} onDoiTab={setTabHienTai} />
      <div className="min-h-0 flex-1 overflow-auto">
        <NoiDungTab />
      </div>
    </div>
  )
}

export default LichCuaToiTrang
