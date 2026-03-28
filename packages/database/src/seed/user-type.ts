//@ts-nocheck
/// Seed UserType

await prisma.userType.createMany({
  data: [
    {
      id: "550e8401-e29b-41d4-a716-446655440000",
      name: "Sinh viên",
      code: "SV",
      description: "Sinh viên dân sự",
      createdAt: new Date("2025-04-03T12:58:40.507Z"),
      updatedAt: new Date("2025-04-03T12:58:40.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440001",
      name: "Học viên",
      code: "HV",
      description: "Học viên quân sự chính quy",
      createdAt: new Date("2025-04-03T12:58:41.507Z"),
      updatedAt: new Date("2025-04-03T12:58:41.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440002",
      name: "Giảng viên",
      code: "GV",
      description: "Giảng viên",
      createdAt: new Date("2025-04-03T12:58:42.507Z"),
      updatedAt: new Date("2025-04-03T12:58:42.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440003",
      name: "Cán bộ",
      code: "CB",
      description: "Cán bộ",
      createdAt: new Date("2025-04-03T12:58:43.507Z"),
      updatedAt: new Date("2025-04-03T12:58:43.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440004",
      name: "Nhân viên",
      code: "NV",
      description: "Nhân viên hợp đồng",
      createdAt: new Date("2025-04-03T12:58:44.507Z"),
      updatedAt: new Date("2025-04-03T12:58:44.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440005",
      name: "Người lao động",
      code: "NLĐ",
      description: "Người lao động",
      createdAt: new Date("2025-04-03T12:58:45.507Z"),
      updatedAt: new Date("2025-04-03T12:58:45.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440006",
      name: "Quân nhân chuyên nghiệp",
      code: "QNCN",
      description: "Quân nhân chuyên nghiệp",
      createdAt: new Date("2025-04-03T12:58:46.507Z"),
      updatedAt: new Date("2025-04-03T12:58:46.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440007",
      name: "Nghĩa vụ",
      code: "L",
      description: "Lính nghĩa vụ",
      createdAt: new Date("2025-04-03T12:58:47.507Z"),
      updatedAt: new Date("2025-04-03T12:58:47.507Z"),
    },
    {
      id: "550e8401-e29b-41d4-a716-446655440008",
      name: "Quốc tế",
      code: "QT",
      description: "Học viên quốc tế",
      createdAt: new Date("2025-04-03T12:58:48.507Z"),
      updatedAt: new Date("2025-04-03T12:58:48.507Z"),
    },
  ],
})
