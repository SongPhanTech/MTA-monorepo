import { Store } from "@tanstack/react-store"

export type DiemLopMonHocStoreState = {
  selectedSubjectClassId?: string
}

/** Lưu lớp môn học đang chọn khi điều hướng từ danh sách lớp giảng dạy sang màn nhập điểm. */
export const diemLopMonHocStore = new Store<DiemLopMonHocStoreState>({
  selectedSubjectClassId: undefined,
})
