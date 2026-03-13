import { FolderOpenOutlined, UserOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import SurveylecturerReport from '@components/sub-pages/khao-sat/survey-lecturer-report'
import SurveyOrganizationReport from '@components/sub-pages/khao-sat/survey-oragation-report'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindManyClusterSurvey,
    useFindManyDM_DonVi,
    useFindManyLecturer,
    useFindUniqueTrainingObjectType,
} from '@workspace/db/hooks'
// import OrganizationSurveyReport from '@/components/sub-pages/khao-sat/bao-cao-don-vi'
// import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum'
// import LecturerSurveyReport from '@components/sub-pages/khao-sat/bao-cao-giang-vien'
// import SurveyReport from '@components/sub-pages/khao-sat/bao-cao'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Flex, Row, Skeleton, Tree } from 'antd'
import { useMemo, useState } from 'react'
// import ClusterSurveyReport from '@components/sub-pages/khao-sat/bao-cao-cum';
import OrganizationSurveyReport from '@/components/sub-pages/khao-sat/bao-cao-don-vi'

function buildOrgAndLectureTree(
    list: Array<any>,
    lecturers: Array<any>,
    parentId: string | null = null
): Array<any> {
    return list
        .filter((item) => (item.parentId ?? null) === parentId)
        .map((item) => ({
            ...item,
            parent: list.find((p) => p.id === item.parentId),
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
                        icon: <UserOutlined />,
                        parent: item,
                    })),
                ...buildOrgAndLectureTree(list, lecturers, item.id),
            ],
        }))
}

