
import DefaultLayout from '@layouts/default-layout'
import { Checkbox, Col, Input, Row,Tabs } from 'antd'
import ClassSubject from '@/components/sub-pages/danh-sach-lop-mon-hoc'
import {useState,useMemo, useCallback} from 'react'
import { useFindUniqueSubjectClass } from '@workspace/db/hooks'
import { formatDate } from '@lib/utils'
import dayjs from 'dayjs'
import DiemQuaTrinh from '@components/sub-pages/diem-qua-trinh'

export default function SubjectClassScore() {
    const [activeKey, setActiveKey] = useState('1')
     const [selectedRowKeys, setSelectedRowKeys] = useState<string>('')
        const {data,refetch}= useFindUniqueSubjectClass({
        where: {
            id: selectedRowKeys
        },
        include: {
           mainLecturer:{
               include: {
                   userProfile: true
               }
           },
           subject:{
            include:{
                managementOrganization: true
            }
           },
              subjectClassStudent: {
                    include: {
                        student: {
                            include: {
                                userProfile: true,
                                fixedClass: {
                                    include: {
                                        trainingCourse: true,
                                    },
                                },
                            },
                        },
                    },
                },
        }
    },{
        enabled: !!selectedRowKeys,refetchOnWindowFocus: false,
    })
    const items = useMemo(() => {
        return [
            {
                label: 'Danh sách lớp môn học',
                key: '1',
                children: <ClassSubject selectedRowKeys={selectedRowKeys} setSelectedRowKeys={(value:string)=>{setSelectedRowKeys(value)}} />,
            },
            {
                label: 'Nhập điểm quá trình',
                key: '2',
                children: <DiemQuaTrinh dataDetailSubjectClass={data} refetchSubjectClass={refetch} subjectClassId={selectedRowKeys} />,
                disabled: !selectedRowKeys
            },
        ]
    },[selectedRowKeys])

 

    const reasonDate=useCallback(()=>{
        if(data?.scoreDeadLineStart || data?.scoreDeadline){
            if(dayjs()?.isAfter(data?.scoreDeadline) && !data?.enteredScore){
                return <Input className="bg-red-600 text-white" placeholder='Hạn nhập điểm' disabled value={`Ngoài hạn nhập điểm quá trình, ${formatDate(data?.scoreDeadLineStart ||'')} đến ${formatDate(data?.scoreDeadline ||'')}`}/>
            }
                return <Input placeholder='Hạn nhập điểm' disabled value={`${data?.scoreDeadLineStart &&formatDate(data?.scoreDeadLineStart)} đến ${data?.scoreDeadline&&formatDate(data?.scoreDeadline ||'')}`} />
        }
        return <Input placeholder='Hạn nhập điểm' disabled />
    },[data])

    return <Row gutter={[16,16]}>
            <Col span={12} >
                <div className="flex items-center mb-3 w-full">
                    <div className="min-w-[150px] w-[150px]">Lớp môn học:</div>
                    <div className="w-[300px]">
                        <Input placeholder='Mã lớp MH' disabled value={data?.code}/>
                    </div>
                     <div className="ml-3 w-full">
                        <Input placeholder='Tên lớp MH' disabled value={data?.name}/>
                    </div>
                </div>
                      <div className="flex items-center mb-3 w-full">
                    <div className="min-w-[150px] w-[150px]">Giảng viên:</div>
                    <div className="w-full">
                        <Input className="w-full" placeholder='Giảng viên' disabled value={data?.mainLecturer?`${data?.mainLecturer?.userProfile?.lastName} ${data?.mainLecturer?.userProfile?.firstName}`:''}/>
                    </div>
                </div>
                          <div className="flex items-center w-full">
                    <div className="min-w-[150px] w-[150px]">Đơn vị quản lý</div>
                    <div className="w-full">
                        <Input className="w-full" placeholder='Giảng viên' disabled value={data?.subject?.managementOrganization? `${data?.subject?.managementOrganization?.sMa} - ${data?.subject?.managementOrganization?.sTen}` :''}/>
                    </div>
                </div>
            </Col>

        <Col span={12} >
                <div className="flex items-center mb-3 w-full">
                    <div className="min-w-[150px] w-[150px]">Hạn nhập điểm</div>
                     <div className="w-full">
                        {reasonDate()}
                    </div>
                </div>
                      <div className="flex items-center mb-3 w-full">
                    <div className="flex items-center mr-9 ">
                        <Checkbox disabled checked={data?.scoreSubmitted}/>
                        <span className='ml-2 opacity-[0.5] w-[160px]'>P13 đã nhận phiếu điểm</span>
                    </div>
                        <div className="flex items-center w-full">
                        <Checkbox disabled checked={data?.isLockScore}/>
                        <span className='ml-2 opacity-[0.5] w-[160px]'>P13 đã khoá</span>
                        <div className="w-full">
                             <Input disabled/>
                        </div>
                    </div>
                </div>
                                      <div className="flex items-center mb-3 w-full">
                        <div className="flex items-center w-full">
                       <Checkbox disabled checked={data?.scoreChecked}/>
                        <span className='ml-2 opacity-[0.5] w-[300px]'>P2/P7 kiểm tra lại phiếu điểm</span>
                        <div className="w-full">
                             <Input disabled />
                        </div>
                    </div>
                </div>
                
            </Col>
        <Col span={24}>
             <Tabs
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key)}
                items={items}
            />
        </Col>
    </Row>
}



SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
