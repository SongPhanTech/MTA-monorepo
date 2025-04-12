import { prisma } from '../..'
import * as XLSX from 'xlsx'
import templateService from './template.service'

import { promises as fs } from 'fs'
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';


const uploadExcelCreateFixedClass = async (context: any): Promise<any> => {
    const body = await context.req.parseBody() // Parse multipart form data
    const trainingCourseId = body.trainingCourseId // Mã khóa học
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

        // Kiểm tra mã khóa có trùng với đầu vào không để tránh nhập nhầm
        const cellAddress = 'C8';
        const cell = sheet[cellAddress];
        const cellValue = cell ? cell.v : null;
        console.log(`Giá trị ô ${cellAddress}:`, cellValue);

        const TrainingCourse = await prisma.trainingCourse.findFirst({
            where: { id: trainingCourseId }, // Tìm kiếm UserType của Sinh viên
        })

        if (!TrainingCourse?.code) {
            return context.json({ error: 'Không tìm thấy khóa học' }, 400)
        }
        if (TrainingCourse?.code != cellValue) {
            return context.json({ error: 'Mã khóa học không trùng khớp' }, 400)
        }
        if (TrainingCourse?.status != "ACTIVE") {
            return context.json({ error: 'Khóa học đã đóng' }, 400)
        }
        console.log("trainingCourseId", trainingCourseId);

        // Duyệt dòng 11 theo mẫu
        await prisma.$transaction(async (prisma) => {
            jsonData = await Promise.all(
                (rowData as any[][]).slice(11).map(async (row: any[], index: number) => {
                    const fixedClass = await prisma.fixedClass.create({
                        data: {
                            trainingCourseId: TrainingCourse?.id,
                            name: row[1], // Tên lớp
                            code: row[2],// Mã lớp
                            classSize: (() => {
                                console.log("row[3]", row[3], row[0]);
                                const size = parseInt(row[3], 10);
                                return isNaN(size) ? 0 : size;
                            })() // Sĩ số converted to int
                        },
                    });
                    // console.log("userProfile", userProfile);
                    return fixedClass;
                })
            );
            return jsonData;
        });
        return context.json(jsonData, 200)
    } catch (error) {
        console.error('Error processing Excel file:', error)
        return context.json({ error: 'Failed to process Excel file' }, 400)
    }
}

const classDivision = async (context: any): Promise<any> => {
    const body = await context.req.parseBody() // Parse multipart form data

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
                    const fixedClass = await prisma.fixedClass.findFirst({
                        where: { code: row[7] }, // Tìm kiếm lớp biên chế
                    })
                    if (!fixedClass) {
                        return 'Không tìm thấy lớp biên chế' + ' ' + row[7]
                    }
                    const userProfile = await prisma.userProfile.findFirst({
                        where: { code: row[1] }, // Tìm kiếm UserType của Sinh viên
                    })
                    if (!userProfile) {
                        return 'Không tìm thấy học viên' + ' ' + row[1]
                    }
                    let fixedClassStudent = await prisma.fixedClassStudent.findFirst({
                        where: { userProfileId: userProfile.id, fixedClassId: fixedClass.id },
                    });
                    if (!fixedClassStudent) {
                        fixedClassStudent = await prisma.fixedClassStudent.create({
                            data: {
                                fixedClassId: fixedClass.id,
                                userProfileId: userProfile.id,
                            },
                        });
                    }
                    // console.log("userProfile", userProfile);
                    return fixedClassStudent;

                })
            );
            return jsonData;
        });
        return context.json(jsonData, 200)
    } catch (error) {
        console.error('Error processing Excel file:', error)
        return context.json({ error: 'Failed to process Excel file' }, 400)
    }
}

export class StudentInfo {
    stt: number | undefined
    id: string | undefined
    name: string | undefined
    code: string | undefined
    DoB: string | undefined
    HomeTown: string | undefined
}

