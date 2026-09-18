export const quyTrinhDashboardStyles = `
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

  .dashboard-row > .ant-col {
    display: flex !important;
    flex-direction: column !important;
  }
  .dashboard-row > .ant-col > div {
    flex: 1 1 auto !important;
    min-height: 0;
  }

  /* 1024x768 and other compact viewports (sidebar leaves ~760px content) */
  @media (max-width: 1279px), (max-height: 800px) {
    .quy-trinh-dashboard .step-icon-container {
      width: 2.25rem !important;
      height: 2.25rem !important;
      margin-bottom: 0.25rem !important;
    }
    .quy-trinh-dashboard .step-icon {
      width: 1rem !important;
      height: 1rem !important;
    }
    .quy-trinh-dashboard .step-num-badge {
      width: 1rem !important;
      height: 1rem !important;
      margin-bottom: 0.125rem !important;
      font-size: 8px !important;
    }
    .quy-trinh-dashboard .step-label {
      font-size: 8.5px !important;
      letter-spacing: 0.01em !important;
      line-height: 1.2 !important;
      padding-left: 0.125rem !important;
      padding-right: 0.125rem !important;
      max-width: 100%;
    }
    .quy-trinh-dashboard .step-container-gap {
      gap: 0.75rem !important;
    }
    .quy-trinh-dashboard .report-item {
      padding-top: 0.25rem !important;
      padding-bottom: 0.25rem !important;
      gap: 0.5rem !important;
    }
    .quy-trinh-dashboard .report-item-icon-container {
      width: 1.5rem !important;
      height: 1.5rem !important;
    }
    .quy-trinh-dashboard .report-item-icon {
      width: 0.75rem !important;
      height: 0.75rem !important;
    }
    .quy-trinh-dashboard .report-item-label {
      font-size: 11px !important;
      line-height: 1.25 !important;
    }
    .quy-trinh-dashboard .fork-card {
      min-width: 76px !important;
      padding: 0.25rem !important;
    }
    .quy-trinh-dashboard .fork-icon-container {
      width: 1.75rem !important;
      height: 1.75rem !important;
      margin-bottom: 0.125rem !important;
    }
    .quy-trinh-dashboard .fork-icon {
      width: 0.875rem !important;
      height: 0.875rem !important;
    }
    .quy-trinh-dashboard .fork-label {
      font-size: 8.5px !important;
      letter-spacing: 0.02em !important;
    }
    .quy-trinh-dashboard .fork-bracket {
      height: 96px !important;
    }
    .quy-trinh-dashboard .ant-dropdown-trigger {
      display: block;
      width: 100%;
      min-width: 0;
    }
    .quy-trinh-dashboard .bottom-card {
      padding: 0.25rem !important;
    }
    .quy-trinh-dashboard .bottom-icon-container {
      width: 1.75rem !important;
      height: 1.75rem !important;
      margin-bottom: 0.25rem !important;
    }
    .quy-trinh-dashboard .bottom-icon {
      width: 0.875rem !important;
      height: 0.875rem !important;
    }
    .quy-trinh-dashboard .bottom-label {
      font-size: 9px !important;
      letter-spacing: 0.02em !important;
      line-height: 1.2 !important;
    }
    .quy-trinh-dashboard .wave-arrows-row {
      margin-top: 0.25rem !important;
      margin-bottom: 0.25rem !important;
      gap: 0.25rem !important;
    }
    .quy-trinh-dashboard .quy-trinh-bottom {
      padding: 0.5rem !important;
    }
    .quy-trinh-dashboard .quy-trinh-bottom-grid {
      gap: 0.5rem !important;
    }
    .quy-trinh-dashboard .quy-trinh-panel-body {
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
      padding-top: 0.5rem !important;
      padding-bottom: 0.5rem !important;
    }
    .quy-trinh-dashboard .quy-trinh-report-body {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
      padding-top: 0.25rem !important;
      padding-bottom: 0.25rem !important;
    }
  }
`
