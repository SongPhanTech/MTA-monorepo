import Select from '@components/commons/select'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindManyClusterSurvey,
    useFindManyDM_DonVi,
    useFindManyLecturer,
} from '@workspace/db/hooks'
import { Col, Flex, Row, Tree } from 'antd'
import { useMemo, useState } from 'react'
// import OrganizationSurveyReport from '@/components/sub-pages/khao-sat/bao-cao-don-vi'
// import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum'
// import LecturerSurveyReport from '@components/sub-pages/khao-sat/bao-cao-giang-vien'
// import SurveyReport from '@components/sub-pages/khao-sat/bao-cao'
import { useSemesterStore, useTrainingMajorStore } from '@workspace/ui'
import { FolderOpenOutlined } from '@ant-design/icons'
import SurveylecturerReport from '@components/sub-pages/khao-sat/survey-lecturer-report'
import SurveyOrganizationReport from '@components/sub-pages/khao-sat/survey-oragation-report'
// import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum';
import OrganizationSurveyReport from '@/components/sub-pages/khao-sat/bao-cao-don-vi'

interface MyTreeNode {
    title: string
    key: string
    value?: string // nếu bạn muốn gán giá trị riêng
    children?: MyTreeNode[]
}

function buildOrgAndLectureTree(
    list: Array<any>,
    lecturers: Array<any>,
    parentId: string | null = null
): Array<any> {
    return list
        .filter((item) => (item.parentId ?? null) === parentId)
        .map((item) => ({
            ...item,
            title: item.name || 'Đơn vị không tên',
            key: item.id,
            icon: <FolderOpenOutlined />,
            selectable: true,
            children: [
                ...lecturers
                    .filter((lecturer) => lecturer.organizationId === item.id)
                    .map((lecturer) => ({
                        ...lecturer,
                        title: lecturer.userProfile?.fullName || 'Giảng viên không tên',
                        key: `${lecturer.id}`,
                    })),
                ...buildOrgAndLectureTree(list, lecturers, item.id),
            ],
        }))
}

export default function BaoCaoGiangVien() {
    const [filters, setFilters] = useState<any>({
        name: '',
        surveyId: undefined,
        lectureId: undefined,
        organizationId: undefined,
        semesterIds: undefined,
        clusterId: undefined,
    })

    const [selectedKeys, setSelectedKeys] = useState<any>([])
    const [selectedItem, setSelectedItem] = useState<any>()

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingMajorStore()

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

    const {
        data: organizations = [],
        isLoading: organizationsLoading,
        error: organizationsError,
    } = useFindManyDM_DonVi()

    const { data: lecturerData = [] } = useFindManyLecturer({
        where: {
            mainSubjectClasses: {
                some: {
                    ...(!!trainingObjectTypeId && { trainingObjectTypeId }),
                },
            },
        },
        orderBy: {
            userProfile: {
                firstName: 'asc',
            },
        },
        include: {
            userProfile: true,
            mainSubjectClasses: true,
            organization: true,
        },
    })

    // Tạo treeData từ organizations và lecturers
    const treeData: any[] = useMemo(() => {
        if (!organizations.length || !lecturerData.length) return []

        return buildOrgAndLectureTree(
            organizations.map((org) => ({
                ...org,
                id: org.Id,
                name: `${org.sMa} - ${org.sTen}`,
                parentId: org.sParentId,
            })),
            lecturerData.map((lec) => ({
                ...lec,
                id: lec.id,
                userProfile: {
                    ...lec.userProfile,
                    fullName:
                        `${lec.userProfile?.lastName ?? ''} ${
                            lec.userProfile?.firstName ?? ''
                        }`.trim() || 'Giảng viên không tên',
                },
                selectable: true,
                organizationId: lec.organizationId,
            })),
            null
        )
    }, [organizations, lecturerData])

    // const { data: SubjectVersion = [], isLoading } = useFindManySurvey(
    //     {
    //         include: {
    //             lecture: true,
    //             subjectClass: true,
    //         },
    //         where: {
    //             lectureId: filters?.lectureId,
    //             active: true,
    //             clusterSurveyId: filters?.clusterId,
    //         },
    //     },
    //     { enabled: !!filters?.lectureId || !!filters?.clusterId }
    // )

    const hanleSearchReport = () => {}

    const items = useMemo(() => {
        if (!filters?.clusterId) {
            return <div className="my-10 text-center text-primary text-base">Chọn đợt khảo sát</div>
        }
        if (filters?.clusterId) {
            if (selectedItem?.id && selectedItem?.iCapDonVi === 0) {
                return (
                    <OrganizationSurveyReport
                        selectedId={filters?.clusterId}
                        surveyName={filters?.name || ''}
                        organizationId={selectedItem?.id}
                    />
                )
            }
            if (selectedItem?.id && selectedItem?.iCapDonVi) {
                return (
                    <SurveyOrganizationReport
                        selectedId={filters?.clusterId}
                        organizationId={selectedItem?.id}
                    />
                )
            }

            if (selectedItem?.id && !selectedItem?.iCapDonVi) {
                return (
                    <SurveylecturerReport
                        selectedId={filters?.clusterId}
                        lectureId={selectedItem?.id}
                    />
                )
            }
            return <>ABC</>
            // if (filtersMore.surveyId) {
            //     return <SurveyReport selectedId={filtersMore?.surveyId || ''} />
            // }
            // if (filtersMore.lectureId) {
            //     return (
            //         <LecturerSurveyReport
            //             selectedId={filtersMore?.clusterId}
            //             lectureId={filtersMore?.lectureId || ''}
            //             sublectClass={filters}
            //             setSublectClass={(value: any) => {
            //                 setFilters({ ...filters, surveyId: value })
            //             }}
            //         />
            //     )
            // }
            // if (filtersMore.organizationId) {
            //     return (
            //         <ClusterSurveyReport
            //             selectedId={filtersMore?.clusterId}
            //             surveyName={filtersMore?.name}
            //             surveyId={filters?.surveyId || ''}
            //             setSurvey={(value) => {
            //                 setFilters({ ...filters, surveyId: value })
            //             }}
            //             organizationSelected={filters?.organizationId}
            //         />
            //     )
            // }
            // return (
            //     <OrganizationSurveyReport
            //         selectedId={filtersMore?.clusterId}
            //         surveyName={filtersMore?.name}
            //         organizationSelected={filters?.organizationId}
            //         setOrganizationSelected={(value) => {
            //             setFilters({ ...filters, organizationId: value })
            //         }}
            //     />
            // )
        }
        return
    }, [filters, selectedItem])
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
                    </Flex>
                    {/* <Button onClick={hanleSearchReport} type="primary">
                        Tìm kiếm
                    </Button> */}
                </Flex>
            </Col>
            <Col span={6}>
                <Tree
                    showIcon
                    selectedKeys={selectedKeys}
                    treeData={treeData}
                    className="w-full mb-3"
                    onSelect={(key, info) => {
                        setSelectedKeys(key)
                        setSelectedItem(info.node)
                    }}
                />
            </Col>

            <Col span={18}>{items}</Col>
        </Row>
    )
}
BaoCaoGiangVien.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
