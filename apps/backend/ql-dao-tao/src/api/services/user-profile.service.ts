
import { prisma } from '../..'
import * as XLSX from 'xlsx'


function splitFullName(fullName: string) {
    if (!fullName || typeof fullName !== "string") return { firstName: "", lastName: "" };

    const parts = fullName.trim().split(/\s+/); // Cắt chuỗi theo khoảng trắng
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: "" }; // Nếu chỉ có một từ, coi như chỉ có tên
    }

    const firstName = parts.pop(); // Lấy phần cuối cùng làm tên
    const lastName = parts.join(" "); // Phần còn lại là họ + tên đệm

    return { firstName, lastName };
}
function parseDate(input: any): Date | null {
    let date: Date | null = null;
    if (input) {
        // Check if input is a number (Excel date serial number)
        if (typeof input === 'number') {
            const excelEpoch = new Date(1899, 11, 31); // 31/12/1899 (Excel starts at 1/1/1900 = 1)
            date = new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000);
        }
        // Check if input is a DD/MM/YYYY string
        else if (typeof input === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
            const [day, month, year] = input.split('/').map(Number);
            if (year !== undefined && month !== undefined && day !== undefined) {
                date = new Date(year, month - 1, day);
            }
        }
    }
    return date;
}
const uploadFileUserProfile = async (context: any): Promise<any> => {
    const body = await context.req.parseBody() // Parse multipart form data
    const typeUser = body.type
    const file = body.file
    // Kiểm tra xem file có tồn tại và là File object không
    if (!file || !(file instanceof File)) {
        return context.json({ error: 'No valid file uploaded' }, 400)
    }
    const allowedExtensions = ['.xls', '.xlsx'];
    const fileName = file.name;
    if (!allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
        return context.json({ error: 'Unsupported file extension' }, 400);
    }
    const fileSize = file.size; // Kích thước file trong byte
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxFileSize) {
        return context.json({ error: 'File size exceeds 50MB' }, 400);
    }
    try {
        // Đọc file Excel
        const UserType = await prisma.userType.findFirst({
            where: { code: typeUser }, // Tìm kiếm UserType của Sinh viên
        })

        if (!UserType) {
            return context.json({ error: 'Không tìm thấy loại hồ sơ' }, 400)
        }
        console.log("UserTypeId", UserType?.id);

        // Đọc file Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
            return context.json({ error: 'No sheets found in the uploaded Excel file' }, 400)
        }
        const sheet = workbook.Sheets[sheetName]

        if (!sheet) {
            return context.json({ error: 'Sheet is undefined in the uploaded Excel file' }, 400)
        }

        // Chuyển đổi dữ liệu từ sheet thành JSON
        const rowData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let jsonData;
        // Duyệt dòng 11 theo mẫu

        await prisma.$transaction(async (prisma) => {
            jsonData = await Promise.all(
                (rowData as any[][]).slice(11).map(async (row: any[], index: number) => {
                    const userProfile = await prisma.userProfile.create({
                        data: {
                            userTypeId: UserType?.id,
                            firstName: splitFullName(row[2]).firstName || '',
                            lastName: splitFullName(row[2]).lastName || '',
                            code: row[1] || '', // Mã
                            gender: row[3] === "Nam" ? "Male" : "Female", // Giới tính
                            dateOfBirth: parseDate(row[4]), // Chuyển đổi thành Date
                            homeTown: row[5] || '', // Quê quán
                            idCardNumber: row[6] || '', // CCCD
                            phoneNumber: row[7] || '', // Số điện thoại
                        },
                    });
                    // console.log("userProfile", userProfile);
                    return userProfile;
                })
            );
            return jsonData;
        });
        return context.json(jsonData,200)
    } catch (error) {
        console.error('Error processing Excel file:', error)
        return context.json({ error: 'Failed to process Excel file' }, 400)
    }
}



const updateFileUserProfile = async (context: any): Promise<any> => {
    const body = await context.req.parseBody() // Parse multipart form data
    const typeUser = body.type
    const file = body.file
    // Kiểm tra xem file có tồn tại và là File object không
    if (!file || !(file instanceof File)) {
        return context.json({ error: 'No valid file uploaded' }, 400)
    }
    const allowedExtensions = ['.xls', '.xlsx'];
    const fileName = file.name;
    if (!allowedExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
        return context.json({ error: 'Unsupported file extension' }, 400);
    }
    const fileSize = file.size; // Kích thước file trong byte
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (fileSize > maxFileSize) {
        return context.json({ error: 'File size exceeds 50MB' }, 400);
    }

    try {
        // Đọc file Excel
        const UserType = await prisma.userType.findFirst({
            where: { code: typeUser }, // Tìm kiếm UserType của Sinh viên
        })
        if (!UserType) {
            return context.json({ error: 'Không tìm thấy loại hồ sơ' }, 400)
        }
        // Đọc file Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
            return context.json({ error: 'No sheets found in the uploaded Excel file' }, 400)
        }
        const sheet = workbook.Sheets[sheetName]

        if (!sheet) {
            return context.json({ error: 'Sheet is undefined in the uploaded Excel file' }, 400)
        }

        // Chuyển đổi dữ liệu từ sheet thành JSON
        const rowData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let jsonData;
        // Duyệt dòng 11 theo mẫu

        await prisma.$transaction(async (prisma) => {
            jsonData = await Promise.all(
                (rowData as any[][]).slice(2).map(async (row: any[], index: number) => {      
                    const userProfile = await prisma.userProfile.create({
                        data: {
                            userTypeId: UserType?.id,
                            firstName: splitFullName(row[2]).firstName || '',
                            lastName: splitFullName(row[2]).lastName || '',
                            code: row[1] || '', // Mã
                            gender: row[3] === "Nam" ? "Male" : "Female", // Giới tính
                            dateOfBirth: parseDate(row[4]), // Chuyển đổi thành Date
                            homeTown: row[5] || '', // Quê quán
                            idCardNumber: row[6] || '', // CCCD
                            phoneNumber: row[7] || '', // Số điện thoại
                        },
                    });
                    // console.log("userProfile", userProfile);
                    return userProfile;
                })
            );
            return jsonData;
        });
        return context.json(jsonData,200)
    } catch (error) {
        console.error('Error processing Excel file:', error)
        return context.json({ error: 'Failed to process Excel file' }, 400)
    }
}
export default
{
    uploadFileUserProfile,
    updateFileUserProfile,
}