import { CheckOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import { emptyObjectIf } from '@workspace/constant'
import type { TrainingCourse } from '@workspace/db/client'
import {
    useCountFixedClass,
    useFindManyCurriculumVersion,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingLevel,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
    useUpdateFixedClass,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, message, Row, Tooltip } from 'antd'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { exportFromTemplate, TableRow } from '@workspace/libs/template-excel'
export default function FixedClassPage({ trainingCourse }: { trainingCourse?: TrainingCourse }) {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [_searchText, _setSearchText] = useState<string>('')
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        managementOrganization: undefined,
        trainingCourses: undefined,
        curriculumVersion: undefined,
        trainingMajors: undefined,
        trainingLevel: undefined,
        startYear: undefined,
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const canReadAll = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
        'XEM_TAT_CA'
    )

    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const router = useRouter()

    const where = useMemo(() => {
        const curriculumVersionFilter = {
            ...(filters.trainingMajors
                ? {
                      curriculum: {
                          trainingMajorId: {
                              in: filters.trainingMajors,
                          },
                      },
                  }
                : {}),
            ...(filters.trainingLevel
                ? {
                      trainingLevelId: {
                          in: filters.trainingLevel,
                      },
                  }
                : {}),
        }

        return {
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.code,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(filters.managementOrganization
                ? {
                      managementOrganizationId: {
                          in: filters.managementOrganization,
                      },
                  }
                : {}),
            ...(filters.trainingCourses
                ? {
                      trainingCourseId: {
                          in: filters.trainingCourses,
                      },
                  }
                : {}),
            ...(filters.curriculumVersion
                ? {
                      curriculumVersionId: {
                          in: filters.curriculumVersion,
                      },
                  }
                : {}),
            ...(Object.keys(curriculumVersionFilter).length > 0 && {
                curriculumVersion: curriculumVersionFilter,
            }),
            trainingCourse: {
                trainingObjectTypeId,
            },
            active: true,
            ...(!canReadAll
                ? {
                      OR: [
                          {
                              lecturerManagement: {
                                  userProfileId: profileId,
                              },
                          },
                          {
                              staffManagement: {
                                  userProfileId: profileId,
                              },
                          },
                      ],
                  }
                : {}),
        }
    }, [
        filters.code,
        filters.name,
        filters.trainingCourses,
        filters.managementOrganization,
        filters.curriculumVersion,
        filters.trainingMajors,
        filters.trainingLevel,
        trainingObjectTypeId,
        canReadAll,
        profileId,
    ])

    const { data = [] } = useFindManyFixedClass({
        where: {
            ...where,
        },
        include: {
            students: {
                include: {
                    userProfile: true,
                },
            },
            lecturerManagement: {
                include: {
                    userProfile: true,
                },
            },
            managementOrganization: true,
            trainingCourse: {
                include: {
                    trainingObjectType: true,
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                    trainingLevel: true,
                },
            },
        },
        orderBy: [
            ...emptyObjectIf(
                [
                    {
                        startYear: filters.startYear,
                    },
                ],
                !!filters.startYear
            ),
            { name: 'asc' },
        ],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })
    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
        orderBy: { name: 'asc' },
    })

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingLevelData = [] } = useFindManyTrainingLevel({
        orderBy: { name: 'asc' },
    })

    const { data: count } = useCountFixedClass({
        where: {
            ...where,
            deletedAt: null,
        },
    })

    const { data: manageOrgData = [], refetch: refetchManageOrg } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(manageOrgData)

    const { onOpen } = useDisclosure<string>({
        tag: 'PutFixedClassModal',
    })

    const { onOpen: onOpenChuyenLop } = useDisclosure({
        tag: 'ModalChuyenLop',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const handleModalChuyenLop = () => {
        onOpenChuyenLop()
    }

    // THAY THẾ TOÀN BỘ HÀM handleExportBangDiem HIỆN TẠI BẰNG HÀM NÀY

    const handleExportBangDiem = () => {
        showSpinner();
        try {
            // 1. Dữ liệu mẫu (Giữ nguyên)
            const reportData = {
              khoa: "KẾT QUẢ ĐÀO TẠO TOÀN KHÓA 35",
              chuyenNganh: "8 52 03 01_01 - Kỹ thuật hoá học",
              lop: "KTHH-NC-35",
              students: [
                { stt: 1, hoTen: "Vũ Đức Anh", ngaySinh: "08/03/1995", doiTuong: "QS", diem: [7.6, 7.8, 8.1, 8.3, 9.3, 6.2, 7.1, 8.3, "0/10", 8.3, 7.8, 8.3, 8.2, 7.6, 8.4, 9, 7.8, 6.9, 8.1, 9, 8, 8.5, null], ccta: null, tbc: 8.19, dlv: 8.7 },
                { stt: 2, hoTen: "Hà Huy Hưng", ngaySinh: "07/01/1997", doiTuong: "QS", diem: [8, 8.3, 8.7, 8.2, 8.9, 7.8, 6.9, 8.7, "0/10", 7.8, 7.2, 8.3, 7.8, 9, 9, 8.6, 7.9, 7.4, 9, 8.5, 8, 9, null], ccta: null, tbc: 8.34, dlv: 8.7 },
                { stt: 3, hoTen: "Trần Tiến Tùng", ngaySinh: "09/10/1994", doiTuong: "QS", diem: [8.4, 8, 8.2, 8.4, 9, 7, 7.5, 8.6, "0/10", 7.2, 7.2, 8.7, 7.6, 7.3, 8.1, 8.3, 7.5, 7.1, 8.4, 9.5, 7.5, 8.5, null], ccta: null, tbc: 8.15, dlv: 9.2 },
                { stt: 4, hoTen: "Vũ Văn Tùng", ngaySinh: "18/05/1994", doiTuong: "QS", diem: [9, 8.1, 8.5, 8.4, 9, 7, 7.4, 8.4, "0/10", 8.3, 7.5, 8.7, 8.4, 8.7, 8.7, 9, 7.7, 7.2, 8.4, 8.5, 8.5, 9, null], ccta: null, tbc: 8.43, dlv: 8.5 }
              ],
              tongSoHP: 22,
              tongSoTC: 53,
            };

            // 2. Chuyển đổi JSON thành TableRow[]
            const studentRows = reportData.students.map(student => ({
              cells: [
                { value: student.stt, align: 'center' as const, border: true },
                { value: student.hoTen, border: true },
                { value: student.ngaySinh, align: 'center' as const, border: true },
                { value: student.doiTuong, align: 'center' as const, border: true },
                ...student.diem.map(d => ({ 
                    value: d !== null ? String(d) : null,
                    align: 'right' as const, 
                    border: true 
                })),
                { value: student.ccta !== null ? String(student.ccta) : null, align: 'right' as const, border: true },
                { value: student.tbc !== null ? String(student.tbc) : null, align: 'right' as const, border: true, bold: true },
                { value: student.dlv !== null ? String(student.dlv) : null, align: 'right' as const, border: true, bold: true },
              ]
            }));

            const totalCell = [{ cells: [{ value: `Tổng số học phần: ${reportData.tongSoHP} HP, tổng số tín chỉ: ${reportData.tongSoTC} TC.`, border: false, colSpan: 10, bold:true }]}];

            // === PHẦN MỚI 1: TẠO CHÚ THÍCH MÔN HỌC (3 CỘT) ===
            const chuthichMonHoc = [
                "M1. Các phương pháp vật lý và hoá lý trong nghiên cứu vật chất",
                "M2. Công nghệ xử lý môi trường.",
                "M3. Hoá học chất rắn",
                "M4. Nhiệt động học và động học trong hoá kỹ thuật",
                "M5. Những vấn đề hiện đại trong hoá học hữu cơ",
                "M6. Những vấn đề hiện đại trong hoá học vô cơ",
                "M7. Phương pháp luận nghiên cứu khoa học",
                "M8. Quá trình và thiết bị chuyển khối - truyền nhiệt",
                "M9. Tiếng Anh",
                "M10. Tin học trong công nghệ hoá học",
                "M11. Triết học",
                "M12. Vật liệu chuyên dụng",
                "M13. Chỉ huy, quản lý kỹ thuật quân sự",
                "M14. Hóa lý bề mặt",
                "M15. Năng lượng tái tạo",
                "M16. Công nghệ vật liệu polyme-composite nâng cao",
                "M17. Hóa học và công nghệ nitroxenlulo",
                "M18. Các phương pháp quang phổ và sắc kí trong phân tích",
                "M19. Kỹ thuật điện hóa và ứng dụng",
                "M20. Chuyên đề nghiên cứu 2 (KTHH)",
                "M21. Chuyên đề nghiên cứu 1 (KTHH)",
                "M22. Chuyên đề nghiên cứu 3 (KTHH)",
            ];

            const columnFooterRows = [];
            // Chia làm 3 cột (Cột 1: 9 item, Cột 2: 9 item, Cột 3: 4 item)
            const maxRowsPerColumn = 9; 
            
            for (let i = 0; i < maxRowsPerColumn; i++) {
                // (colSpan 10 cho mỗi cột, tổng 30 cột)
                const cell1 = chuthichMonHoc[i] ? { value: chuthichMonHoc[i], border: false, colSpan: 10 } : { value: null, border: false, colSpan: 10 };
                const cell2 = chuthichMonHoc[i + 9] ? { value: chuthichMonHoc[i + 9], border: false, colSpan: 10 } : { value: null, border: false, colSpan: 10 };
                const cell3 = chuthichMonHoc[i + 18] ? { value: chuthichMonHoc[i + 18], border: false, colSpan: 10 } : { value: null, border: false, colSpan: 10 };
                
                columnFooterRows.push({ cells: [cell1, cell2, cell3] });
            }

            // === PHẦN MỚI 2: TẠO PHẦN GHI CHÚ CUỐI FILE ===
             const ghiChuRows = [
                { cells: [{ value: null, border: false }] }, // Dòng trống
                { cells: [{ value: 'GHI CHÚ:', border: false, bold: true, colSpan: 10 }] },
                { cells: [{ value: "1. 'Null': Môn đã lên danh sách thi nhưng chưa thi hoặc giáo viên chưa nhập điểm", border: false, colSpan: 20 }] },
                { cells: [{ value: "2. ' ': Môn chưa lên danh sách thi", border: false, colSpan: 20 }] },
                { cells: [{ value: "3. 'Miễn': Môn miễn học", border: false, colSpan: 20 }] },
                { cells: [{ value: "4. 'HT': Môn hoãn thi", border: false, colSpan: 20 }] },
                { cells: [{ value: "4. 'CT': Môn cấm thi", border: false, colSpan: 20 }] },
                { cells: [{ value: "5. 'ĐCT': Môn đình chỉ thi", border: false, colSpan: 20 }] },
                { cells: [{ value: "6. Điểm TBC: Tính điểm trung bình cộng của tất cả các môn đã có điểm ở thời điểm xuất file excel điểm (Không tính điểm môn chưa thi, không tính điểm môn hoãn thi, miễn thi)", border: false, colSpan: 30 }] },
            ];


            // 3. Gọi hàm export
            exportFromTemplate({
              templateUrl: "/lms/templates/chuong-trinh-dao-tao/Bangdiemtheolop.xlsx",
              sheets: [
                {
                  sheet: "BaoCaoDiem", // Đảm bảo tên sheet này chính xác
                  data: {
                    khoa: reportData.khoa,
                    chuyenNganh: reportData.chuyenNganh,
                    lop: reportData.lop,
                    tongSoHP: reportData.tongSoHP,
                    tongSoTC: reportData.tongSoTC,
                  },
                  tableStartCell: { row: 9, col: 1 }, 
                  
                  rows: [
                    ...studentRows, 
                    ...totalCell,
                    ...columnFooterRows, 
                    ...ghiChuRows
                  ], 
                },
              ],
              fileName: `BangDiem-${reportData.lop}.xlsx`,
            });
        } catch (error) {
            console.error("Export failed:", error);
            message.error("Xuất file thất bại, vui lòng thử lại!");
        } finally {
            hideSpinner();
        }
    };

    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateFixedClass({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify={'end'}>
                        <Col span={4}>
                            <Flex justify="end">
                                <Button
                                    className="mr-3"
                                    type="primary"
                                    onClick={handleExportBangDiem}
                                >
                                   Xuất excel
                                </Button>
                                <Button
                                    className="mr-3"
                                    type="primary"
                                    onClick={handleModalChuyenLop}
                                >
                                    Chuyển lớp
                                </Button>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                                    'THEM'
                                ) && (
                                    <Button onClick={handleModal} type="primary">
                                        Thêm mới
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="fixed-class"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        onRowClick={(record) => {
                            if (
                                can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                                    'XEM_CHI_TIET'
                                )
                            ) {
                                router.push(
                                    ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace(
                                        '[id]',
                                        String(record.id)
                                    )
                                )
                            }
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã lớp quản lý',
                                align: 'center',
                                width: 150,
                                fixed: 'left',
                                dataIndex: 'code',
                                type: 'input',
                            },
                            {
                                title: 'Tên lớp quản lý',
                                align: 'center',
                                width: 200,
                                fixed: 'left',
                                dataIndex: 'name',
                                type: 'input',
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'managementOrganization',
                                align: 'center',
                                width: 200,
                                type: 'tree_select',
                                options: treeData,
                                render: (value) => (value?.sTen ? value?.sTen : ''),
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 200,
                                type: 'select',
                                options: trainingMajorData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                dataIndex: 'trainingMajors',
                                render: (_, record) =>
                                    record?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                                    '',
                            },
                            {
                                title: 'Khoá',
                                dataIndex: 'trainingCourse',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: trainingCourseData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (value) => (value?.name ? value?.name : ''),
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                align: 'center',
                                dataIndex: 'trainingObjectTypes',
                                width: 180,
                                type: 'select',
                                options: trainingObjectTypeData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (__, record) =>
                                    record?.trainingCourse?.trainingObjectType?.name || '',
                            },

                            {
                                title: 'Bậc đào tạo',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: trainingLevelData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                dataIndex: 'trainingLevel',
                                render: (__, record) =>
                                    record?.curriculumVersion?.trainingLevel?.name || '',
                            },
                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'curriculumVersion',
                                align: 'center',
                                width: 250,
                                type: 'select',
                                options: curriculumVersionData.map((item) => ({
                                    label: item.name,
                                    value: item.id,
                                })),
                                render: (value) => (value?.name ? value?.name : ''),
                            },

                            {
                                title: 'Đã tốt nghiệp',
                                align: 'center',
                                width: 150,
                                dataIndex: 'graduated',
                                type: 'select',
                                options: [
                                    { value: true, label: 'Đã tốt nghiệp' },
                                    { value: false, label: 'Chưa tốt nghiệp' },
                                ],
                                render: (value) =>
                                    value ? <CheckOutlined className="text-[#028850]" /> : '',
                            },
                            {
                                title: 'Giáo viên chủ nhiệm',
                                dataIndex: 'lecturerManagement',
                                align: 'center',
                                width: 200,
                                type: 'input',
                                render: (value) =>
                                    value?.userProfile?.fullname
                                        ? value?.userProfile?.fullname
                                        : '',
                            },
                            {
                                title: 'Cán bộ quản lý',
                                dataIndex: 'staffManagement',
                                align: 'center',
                                width: 200,
                                type: 'input',
                                render: (value) =>
                                    value?.userProfile?.fullname
                                        ? value?.userProfile?.fullname
                                        : '',
                            },
                            {
                                title: 'Năm bắt đầu',
                                dataIndex: 'startYear',
                                width: 150,
                                type: 'order',
                                align: 'center',
                            },
                            // {
                            //     title: 'Trạng thái',
                            //     align: 'center',
                            //     fixed: 'right',
                            //     width: 130,
                            //     render: (value, record) => {
                            //         return !record?.active ? (
                            //             <Tag color="error">Không hoạt động</Tag>
                            //         ) : (
                            //             <Tag color="success">Đang hoạt động</Tag>
                            //         )
                            //     },
                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                fixed: 'right',
                                align: 'center',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                                    'XEM_CHI_TIET',
                                    'SUA',
                                    'XOA'
                                ),
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                                            'XEM_CHI_TIET'
                                        ) && (
                                            <Tooltip title="Xem danh sách học viên" placement="top">
                                                <Eye
                                                    size={16}
                                                    strokeWidth={1.5}
                                                    className="text-base cursor-pointer"
                                                />
                                            </Tooltip>
                                        )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                                            'SUA'
                                        ) && (
                                            <EditIcon
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onOpen(id)
                                                }}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        )}
                                        {can(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_LOP_BIEN_CHE,
                                            'XOA'
                                        ) && (
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: (e) => {
                                                        handleDelete(id)
                                                        e?.stopPropagation()
                                                    },
                                                    onCancel: (e) => {
                                                        e?.stopPropagation()
                                                    },
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </Row>
                                ),
                            },
                        ]}
                        data={data}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

FixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
