import { CameraFilled, UserOutlined } from '@ant-design/icons'
import HocHamForm from '@components/modal/quan-ly-ho-so/form/hoc-ham'
import HocViForm from '@components/modal/quan-ly-ho-so/form/hoc-vi'
import ThongTinCoBan from '@components/modal/quan-ly-ho-so/form/thong-tin-co-ban'
import ThongTinThanNhanForm from '@components/modal/quan-ly-ho-so/form/thong-tin-than-nhan'
import TrinhDoLyLuanChinhTriForm from '@components/modal/quan-ly-ho-so/form/trinh-do-ly-luan-chinh-tri'
import CreateLayout from '@layouts/create-layout'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Flex, Form, Input, Upload, type UploadFile, type UploadProps } from 'antd'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import './index.css'
import ImgCrop from 'antd-img-crop'
export default function CreateUserPage() {
    const [search, setSearch] = useState<string>('')
    const [activeKey, setActiveKey] = useState('thongTinCoBan')
    const [avatar, setAvatar] = useState<UploadFile[]>([])
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const router = useRouter()
    const listTabs = [
        {
            title: 'Thông tin cơ bản',
            id: 'thongTinCoBan',
            render: <ThongTinCoBan />,
        },
        {
            title: 'Thông tin liên hệ',
            id: 'thongTinLienHe',
        },
        {
            title: 'Thông tin thân nhân',
            id: 'thongTinThanNhan',
            render: <ThongTinThanNhanForm />,
        },
        {
            title: 'Học vị',
            id: 'hocVi',
            render: <HocViForm />,
        },
        {
            title: 'Học hàm',
            id: 'hocHam',
            render: <HocHamForm />,
        },
        {
            title: 'Trình độ lý luận chính trị',
            id: 'trinhDoLyLuanChinhTri',
            render: <TrinhDoLyLuanChinhTriForm />,
        },
        {
            title: 'Quá trình công tác',
            id: 'quaTrinhCongTac',
        },
        {
            title: 'Khen thưởng - kỷ luật',
            id: 'khenThuongKyLuat',
        },
        {
            title: 'Đối tượng chính sách',
            id: 'doiTuongChinhSach',
        },
        {
            title: 'Kê khai tài sản',
            id: 'keKhaiTaiSan',
        },
    ]
    const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1))
    }

    const listTabsRender = useMemo(() => {
        return (
            listTabs.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())) || []
        )
    }, [search])

    return (
        <div>
            <Flex justify="space-between" className="p-4">
                <div className="text-xl font-semibold">Thêm hồ sơ</div>
                <Flex justify="end">
                    <Button
                        className="mr-3"
                        onClick={() => {
                            router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO)
                        }}
                    >
                        Hủy
                    </Button>
                    <Button type="primary">Lưu</Button>
                </Flex>
            </Flex>
            <Flex justify="space-between" className="w-full h-[calc(100vh-175px)]">
                <div className="bg-white rounded-lg shadow h-full overflow-y-auto w-[250px]">
                    <div className="p-4">
                        <Input
                            id="search"
                            className="w-full"
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm ..."
                        />
                    </div>

                    {listTabsRender.length && (
                        <div className="mt-2">
                            {listTabsRender.map((item) => (
                                <div
                                    className="relative cursor-pointer mb-2 px-5 py-2 hover:bg-gray-100"
                                    key={item.id}
                                    onClick={() => setActiveKey(item.id)}
                                >
                                    {activeKey === item.id && (
                                        <div className="bg-primary absolute top-0 left-0 h-full w-[3px]" />
                                    )}
                                    <div
                                        className={
                                            activeKey === item.id ? 'text-primary font-[500]' : ''
                                        }
                                    >
                                        {item.title}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="h-full overflow-y-auto w-[calc(100%-266px)] ">
                    <div className="p-6 shadow rounded-lg bg-white mb-4">
                        <Form.Item name={'file'} className="mb-0">
                            <ImgCrop rotationSlider>
                                <Upload
                                    listType="picture-circle"
                                    maxCount={1}
                                    fileList={avatar?.length > 0 ? avatar : fileList}
                                    onChange={onChange}
                                    onRemove={() => {
                                        setAvatar([])
                                    }}
                                    className="!w-[64px] !h-[64px] avatar-upload"
                                >
                                    {avatar?.length > 0 || fileList.length > 0
                                        ? ''
                                        : fileList.length < 1 && (
                                              <div className="relative flex items-center justify-center">
                                                  <UserOutlined
                                                      style={{ fontSize: '20px', color: '#686C7B' }}
                                                  />
                                                  <div className="absolute bottom-[-24px] right-[-24px] w-[24px] h-[24px] rounded-[50%] bg-[#e0e0e0]">
                                                      <CameraFilled style={{ color: '#686C7B' }} />
                                                  </div>
                                              </div>
                                          )}
                                </Upload>
                            </ImgCrop>
                        </Form.Item>
                    </div>
                    <div className="p-6 shadow rounded-lg bg-white form-userprofile">
                        {listTabs.map((i) => {
                            return i?.render || ''
                        })}
                    </div>
                </div>
            </Flex>
        </div>
    )
}

CreateUserPage.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <CreateLayout
            breadcrumbList={[
                { title: 'Quản lý hồ sơ', href: '/quan-ly-ho-so' },
                { title: 'Tạo mới' },
            ]}
        >
            {page}
        </CreateLayout>
    )
}
