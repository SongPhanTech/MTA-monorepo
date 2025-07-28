import { PrinterOutlined } from '@ant-design/icons'
import { GridBlock } from '@components/commons/grid-block'
import { useGenderOptions } from '@hooks/gender'
import { Gender } from '@workspace/db'
import { useFindUniqueStudent } from '@workspace/db/hooks'
import { Button, Input, Modal } from 'antd'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'
import { workHistoryData } from '@/utils/dataFake'

dayjs.locale('vi')

type ModalTomTatLyLichInput = {
    id: string
}

const ModalTomTatLyLich = () => {
    const formattedDate = `${dayjs().format('DD')}/${dayjs().format('MM')}/${dayjs().format('YYYY')}`
    const printRef = useRef<HTMLDivElement>(null)
    const [signerName, setSignerName] = useState('Đại úy Đào Văn Thắng')
    const { getGenderLabel } = useGenderOptions()

    const { isOpen, onClose, input } = useDisclosure<ModalTomTatLyLichInput>({
        tag: ModalTomTatLyLich.name,
    })

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
        @page {
            size: A4;
        }
        @media print {
            @page { margin: 1 1 1 1 !important; }
            body, html, #root {
                height: auto !important;
                overflow: visible !important;
            }
            .page {
                page-break-after: auto !important;
                break-after: auto !important;
                min-height: 297mm;
                width: 210mm;
                padding: 15mm;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
            }
        }
      `,
    })

    const { data: initialData } = useFindUniqueStudent(
        {
            where: {
                id: input?.id,
            },
            include: {
                userProfile: {
                    include: {
                        religion: true,
                        ethnicity: true,
                    },
                },
            },
        },
        { enabled: !!input?.id }
    )

    const Header = () => {
        return (
            <div className="flex flex-col page-1">
                <div className="uppercase text-lg font-bold flex w-full justify-center">
                    Bản tóm tắt lí lịch
                </div>
                <div className="flex justify-between items-center mb-2">
                    <img
                        src={initialData?.userProfile?.avatar || ''}
                        alt="avatar"
                        className="border border-solid border-black w-[113px] h-[151px]"
                    />

                    <div className="flex-1 pl-4">
                        <div className="mb-1">
                            <span className="font-bold">Họ tên khai sinh: </span>
                            <span className="font-bold uppercase">
                                {initialData?.userProfile?.fullname}
                            </span>
                            <span className="ml-4">
                                (Giới tính: {getGenderLabel(initialData?.userProfile?.gender)})
                            </span>
                        </div>
                        <div className="mb-1">
                            <span className="font-bold">Họ tên khác: </span>
                            <span>{initialData?.userProfile?.familyName || 'Không'}</span>
                        </div>
                        <div className="mb-1">Cấp bậc, hệ số lương, tháng năm: 1/ (08/2018)</div>
                    </div>
                </div>

                <div className="mt-2 flex">
                    <span className="font-medium">SH:</span>
                    <span className="ml-2 font-bold">
                        {initialData?.userProfile?.officerNumber}
                    </span>
                    <span className="flex-1 border-b border-dashed border-black" />
                </div>
            </div>
        )
    }

    const Muc1 = () => {
        return (
            <div className="flex flex-col">
                <div className="uppercase text-lg font-bold flex w-full justify-center">
                    I. Bản thân
                </div>
                <div className="flex flex-col">
                    <GridBlock
                        columns={3}
                        items={[
                            {
                                key: 'dob',
                                content: (
                                    <>
                                        Sinh ngày:{' '}
                                        {initialData?.userProfile?.dateOfBirth
                                            ? dayjs(initialData?.userProfile.dateOfBirth).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </>
                                ),
                            },
                            {
                                key: 'ethnicity',
                                content: <>Dân tộc: {initialData?.userProfile?.ethnicity?.sTen}</>,
                            },
                            {
                                key: 'religion',
                                content: (
                                    <>
                                        Tôn giáo:{' '}
                                        {initialData?.userProfile?.religion?.sTen || 'Không'}
                                    </>
                                ),
                            },
                        ]}
                    />

                    <span>Quê quán: </span>
                    <span>Nơi ở hiện nay: </span>
                    <GridBlock
                        columns={2}
                        items={[
                            {
                                key: 'ngay-tham-gia-cach-mang',
                                content: (
                                    <>
                                        Ngày tham gia cách mạng:{' '}
                                        {initialData?.userProfile?.dateOfBirth
                                            ? dayjs(initialData?.userProfile.dateOfBirth).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </>
                                ),
                            },
                            {
                                key: 'ngay-tuyen-dung',
                                content: (
                                    <>
                                        Ngày tuyển dụng:{' '}
                                        {initialData?.userProfile?.dateOfBirth
                                            ? dayjs(initialData?.userProfile.dateOfBirth).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </>
                                ),
                            },
                        ]}
                    />
                    <GridBlock
                        columns={3}
                        items={[
                            {
                                key: 'ngay-nhap-ngu',
                                content: (
                                    <>
                                        Ngày nhập ngũ:{' '}
                                        {initialData?.userProfile?.enlistmentDate
                                            ? dayjs(initialData?.userProfile.enlistmentDate).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </>
                                ),
                            },
                            {
                                key: 'ngay-xuat-ngu',
                                content: (
                                    <>
                                        Xuất ngũ:{' '}
                                        {initialData?.userProfile?.dischargeDate
                                            ? dayjs(initialData?.userProfile.dischargeDate).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </>
                                ),
                            },
                            {
                                key: 'ngay-tai-ngu',
                                content: (
                                    <>
                                        Tái ngũ:{' '}
                                        {initialData?.userProfile?.dateOfBirth
                                            ? dayjs(initialData?.userProfile.dateOfBirth).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </>
                                ),
                            },
                        ]}
                    />
                    <GridBlock
                        columns={2}
                        items={[
                            {
                                key: 'ngay-vao-dang',
                                content: (
                                    <>
                                        Ngày vào Đảng:{' '}
                                        {initialData?.userProfile?.CPVJoinDate
                                            ? dayjs(initialData?.userProfile.CPVJoinDate).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : ''}
                                    </>
                                ),
                            },
                            {
                                key: 'chinh-thuc',
                                content: (
                                    <>
                                        Chính thức:{' '}
                                        {initialData?.userProfile?.officialCPVDate
                                            ? dayjs(
                                                  initialData?.userProfile.officialCPVDate
                                              ).format('DD/MM/YYYY')
                                            : ''}
                                    </>
                                ),
                            },
                        ]}
                    />
                    <span>Giáo dục phổ thông: </span>
                    <span>Chức danh khoa học, học vị cao nhất, chuyên ngành, thời gian: </span>
                    <span>
                        Chỉ huy quản lý <span className="text-sm">(sơ, trung, cao cấp)</span>:{' '}
                    </span>
                    <span>
                        Lý luận chính trị <span className="text-sm">(sơ, trung, cao cấp)</span>:{' '}
                    </span>
                    <span>
                        Chuyên môn kỹ thuật <span className="text-sm">(sơ, trung, cao cấp)</span>:{' '}
                    </span>
                    <span>Ngoại ngữ, trình độ, tháng năm: </span>
                    <span>Tiếng dân tộc, mức độ nghe, nói, viết: </span>
                    <span>
                        Qua trường{' '}
                        <span className="text-sm">
                            (tên trường, ngành học, chuyên ngành học, cấp học, thời gian, kết quả,
                            loại hình đào tạo)
                        </span>
                        :{' '}
                    </span>
                    <span className="pl-6 font-bold mt-1">
                        Trường QS Pháo Binh, Đào tạo Sỹ Quan chỉ huy Pháo Binh cấp phân đội, 9/2014
                        - 8/2018, Đại học, Khá.
                    </span>
                    <span>
                        Chiến đấu, phục vụ chiến đấu{' '}
                        <span className="text-sm">
                            (thời gian; cương vị, đơn vị; địa danh, địa điểm; trực tiếp hoặc phục vụ
                            chiến đấu; đối tượng)
                        </span>
                        :{' '}
                    </span>
                    <span className="pl-6 font-bold mt-1">Chưa qua</span>
                    <span>
                        Đã đi nước ngoài
                        <span className="text-sm">(tên nước, thời gian, lý do)</span>:{' '}
                        <span className="font-bold">Chưa đi</span>
                    </span>
                    <GridBlock
                        columns={3}
                        items={[
                            {
                                key: 'suc-khoe',
                                content: <>Sức khỏe: Loại 1</>,
                            },
                            {
                                key: 'nhom-mau',
                                content: <>Nhóm máu: B</>,
                            },
                            {
                                key: 'benh-chinh',
                                content: <>Bệnh chính: Không</>,
                            },
                        ]}
                    />
                    <span>
                        Thương tật{' '}
                        <span className="text-sm">
                            (loại, tỷ lệ, nguyên nhân, thời gian và nơi bị thương, thời gian giám
                            định)
                        </span>
                        :{' '}
                    </span>
                    <span className="pl-6 font-bold mt-1">Không</span>
                    <span>Danh hiệu được phong tháng năm: </span>
                    <span>
                        Khen thưởng <span className="text-sm">(hình thức, tháng, năm, lý do)</span>:{' '}
                    </span>
                    <span>
                        Kỷ luật <span className="text-sm">(hình thức, tháng, năm, lý do)</span>:{' '}
                    </span>
                    <span>Trước khi nhập ngũ (tuyển dụng) làm gì? Ở đâu? Quan hệ CT-XH: </span>
                    <span className="pl-6 font-bold mt-1">
                        Là học sinh trường THPT ở địa phương, có quan hệ chính trị xã hội tốt
                    </span>
                    <span>
                        Tình hình nhà ở{' '}
                        <span className="text-sm">(loại nhà, diện tích, hình thức sở hữu)</span>:
                        Nhà cấp 4, Diện tích 60m<sup>2</sup>, Ở cùng bố mẹ
                    </span>
                </div>
                <div className="new-page flex flex-col" style={{ minHeight: '297mm' }}>
                    <div className="uppercase text-lg font-bold flex w-full justify-center mb-4">
                        Quá trình công tác
                    </div>
                    <div className="flex-grow border border-black flex flex-col">
                        <table className="w-full border-collapse flex-grow">
                            <thead>
                                <tr>
                                    <th
                                        className="border border-black p-1 text-center align-middle"
                                        colSpan={2}
                                    >
                                        Thời gian
                                    </th>
                                    <th
                                        className="border border-black p-1 text-center align-middle"
                                        rowSpan={2}
                                    >
                                        Chức danh, chức vụ, đơn vị công tác
                                        <br />
                                        <span className="font-normal">
                                            (đơn vị quân đội ghi từ c, d, e, f...), số quyết định
                                        </span>
                                    </th>
                                    <th
                                        className="border border-black p-1 text-center align-middle"
                                        rowSpan={2}
                                    >
                                        Cấp bậc, <br /> tháng năm
                                    </th>
                                    <th
                                        className="border border-black p-1 text-center align-middle"
                                        rowSpan={2}
                                    >
                                        Chức vụ Đảng, <br /> đoàn thể
                                    </th>
                                </tr>
                                <tr>
                                    <th className="border border-black p-1 text-center">Từ</th>
                                    <th className="border border-black p-1 text-center">Đến</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workHistoryData?.map((item, index) => (
                                    <tr key={`${item.partyPosition}-${index}`}>
                                        <td className="border-l border-r border-black p-1 text-center">
                                            {item.from}
                                        </td>
                                        <td className="border-l border-r border-black p-1 text-center">
                                            {item.to}
                                        </td>
                                        <td className="border-l border-r border-black p-1">
                                            {item.position}
                                        </td>
                                        <td className="border-l border-r border-black p-1 text-center">
                                            {item.rank}
                                        </td>
                                        <td className="border-l border-r border-black p-1 text-center">
                                            {item.partyPosition}
                                        </td>
                                    </tr>
                                ))}
                                {Array.from({ length: 20 - workHistoryData.length }).map(
                                    (_, index) => (
                                        <tr key={`empty-${index}-${length}`}>
                                            <td className="border-l border-r border-black p-1">
                                                &nbsp;
                                            </td>
                                            <td className="border-l border-r border-black p-1">
                                                &nbsp;
                                            </td>
                                            <td className="border-l border-r border-black p-1">
                                                &nbsp;
                                            </td>
                                            <td className="border-l border-r border-black p-1">
                                                &nbsp;
                                            </td>
                                            <td className="border-l border-r border-black p-1">
                                                &nbsp;
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    const Muc2 = () => {
        return (
            <div className="new-page flex flex-col">
                <div className="uppercase text-lg font-bold flex w-full justify-center">
                    II. Tình hình KT-CT của gia đình
                </div>
                <div className="flex flex-col">
                    <GridBlock
                        columns={3}
                        items={[
                            {
                                key: 'name-cha',
                                content: (
                                    <>
                                        Họ tên cha:{' '}
                                        <span className="font-bold capitalize">Vương Văn Mạnh</span>
                                    </>
                                ),
                            },
                            {
                                key: 'dob-cha',
                                content: <>Sinh: 1966</>,
                            },
                            {
                                key: 'nghe-nghiep-cha',
                                content: <>Nghề nghiệp: Làm ruộng</>,
                            },
                        ]}
                    />
                    <GridBlock
                        columns={3}
                        items={[
                            {
                                key: 'name-me',
                                content: (
                                    <>
                                        Họ tên mẹ:{' '}
                                        <span className="font-bold capitalize">Lại Thị Mến</span>
                                    </>
                                ),
                            },
                            {
                                key: 'dob-me',
                                content: <>Sinh: 1971</>,
                            },
                            {
                                key: 'nghe-nghiep-me',
                                content: <>Nghề nghiệp: Làm ruộng</>,
                            },
                        ]}
                    />
                    <span>Thành phần gia đình: Nông dân</span>
                    <span>Quê quán: Ngô Quyền, TP Nam Định, Nam Định</span>
                    <span>Nơi ở hiện nay: Máy Tơ, Ngô Quyền, TP Nam Định, Nam Định</span>
                    <div className="flex justify-between">
                        <span>Cha mẹ sinh được: 02 người con (02 trai)</span>
                        <span>Đồng chí: Vương Trung Hiếu</span>
                        <span>Là thứ: 01</span>
                    </div>
                    <span className="pl-6 font-bold">Tình hình KT-CT của gia đình</span>
                    <p>
                        <span className="pl-6 font-bold">* Kinh tế:</span> Thu nhập của gia đình là
                        chính đáng, chủ yếu từ sản xuất nông nghiệp. Kinh tế hàng năm ổn định, đủ
                        ăn.
                    </p>

                    <p>
                        <span className="pl-6 font-bold">* Chính trị:</span> Qua các thời kỳ cách
                        mạng gia đình không có ai làm gì cho đế quốc phong kiến, là người dân làm ăn
                        lương thiện, luôn chấp hành nghiêm chủ trương đường lối của Đảng, chính sách
                        và pháp luật của Nhà nước, các quy định của địa phương.
                    </p>
                </div>
            </div>
        )
    }

    const Muc3 = () => {
        return (
            <div className="flex flex-col">
                <div className="uppercase text-lg font-bold flex w-full justify-center">
                    III. Tình hình KT-CT của gia đình{' '}
                    {initialData?.userProfile?.gender === Gender.Male ? (
                        <>
                            vợ, (<span style={{ textDecoration: 'line-through' }}>(chồng)</span>)
                        </>
                    ) : initialData?.userProfile?.gender === Gender.Female ? (
                        <>
                            chồng, <span style={{ textDecoration: 'line-through' }}>(vợ)</span>
                        </>
                    ) : (
                        'vợ, chồng'
                    )}
                </div>
                <div className="flex flex-col">
                    <GridBlock
                        columns={3}
                        items={[
                            {
                                key: 'name-cha',
                                content: (
                                    <>
                                        Họ tên cha:{' '}
                                        <span className="font-bold capitalize">Vương Văn Mạnh</span>
                                    </>
                                ),
                            },
                            {
                                key: 'dob-cha',
                                content: <>Sinh: 1966</>,
                            },
                            {
                                key: 'nghe-nghiep-cha',
                                content: <>Nghề nghiệp: Làm ruộng</>,
                            },
                        ]}
                    />
                    <GridBlock
                        columns={3}
                        items={[
                            {
                                key: 'name-me',
                                content: (
                                    <>
                                        Họ tên mẹ:{' '}
                                        <span className="font-bold capitalize">Lại Thị Mến</span>
                                    </>
                                ),
                            },
                            {
                                key: 'dob-me',
                                content: <>Sinh: 1971</>,
                            },
                            {
                                key: 'nghe-nghiep-me',
                                content: <>Nghề nghiệp: Làm ruộng</>,
                            },
                        ]}
                    />
                    <span>Thành phần gia đình: Nông dân</span>
                    <span>Quê quán: Ngô Quyền, TP Nam Định, Nam Định</span>
                    <span>Nơi ở hiện nay: Máy Tơ, Ngô Quyền, TP Nam Định, Nam Định</span>
                    <div className="flex justify-between">
                        <span>Cha mẹ sinh được: 02 người con (02 trai)</span>
                        <span>Đồng chí: Vương Trung Hiếu</span>
                        <span>Là thứ: 01</span>
                    </div>
                    <span className="pl-6 font-bold">Tình hình KT-CT của gia đình</span>
                    <p>
                        <span className="pl-6 font-bold">* Kinh tế:</span> Thu nhập của gia đình là
                        chính đáng, chủ yếu từ sản xuất nông nghiệp. Kinh tế hàng năm ổn định, đủ
                        ăn.
                    </p>

                    <p>
                        <span className="pl-6 font-bold">* Chính trị:</span> Qua các thời kỳ cách
                        mạng gia đình không có ai làm gì cho đế quốc phong kiến, là người dân làm ăn
                        lương thiện, luôn chấp hành nghiêm chủ trương đường lối của Đảng, chính sách
                        và pháp luật của Nhà nước, các quy định của địa phương.
                    </p>
                </div>
                <div className="flex flex-col mt-6">
                    <GridBlock
                        columns={2}
                        items={[
                            {
                                key: 'name-vo',
                                content: (
                                    <>
                                        Họ tên{' '}
                                        {initialData?.userProfile?.gender === Gender.Male ? (
                                            <>
                                                vợ, (
                                                <span style={{ textDecoration: 'line-through' }}>
                                                    (chồng)
                                                </span>
                                                )
                                            </>
                                        ) : initialData?.userProfile?.gender === Gender.Female ? (
                                            <>
                                                chồng,{' '}
                                                <span style={{ textDecoration: 'line-through' }}>
                                                    (vợ)
                                                </span>
                                            </>
                                        ) : (
                                            'vợ, chồng'
                                        )}
                                        :{' '}
                                        <span className="font-bold capitalize">Vương Văn Mạnh</span>
                                    </>
                                ),
                            },
                            {
                                key: 'dob-vo',
                                content: <>Năm sinh: 1966</>,
                            },
                        ]}
                    />
                    <span>Nghề nghiệp: </span>
                    <span>Chỗ ở hiện nay: </span>
                    <span>Họ tên, năm sinh, nghề nghiệp các con: </span>
                </div>
            </div>
        )
    }

    const Muc4 = () => {
        return (
            <div className="new-page flex flex-col">
                <div className="uppercase text-lg font-bold flex w-full justify-center">
                    IV. Tóm tắt nhận xét
                </div>
                <p>
                    <span className="pl-6 font-bold italic">+ Lý lịch:</span> Lai lịch Chính trị gia
                    đình hai bên nội, ngoại trogn sạch, rõ ràng. Qua các thời kỳ cách mạng gia đình
                    không có ai làm gì cho đế quốc phong kiến, luôn chấp hành tất mọi đường lối chủ
                    trương của Đảng, chính sách và pháp luật Nhà nước.
                </p>
                <p>
                    <span className="pl-6 font-bold italic">+ Bản thân:</span> Nhập ngũ tháng
                    9/2014, được đào tọa qua Trường Sĩ Quan Pháo Binh. Đã qua giữ chức Trung đội
                    trưởng, từ tháng 1/2021 giữ chức Phó Đại đội trưởng Đại đội 1, Tiểu đoàn 15, Sư
                    đoàn, Quân khu 1, luôn nhận và hoàn thành tột mọi nhiệm vụ được giao.
                </p>
                <p>
                    <span className="pl-6 font-bold italic">+ Điểm mạnh:</span> Lập trường tư tưởng
                    kiện đị vững vàng, an tâm công tác xác định tốt nhiệm vụ, sẵn sáng nhận và hoàn
                    thành tốt mọi nhiệm vụ được giao.
                </p>
                <span className="pl-6">
                    Phẩm chất đạo đức tốt, lối sống trong sạch, lành mạnh, trung thực. Tích cực xây
                    dịng mối đoàn kết nội bộ tốt trong đơn vị, giải quyết hài hòa các mối quan hệ.
                </span>
                <span className="pl-6">
                    Có năng lục, trình độ huấn luyện, quản lý, chỉ huy khá, phương pháp tác phong
                    công tác phù hợp. Gương mẫu trong thực hiện nhiệm vụ. Trên cương vị Phó Đại đội
                    trưởng cùng với ban chỉ huy tổ chức và duy trì hiệu quả công tác huấn luyện,
                    SSCĐ cao, công tác hậu cần kĩ thuật. Bản thân hoàn thành tốt nhiệm vụ.
                </span>
                <span className="pl-6">
                    Chấp hành nghiêm pháp luật Nhà nước, kỷ luật Quân đội, quy định của đơn vị.
                </span>
                <p>
                    <span className="pl-6 font-bold italic">+ Hạn chế:</span>{' '}
                    <span className="text-blue-500">
                        Việc kiểm tra, đôn đốc Trung đội thực hiện nhiệm vụ có thời điểm chưa sâu
                        sát, tỉ mỉ.
                    </span>
                </p>
                <p>
                    <span className="pl-6 font-bold">+ Kết luận:</span> Phẩm chất tốt, năng lực công
                    tác khá, hoàn thành tốt chức trách, nhiệm vụ.
                </p>
                <p>
                    <span className="pl-6 font-bold">+ HSD:</span> 1a
                </p>
            </div>
        )
    }

    const Footer = () => {
        return (
            <div className="flex flex-col mt-10">
                <span className="font-bold">
                    Những điều cần ghi thêm (Khai lý lịch, chưa có xác minh hoặc xác minh chính trị
                    nhưng chưa rõ cần phải thâm trả, xác minh lại; những nội dung chỉnh lý lịch được
                    cấp có thẩm quyền quyết định:)
                </span>
                <div className="space-y-2">
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                    <div className="h-6 border-b border-dotted border-black w-full" />
                </div>
                <span className="mt-5">Ngày trích: {formattedDate}</span>
                <span>
                    Tài liệu căn cứ để trích: <span className="font-bold">T63 lưu, NXCB năm</span>
                </span>
                <div className="flex w-full">
                    <div className="flex flex-col items-center justify-center w-[50%]">
                        <span>Họ tên, cấp bậc, chức vụ, chữ ký người trích</span>
                        <span className="uppercase font-bold">Chính trị viên tiểu đoàn</span>
                        <div className="mt-20" />
                        <span className="font-bold">{signerName}</span>
                    </div>
                    <div className="flex flex-col items-center w-[50%]">
                        <span className="mt-6" />
                        <span className="uppercase font-bold">Cấp phê chuẩn</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={900}
            style={{ top: 20 }}
            title={
                <div className="flex items-center justify-between w-[95%]">
                    <span>Modal tóm tắt lý lịch</span>
                    {/* TODO: Làm select chọn trưởng phòng đào tạo */}
                    <Input
                        placeholder="Nhập tên người ký"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-64"
                    />
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        size="small"
                        type="primary"
                    >
                        In
                    </Button>
                </div>
            }
        >
            <div
                ref={printRef}
                className="mx-auto p-10 page text-sm leading-relaxed font-[Times New Roman] flex flex-col gap-2"
            >
                <Header />
                <Muc1 />
                <Muc2 />
                <Muc3 />
                <Muc4 />
                <Footer />
            </div>
            <style>
                {`
            @media print {
                .page {
                    width: 210mm;
                    min-height: 297mm; 
                    page-break-after: auto;
                    background: white;
                    overflow: visible;
                }
                .new-page {
                    page-break-before: always;
                }
                .page-1 {
                    margin-top: -40px !important;
                }
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            @page {
                size: A4;
            }
            @media screen {
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    margin: 10px auto;
                    padding: 20mm;
                    background: white;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
            }
            `}
            </style>
        </Modal>
    )
}

export default ModalTomTatLyLich
