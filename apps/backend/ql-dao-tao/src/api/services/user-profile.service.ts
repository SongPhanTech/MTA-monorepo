import { prisma } from '../..'
import * as XLSX from 'xlsx'

function splitFullName(fullName: string) {
    if (!fullName || typeof fullName !== 'string')
        return { firstName: '', lastName: '' }

    const parts = fullName.trim().split(/\s+/) // Cắt chuỗi theo khoảng trắng
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' } // Nếu chỉ có một từ, coi như chỉ có tên
    }

    const firstName = parts.pop() // Lấy phần cuối cùng làm tên
    const lastName = parts.join(' ') // Phần còn lại là họ + tên đệm

    return { firstName, lastName }
}
function parseDate(input: any): Date | null {
    let date: Date | null = null
    if (input) {
        // Check if input is a number (Excel date serial number)
        if (typeof input === 'number') {
            const excelEpoch = new Date(1899, 11, 31) // 31/12/1899 (Excel starts at 1/1/1900 = 1)
            date = new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000)
        }
        // Check if input is a DD/MM/YYYY string
        else if (
            typeof input === 'string' &&
            /^\d{2}\/\d{2}\/\d{4}$/.test(input)
        ) {
            const [day, month, year] = input.split('/').map(Number)
            if (
                year !== undefined &&
                month !== undefined &&
                day !== undefined
            ) {
                date = new Date(year, month - 1, day)
            }
        }
    }
    return date
}
const uploadFileUserProfile = async (context: any): Promise<any> => {
    const body = await context.req.parseBody() // Parse multipart form data
    const typeUser = body.type
    const file = body.file
    // Kiểm tra xem file có tồn tại và là File object không
    if (!file || !(file instanceof File)) {
        return context.json({ error: 'No valid file uploaded' }, 400)
    }
    const allowedExtensions = ['.xls', '.xlsx']
    const fileName = file.name
    if (
        !allowedExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
    ) {
        return context.json({ error: 'Unsupported file extension' }, 400)
    }
    const fileSize = file.size // Kích thước file trong byte
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (fileSize > maxFileSize) {
        return context.json({ error: 'File size exceeds 50MB' }, 400)
    }
    try {
        // Đọc file Excel
        const UserType = await prisma.userType.findFirst({
            where: { code: typeUser }, // Tìm kiếm UserType của Sinh viên
        })

        if (!UserType) {
            return context.json({ error: 'Không tìm thấy loại hồ sơ' }, 400)
        }
        console.log('UserTypeId', UserType?.id)

        // Đọc file Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
            return context.json(
                { error: 'No sheets found in the uploaded Excel file' },
                400
            )
        }
        const sheet = workbook.Sheets[sheetName]

        if (!sheet) {
            return context.json(
                { error: 'Sheet is undefined in the uploaded Excel file' },
                400
            )
        }

        // Chuyển đổi dữ liệu từ sheet thành JSON
        const rowData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        let jsonData
        // Duyệt dòng 11 theo mẫu

        await prisma.$transaction(async (prisma) => {
            jsonData = await Promise.all(
                (rowData as any[][])
                    .slice(11)
                    .map(async (row: any[], index: number) => {
                        const userProfile = await prisma.userProfile.create({
                            data: {
                                userTypeId: UserType?.id,
                                firstName:
                                    splitFullName(row[2]).firstName || '',
                                lastName: splitFullName(row[2]).lastName || '',
                                code: row[1] || '', // Mã
                                gender: row[3] === 'Nam' ? 'Male' : 'Female', // Giới tính
                                dateOfBirth: parseDate(row[4]), // Chuyển đổi thành Date
                                homeTown: row[5] || '', // Quê quán
                                idCardNumber: row[6] || '', // CCCD
                                phoneNumber: row[7] || '', // Số điện thoại
                            },
                        })
                        // console.log("userProfile", userProfile);
                        return userProfile
                    })
            )
            return jsonData
        })
        return context.json(jsonData, 200)
    } catch (error) {
        console.error('Error processing Excel file:', error)
        return context.json({ error: 'Failed to process Excel file' }, 400)
    }
}

