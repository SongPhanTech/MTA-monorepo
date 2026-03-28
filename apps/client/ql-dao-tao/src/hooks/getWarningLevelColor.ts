export const getWarningLevelColor = (level: number) => {
  switch (level) {
    case 0:
      return "green" // Không cảnh cáo
    case 1:
      return "lime" // Mức nhẹ
    case 2:
      return "orange" // Mức trung bình
    case 3:
      return "volcano" // Mức nặng
    case 4:
      return "red" // Mức nguy hiểm
    default:
      return "default"
  }
}
