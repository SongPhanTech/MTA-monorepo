import type { TabLichCuaToi } from "@components/cong-giang-vien/lich-cua-toi/types"
import { TAB_LICH_CUA_TOI } from "@components/cong-giang-vien/lich-cua-toi/types"
import { cn } from "@workspace/ui/lib/utils"

type HeaderLichCuaToiProps = {
  tabHienTai: TabLichCuaToi
  onDoiTab: (tab: TabLichCuaToi) => void
}

const HeaderLichCuaToi = ({ tabHienTai, onDoiTab }: HeaderLichCuaToiProps) => {
  return (
    <header className="shrink-0 rounded-lg bg-white px-4 pt-4 shadow-sm">
      <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
        Lịch của tôi
      </h1>

      <nav
        className="lich-cua-toi-tabs mt-3 flex gap-6 border-b border-gray-200"
        aria-label="Loại lịch"
      >
        {TAB_LICH_CUA_TOI.map((tab) => {
          const dangChon = tabHienTai === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onDoiTab(tab.key)}
              className={cn(
                "lich-cua-toi-tab -mb-px border-b-2 bg-transparent px-0 pb-3 pt-1 text-sm font-medium transition-colors",
                dangChon
                  ? "border-cgv-green-dark text-cgv-green-dark"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
              aria-current={dangChon ? "page" : undefined}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}

export default HeaderLichCuaToi
