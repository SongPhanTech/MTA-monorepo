import { BottomSection } from "./bottom-section"
import { MainView } from "./main-view"

const WaveArrow = ({ delayClass }: { delayClass: string }) => (
  <div className={`animate-wave-arrow ${delayClass}`}>
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
)

export default function QuyTrinhQuanLyHoSoDashboard() {
  return (
    <div className="mx-auto flex w-full min-h-0 max-w-[1450px] flex-col justify-start px-2">
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
        .delay-1 { animation-delay: 0s; }
        .delay-2 { animation-delay: 0.3s; }
        .delay-3 { animation-delay: 0.6s; }

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

        @media (max-height: 800px) {
          .step-icon-container {
            width: 2.5rem !important;
            height: 2.5rem !important;
            margin-bottom: 0.15rem !important;
          }
          .step-arrow-container {
            height: 2.5rem !important;
          }
          .step-icon {
            width: 1rem !important;
            height: 1rem !important;
          }
          .step-num-badge {
            width: 0.875rem !important;
            height: 0.875rem !important;
            margin-bottom: 0.1rem !important;
            font-size: 7.5px !important;
          }
          .step-label {
            font-size: 9.5px !important;
          }
          .report-item {
            padding-top: 0.375rem !important;
            padding-bottom: 0.375rem !important;
          }
          .report-item-icon-container {
            width: 1.75rem !important;
            height: 1.75rem !important;
          }
          .report-item-icon {
            width: 0.875rem !important;
            height: 0.875rem !important;
          }
          .report-item-label {
            font-size: 11px !important;
          }
          .bottom-card {
            padding: 0.375rem !important;
          }
          .bottom-icon-container {
            width: 2rem !important;
            height: 2rem !important;
            margin-bottom: 0.25rem !important;
          }
          .bottom-icon {
            width: 1rem !important;
            height: 1rem !important;
          }
          .bottom-label {
            font-size: 10px !important;
          }
        }
      `}</style>

      <div className="dashboard-content-wrapper flex min-h-0 flex-col justify-start">
        <div className="views-wrapper flex min-h-0 flex-col overflow-x-hidden">
          <MainView />
        </div>

        <div className="my-2 flex shrink-0 items-center justify-center gap-2">
          <WaveArrow delayClass="delay-1" />
          <WaveArrow delayClass="delay-2" />
          <WaveArrow delayClass="delay-3" />
        </div>
      </div>

      <div className="shrink-0">
        <BottomSection />
      </div>
    </div>
  )
}
