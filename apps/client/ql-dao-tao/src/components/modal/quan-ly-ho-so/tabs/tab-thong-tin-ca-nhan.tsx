import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import { GENDER_LIST, STUDENT_STATUS_OPTIONS } from '@constants/constants'
import { buildOrgTree } from '@lib/utils'
import {
    useFindManyCurriculumVersion,
    useFindManyDM_DanToc,
    useFindManyDM_DonVi,
    useFindManyDM_KhuVuc_DiaLy,
    useFindManyDM_QuocGia,
    useFindManyDM_TonGiao,
    useFindManyFixedClass,
    useFindManyLecturerType,
    useFindManyStaffPosition,
    useFindManyStaffType,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
} from '@workspace/db/hooks'
import { Col, Collapse, Form, Input, Row, TreeSelect, Upload } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import type { PutModalType, TabThongTinCaNhan } from '../type'
const { Panel } = Collapse

export default function ThongTinCaNhanTab({ type }: TabThongTinCaNhan) {
    const form = Form.useFormInstance<PutModalType>()

    const { data: registrationAreaData = [], refetch: refetchRe } =
        useFindManyDM_KhuVuc_DiaLy()

    const { data: staffPositionData = [] } = useFindManyStaffPosition()

    const { data: staffTypeData = [] } = useFindManyStaffType()

    const { data: nationalityData = [], refetch: refetchNa } =
        useFindManyDM_QuocGia()

    const { data: religionData = [], refetch: refetchReli } =
        useFindManyDM_TonGiao()

    const { data: ethnicityData = [], refetch: refetchEth } =
        useFindManyDM_DanToc()

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyDM_DonVi()

    const { data: lecturerTypeData = [] } = useFindManyLecturerType()

    const treeData = buildOrgTree(manageOrgData)

    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion()

    const { data: fixedClassData = [], refetch: refetchFix } =
        useFindManyFixedClass({
            include: {
                trainingCourse: true,
                curriculumVersion: true,
            },
        })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    // Thêm useMemo và watch fields
    const selectedTrainingCourseId = Form.useWatch('trainingCourseId', form)
    const selectedCurriculumVersionId = Form.useWatch(
        'curriculumVersionId',
        form
    )

    const filteredFixedClasses = useMemo(() => {
        if (!selectedTrainingCourseId && !selectedCurriculumVersionId) {
            return fixedClassData
        }

        return fixedClassData.filter((cls) => {
            const matchesCourse =
                !selectedTrainingCourseId ||
                cls.trainingCourseId === selectedTrainingCourseId
            const matchesCurriculum =
                !selectedCurriculumVersionId ||
                cls.curriculumVersionId === selectedCurriculumVersionId
            return matchesCourse && matchesCurriculum
        })
    }, [fixedClassData, selectedTrainingCourseId, selectedCurriculumVersionId])

    // Lọc khóa học dựa trên chương trình đào tạo đã chọn
    const filteredTrainingCourses = useMemo(() => {
        if (!selectedCurriculumVersionId) {
            return trainingCourseData
        }

        // Lấy danh sách khóa học có chứa chương trình đào tạo đã chọn
        const coursesWithCurriculum = fixedClassData
            .filter(
                (cls) => cls.curriculumVersionId === selectedCurriculumVersionId
            )
            .map((cls) => cls.trainingCourseId)
            .filter(
                (courseId, index, array) => array.indexOf(courseId) === index
            ) // Remove duplicates

        return trainingCourseData.filter((course) =>
            coursesWithCurriculum.includes(course.id)
        )
    }, [trainingCourseData, fixedClassData, selectedCurriculumVersionId])

    // Cập nhật handleFixedClassChange hoàn chỉnh
    const handleFixedClassChange = (classId: string) => {
        const selectedClass = fixedClassData.find((cls) => cls.id === classId)

        if (selectedClass?.trainingCourseId) {
            const newCourse = selectedClass.trainingCourseId

            // Tự động set khóa học tương ứng với lớp
            form.setFieldValue('trainingCourseId', newCourse)
        }

        // SỬA: Tự động set phiên bản chương trình đào tạo
        if (selectedClass?.curriculumVersionId) {
            const newCurriculum = selectedClass.curriculumVersionId

            form.setFieldValue('curriculumVersionId', newCurriculum)
        }
    }

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col span={4}>
                    <div
                        style={{
                            transform: 'scale(1.35)',
                            transformOrigin: 'top left',
                            fontSize: '0.65rem',
                        }}
                    >
                        <Form.Item name={'file'} className="mb-0">
                            <Upload listType="picture-card" maxCount={1}>
                                <p
                                    style={{
                                        fontSize: '0.65rem',
                                    }}
                                >
                                    + Tải ảnh lên
                                </p>
                            </Upload>
                        </Form.Item>
                    </div>
                </Col>

                <Col span={20}>
                    <Row gutter={[10, 10]}>
                        <Col sm={12} lg={12}>
                            <FormItem
                                form={form}
                                name="idCardNumber"
                                label="Số CCCD"
                                className="mb-0"
                                required
                            >
                                {/* <AutoComplete
                                    placeholder="Nhập hoặc chọn số CCCD"
                                    allowClear
                                    options={idCardOptions}
                                    filterOption={(inputValue, option) =>
                                        option?.value
                                            .toUpperCase()
                                            .indexOf(
                                                inputValue.toUpperCase()
                                            ) !== -1 ||
                                        option?.label
                                            .toUpperCase()
                                            .indexOf(
                                                inputValue.toUpperCase()
                                            ) !== -1
                                    }
                                    onSelect={(value) => {
                                        form.setFieldsValue({
                                            idCardNumber: value,
                                        })
                                        debouncedSearch(value)
                                    }}
                                    onChange={(value) => {
                                        form.setFieldsValue({
                                            idCardNumber: value,
                                        })
                                        debouncedSearch(value)
                                    }}
                                /> */}
                                <Input placeholder="Nhập số căn cước công dân" />
                            </FormItem>
                        </Col>
                        {type === 'CIVILIAN_STUDENT' && (
                            <Col sm={12} lg={12}>
                                <FormItem
                                    form={form}
                                    name="code"
                                    label="Mã sinh viên"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                'Vui lòng nhập mã sinh viên!',
                                        },
                                    ]}
                                    className="mb-0"
                                >
                                    <Input placeholder="Nhập mã sinh viên" />
                                </FormItem>
                            </Col>
                        )}
                        {type === 'MILITARY_STUDENT' && (
                            <Col sm={12} lg={12}>
                                <FormItem
                                    form={form}
                                    name="code"
                                    label="Mã học viên"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                'Vui lòng nhập mã học viên!',
                                        },
                                    ]}
                                    className="mb-0"
                                >
                                    <Input placeholder="Nhập mã học viên" />
                                </FormItem>
                            </Col>
                        )}
                        {type === 'LECTURER' && (
                            <Col sm={12} lg={12}>
                                <FormItem
                                    form={form}
                                    name="code"
                                    label="Mã giảng viên"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                'Vui lòng nhập mã giảng viên',
                                        },
                                    ]}
                                    className="mb-0"
                                >
                                    <Input placeholder="Nhập mã giảng viên" />
                                </FormItem>
                            </Col>
                        )}

                        {type === 'STAFF' && (
                            <Col sm={12} lg={12}>
                                <FormItem
                                    form={form}
                                    name="code"
                                    label="Mã cán bộ"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng nhập mã cán bộ',
                                        },
                                    ]}
                                    className="mb-0"
                                >
                                    <Input placeholder="Nhập mã cán bộ" />
                                </FormItem>
                            </Col>
                        )}

                        <Col sm={12} lg={12}>
                            <FormItem
                                form={form}
                                name="lastName"
                                label="Họ và tên đệm"
                                required
                                className="mb-0"
                            >
                                <Input placeholder="Nhập họ và tên đệm" />
                            </FormItem>
                        </Col>
                        <Col sm={12} lg={12}>
                            <FormItem
                                form={form}
                                name="firstName"
                                label="Tên"
                                required
                                className="mb-0"
                            >
                                <Input placeholder="Nhập tên" />
                            </FormItem>
                        </Col>
                    </Row>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="code"
                        label="Tên tài khoản"
                        required
                        className="mb-0"
                    >
                        <Input placeholder="Nhập tên tài khoản" />
                    </FormItem>
                </Col>

                {type.includes('STUDENT') && (
                    <>
                        <Col sm={12} lg={8}>
                            <FormItem
                                form={form}
                                name="trainingObjectTypeId"
                                label="Đối tượng đào tạo"
                                className="mb-0"
                                required
                            >
                                <Select
                                    placeholder="Chọn đối tượng đào tạo"
                                    options={trainingObjectTypeData.map(
                                        (value) => ({
                                            value: value.id,
                                            label: value.name,
                                        })
                                    )}
                                />
                            </FormItem>
                        </Col>
                        <Col sm={12} lg={8}>
                            <FormItem
                                form={form}
                                name="fixedClassId"
                                label="Lớp"
                                className="mb-0"
                                required
                            >
                                <Select
                                    placeholder="Chọn lớp"
                                    optionFilterProp="label"
                                    onChange={handleFixedClassChange}
                                    options={filteredFixedClasses.map(
                                        (value) => ({
                                            value: value.id,
                                            label: `${value.code}-${value.name}`,
                                        })
                                    )}
                                />
                            </FormItem>
                        </Col>
                        <Col sm={12} lg={8}>
                            <FormItem
                                form={form}
                                name="trainingCourseId"
                                label="Khóa"
                                className="mb-0"
                            >
                                <Select
                                    placeholder="Chọn khóa"
                                    options={filteredTrainingCourses.map(
                                        (value) => ({
                                            value: value.id,
                                            label: value.name,
                                        })
                                    )}
                                />
                            </FormItem>
                        </Col>
                        <Col sm={12} lg={8}>
                            <FormItem
                                form={form}
                                name="curriculumVersionId"
                                label="Chương trình đào tạo"
                                className="mb-0"
                            >
                                <Select
                                    placeholder={'Chọn chương trình đào tạo'}
                                    showSearch
                                    optionFilterProp="label"
                                    options={curriculumVersionData.map(
                                        (value) => ({
                                            value: value.id,
                                            label: value.name,
                                        })
                                    )}
                                />
                            </FormItem>
                        </Col>
                        <Col sm={12} lg={8}>
                            <FormItem
                                form={form}
                                name="status"
                                label="Trạng thái"
                                className="mb-0"
                            >
                                <Select
                                    placeholder="Chọn trạng thái"
                                    options={STUDENT_STATUS_OPTIONS.map((v) => {
                                        return {
                                            value: v.value,
                                            label: v.label,
                                        }
                                    })}
                                />
                            </FormItem>
                        </Col>
                    </>
                )}

                {type === 'LECTURER' && (
                    <>
                        <Col span={8}>
                            <FormItem
                                form={form}
                                name="organizationId"
                                label="Đơn vị"
                                className="mb-0"
                            >
                                <TreeSelect
                                    allowClear
                                    showSearch
                                    placeholder="Chọn đơn vị phụ trách"
                                    treeDefaultExpandAll
                                    treeData={treeData}
                                    filterTreeNode={(input, node) =>
                                        (node.title as string)
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                />
                            </FormItem>
                        </Col>
                        <Col span={8}>
                            <FormItem
                                form={form}
                                name="lecturerTypeId"
                                label="Loại giảng viên"
                                className="mb-0"
                            >
                                <Select
                                    placeholder="Chọn loại giảng viên"
                                    options={lecturerTypeData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                />
                            </FormItem>
                        </Col>
                    </>
                )}

                {type === 'STAFF' && (
                    <>
                        <Col span={8}>
                            <FormItem
                                form={form}
                                name="organizationId"
                                label="Đơn vị"
                                className="mb-0"
                            >
                                <TreeSelect
                                    allowClear
                                    showSearch
                                    placeholder="Chọn đơn vị phụ trách"
                                    treeDefaultExpandAll
                                    treeData={treeData}
                                    filterTreeNode={(input, node) =>
                                        (node.title as string)
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                />
                            </FormItem>
                        </Col>
                        <Col span={8}>
                            <FormItem
                                form={form}
                                name="staffTypeId"
                                label="Loại cán bộ"
                                className="mb-0"
                            >
                                <Select
                                    placeholder="Chọn loại cán bộ"
                                    options={staffTypeData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                />
                            </FormItem>
                        </Col>
                        <Col span={8}>
                            <FormItem
                                form={form}
                                name="staffPositionId"
                                label="Chức vụ cán bộ"
                                className="mb-0"
                            >
                                <Select
                                    placeholder="Chọn loại cán bộ"
                                    options={staffPositionData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                />
                            </FormItem>
                        </Col>
                    </>
                )}

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="dateOfBirth"
                        label="Ngày sinh"
                        className="mb-0"
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            className="w-full"
                            disabledDate={(date) =>
                                date && date > dayjs().endOf('day')
                            }
                        />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="idCardDate"
                        label="Ngày cấp CCCD"
                        className="mb-0"
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            className="w-full"
                            disabledDate={(date) =>
                                date && date > dayjs().endOf('day')
                            }
                        />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="officerNumber"
                        label="Số hiệu sĩ quan"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập số hiệu sĩ quan / quân nhân" />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="gender"
                        label="Giới tính"
                        className="mb-0"
                    >
                        <Select
                            allowClear
                            placeholder="Chọn giới tính"
                            options={GENDER_LIST.map((i) => {
                                return {
                                    value: i.id,
                                    label: i.name,
                                }
                            })}
                        />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="phoneNumber"
                        label="Số điện thoại"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập số điện thoại" />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="email"
                        label="Thư điện tử"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập thư điện tử" />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="healthInsuranceNumber"
                        label="Thẻ bảo hiểm y tế"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập thẻ bảo hiểm y tế" />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="bankAccountNumber"
                        label="Số thẻ ngân hàng"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập số thẻ ngân hàng" />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="bankName"
                        label="Ngân hàng"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập ngân hàng" />
                    </FormItem>
                </Col>

                {type.includes('STUDENT') && (
                    <Col sm={12} lg={8}>
                        <FormItem
                            form={form}
                            name="registrationAreaId"
                            label="Khu vực đăng ký"
                            className="mb-0"
                            normalize={(value) =>
                                value === undefined ? null : value
                            }
                        >
                            <Select
                                allowClear
                                placeholder="Chọn khu vực đăng ký"
                                options={registrationAreaData.map((i) => {
                                    return {
                                        value: i.Id,
                                        label: i.sTen,
                                    }
                                })}
                            />
                        </FormItem>
                    </Col>
                )}
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="nationalityId"
                        label="Quốc tịch"
                        className="mb-0"
                        normalize={(value) =>
                            value === undefined ? null : value
                        }
                    >
                        <Select
                            allowClear
                            placeholder="Chọn quốc tịch"
                            options={nationalityData.map((i) => {
                                return {
                                    value: i.Id,
                                    label: i.sTen,
                                }
                            })}
                        />
                    </FormItem>
                </Col>
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="religionId"
                        label="Tôn giáo"
                        className="mb-0"
                        normalize={(value) =>
                            value === undefined ? null : value
                        }
                    >
                        <Select
                            allowClear
                            placeholder="Chọn tôn giáo"
                            options={religionData.map((i) => {
                                return {
                                    value: i.Id,
                                    label: i.sTen,
                                }
                            })}
                        />
                    </FormItem>
                </Col>
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="ethnicityId"
                        label="Dân tộc"
                        className="mb-0"
                        normalize={(value) =>
                            value === undefined ? null : value
                        }
                    >
                        <Select
                            allowClear
                            placeholder="Chọn dân tộc"
                            options={ethnicityData.map((i) => {
                                return {
                                    value: i.Id,
                                    label: i.sTen,
                                }
                            })}
                        />
                    </FormItem>
                </Col>

                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="unionDate"
                        label="Ngày vào đoàn"
                        className="mb-0"
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            className="w-full"
                            disabledDate={(date) =>
                                date && date > dayjs().endOf('day')
                            }
                        />
                    </FormItem>
                </Col>
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="unionPlace"
                        label="Nơi vào đoàn"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập nơi vào đoàn" />
                    </FormItem>
                </Col>
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="CPVJoinDate"
                        label="Ngày vào Đảng"
                        className="mb-0"
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            className="w-full"
                            disabledDate={(date) =>
                                date && date > dayjs().endOf('day')
                            }
                        />
                    </FormItem>
                </Col>
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="officialCPVDate"
                        label="Ngày chính thức"
                        className="mb-0"
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            className="w-full"
                            disabledDate={(date) =>
                                date && date > dayjs().endOf('day')
                            }
                        />
                    </FormItem>
                </Col>
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="CPVJoinPlace"
                        label="Nơi vào Đảng"
                        className="mb-0"
                    >
                        <Input placeholder="Nhập nơi vào Đảng" />
                    </FormItem>
                </Col>
                <Col sm={12} lg={8}>
                    <FormItem
                        form={form}
                        name="tenureDate"
                        label="Ngày vào biên chế"
                        className="mb-0"
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            className="w-full"
                            disabledDate={(date) =>
                                date && date > dayjs().endOf('day')
                            }
                        />
                    </FormItem>
                </Col>
            </Row>

            <div className="mt-4">
                <Collapse
                    ghost
                    accordion={true}
                    className="bg-gray-50 shadow-sm"
                >
                    <Panel
                        header={
                            <span className="text-base font-medium text-gray-800">
                                Nơi sinh
                            </span>
                        }
                        key="1"
                        className="border-none mb-2"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="provinceOfBirthId"
                                    className="mb-0"
                                    label="Tỉnh/Thành phố"
                                >
                                    <Select
                                        placeholder="Chọn tỉnh/thành phố"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="districtOfBirthId"
                                    className="mb-0"
                                    label="Quận/Huyện"
                                >
                                    <Select
                                        placeholder="Chọn quận/huyện"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="communeOfBirthId"
                                    className="mb-0"
                                    label="Phường/Xã"
                                >
                                    <Select
                                        placeholder="Chọn phường/xã"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                    </Panel>
                </Collapse>

                <Collapse
                    ghost
                    accordion={true}
                    className="bg-gray-50 shadow-sm"
                >
                    <Panel
                        header={
                            <span className="text-base font-medium text-gray-800">
                                Quê quán
                            </span>
                        }
                        key="2"
                        className="border-none mb-2"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="provinceHometownId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn tỉnh/thành phố"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="districtHometownId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn quận/huyện"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="communeHometownId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn phường/xã"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                    </Panel>
                </Collapse>

                <Collapse
                    ghost
                    accordion={true}
                    className="bg-gray-50 shadow-sm"
                >
                    <Panel
                        header={
                            <span className="text-base font-medium text-gray-800">
                                Hộ khẩu thường trú
                            </span>
                        }
                        key="3"
                        className="border-none mb-2"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="provincePermanentAddressId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn tỉnh/thành phố"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="districtPermanentAddressId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn quận/huyện"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="communePermanentAddressId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn phường/xã"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                    </Panel>
                </Collapse>

                <Collapse
                    ghost
                    accordion={true}
                    className="bg-gray-50 shadow-sm"
                >
                    <Panel
                        header={
                            <span className="text-base font-medium text-gray-800">
                                Nơi ở hiện nay
                            </span>
                        }
                        key="4"
                        className="border-none mb-2"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={6}>
                                <FormItem
                                    form={form}
                                    name="provinceCurrentAddressId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn tỉnh/thành phố"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={6}>
                                <FormItem
                                    form={form}
                                    name="districtCurrentAddressId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn quận/huyện"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={6}>
                                <FormItem
                                    form={form}
                                    name="communeCurrentAddressId"
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn phường/xã"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                            <Col span={6}>
                                <FormItem
                                    form={form}
                                    name="currentAddress"
                                    className="mb-0"
                                >
                                    <Input
                                        placeholder="Nhập địa chỉ cụ thể"
                                        className="w-full"
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                    </Panel>
                </Collapse>
            </div>
        </>
    )
}
