import Select from '@components/commons/select'
import TreeSelect from '@components/commons/tree-select'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import {
    useFindManyClusterSurvey,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindManySurvey,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Row } from 'antd'
import { useMemo, useState } from 'react'
import OrganizationSurveyReport from '@/components/sub-pages/khao-sat/bao-cao-don-vi'
import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum'
import LecturerSurveyReport from '@components/sub-pages/khao-sat/bao-cao-giang-vien'
import SurveyReport from '@components/sub-pages/khao-sat/bao-cao'
import { useSemesterStore } from '@workspace/ui'

export default function BaoCaoGiangVien() {
    const [filters, setFilters] = useState<any>({
        name: '',
        surveyId: undefined,
        lectureId: undefined,
        organizationId: undefined,
        semesterIds: undefined,
        clusterId: undefined,
    })

    const [filtersMore, setFiltersMore] = useState<any>({
        name: '',
        surveyId: undefined,
        lectureId: undefined,
        organizationId: undefined,
        semesterIds: undefined,
        clusterId: undefined,
    })

    const { id: semesterId } = useSemesterStore()

    const { data = [], refetch } = useFindManyClusterSurvey({
        where: {
            surveys: {
                some: {
                    semesterId,
                },
            },
        },
        include: {
            surveyObjectType: true,
            surveyTopic: true,
            surveyQuestion: true,
            surveys: {
                include: {
                    surveySessions: true,
                    subjectClass: {
                        include: {
                            semester: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })
    const { data: organizations = [] } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(organizations)

    const { data: lecturerData = [] } = useFindManyLecturer(
        {
            include: {
                organization: true,
                userProfile: true,
            },
            where: {
                organizationId: filters?.organizationId,
                userProfile: {
                    active: true,
                },
                active: true,
            },
        },
        {
            enabled: !!filters?.organizationId,
        }
    )
    const { data: SubjectVersion = [], isLoading } = useFindManySurvey(
        {
            include: {
                lecture: true,
                subjectClass: true,
            },
            where: {
                lectureId: filters?.lectureId,
                active: true,
                clusterSurveyId: filters?.clusterId,
            },
        },
        { enabled: !!filters?.lectureId || !!filters?.clusterId }
    )

    const hanleSearchReport = () => {
        setFiltersMore(filters)
    }

    const items = useMemo(() => {
        if (!filtersMore?.clusterId) {
            return <div className="my-10 text-center text-primary text-base">Chọn đợt khảo sát</div>
        }
        if (filtersMore?.clusterId) {
            if (filtersMore.surveyId) {
                return <SurveyReport selectedId={filtersMore?.surveyId || ''} />
            }
            if (filtersMore.lectureId) {
                return (
                    <LecturerSurveyReport
                        selectedId={filtersMore?.clusterId}
                        lectureId={filtersMore?.lectureId || ''}
                        sublectClass={filters}
                        setSublectClass={(value: any) => {
                            setFilters({ ...filters, surveyId: value })
                        }}
                    />
                )
            }
            if (filtersMore.organizationId) {
                return (
                    <ClusterSurveyReport
                        selectedId={filtersMore?.clusterId}
                        surveyName={filtersMore?.name}
                        surveyId={filters?.surveyId || ''}
                        setSurvey={(value) => {
                            setFilters({ ...filters, surveyId: value })
                        }}
                        organizationSelected={filters?.organizationId}
                    />
                )
            }
            return (
                <OrganizationSurveyReport
                    selectedId={filtersMore?.clusterId}
                    surveyName={filtersMore?.name}
                    organizationSelected={filters?.organizationId}
                    setOrganizationSelected={(value) => {
                        setFilters({ ...filters, organizationId: value })
                    }}
                />
            )
        }
        return
    }, [filtersMore])
    return (
        <Row gutter={[16, 4]}>
            <Col span={24}>
                <Flex justify="space-between">
                    <Flex>
                        <Select
                            onChange={(value) => setFilters({ ...filters, clusterId: value })}
                            className="mr-4 w-[250px]"
                            options={data.map((i) => {
                                return {
                                    label: i.name,
                                    value: i.id,
                                }
                            })}
                            placeholder="Chọn đợt khảo sát"
                            dropdownStyle={{
                                maxHeight: 400,
                                overflow: 'auto',
                                width: 'fit-content',
                                maxWidth: 400,
                            }}
                            dropdownMatchSelectWidth={false}
                        />
                        <TreeSelect
                            allowClear
                            showSearch
                            placeholder="Chọn đơn vị quản lý"
                            treeDefaultExpandAll
                            treeData={treeData}
                            value={filters.organizationId}
                            className="mr-4 w-[250px]"
                            onChange={(value) => setFilters({ ...filters, organizationId: value })}
                            dropdownStyle={{
                                maxHeight: 400,
                                overflow: 'auto',
                                width: 'fit-content',
                                maxWidth: 400,
                            }}
                            dropdownMatchSelectWidth={false}
                        />
                        <Select
                            className="mr-4 w-[250px]"
                            placeholder="Chọn giảng viên"
                            value={filters.lectureId}
                            onChange={(value) => setFilters({ ...filters, lectureId: value })}
                            options={lecturerData?.map((i) => {
                                return {
                                    label: `${i?.code || ''} - ${i.userProfile?.lastName ?? ''} ${i.userProfile?.firstName ?? ''}`.trim(),
                                    value: i.id,
                                    key: i.id,
                                }
                            })}
                            dropdownStyle={{
                                maxHeight: 400,
                                overflow: 'auto',
                                width: 'fit-content',
                                maxWidth: 400,
                            }}
                            dropdownMatchSelectWidth={false}
                        />
                        <Select
                            className="mr-4 w-[250px]"
                            placeholder="Chọn môn học"
                            value={filters.surveyId}
                            onChange={(value) => setFilters({ ...filters, surveyId: value })}
                            options={SubjectVersion?.map((i) => {
                                return {
                                    label: `${i?.subjectClass?.code || ''} - ${i?.subjectClass?.name || ''}`.trim(),
                                    value: i.id,
                                    key: i.id,
                                }
                            })}
                            dropdownStyle={{
                                maxHeight: 400,
                                overflow: 'auto',
                                width: 'fit-content',
                                maxWidth: 400,
                            }}
                            dropdownMatchSelectWidth={false}
                        />
                    </Flex>
                    <Button onClick={hanleSearchReport} type="primary">
                        Tìm kiếm
                    </Button>
                </Flex>
            </Col>
            <Col span={24}>{items}</Col>
        </Row>
    )
}
BaoCaoGiangVien.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
