export type QuyTrinhView =
  | "main"
  | "chuan-bi"
  | "tao-dot"
  | "trien-khai"
  | "thuc-hien"
  | "tong-hop"
  | "phan-tich"
  | "ket-thuc"

export type QuyTrinhDetailView = Exclude<QuyTrinhView, "main">
