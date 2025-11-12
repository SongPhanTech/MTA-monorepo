import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useGetSurveyObjects } from '@workspace/libs/api/exam'
import { useAbility } from '@workspace/permissions/hooks'
import { Button, Col, Flex, Row, Tag } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

function DanhSachDoiTuong({ selectedId }: { selectedId: string }) {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        fullname: undefined,
        studentCode:undefined,
        lecturerCode: undefined,
        idCardNumber:undefined,
        phoneNumber: undefined,
        taken: undefined,
        fixedClassIds: undefined,
        trainingCourseIds: undefined,
        organization: undefined,
        isStudent: 'all'
    })
    const router = useRouter()

    const { data: res } = useGetSurveyObjects({
        limit: numberOfPages || DEFAULT_PAGINATE_SIZE,
        page: currentPage || 1,
        id: selectedId,
        fullname: filters.fullname,
        lecturerCode: filters.lecturerCode,
        studentCode: filters.studentCode,
        fixedClassIds: filters.fixedClassIds,
        trainingCourseIds: filters.trainingCourseIds,
        organizationId: filters.organization,
        taken: filters?.taken && filters?.taken?.length ===1 ? filters.taken[0] : undefined,
        isStudent: filters?.isStudent
    })

    const data = useMemo(() => {
        if (res?.status === 200) {
            return res?.data
        }
        return
    }, [res])


    return (
        <div>
            <Row gutter={[16, 4]}>
                <Col span={24}>
                    <Flex justify="end" gap={8} align="center">
                        <Button  onClick={()=>{

                        }} type='primary'>Xuất dữ liệu</Button>
                        <Button color="blue" onClick={()=>{
                            setFilters({...filters, isStudent: 'all'})
                        }} variant="solid">Tất cả</Button>
                        <Button color="purple" onClick={()=>{
                            setFilters({...filters, isStudent: 'student'})
                        }} variant="solid">Học viên</Button>
                             <Button color="pink" onClick={()=>{
                            setFilters({...filters, isStudent: 'lecturer'})
                        }} variant="solid">Giảng viên</Button>
                    </Flex>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey={'id'}
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã HV',
                                dataIndex: 'studentCode',
                                type:'input',
                                render: (_, record) => record?.educationAndTraining?.length>0?record?.educationAndTraining[0]?.code :'',
                            },
                               {
                                title: 'Mã GV',
                                dataIndex: 'lecturerCode',
                                type:'input',
                                render: (_, record) => record?.lecturer?.code || '',
                            },
                            {
                                title: 'Người làm khảo sát',
                                dataIndex: 'fullname',
                                type:'input',
                                render: (_, record) => {
                                    return `${record?.lastName || ''} ${record?.firstName || ''}`
                                },
                            },
                            {
                                title: 'CCCD',
                                dataIndex: 'idCardNumber',
                                type:'input',
                                render: (_, record) => record?.idCardNumber || '',
                            },
                            {
                                title: 'SĐT',
                                dataIndex: 'phoneNumber',
                                type:'input',
                                render: (_, record) => record?.phoneNumber || '',
                            },
                            // {
                            //     title: 'Đối tượng',
                            //     render: (_, record) => record?.lecturer ?'Giảng viên':'Học viên',
                            // },

                               {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organizationId',
                                type:'select',
                                options:[],
                                render: (_, record) => record?.lecturer?.organization?.sTen || '',
                            },
                              {
                                title: 'Lớp quản lý',
                                dataIndex: 'fixedClassIds',
                                type:'select',
                                options:[],
                                render: (_, record) => record?.educationAndTraining?.length>0  ?`${record?.educationAndTraining[0]?.fixedClass?.code}-${record?.educationAndTraining[0]?.fixedClass?.name}` :"",
                            },
                            {
                                title: 'Khoá',
                                dataIndex: 'trainingCourseIds',
                                type:'select',
                                options:[],
                                render: (_, record) => record?.educationAndTraining?.length>0  ?`${record?.educationAndTraining[0]?.fixedClass?.trainingCourse?.name ||''}` :"",
                            },
                            {
                                title: 'Trạng thái KS',
                                dataIndex: 'taken',
                                align: 'center',
                                type:'select',
                                options: [
                                  {
                                    value: true,
                                    label: 'Đã làm',
                                  }  ,
                                  {
                                    value: false,
                                    label: 'Chưa làm',
                                  },
                                ],
                                render: (_, record) => {
                                    return (
                                        <Tag color={record?.surveySession ? 'green' : 'red'}>
                                            {record?.surveySession ? 'Đã làm' : 'Chưa làm'}
                                        </Tag>
                                    )
                                },
                            },
                        ]}
                        data={data?.data || []}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: data?.count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

export default DanhSachDoiTuong
