import { SafetyCertificateOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import TableCollapse from '@components/commons/tableCollapse'
import { useScoreConverter } from '@hooks/scoreConverter'
import DefaultLayout from '@layouts/default-layout'
import type { ArchivedAward, ArchivedCertificate, StudentSubjectScore } from '@workspace/db/client'
import {
    useFindManySemester,
    useFindManyStudentSubjectScore,
    useFindUniqueStudent,
} from '@workspace/db/hooks'
import { exportFromTemplate, TableRow } from '@workspace/libs/template-excel'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Flex, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookCheckIcon, Check, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')
export interface IMonHoc {
    TenMonhoc: string;
    MaMH?: string;
    soTC?: number;
    diem01?: number;
    diem02?: number;
    diem07?: number;
    diemhe10?: number;
    diemhe4?: number;
    diemchu?: string;
    ghichu?: string;
}


export interface IHocKi {
    TenHocKi?: string;
    SoTinChiKy?: number; 
    DiemTBKyHe10?: number; 
    DiemTBKyHe4?: number; 
    monHocs?: IMonHoc[]; 
}
export default function StudentScoreClassPage() {
    const router = useRouter()
    const studentId = router.query.id as string
    const [_filters, _setFilters] = useState({
        searchText: '',
    })

    const { onOpen } = useDisclosure<{
        dataTable: any
        dataStudent: any
    }>({
        tag: 'ModalPrintToKQHT',
    })

    const { onOpen: onOpenModalAddScore } = useDisclosure<{
        id: string
        list: string[]
        studentId: string
        subjectClassStudent: StudentSubjectScore
    }>({
        tag: 'PutAddOlympicScoreModal',
    })

    const { onOpen: onOpenModalAddCertificate } = useDisclosure<{
        id: string
        list: string[]
        studentId: string
        subjectClassStudent: StudentSubjectScore
    }>({
        tag: 'PutAddCertificateScoreModal',
    })

    const { onOpen: onOpenModalNhapDiem } = useDisclosure<string>({
        tag: 'NhapDiemThuCong',
        onClose: () => {
            refetch()
        },
    })
    const exportTemplate = async () => {
      const hocKis: IHocKi[] = [];
      if (data.length > 0) {
        data.forEach(item=>{
            const monhoc: IMonHoc[] = [];
            item.subjectClasses.forEach((subjectClass) => {
              subjectClass.subjectClassStudent.forEach(
                (subjectClassStudent) => {
                  monhoc.push({
                    TenMonhoc: subjectClassStudent.subjectVersion.name,
                    MaMH:
                      subjectClassStudent.subjectVersion.code?.slice(0, 2) ??
                      "",
                    soTC: subjectClassStudent.subjectVersion.credit,
                    diemhe10:
                      subjectClassStudent?.manualFinalScore ||
                      subjectClassStudent?.finalScore?.toNumber() ||
                      0,
                    diemhe4:
                      convertScore(
                        subjectClassStudent?.manualFinalScore ||
                          subjectClassStudent?.finalScore?.toNumber() ||
                          0
                      ).base4 ?? 0,
                      diemchu: convertScore(
                        subjectClassStudent?.manualFinalScore ||
                          subjectClassStudent?.finalScore?.toNumber() ||
                          0
                      ).letter ?? '',
                      ghichu: subjectClassStudent.description ?? '',
                  });
                }
              );
            });
            const tongSoTinChi = monhoc.reduce((acc, curr) => acc + (curr.soTC ?? 0), 0);

            const tongDiemNhanTinChiHe10 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe10 ?? 0) * (curr.soTC ?? 0),
                0
            );
            const tongDiemNhanTinChiHe4 = monhoc.reduce(
                (acc, curr) => acc + (curr.diemhe4 ?? 0) * (curr.soTC ?? 0),
                0
            );
        
            const diemTBHe10_Raw =
              tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe10 / tongSoTinChi;
            const diemTBHe4_Raw =
              tongSoTinChi === 0 ? 0 : tongDiemNhanTinChiHe4 / tongSoTinChi;

            const diemTBHe10 = parseFloat(diemTBHe10_Raw.toFixed(1));
            const diemTBHe4 = parseFloat(diemTBHe4_Raw.toFixed(1));
        
            hocKis.push({
                TenHocKi: item.code + '-' + item.name + '-' + item.schoolYear?.name,
                SoTinChiKy: tongSoTinChi,
                DiemTBKyHe10: diemTBHe10,
                DiemTBKyHe4: diemTBHe4,
                monHocs: monhoc,
            });
        })
      }
      const sampleStudentData = {
        fullname: student?.userProfile?.fullname,
        dateOfBirth: student?.userProfile?.dateOfBirth,
        maSV: student?.code,
        htdt: student?.trainingObjectType?.name,
        nganh: student?.curriculumVersion?.curriculum.trainingMajor.name,
        lop: student?.fixedClass?.trainingCourse?.name,
        hocKis: hocKis,
      }

      const tableRows = sampleStudentData.hocKis.flatMap((hocKi) => {
        const hocKiRow: TableRow = {
            cells: [
              {
                value: hocKi.TenHocKi ?? '', 
                colSpan: 19, 
                bold: true,
                align: 'left',
                border: true, 
              },
            ],
          };
          //@ts-ignore
        const monHocRows: TableRow[] = hocKi?.monHocs?.map((monHoc: IMonHoc, index: number) => ({   
          cells: [
            { value: index + 1 },
            { value: monHoc.TenMonhoc ?? '', colSpan: 6, border: true }, 
            { value: monHoc.MaMH ?? '' },
            { value: monHoc.soTC, align: 'center' },
            { value: monHoc.diem01 ?? 0, align: 'right' },
            { value: monHoc.diem02 ?? 0, align: 'right' },
            { value: monHoc.diem07 ?? 0, align: 'right' },
            { value: null },
            { value: null },
            { value: monHoc.diemhe10 ?? 0, align: 'right' },
            { value: monHoc.diemhe4 ?? 0, align: 'right' },
            { value: monHoc.diemchu ?? '', align: 'center' },
            { value: null },
            { value: monHoc.ghichu ?? '' },
          ]
        })) ?? [];
  
        // Dòng trung bình học kỳ
        const trungBinhRow: TableRow = {
          cells: [
            { value: null },
            { value: 'Điểm trung bình học kỳ:', colSpan: 6, bold: true, align: 'center' },
            { value: null }, // Cột 7
            { value: hocKi.SoTinChiKy ?? 0, bold: true, align: 'center' }, // Cột 8
            { value: null }, // Cột 9
            { value: null }, // Cột 10
            { value: null }, // Cột 11
            { value: null }, // Cột 12
            { value: null }, // Cột 13
            { value: hocKi.DiemTBKyHe10 ?? 0, bold: true, align: 'right' }, // Cột 14
            { value: hocKi.DiemTBKyHe4 ?? 0, bold: true, align: 'right' }, // Cột 15
            { value: null }, // Cột 16
            { value: null }, // Cột 17
            { value: null }, // Cột 18
          ]
        };
        
        return [hocKiRow, ...monHocRows, trungBinhRow];
      });
  

      const gapRow: TableRow = {
        cells: [{ value: null, colSpan: 18, border: false }]
      };
      const tongtinchi = sampleStudentData.hocKis.reduce((acc, curr) => acc + (curr.SoTinChiKy ?? 0), 0);
      
      // Tính điểm trung bình hệ 10 toàn khóa: tổng (điểm TB kỳ × số tín chỉ kỳ) / tổng số tín chỉ
      const tongDiemNhanTinChiHe10 = sampleStudentData.hocKis.reduce(
        (acc, curr) => acc + (curr.DiemTBKyHe10 ?? 0) * (curr.SoTinChiKy ?? 0), 
        0
      );
      const tongDiemNhanTinChiHe4 = sampleStudentData.hocKis.reduce(
        (acc, curr) => acc + (curr.DiemTBKyHe4 ?? 0) * (curr.SoTinChiKy ?? 0), 
        0
      );
      
      const tongdiemhe10 = tongtinchi === 0 ? 0 : parseFloat((tongDiemNhanTinChiHe10 / tongtinchi).toFixed(1));
      const tongdiemhe4 = tongtinchi === 0 ? 0 : parseFloat((tongDiemNhanTinChiHe4 / tongtinchi).toFixed(1));
      const totalRow: TableRow = {
        cells: [
          { value: `Tổng tín chỉ: ${tongtinchi}`, colSpan: 18, border: false },       
        ]
      };
      const diemTBHe10Row: TableRow = {
        cells: [
          { value: `Điểm trung bình hệ 10 toàn khóa: ${tongdiemhe10}`, colSpan: 18, border: false },       
        ]
      };
      const diemTBHe4Row: TableRow = {
        cells: [
          { value: `Điểm trung bình hệ 4 toàn khóa: ${tongdiemhe4}`, colSpan: 18, border: false },       
        ]
      };
      const xeploai = convertScore(tongdiemhe10).classification;
      const xepLoaiRow: TableRow = {
        cells: [
          { value: `Xếp loại: ${xeploai}`, colSpan: 18, border: false },       
        ]
      };
  

      const dateSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: 12, border: false }, // Ô trống bên trái
          { 
            value: `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, 
            colSpan: 6, 
            border: false, 
            align: 'center' 
          } 
        ]
      };
      
      const titleSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: 12, border: false },
          { 
            value: '  KT. TRƯỞNG PHÒNG \n PHÓ TRƯỞNG PHÒNG', 
            colSpan: 6, 
            border: false, 
            align: 'center',
            bold: true,
          } 
        ]
      };
      const nameSignatureRow: TableRow = {
        cells: [
          { value: null, colSpan: 12, border: false }, // Ô trống bên trái
          { 
            value: 'Đại tá, TS Nguyễn Văn Bình												', 
            colSpan: 6, 
            border: false, 
            align: 'center' ,
            bold: true
          } 
        ]
      };
    exportFromTemplate({
      templateUrl: "/lms/templates/chuong-trinh-dao-tao/quatrinh.xlsx",
      sheets: [
        {
          sheet: "BaoCaoDiem",
          data: {
            fullname: sampleStudentData.fullname ?? '',
            dateOfBirth: sampleStudentData.dateOfBirth ? dayjs(sampleStudentData.dateOfBirth).format('DD/MM/YYYY') : '',
            htdt: sampleStudentData.htdt ?? '',
            maSV: sampleStudentData.maSV ?? '',
            nganh: sampleStudentData.nganh ?? '',
            lop: sampleStudentData.lop ?? '',
          },
          tableStartCell: { row: 11, col: 1 },
          rows: [
            ...tableRows,   
            gapRow,         
            gapRow,         
            totalRow,
            diemTBHe10Row,
            diemTBHe4Row,
            xepLoaiRow,
            dateSignatureRow, 
            titleSignatureRow, 
            nameSignatureRow
          ],
          hiddenColumns: ['M', 'N', 'R','J','K','L']
        },
      ],
      fileName: `BDCN-${sampleStudentData.fullname}.xlsx`,
    });
     

    };

    const { data: student } = useFindUniqueStudent(
        {
            where: {
                id: studentId,
            },
            include: {
                userProfile: true,
                curriculumVersion: {
                    include: {
                        trainingLevel: true,
                        curriculum: {
                            include: {
                                trainingMajor: {
                                    include: {
                                        trainingField: true,
                                    },
                                },
                            },
                        },
                    },
                },
                fixedClass: {
                    include: {
                        trainingCourse: {
                            include: {
                                scoreConverts: true,
                            },
                        },
                    },
                },
                trainingObjectType: true,
                trainingForm: true,
            },
        },
        {
            enabled: !!studentId,
        }
    )

    const { data: studentSubjectScoreData = [] } = useFindManyStudentSubjectScore(
        {
            where: {
                studentId: studentId,
                manualFinalScore: {
                    gt: 0,
                },
            },
            include: {
                subjectVersion: true,
            },
        },
        {
            enabled: !!studentId,
        }
    )
    const { data = [], refetch } = useFindManySemester({
        where: {
            subjectClasses: {
                some: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
            },
        },
        include: {
            subjectClasses: {
                where: {
                    subjectClassStudent: {
                        some: {
                            studentId,
                        },
                    },
                },
                include: {
                    subjectClassStudent: {
                        where: {
                            studentId,
                        },
                        include: {
                            subjectVersion: true,
                            certificates: {
                                include: {
                                    archivedCertificate: true,
                                },
                            },
                            awards: {
                                include: {
                                    archivedAward: true,
                                },
                            },
                        },
                    },
                },
            },
            trainingCoursesStart: {
                where: {
                    id: student?.fixedClass?.trainingCourseId ?? undefined,
                },
                include: {
                    scoreConverts: true,
                },
            },
            schoolYear: true,
        },
        orderBy: {
            createdAt: 'asc',
        },
    })

    const { convertScore } = useScoreConverter(data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts)

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {[
                    student?.code,
                    student?.userProfile?.fullname,
                    student?.trainingObjectType?.name,
                    student?.fixedClass?.trainingCourse?.name,
                    student?.curriculumVersion?.name,
                    student?.curriculumVersion?.curriculum.trainingMajor.name,
                    student?.curriculumVersion?.curriculum.trainingMajor.trainingField.name,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[8, 8]} align="top" justify="space-between">
                        {/* Hàng chứa các button */}
                        <Col xs={24}>
                            <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                                <Button
                                    type="primary"
                                    onClick={() => onOpenModalNhapDiem(studentId)}
                                >
                                    Nhập điểm thủ công
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() =>
                                        onOpen({
                                            dataTable: data,
                                            dataStudent: student,
                                        })
                                    }
                                >
                                    In kết quả học tập
                                </Button>
                                
                                <Button
                                    type="primary"
                                    onClick={() =>
                                       {exportTemplate()}
                                    }
                                >
                                    Xuất bảng điểm cá nhân (Mẫu P2)
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col className="text-lg font-bold">Danh sách điểm thủ công</Col>
                <Col span={24}>
                    <Table
                        // filters={filters}
                        // setFilters={setFilters}
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã môn học',
                                width: 150,
                                align: 'center',
                                render: (_, record) => record?.subjectVersion?.code,
                            },
                            {
                                title: 'Tên môn học',
                                align: 'center',
                                render: (_, record) => record?.subjectVersion?.name,
                            },
                            {
                                title: 'Điểm thủ công',
                                dataIndex: 'manualFinalScore',
                                align: 'center',
                                width: 200,
                            },
                        ]}
                        data={studentSubjectScoreData}
                        pagination={false}
                    />
                </Col>
                <Col className="text-lg font-bold mt-9">Danh sách điểm theo kỳ</Col>
                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        currentPage={1}
                        headerTitleKey={({ code, name, schoolYear }) =>
                            `${[code, name, schoolYear?.name].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="subjectClasses"
                        defaultExpandAll
                        columns={[
                            {
                                title: 'Mã môn học',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'subjectVersion', 'code'],
                                fixed: 'left',
                                width: 120,
                            },
                            {
                                title: 'Tên môn học',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'subjectVersion', 'name'],
                                fixed: 'left',
                                width: 200,
                            },
                            {
                                title: 'Điểm chuyên cần',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'attendanceScore'],
                                width: 130,
                            },
                            {
                                title: 'Điểm thường xuyên',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'midtermScore'],
                                width: 150,
                            },
                            {
                                title: 'Điểm thi',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'examScore'],
                                width: 100,
                            },
                            {
                                title: 'Điểm cộng',
                                align: 'center',
                                width: 120,
                                render: (_, { id, subjectClassStudent }) =>
                                    subjectClassStudent?.[0]?.awards.reduce(
                                        (
                                            acc: number,
                                            curr: {
                                                archivedAward: ArchivedAward
                                            }
                                        ) => acc + (curr?.archivedAward?.bonusScore ?? 0),
                                        0
                                    ),
                            },
                            {
                                title: 'Chứng chỉ',
                                align: 'center',
                                width: 150,
                                render: (_, { id, subjectClassStudent }) =>
                                    subjectClassStudent?.[0]?.certificates
                                        .map(
                                            (i: { archivedCertificate: ArchivedCertificate }) =>
                                                i?.archivedCertificate?.code
                                        )
                                        .join(', '),
                            },
                            {
                                title: 'Điểm tương đương',
                                align: 'center',
                                width: 150,
                                render: (__, { id, subjectClassStudent }) => {
                                    const arr: { finalScore: number }[] =
                                        subjectClassStudent?.[0]?.certificates.map(
                                            (i: { archivedCertificate: ArchivedCertificate }) => {
                                                return {
                                                    ...i,
                                                    finalScore:
                                                        Number(
                                                            i?.archivedCertificate?.finalScore
                                                        ) || 0,
                                                }
                                            }
                                        )
                                    return arr?.length > 0
                                        ? _.maxBy(arr, 'finalScore')?.finalScore
                                        : ''
                                },
                            },
                            {
                                title: 'Số tín chỉ',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'subjectVersion', 'credit'],
                                width: 100,
                            },
                            {
                                title: 'Điểm hệ 10',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    const subjectClassStudent = record?.subjectClassStudent?.[0]
                                    return (
                                        subjectClassStudent?.manualFinalScore ??
                                        subjectClassStudent?.finalScore?.toNumber() ??
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Điểm hệ 4',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    const subjectClassStudent = record?.subjectClassStudent?.[0]
                                    const score =
                                        subjectClassStudent?.manualFinalScore ||
                                        subjectClassStudent?.finalScore?.toNumber() ||
                                        0
                                    return score !== undefined ? convertScore(score).base4 : ''
                                },
                            },
                            {
                                title: 'Điểm hệ chữ',
                                align: 'center',
                                width: 120,
                                render: (_, record) => {
                                    const subjectClassStudent = record?.subjectClassStudent?.[0]
                                    const score =
                                        subjectClassStudent?.manualFinalScore ||
                                        subjectClassStudent?.finalScore?.toNumber() ||
                                        0
                                    return score !== undefined ? convertScore(score).letter : ''
                                },
                            },
                            {
                                title: 'Kết quả',
                                align: 'center',
                                width: 100,
                                render: (_: any, record: any) => {
                                    const subjectClassStudent = record.subjectClassStudent?.[0]
                                    const score =
                                        subjectClassStudent?.manualFinalScore ??
                                        subjectClassStudent?.finalScore

                                    if (score === undefined || score === null) return null

                                    const result = convertScore(score)

                                    return (
                                        <div className="flex items-center justify-center">
                                            {result.pass ? (
                                                <Check size={18} color="green" />
                                            ) : (
                                                <X size={18} color="red" />
                                            )}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Ghi chú',
                                align: 'center',
                                dataIndex: ['subjectClassStudent', '0', 'description'],
                                width: 200,
                                render: (value: string) => {
                                    return <span className="line-clamp-1">{value}</span>
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 150,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id, subjectClassStudent }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip title="Cộng điểm">
                                            <BookCheckIcon
                                                onClick={onOpenModalAddScore.bind(null, {
                                                    id: subjectClassStudent?.[0]?.id,
                                                    studentId: studentId,
                                                    list:
                                                        subjectClassStudent?.length > 0
                                                            ? subjectClassStudent[0]?.awards.map(
                                                                  (i: {
                                                                      archivedAwardId: string
                                                                  }) => i.archivedAwardId
                                                              )
                                                            : [],
                                                    subjectClassStudent: subjectClassStudent?.[0],
                                                })}
                                                size={16}
                                            />
                                        </Tooltip>

                                        <Tooltip title="Thêm chứng chỉ">
                                            <SafetyCertificateOutlined
                                                onClick={onOpenModalAddCertificate.bind(null, {
                                                    id: subjectClassStudent?.[0]?.id,
                                                    studentId: studentId,
                                                    list:
                                                        subjectClassStudent?.length > 0
                                                            ? subjectClassStudent[0]?.certificates.map(
                                                                  (i: {
                                                                      archivedCertificateId: string
                                                                  }) => i.archivedCertificateId
                                                              )
                                                            : [],
                                                    subjectClassStudent: subjectClassStudent?.[0],
                                                })}
                                                size={16}
                                            />
                                        </Tooltip>
                                    </Row>
                                ),
                            },
                        ]}
                        data={data}
                        pagination={{
                            hideOnSinglePage: true,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

StudentScoreClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Quản lý hồ sơ' },
                {
                    title: 'Lớp quản lý',
                    href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
                },
                { title: 'Chi tiết lớp quản lý' },
                { title: 'Kết quả học tập' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
