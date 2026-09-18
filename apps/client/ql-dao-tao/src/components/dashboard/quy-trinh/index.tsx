import { useState } from "react"
import { MainView } from "./main-view"
import { DetailedView } from "./detailed-view"
import { BottomSection } from "./bottom-section"
import { quyTrinhDashboardStyles } from "./dashboard-styles"
import type { QuyTrinhView } from "./types"

export type { QuyTrinhView, QuyTrinhDetailView } from "./types"

export interface QuyTrinhDashboardProps {
  view?: QuyTrinhView
  onViewChange?: (view: QuyTrinhView) => void
}
export default function QuyTrinhDashboard({
  view: controlledView,
  onViewChange,
}: QuyTrinhDashboardProps = {}) {
  const [internalView, setInternalView] = useState<QuyTrinhView>("main")

  const view = controlledView ?? internalView
  const setView = onViewChange ?? setInternalView

  return (
    <div className="quy-trinh-dashboard flex flex-col mx-auto max-w-[1450px] h-full flex-1 min-h-0 justify-start">
      <style>{quyTrinhDashboardStyles}</style>

      <div className="dashboard-content-wrapper min-h-0 flex flex-col justify-start">
        <div className="views-wrapper min-h-0 flex flex-col">
          {view === "main" ? (
            <MainView setView={setView} />
          ) : (
            <DetailedView view={view} setView={setView} />
          )}
        </div>

        {/* WAVE ARROWS ROW */}
        <div className="wave-arrows-row flex justify-center items-center gap-2 my-2 shrink-0">
          <div className="animate-wave-arrow delay-1">
            <svg
              width="12"
              height="16"
              viewBox="0 0 12 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 16V2M6 2L1 7M6 2L11 7"
                stroke="#0f8a4b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="animate-wave-arrow delay-2">
            <svg
              width="12"
              height="16"
              viewBox="0 0 12 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 16V2M6 2L1 7M6 2L11 7"
                stroke="#0f8a4b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="animate-wave-arrow delay-3">
            <svg
              width="12"
              height="16"
              viewBox="0 0 12 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 16V2M6 2L1 7M6 2L11 7"
                stroke="#0f8a4b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="shrink-0">
        <BottomSection view={view} />
      </div>
    </div>
  )
}
