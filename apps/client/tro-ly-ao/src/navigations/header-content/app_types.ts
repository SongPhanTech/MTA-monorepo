import { ROUTER_PATH } from "@workspace/router"

const APPS_TYPES = [
  {
    key: "TRO_LY_AO",
    label: "Trợ lý ảo",
    path: ROUTER_PATH.TRO_LY_AO.TRO_LY_AO,
    matchPaths: ["/hoi-thoai", ROUTER_PATH.TRO_LY_AO.TRO_LY_AO],
    isShow: true,
  },
  {
    key: "TIM_KIEM_VAN_BAN",
    label: "Tìm kiếm văn bản",
    path: ROUTER_PATH.TRO_LY_AO.TIM_KIEM_VAN_BAN,
    isShow: true,
  },
  {
    key: "XU_LY_VAN_BAN",
    label: "Xử lý văn bản",
    path: ROUTER_PATH.TRO_LY_AO.XU_LY_VAN_BAN,
    isShow: true,
  },
  {
    key: "CAU_HOI_THUONG_GAP",
    label: "Câu hỏi thường gặp",
    path: ROUTER_PATH.TRO_LY_AO.CAU_HOI_THUONG_GAP,
    isShow: true,
  },
  // {
  //     key: 'QUAN_TRI_DU_LIEU',
  //     label: 'Quản trị dữ liệu',
  //     path: ROUTER_PATH.TRO_LY_AO.QUAN_TRI_DU_LIEU,
  //     isShow: true,
  // },
]
export default APPS_TYPES
