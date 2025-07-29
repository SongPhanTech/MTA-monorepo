import { CameraFilled, UserOutlined } from '@ant-design/icons'
import HocHamForm from '@components/modal/quan-ly-ho-so/form/hoc-ham'
import HocViForm from '@components/modal/quan-ly-ho-so/form/hoc-vi'
import ThongTinCoBan from '@components/modal/quan-ly-ho-so/form/thong-tin-co-ban'
import ThongTinThanNhanForm from '@components/modal/quan-ly-ho-so/form/thong-tin-than-nhan'
import TrinhDoLyLuanChinhTriForm from '@components/modal/quan-ly-ho-so/form/trinh-do-ly-luan-chinh-tri'
import { ROUTER_PATH } from '@workspace/router'
import {
    Button,
    Flex,
    Form,
    type GetProp,
    Input,
    message,
    Upload,
    type UploadFile,
    type UploadProps,
} from 'antd'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './tao-moi/index.css'
import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import BoiDuongQuocPhongAnNinhForm from '@components/modal/quan-ly-ho-so/form/boi-duong-quoc-phong-an-ninh'
import CapBacForm from '@components/modal/quan-ly-ho-so/form/cap-bac'
import DoanDang from '@components/modal/quan-ly-ho-so/form/doan-dang'
import DoiTuongChinhSachForm from '@components/modal/quan-ly-ho-so/form/doi-tuong-chinh-sach'
import KeKhaiTaiSanForm from '@components/modal/quan-ly-ho-so/form/ke-khai-taI-san'
import NgoaiNguForm from '@components/modal/quan-ly-ho-so/form/ngoai-ngu'
import QuaTrinhCongTacForm from '@components/modal/quan-ly-ho-so/form/qua-trinh-cong-tac'
import QuaTrinhCuDiCongTacForm from '@components/modal/quan-ly-ho-so/form/qua-trinh-cu-di-cong-tac'
import QuaTrinhDiDaoTaoBoiDuongForm from '@components/modal/quan-ly-ho-so/form/qua-trinh-di-dao-tao-boi-duong'
import ThongTinKhenThuongForm from '@components/modal/quan-ly-ho-so/form/thong-tin-khen-thuong'
import ThongTinKyLuatForm from '@components/modal/quan-ly-ho-so/form/thong-tin-ky-luat'
import ThongTinLienHe from '@components/modal/quan-ly-ho-so/form/thong-tin-lien-he'
import TinHocForm from '@components/modal/quan-ly-ho-so/form/tin-hoc'
import TrinhDoQuanLyNhaNuocForm from '@components/modal/quan-ly-ho-so/form/trinh-do-quan-ly-nha-nuoc'
import useSpinner from '@hooks/spinner'
import CreateLayout from '@layouts/create-layout'
import { emptyObjectIf, getMinioUrl } from '@workspace/constant'
import type { Prisma } from '@workspace/db'
import { useFindUniqueUserProfile, useUpdateUserProfile } from '@workspace/db/hooks'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import { diffArrays } from '@workspace/libs/utils'
import ImgCrop from 'antd-img-crop'
import dayjs from 'dayjs'

