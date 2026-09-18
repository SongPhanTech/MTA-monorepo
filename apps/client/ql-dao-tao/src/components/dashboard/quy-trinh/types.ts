export type QuyTrinhView =
  | "main"
  | "len-ke-hoach"
  | "to-chuc-thi"
  | "xet-tot-nghiep"
  | "quan-ly-khoa-luan"
  | "quan-ly-diem"

export type QuyTrinhDetailView = Exclude<QuyTrinhView, "main">