const exportFixedClassByCourse = async (context: any): Promise<any> => {
    const query = context.req.valid('query')
    const fixedClassId = query.fixedClassId

    // dạng thông tin
    const content = await getContent(fixedClassId)
    console.log("content", content);
    const fixedClass = await prisma.fixedClass.findFirst({
        where: { id: fixedClassId }, // Tìm kiếm lớp biên chế
    })
    if (!fixedClass) {
        console.log("Không tìm thấy lớp biên chế nào", fixedClassId);
        return 404;
    }
    const { date, month, year } = templateService.getCurrentDateForReport()
    // console.log("fixedClass", date, month, year, fixedClass.name);
    // dạng bảng

    const templateData = {
        fields: [
            date,
            month,
            year,
            fixedClass.name,
        ],
        cellValues: {
            sheet: content.map((item: StudentInfo) => ({
                ["A"]: item.stt,
                ["B"]: item.code,
                ["C"]: item.name,
                ["D"]: item.DoB,
                ["E"]: item.HomeTown,
            })),
        }
    }
    // console.log("templateData", templateData);

    const docxBuffer = await templateService.getBufferFromUrl('LIST_STUDENT_FIXCLASS');
    const templateZip = new PizZip(docxBuffer);
    const document = new Docxtemplater(templateZip, {
        paragraphLoop: true,
        linebreaks: true,
    });
    const fillData: Record<number, any> = templateData.fields.reduce(
        (obj, value, index) => {
            obj[index + 1] = value;
            return obj;
        },
        {} as Record<number, any>,
    );

    const tableData = templateData.cellValues;
    const data = {
        ...fillData,
        ...tableData
    };
    // console.log("data", data);
    const reportDocx = document.render(data);
    return new Response(reportDocx.getZip().generate({ type: 'nodebuffer' }), {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': 'attachment; filename="DSLop_' + fixedClass.name + '.docx"',
        },
    })
}

const getContent = async (fixedClassId: string) => {
    const ListStudentInfo: StudentInfo[] = []


    let stt = 1;
    try {
        let fixedClasses;
        if (fixedClassId) {
            fixedClasses = await prisma.fixedClassStudent.findMany({
                include: {
                    UserProfile: true
                },
                where: {
                    fixedClassId: fixedClassId,
                }
            });
            let studentInfo: StudentInfo | undefined;
            for (const userProfile of fixedClasses) {
                // console.log("userProfile", userProfile.UserProfile.firstName);
                studentInfo = new StudentInfo();
                studentInfo.stt = stt++;
                studentInfo.id = userProfile.UserProfile.id;
                studentInfo.name = userProfile.UserProfile.lastName + ' ' + userProfile.UserProfile.firstName;
                studentInfo.code = userProfile.UserProfile.code ? userProfile.UserProfile.code : ' ';
                studentInfo.DoB = userProfile.UserProfile.dateOfBirth
                    ? new Date(userProfile.UserProfile.dateOfBirth).toLocaleDateString('vi-VN')
                    : ' ';
                studentInfo.HomeTown = userProfile.UserProfile.homeTown ? userProfile.UserProfile.homeTown : ' ';

                ListStudentInfo.push(studentInfo);
            }
        } else {
            console.log("Không tìm thấy lớp biên chế nào", fixedClassId);
            return [];
        }
        return ListStudentInfo;
    } catch (error) {
        return [];
    }
}

const ListStudentInfo = async (fixedClassId: string) => {
    const ListStudentInfo: StudentInfo[] = []


    let stt = 1;
    try {
        let fixedClasses;
        if (fixedClassId) {
            fixedClasses = await prisma.fixedClassStudent.findMany({
                include: {
                    UserProfile: true
                },
                where: {
                    fixedClassId: fixedClassId,
                }
            });
            let studentInfo: StudentInfo | undefined;
            for (const userProfile of fixedClasses) {
                // console.log("userProfile", userProfile.UserProfile.firstName);
                studentInfo = new StudentInfo();
                studentInfo.stt = stt++;
                studentInfo.id = userProfile.UserProfile.id;
                studentInfo.name = userProfile.UserProfile.lastName + ' ' + userProfile.UserProfile.firstName;
                studentInfo.code = userProfile.UserProfile.code ? userProfile.UserProfile.code : ' ';
                studentInfo.DoB = userProfile.UserProfile.dateOfBirth
                    ? new Date(userProfile.UserProfile.dateOfBirth).toLocaleDateString('vi-VN')
                    : ' ';
                studentInfo.HomeTown = userProfile.UserProfile.homeTown ? userProfile.UserProfile.homeTown : ' ';

                ListStudentInfo.push(studentInfo);
            }
        } else {
            console.log("Không tìm thấy lớp biên chế nào", fixedClassId);
            return [];
        }
        return ListStudentInfo;
    } catch (error) {
        return [];
    }
}

export default
{
    uploadExcelCreateFixedClass,
    classDivision,
    exportFixedClassByCourse
}