export default function BaoCaoGiangVien() {
    const [filters, setFilters] = useState<any>({
        name: '',
        surveyName: '',
        surveyId: undefined,
        lectureId: undefined,
        organizationId: undefined,
        semesterIds: undefined,
        clusterId: undefined,
    })
    const [searchText, setSearchText] = useState<any>('')
    const [selectedKeys, setSelectedKeys] = useState<any>([])
    const [selectedItem, setSelectedItem] = useState<any>()

    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

    const { data: trainingObjectType } = useFindUniqueTrainingObjectType(
        {
            where: { id: trainingObjectTypeId },
            select: { name: true },
        },
        {
            enabled: !!trainingObjectTypeId,
        }
    )
    const trainingObjectTypeName = useMemo(
        () => trainingObjectType?.name ?? '',
        [trainingObjectType]
    )

    const { data = [], refetch } = useFindManyClusterSurvey({
        where: {
            surveys: {
                some: {
                    semesterId,
                    trainingObjectTypeId,
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
        isFetching,
        error: organizationsError,
    } = useFindManyDM_DonVi(
        {
            where: {
                // ...(searchText && {
                //     OR: [
                //         { sTen: { contains: searchText, mode: 'insensitive' } },
                //         { sMa: { contains: searchText, mode: 'insensitive' } },
                //     ],
                // }),
                OR: [
                    {
                        iCapDonVi: 0,
                        iLoaiDonVi: 0,
                    },
                    {
                        iLoaiDonVi: {
                            in: [5, 6, 7],
                        },
                    },
                ],
            },
            select: {
                Id: true,
                sMa: true,
                sTen: true,
                bActive: true,
                iCapDonVi: true,
                iDictionaryKey: true,
                iLoaiDonVi: true,
                iNhomDonVi: true,
                sParentId: true,
            },
             orderBy: { iSTT: 'desc' }
        },

        {
            refetchOnWindowFocus: false,
        }
    )

    const { data: lecturerData = [] } = useFindManyLecturer(
        {
            where: {
                // ...(searchText && {
                //     userProfile: {
                //         OR: [
                //             { fullName: { contains: searchText, mode: 'insensitive' } },
                //             { code: { contains: searchText, mode: 'insensitive' } },
                //         ],
                //     },
                // }),
                mainSubjectClasses: {
                    some: {
                        ...(!!trainingObjectTypeId && { trainingObjectTypeId }),
                    },
                },
                organization: {
                    OR: [
                        {
                            iCapDonVi: 0,
                            iLoaiDonVi: 0,
                        },
                        {
                            iLoaiDonVi: {
                                in: [5, 6, 7],
                            },
                        },
                    ],
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
        },
        {
            refetchOnWindowFocus: false,
        }
    )

    const { data: lecturerActive = [] } = useFindManyLecturer(
        {
            where: {
                // ...(searchText && {
                //     userProfile: {
                //         OR: [
                //             { fullName: { contains: searchText, mode: 'insensitive' } },
                //             { code: { contains: searchText, mode: 'insensitive' } },
                //         ],
                //     },
                // }),
                mainSubjectClasses: {
                    some: {
                        ...(!!trainingObjectTypeId && { trainingObjectTypeId }),
                    },
                },
                clusterSurvey: {
                    some: {
                        id: filters.clusterId,
                    },
                },
                organization: {
                    OR: [
                        {
                            iCapDonVi: 0,
                            iLoaiDonVi: 0,
                        },
                        {
                            iLoaiDonVi: {
                                in: [5, 6, 7],
                            },
                        },
                    ],
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
        },
        {
            enabled: !!filters.clusterId,
            refetchOnWindowFocus: false,
        }
    )

    // Tạo treeData từ organizations và lecturers
    const treeData: any[] = useMemo(() => {
        if (!organizations.length || !lecturerData.length) return []
        // const treeData1 = buildDonViTree(organizations.map(i=>{return {...i,key:i.Id,title:i.sTen}}))

        // console.log(treeData1, '123')
        // return treeData1
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
                selectable: lecturerActive.some((i) => i.id === lec.id),
                organizationId: lec.organizationId,
                className: !lecturerActive.some((i) => i.id === lec.id)
                    ? 'tree-child-disabled'
                    : '',
            })),
            null
        )
    }, [organizations, lecturerData, lecturerActive])

    const hanleSearchReport = () => {}

    const items = useMemo(() => {
        if (!filters?.clusterId) {
            return <div className="my-10 text-center text-primary text-base">Chọn đợt khảo sát</div>
        }
        if (filters?.clusterId) {
            console.log(selectedItem, '123')

            if (
                selectedItem?.id &&
                selectedItem?.iCapDonVi === 0 &&
                selectedItem?.iLoaiDonVi === 0
            ) {
                return (
                    <OrganizationSurveyReport
                        selectedId={filters?.clusterId}
                        surveyName={filters?.surveyName}
                        organizationId={selectedItem?.id}
                        trainingObjectTypeName={trainingObjectTypeName}
                        semesterId={semesterId || ''}
                        trainingObjectTypeId={trainingObjectTypeId || ''}
                    />
                )
            }

            if (selectedItem?.id && selectedItem?.iCapDonVi && selectedItem?.iLoaiDonVi) {
                return (
                    <SurveyOrganizationReport
                        selectedId={filters.clusterId}
                        organizationId={selectedItem.id}
                        surveyName={filters?.surveyName}
                        trainingObjectTypeName={trainingObjectTypeName}
                        organizationName={
                            selectedItem.iCapDonVi === 3
                                ? selectedItem.parent?.sTen
                                : selectedItem.sTen
                        }
                        organizationCode={
                            selectedItem.iCapDonVi === 3
                                ? selectedItem.parent?.sMa
                                : selectedItem.sMa
                        }
                        departmentName={selectedItem.iCapDonVi === 3 ? selectedItem.sTen : ''}
                        departmentCode={selectedItem.iCapDonVi === 3 ? selectedItem.sMa : ''}
                    />
                )
            }

            if (selectedItem?.id && !selectedItem?.iCapDonVi) {
                const org = selectedItem.organization
                const isDepartment = org?.iCapDonVi === 3
                return (
                    <SurveylecturerReport
                        selectedId={filters?.clusterId}
                        lectureId={selectedItem?.id}
                        surveyName={filters?.surveyName}
                        trainingObjectTypeName={trainingObjectTypeName}
                        organizationName={isDepartment ? org.parent?.sTen : org?.sTen}
                        organizationCode={isDepartment ? org.parent?.sMa : org?.sMa}
                        lecturerName={selectedItem?.userProfile?.fullName}
                        lecturerCode={selectedItem?.code}
                        departmentName={isDepartment ? org?.sTen : ''}
                        departmentCode={isDepartment ? org?.sMa : ''}
                    />
                )
            }
            return <>Vui lòng chọn đối tượng</>
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
    }, [filters, selectedItem, trainingObjectTypeName])
    return (
        <Row gutter={[16, 4]}>
            <Col span={24}>
                <Flex justify="space-between">
                    <Flex>
                        <Select
                            onChange={(value, option: any) => {
                                setFilters((prev: any) => ({
                                    ...prev,
                                    clusterId: value,
                                    surveyName: option?.label,
                                }))
                            }}
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
                        {/* <Input
                            placeholder="Tìm kiếm"
                            className="mr-4 w-[250px]"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value)
                            }}
                        /> */}
                    </Flex>
                    {/* <Button onClick={hanleSearchReport} type="primary">
                        Tìm kiếm
                    </Button> */}
                </Flex>
            </Col>
            <Col span={6}>
                {isFetching ? (
                    <Skeleton />
                ) : (
                    <Tree
                        showIcon
                        selectedKeys={selectedKeys}
                        treeData={treeData}
                        className="w-full mb-3 min-w-[250px]"
                        onSelect={(key, info) => {
                            setSelectedKeys(key)
                            setSelectedItem(info.node)
                            // setFilters((prev: any) => ({
                            //     ...prev,
                            // }))
                            // console.log('selectedItem:', info.node)
                        }}
                    />
                )}
            </Col>

            <Col span={18} className="w-[calc(100%-250px)]">
                {isFetching ? <Skeleton /> : items}
            </Col>
        </Row>
    )
}
BaoCaoGiangVien.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
