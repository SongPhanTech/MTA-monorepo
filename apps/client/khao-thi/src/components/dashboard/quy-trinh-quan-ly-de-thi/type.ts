export type QuyTrinhDeThiView =
  | "main"
  | "xay-dung"
  | "thiet-lap-khung"
  | "thiet-lap-ma-tran"
  | "sinh-de"
  | "xem-truoc"
  | "sinh-dap-an"
  | "hoan-thien"

export type QuyTrinhDeThiDetailView = Exclude<QuyTrinhDeThiView, "main">