dayjs.locale('vi')
interface itemType {
    id: string
    render?: JSX.Element
    title: string
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

export type SubmitForm = Prisma.UserProfileGetPayload<{
    include: {
        tinHoc: true
        hocVi: true
        hocHam: true
        trinhDoLyLuanChinhTri: true
        trinhDoQuanLyHanhChinh: true
        trinhDoQuanLyNhaNuoc: true
        ngoaiNgu: true
        boiDuongQuocPhongAnNinh: true
        capBac: true
        doanDang: true
        doiTuongChinhSach: true
        keKhaiTaiSan: true
        quaTrinhCongTac: true
        quaTrinhCuDiCongTac: true
        quaTrinhCuDiDaoTao: true
        khenThuong: true
        kyLuat: true
        relatives: true
    }
}> & {
    file?: FileType
}
export default function UpdateUserPage() {
    const router = useRouter()
    const cccd = router.query.id as string
    const [form] = Form.useForm<SubmitForm>()
    const [search, setSearch] = useState<string>('')
    const [activeKey, setActiveKey] = useState('thongTinCoBan')
    const [expland, setExpland] = useState<string[]>(['thongTinCoBan', 'thongTinLienHe'])

    const [fileList, setFileList] = useState<UploadFile[]>([])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    const listTabs: itemType[] = useMemo(() => {
        return [
            {
                title: 'Thông tin cơ bản',
                id: 'thongTinCoBan',
                render: <ThongTinCoBan expland={expland} setExpland={setExpland} />,
            },
            {
                title: 'Thông tin liên hệ',
                id: 'thongTinLienHe',
                render: <ThongTinLienHe expland={expland} setExpland={setExpland} />,
            },
            {
                title: 'Đoàn - Đảng',
                id: 'DoanDang',
                render: <DoanDang expland={expland} setExpland={setExpland} />,
            },
            {
                title: 'Thông tin thân nhân',
                id: 'thongTinThanNhan',
                render: (
                    <Form.Item name="relatives">
                        <ThongTinThanNhanForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Học vị',
                id: 'hocVi',
                render: (
                    <Form.Item name="hocVi">
                        <HocViForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Học hàm',
                id: 'hocHam',
                render: (
                    <Form.Item name="hocHam">
                        <HocHamForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Trình độ lý luận chính trị',
                id: 'trinhDoLyLuanChinhTri',
                render: (
                    <Form.Item name="trinhDoLyLuanChinhTri">
                        <TrinhDoLyLuanChinhTriForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            // {
            //     title: 'Trình độ quản lý hành chính',
            //     id: 'trinhDoQuanLyHanhChinh',
            //     render: <TrinhDoQuanLyHanhChinhForm expland={expland} setExpland={setExpland} />,
            // },
            {
                title: 'Trình độ quản lý nhà nước',
                id: 'trinhDoQuanLyNhaNuoc',
                render: (
                    <Form.Item name="trinhDoQuanLyNhaNuoc">
                        <TrinhDoQuanLyNhaNuocForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Ngoại ngữ',
                id: 'ngoaiNgu',
                render: (
                    <Form.Item name="ngoaiNgu">
                        <NgoaiNguForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Tin học',
                id: 'tinHoc',
                render: (
                    <Form.Item name="tinHoc">
                        <TinHocForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Bồi dưỡng quốc phòng an ninh',
                id: 'boiDuongQuocPhongAnNinh',
                render: (
                    <Form.Item name="boiDuongQuocPhongAnNinh">
                        <BoiDuongQuocPhongAnNinhForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Cấp bậc',
                id: 'capBac',
                render: (
                    <Form.Item name="capBac">
                        <CapBacForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Quá trình công tác',
                id: 'quaTrinhCongTac',
                render: (
                    <Form.Item name="quaTrinhCongTac">
                        <QuaTrinhCongTacForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Quá trình được cử đi công tác',
                id: 'quaTrinhDuocCuDiCongTac',
                render: (
                    <Form.Item name="quaTrinhCuDiCongTac">
                        <QuaTrinhCuDiCongTacForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Quá trình được cử đi đào tạo bồi dưỡng',
                id: 'quaTrinhDiDaoTaoBoiDuong',
                render: (
                    <Form.Item name="quaTrinhCuDiDaoTao">
                        <QuaTrinhDiDaoTaoBoiDuongForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Khen thưởng',
                id: 'khenThuong',
                render: (
                    <Form.Item name="khenThuong">
                        <ThongTinKhenThuongForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Kỷ luật',
                id: 'kyLuat',
                render: (
                    <Form.Item name="kyLuat">
                        <ThongTinKyLuatForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Đối tượng chính sách',
                id: 'doiTuongChinhSach',
                render: (
                    <Form.Item name="doiTuongChinhSach">
                        <DoiTuongChinhSachForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
            {
                title: 'Kê khai tài sản',
                id: 'keKhaiTaiSan',
                render: (
                    <Form.Item name="keKhaiTaiSan">
                        <KeKhaiTaiSanForm expland={expland} setExpland={setExpland} />
                    </Form.Item>
                ),
            },
        ]
    }, [expland])

    const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1))
    }

    const handleScroll = (item: itemType) => {
        setActiveKey(item.id)
        setExpland([...expland, item.id])
        const el = document.getElementById(item.id)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
    }

    const listTabsRender = useMemo(() => {
        return (
            listTabs.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())) || []
        )
    }, [search, listTabs.filter])

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()

    // const mappingData = (arrA: any[], arrB: any[]) => {
    //     const { onlyInA: onlyInNew, onlyInB: onlyInOld } = diffArrays(arrA, arrB)
    //     return
    // }

    const handleSubmit = async (values: SubmitForm) => {
        if (!values) return
        const fileName = values.avatar
        if (fileList.length > 0) {
            const file = fileList[0]
            const resPresignedUrl = await generatePresignedUrl({
                path: 'avatar',
                extension: file.name?.split('.').pop() ?? '',
            })

            await fetch(resPresignedUrl.data.url, {
                method: 'PUT',
                body: file.originFileObj,
            })

            form.setFieldsValue({
                avatar: resPresignedUrl.data.fileName,
            })
        }
        try {
            showSpinner()
            console.log('values', values, cccdUserProfileData?.hocVi)
            const item = diffArrays(
                cccdUserProfileData?.hocVi.length ? cccdUserProfileData?.hocVi : [],
                values.hocVi,
                'id'
            )
            console.log('item', item)

            await updateUserProfile({
                where: {
                    idCardNumber: cccd,
                },
                data: {
                    ...values,
                    dateOfBirth: values.dateOfBirth
                        ? dayjs(values.dateOfBirth).toISOString()
                        : null,
                    idCardDate: values.idCardDate ? dayjs(values.idCardDate).toISOString() : null,
                    unionDate: values.unionDate ? dayjs(values.unionDate).toISOString() : null,
                    CPVJoinDate: values.CPVJoinDate
                        ? dayjs(values.CPVJoinDate).toISOString()
                        : null,
                    officialCPVDate: values.officialCPVDate
                        ? dayjs(values.officialCPVDate).toISOString()
                        : null,
                    tenureDate: values.tenureDate ? dayjs(values.tenureDate).toISOString() : null,
                    avatar: fileName,
                    ...emptyObjectIf(
                        {
                            hocVi: {
                                ...emptyObjectIf(
                                    {
                                        deleteMany: {
                                            id: {
                                                in: cccdUserProfileData?.hocVi.map(
                                                    (item) => item.id
                                                ),
                                            },
                                        },
                                    },
                                    item.onlyInA.length > 0
                                ),
                                ...emptyObjectIf(
                                    {
                                        createMany: {
                                            data: values.hocVi,
                                            skipDuplicates: true,
                                        },
                                    },
                                    item.onlyInB.length > 0
                                ),
                            },
                        },

                        !!values.hocVi
                    ),
                    ...emptyObjectIf(
                        {
                            hocHam: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.hocHam.map((item) => item.id),
                                    },
                                },
                                createMany: {
                                    data: values.hocHam?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.hocHam
                    ),
                    ...emptyObjectIf(
                        {
                            relatives: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.relatives.map((item) => item.id),
                                    },
                                },
                                createMany: {
                                    data: values.relatives?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.relatives
                    ),
                    ...emptyObjectIf(
                        {
                            trinhDoLyLuanChinhTri: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.trinhDoLyLuanChinhTri.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.trinhDoLyLuanChinhTri?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.trinhDoLyLuanChinhTri
                    ),
                    ...emptyObjectIf(
                        {
                            trinhDoQuanLyNhaNuoc: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.trinhDoQuanLyNhaNuoc.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.trinhDoQuanLyNhaNuoc?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.trinhDoQuanLyNhaNuoc
                    ),
                    ...emptyObjectIf(
                        {
                            ngoaiNgu: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.ngoaiNgu.map((item) => item.id),
                                    },
                                },
                                createMany: {
                                    data: values.ngoaiNgu?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.ngoaiNgu
                    ),
                    ...emptyObjectIf(
                        {
                            boiDuongQuocPhongAnNinh: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.boiDuongQuocPhongAnNinh.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.boiDuongQuocPhongAnNinh?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.boiDuongQuocPhongAnNinh
                    ),
                    ...emptyObjectIf(
                        {
                            capBac: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.capBac.map((item) => item.id),
                                    },
                                },
                                createMany: {
                                    data: values.capBac?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.capBac
                    ),
                    ...emptyObjectIf(
                        {
                            quaTrinhCongTac: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.quaTrinhCongTac.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.quaTrinhCongTac?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },

                        !!values.quaTrinhCongTac
                    ),
                    ...emptyObjectIf(
                        {
                            quaTrinhCuDiCongTac: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.quaTrinhCuDiCongTac.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.quaTrinhCuDiCongTac?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },
                        !!values.quaTrinhCuDiCongTac
                    ),
                    ...emptyObjectIf(
                        {
                            quaTrinhCuDiDaoTao: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.quaTrinhCuDiDaoTao.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.quaTrinhCuDiDaoTao?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },
                        !!values.quaTrinhCuDiDaoTao
                    ),
                    ...emptyObjectIf(
                        {
                            khenThuong: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.khenThuong.map((item) => item.id),
                                    },
                                },
                                createMany: {
                                    data: values.khenThuong?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },
                        !!values.khenThuong
                    ),
                    ...emptyObjectIf(
                        {
                            kyLuat: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.kyLuat.map((item) => item.id),
                                    },
                                },
                                createMany: {
                                    data: values.kyLuat?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },
                        !!values.kyLuat
                    ),
                    ...emptyObjectIf(
                        {
                            doiTuongChinhSach: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.doiTuongChinhSach.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.doiTuongChinhSach?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },
                        !!values.doiTuongChinhSach
                    ),
                    ...emptyObjectIf(
                        {
                            keKhaiTaiSan: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.keKhaiTaiSan.map(
                                            (item) => item.id
                                        ),
                                    },
                                },
                                createMany: {
                                    data: values.keKhaiTaiSan?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },
                        !!values.keKhaiTaiSan
                    ),
                    ...emptyObjectIf(
                        {
                            tinHoc: {
                                deleteMany: {
                                    id: {
                                        in: cccdUserProfileData?.tinHoc.map((item) => item.id),
                                    },
                                },
                                createMany: {
                                    data: values.tinHoc?.map((item) => ({
                                        ...item,
                                    })),
                                    skipDuplicates: true,
                                },
                            },
                        },
                        !!values.tinHoc
                    ),
                },
            })
            queryClient.invalidateQueries({
                queryKey: ['UserProfile'],
            })
            // router.push(ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO)
        } catch (error) {
            message.error('Đã có lỗi xảy ra, vui lòng thử lại sau')
        }
        hideSpinner()
    }

    const { data: cccdUserProfileData } = useFindUniqueUserProfile(
        {
            where: {
                idCardNumber: cccd,
            },
            include: {
                nationality: true,
                religion: true,
                ethnicity: true,
                rank: true,
                academicDegreeType: true,
                academicRankType: true,
                level: true,
                tinHoc: true,
                hocVi: true,
                hocHam: true,
                trinhDoLyLuanChinhTri: true,
                trinhDoQuanLyNhaNuoc: true,
                ngoaiNgu: true,
                boiDuongQuocPhongAnNinh: true,
                capBac: true,
                doiTuongChinhSach: true,
                keKhaiTaiSan: true,
                khenThuong: true,
                kyLuat: true,
                quaTrinhCongTac: true,
                quaTrinhCuDiCongTac: true,
                quaTrinhCuDiDaoTao: true,
                relatives: true,
            },
        },
        {
            enabled: !!cccd,
        }
    )

    // Hàm fill thông tin từ dữ liệu cccdUserProfileData
    const fillUserInfo = useCallback(
        (userData: any) => {
            if (!userData) return
            // Fill thông tin cơ bản từ UserProfile
            form.setFieldsValue({
                ...userData,
                dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : null,
                idCardDate: userData.idCardDate ? dayjs(userData.idCardDate) : null,
                idCardExpirationDate: userData.idCardExpirationDate
                    ? dayjs(userData.idCardExpirationDate)
                    : null,
                // Thông tin cá nhân khác
                unionDate: userData.unionDate ? dayjs(userData.unionDate) : null,
                CPVJoinDate: userData.CPVJoinDate ? dayjs(userData.CPVJoinDate) : null,
                officialCPVDate: userData.officialCPVDate ? dayjs(userData.officialCPVDate) : null,
                tenureDate: userData.tenureDate ? dayjs(userData.tenureDate) : null,
            })
        },
        [form]
    )

    const avatar = Form.useWatch('avatar', form)
    const fileListValue = useMemo(() => {
        if (avatar) {
            const avatarFile: UploadFile = {
                uid: '-1',
                name: 'avatar.jpg',
                status: 'done',
                url: getMinioUrl(avatar), // Sử dụng getMinioUrl để tạo URL hiển thị
            }
            return [avatarFile]
        }
    }, [avatar])

    // Effect để fill thông tin khi có dữ liệu từ API
    useEffect(() => {
        if (cccdUserProfileData) {
            fillUserInfo(cccdUserProfileData)
        }
    }, [cccdUserProfileData, fillUserInfo])

    return (
        <Form form={form} onFinish={handleSubmit}>
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
                        <Button type="primary" htmlType="submit">
                            Lưu
                        </Button>
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

                        {listTabsRender.length ? (
                            <div className="mt-2">
                                {listTabsRender.map((item) => (
                                    <div
                                        className="relative cursor-pointer mb-2 px-5 py-2 hover:bg-gray-100"
                                        key={item.id}
                                        onClick={() => handleScroll(item)}
                                    >
                                        {activeKey === item.id && (
                                            <div className="bg-primary absolute top-0 left-0 h-full w-[3px]" />
                                        )}
                                        <div
                                            className={
                                                activeKey === item.id
                                                    ? 'text-primary font-[500]'
                                                    : ''
                                            }
                                        >
                                            {item.title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4">Không tìm thấy kết quả</div>
                        )}
                    </div>
                    <div className="h-full overflow-y-auto w-[calc(100%-266px)] ">
                        <div className="p-6 shadow rounded-lg bg-white mb-4">
                            <FormItem name="avatar" form={form} className="mb-0 relative">
                                <ImgCrop rotationSlider>
                                    <Upload
                                        listType="picture-circle"
                                        maxCount={1}
                                        fileList={avatar ? fileListValue : fileList}
                                        onChange={onChange}
                                        onRemove={() => {
                                            setFileList([])
                                            form.setFieldValue('avatar', null)
                                        }}
                                        showUploadList={{
                                            showPreviewIcon: false,
                                        }}
                                        className="avatar-upload "
                                    >
                                        {fileList.length > 0
                                            ? ''
                                            : fileList.length < 1 && (
                                                  <div className="relative flex items-center justify-center">
                                                      <UserOutlined
                                                          style={{
                                                              fontSize: '20px',
                                                              color: '#686C7B',
                                                          }}
                                                      />
                                                  </div>
                                              )}
                                    </Upload>
                                </ImgCrop>
                                <div className="absolute bottom-[0px] left-[52px] w-[24px] h-[24px] rounded-[50%] bg-[#e0e0e0] flex items-center justify-center">
                                    <CameraFilled style={{ color: '#686C7B' }} />
                                </div>
                            </FormItem>
                        </div>
                        <div className="p-6 shadow rounded-lg bg-white form-userprofile">
                            {listTabs.map((i) => {
                                return (
                                    <div key={i.id} id={i.id}>
                                        {i?.render}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Flex>
            </div>
        </Form>
    )
}

UpdateUserPage.getLayout = function getLayout(page: React.ReactElement) {
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
