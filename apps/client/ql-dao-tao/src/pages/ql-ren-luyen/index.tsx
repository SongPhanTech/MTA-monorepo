import { EyeOutlined } from '@ant-design/icons'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindManySemester,
    useFindManyTrainingScoreSession,
    useUpdateTrainingScoreSession,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Select, useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Collapse, Empty, Flex, message, Row, Table, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { BookPlus, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function QuanLyDiemRenLuyen() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const { showSpinner, hideSpinner } = useSpinner()
    const { id: semesterId } = useSemesterStore()
    const [semesterFilter, setSemesterFilter] = useState<string | undefined>(undefined)
    const { onOpen } = useDisclosure<string>({
        tag: 'PutDotRenLuyen',
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const [isOpen, setIsOpen] = useState(false)

    // Fetch semester list
    const { data: semesterList = [] } = useFindManySemester({
        include: {
            schoolYear: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    // Fetch all training score sessions
    const { data: trainingScoreSessions = [], refetch } = useFindManyTrainingScoreSession({
        where: {
            deletedAt: null,
            ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
            ...(semesterFilter ? { semesterId: semesterFilter } : {}),
        },
        include: {
            trainingObjectType: true,
            semester: {
                include: {
                    schoolYear: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    const { mutateAsync: updateTrainingScoreSession } = useUpdateTrainingScoreSession()

    const handleDeleteDotDanhGia = async (id: string) => {
        try {
            showSpinner()
            await updateTrainingScoreSession({
                where: { id },
                data: { deletedAt: new Date() },
            })
            message.success('Xóa đợt đánh giá thành công')
            refetch()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    // Group training sessions by semester
    const groupedBySemester = useMemo(() => {
        const groups = new Map<
            string,
            {
                semester: (typeof semesterList)[0] | null
                sessions: typeof trainingScoreSessions
            }
        >()

        // First, add all semesters to ensure we show semesters even without sessions
        semesterList.forEach((semester) => {
            if (!semesterFilter || semesterFilter === semester.id) {
                groups.set(semester.id, {
                    semester,
                    sessions: [],
                })
            }
        })

        // Then, add sessions to their respective semesters
        trainingScoreSessions.forEach((session) => {
            if (session.semesterId) {
                const existing = groups.get(session.semesterId)
                if (existing) {
                    existing.sessions.push(session)
                } else {
                    groups.set(session.semesterId, {
                        semester: session.semester,
                        sessions: [session],
                    })
                }
            }
        })

        // Convert to array and sort by semester
        return Array.from(groups.values())
            .filter((g) => g.semester)
            .sort((a, b) => {
                // Sort by school year start date desc, then semester name desc
                const dateA = a.semester?.schoolYear?.startDate?.getTime() || 0
                const dateB = b.semester?.schoolYear?.startDate?.getTime() || 0
                if (dateA !== dateB) return dateB - dateA
                return (b.semester?.name || '').localeCompare(a.semester?.name || '')
            })
    }, [semesterList, trainingScoreSessions, semesterFilter])

    const columns = [
        {
            title: 'STT',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Tên đợt đánh giá',
            dataIndex: 'name',
            width: 200,
        },
        {
            title: 'Đối tượng đào tạo',
            width: 150,
            render: (_: any, record: any) => record?.trainingObjectType?.name || '-',
        },
        {
            title: 'Thời gian',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: any) =>
                record?.time ? dayjs(record.time).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            width: 200,
            render: (text: string) => text || '-',
        },
        ...(canSome(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN, 'XEM_CHI_TIET', 'SUA', 'XOA')
            ? [
                  {
                      title: 'Thao tác',
                      width: 120,
                      align: 'center' as const,
                      render: (_: any, record: any) => (
                          <Row className="justify-center gap-2">
                              {can(
                                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                  'XEM_CHI_TIET'
                              ) && (
                                  <Tooltip title="Xem chi tiết" placement="top">
                                      <EyeOutlined
                                          className="text-sm cursor-pointer"
                                          onClick={() =>
                                              router.push(
                                                  `${ROUTER_PATH.QL_DAO_TAO.QL_REN_LUYEN}/${record.id}`
                                              )
                                          }
                                      />
                                  </Tooltip>
                              )}
                              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN, 'SUA') && (
                                  <EditIcon
                                      className="text-sm text-blue-700 cursor-pointer"
                                      onClick={(e) => {
                                          onOpen(record.id)
                                          e.stopPropagation()
                                      }}
                                  />
                              )}
                              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN, 'XOA') && (
                                  <DeleteIcon
                                      popConfirm={{
                                          onConfirm: (e) => {
                                              handleDeleteDotDanhGia(record.id)
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
              ]
            : []),
    ]

    useEffect(() => {
        if (isOpen) {
            const handleScroll = (e: Event) => {
                // Kiểm tra xem có phải đang cuộn cái danh sách học kỳ không
                // (Class 'rc-virtual-list-holder' là của cái thanh cuộn trong dropdown Antd)
                const target = e.target as HTMLElement;
                if (target?.classList?.contains('rc-virtual-list-holder')) {
                    return; // Nếu cuộn trong dropdown thì giữ nguyên
                }
                
                // Nếu cuộn ở ngoài (body, main layout...) thì đóng lại
                setIsOpen(false);
            };

            // Dùng capture: true để bắt được sự kiện scroll của bất kỳ thành phần nào
            window.addEventListener('scroll', handleScroll, true);
            
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
            };
        }
    }, [isOpen]);

    return (
        <div className="p-4">
            <Row gutter={[16, 16]}>
                {/* Header */}
                <Col span={24}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col span={8}>
                            <Select
                                className="w-full"
                                placeholder="Lọc theo học kỳ"
                                value={semesterFilter}
                                onChange={(value) => {
                                    setSemesterFilter(value)
                                    setIsOpen(false)
                                }}
                                allowClear
                                showSearch
                                open={isOpen}
                                onDropdownVisibleChange={(visible) => setIsOpen(visible)}
                                dropdownStyle={{ zIndex: 950 }}
                                options={semesterList.map((s) => ({
                                    value: s.id,
                                    label: [s.name, s.schoolYear?.name].filter(Boolean).join(' - '),
                                }))}
                            />
                        </Col>
                        <Col span={16}>
                            <Flex justify="end" gap={10}>
                                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN, 'THEM') && (
                                    <Button type="primary" onClick={() => onOpen()}>
                                        <BookPlus />
                                        Thêm mới đợt đánh giá
                                    </Button>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                {/* Content - Grouped by Semester */}
                <Col span={24}>
                    {groupedBySemester.length === 0 ? (
                        <Empty description="Không có dữ liệu" />
                    ) : (
                        <Collapse
                            defaultActiveKey={groupedBySemester
                                .slice(0, 3)
                                .map((g) => g.semester?.id || '')}
                            expandIcon={({ isActive }) =>
                                isActive ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )
                            }
                            items={groupedBySemester.map((group) => ({
                                key: group.semester?.id || '',
                                label: (
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold">
                                            {[
                                                group.semester?.name,
                                                group.semester?.schoolYear?.name,
                                            ]
                                                .filter(Boolean)
                                                .join(' - ')}
                                        </span>
                                        <Tag color={group.sessions.length > 0 ? 'green' : 'orange'}>
                                            {group.sessions.length} đợt
                                        </Tag>
                                        {group.sessions.length === 0 && (
                                            <Tag color="warning">Chưa có đợt đánh giá</Tag>
                                        )}
                                    </div>
                                ),
                                children:
                                    group.sessions.length > 0 ? (
                                        <Table
                                            rowKey="id"
                                            columns={columns}
                                            dataSource={group.sessions}
                                            pagination={false}
                                            size="small"
                                            onRow={(record) => ({
                                                onClick: () => {
                                                    if (
                                                        can(
                                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                                            'XEM_CHI_TIET'
                                                        )
                                                    ) {
                                                        router.push(
                                                            `${ROUTER_PATH.QL_DAO_TAO.QL_REN_LUYEN}/${record.id}`
                                                        )
                                                    }
                                                },
                                                className: 'cursor-pointer hover:bg-gray-50',
                                            })}
                                        />
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            <p>Học kỳ này chưa có đợt đánh giá rèn luyện.</p>
                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QL_REN_LUYEN,
                                                'THEM'
                                            ) && (
                                                <Button
                                                    type="link"
                                                    onClick={() => onOpen()}
                                                    className="mt-2"
                                                >
                                                    + Thêm đợt đánh giá
                                                </Button>
                                            )}
                                        </div>
                                    ),
                            }))}
                        />
                    )}
                </Col>
            </Row>
        </div>
    )
}

QuanLyDiemRenLuyen.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
