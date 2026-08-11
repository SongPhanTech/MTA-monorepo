import { MainView } from "./main-view"
import { BottomSection } from "./bottom-section"
import type { QuyTrinhView } from "./types"

export type { QuyTrinhView, QuyTrinhDetailView } from "./types"

export interface QuyTrinhKhaoSatDashboardProps {
  view?: QuyTrinhView
  onViewChange?: (view: QuyTrinhView) => void
}

export default function QuyTrinhKhaoSatDashboard() {
  return (
    <div className="flex flex-col mx-auto w-full max-w-[1450px] px-2 min-h-0 justify-start">
      <style>{`
        @keyframes waveArrow {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
        .animate-wave-arrow {
          display: inline-block;
          animation: waveArrow 1.5s infinite ease-in-out;
        }
        .delay-1 {
          animation-delay: 0s;
        }
        .delay-2 {
          animation-delay: 0.3s;
        }
        .delay-3 {
          animation-delay: 0.6s;
        }


        .dashboard-row {
          align-items: stretch !important;
        }
        .dashboard-row > .ant-col {
          display: flex !important;
          flex-direction: column !important;
          align-self: stretch !important;
          height: auto !important;
        }
        .dashboard-row > .ant-col > div {
          height: auto !important;
          min-height: 100%;
          flex: 1 1 auto !important;
        }

        /* Small viewport height screens (laptops / 1024x768 screens) */
        @media (max-height: 800px) {
          .step-icon-container {
            width: 2.5rem !important; /* h-10 */
            height: 2.5rem !important;
            margin-bottom: 0.15rem !important;
          }
          .step-arrow-container {
            height: 2.5rem !important;
          }
          .step-icon {
            width: 1rem !important; /* h-4 */
            height: 1rem !important;
          }
          .step-num-badge {
            width: 0.875rem !important; /* h-3.5 */
            height: 0.875rem !important;
            margin-bottom: 0.1rem !important;
            font-size: 7.5px !important;
          }
          .step-label {
            font-size: 9.5px !important;
          }
          .step-container-gap {
            gap: 0.5rem !important;
          }
          .report-item {
            padding-top: 0.375rem !important; /* py-1.5 */
            padding-bottom: 0.375rem !important;
          }
          .report-item-icon-container {
            width: 1.75rem !important; /* h-7 */
            height: 1.75rem !important;
          }
          .report-item-icon {
            width: 0.875rem !important; /* h-3.5 */
            height: 0.875rem !important;
          }
          .report-item-label {
            font-size: 11.5px !important;
          }
          .fork-card {
            min-width: 105px !important;
            padding: 0.25rem !important; /* p-1 */
          }
          .fork-icon-container {
            width: 1.75rem !important; /* h-7 */
            height: 1.75rem !important;
            margin-bottom: 0.125rem !important;
          }
          .fork-icon {
            width: 0.875rem !important; /* h-3.5 */
            height: 0.875rem !important;
          }
          .fork-label {
            font-size: 9px !important;
          }
          .fork-bracket {
            height: 100px !important;
          }
          .bottom-card {
            padding: 0.375rem !important; /* p-1.5 */
          }
          .bottom-icon-container {
            width: 2rem !important; /* h-8 */
            height: 2rem !important;
            margin-bottom: 0.25rem !important;
          }
          .bottom-icon {
            width: 1rem !important; /* h-4 */
            height: 1rem !important;
          }
          .bottom-label {
            font-size: 10px !important;
          }
        }
      `}</style>

      <div className="dashboard-content-wrapper min-h-0 flex flex-col justify-start">
        <div className="views-wrapper min-h-0 flex flex-col overflow-x-hidden">
          <MainView />
        </div>

        {/* WAVE ARROWS ROW */}
        <div className="flex justify-center items-center gap-2 my-2 shrink-0">
          <div className="animate-wave-arrow delay-1">
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
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
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
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
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
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
        <BottomSection view="main" />
      </div>
    </div>
  )
}