const updateFileUserProfile = async (context: any): Promise<any> => {
    const body = await context.req.parseBody() // Parse multipart form data
    const file = body.file
    console.log(file)
    // Kiểm tra xem file có tồn tại và là File object không
    if (!file || !(file instanceof File)) {
        return context.json({ error: 'No valid file uploaded' }, 400)
    }
    const allowedExtensions = ['.xls', '.xlsx']
    const fileName = file.name
    if (
        !allowedExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
    ) {
        return context.json({ error: 'Unsupported file extension' }, 400)
    }
    const fileSize = file.size // Kích thước file trong byte
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (fileSize > maxFileSize) {
        return context.json({ error: 'File size exceeds 50MB' }, 400)
    }

    try {
        // Đọc file Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
            return context.json(
                { error: 'No sheets found in the uploaded Excel file' },
                400
            )
        }
        const sheet = workbook.Sheets[sheetName]

        if (!sheet) {
            return context.json(
                { error: 'Sheet is undefined in the uploaded Excel file' },
                400
            )
        }

        // Chuyển đổi dữ liệu từ sheet thành JSON
        const rowData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        let jsonData
        // Duyệt dòng 11 theo mẫu

        await prisma.$transaction(async (prisma) => {
            jsonData = await Promise.all(
                (rowData as any[][])
                    .slice(1)
                    .map(async (row: any[], index: number) => {
                        console.log('row', row[0], row[2], index)
                        const existingUserProfile =
                            await prisma.userProfile.findFirst({
                                where: { code: row[2] }, // Tìm kiếm UserType của Sinh viên
                            })
                        if (
                            !existingUserProfile ||
                            row[2] === '' ||
                            row[2] === undefined
                        ) {
                            // Nếu không tìm thấy hồ sơ hoặc mã hồ sơ trống, trả về thông báo lỗi
                            console.log(
                                'existingUserProfile',
                                existingUserProfile?.code,
                                row[1]
                            )
                            return 'Không tìm thấy hồ sơ' + ' ' + row[2]
                        } else {
                            const { firstName, lastName } = splitFullName(
                                row[1]
                            )
                            const priorityObject =
                                await prisma.priorityObject.findFirst({
                                    where: { name: row[9] }, // đối tượng ưu tiên
                                })
                            const registrationArea =
                                await prisma.registrationArea.findFirst({
                                    where: { name: row[10] }, // khu vực đăng ký
                                })
                            const nationality =
                                await prisma.nationality.findFirst({
                                    where: { name: row[11] }, // quốc tịch
                                })
                            const religion = await prisma.religion.findFirst({
                                where: { name: row[12] }, // tôn giáo
                            })
                            const ethnicity = await prisma.ethnicity.findFirst({
                                where: { name: row[13] }, // dân tộc
                            })
                            const updatedUserProfile =
                                await prisma.userProfile.update({
                                    where: { id: existingUserProfile.id },
                                    data: {
                                        firstName: firstName || '', // Tên
                                        lastName: lastName || '', // Họ
                                        dateOfBirth: parseDate(row[3]), // Ngày sinh
                                        placeOfBirth: row[4] || '', // Nơi sinh
                                        homeTown: row[5] || '', // Quê quán
                                        idCardNumber: String(row[6] || ''), // CCCD
                                        idCardDate: parseDate(row[7]), // Ngày cấp CCCD
                                        officerNumber: String(row[8] || ''), // Số hiệu sĩ quan
                                        priorityObjectId:
                                            priorityObject?.id || null, // Đối tượng ưu tiên
                                        registrationAreaId:
                                            registrationArea?.id || null, // Khu vực đăng ký
                                        nationalityId: nationality?.id || null, // Quốc tịch
                                        religionId: religion?.id || null, // Tôn giáo
                                        ethnicityId: ethnicity?.id || null, // Dân tộc
                                        permanentAddress: row[14] || '', // Địa chỉ thường trú
                                        temporaryAddress: row[15] || '', // Địa chỉ tạm trú
                                        // Địa chỉ liên lạc
                                        phoneNumber: String(row[17] || ''), // Số điện thoại
                                        email: row[18] || '', // Email
                                        parentPhoneNumber: String(
                                            row[19] || ''
                                        ), // Số điện thoại phụ huynh
                                        parentName: String(row[20] || ''), // Tên phụ huynh
                                        unionDate: parseDate(row[21]), // Ngày kết nạp Đoàn
                                        unionPlace: row[22] || '', // Nơi kết nạp Đoàn
                                        CPVJoinDate: parseDate(row[23]), // Ngày kết nạp Đảng
                                        officialCPVDate: parseDate(row[24]), // Ngày chính thức Đảng
                                        CPVJoinPlace: row[25] || '', // Nơi kết nạp Đảng
                                        tenureDate: parseDate(row[26]), // Ngày vào biên chế
                                        enlistmentDate: parseDate(row[27]), // Ngày nhập ngũ
                                        dischargeDate: parseDate(row[28]), // Ngày xuất ngũ
                                        rankName: row[29] || '', // Quân hàm
                                        educationLevel: row[30] || '', // Trình độ học vấn
                                        academicDegreeTypeName: row[31] || '', // Trình độ học vấn
                                        academicRankTypeName: row[32] || '', // Trình độ học vấn
                                        positionName: row[33] || '', // Chức vụ
                                        positionCPVName: row[34] || '', // Chức vụ Đảng
                                        organizationName: row[35] || '', // đơn vị
                                        organizationCPVName: row[36] || '', // Đơn vị Đảng
                                    }, // Cập nhật mã
                                })
                            return updatedUserProfile
                        }
                    })
                // console.log("updatedUserProfile", updatedUserProfile);
            )
            return jsonData
        })
        return context.json(jsonData, 200)
    } catch (error) {
        console.error('Error processing Excel file:', error)
        return context.json({ error: 'Failed to process Excel file' }, 400)
    }
}
export default {
    uploadFileUserProfile,
    updateFileUserProfile,
}
