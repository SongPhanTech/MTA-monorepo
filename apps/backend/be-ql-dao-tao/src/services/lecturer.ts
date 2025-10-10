import { ExamType, SubjectClassSchedule } from '@workspace/db'
import { prisma } from '..'

const getExamTypeVietNamese = (examType: ExamType) => {
    switch (examType) {
        // case ExamType.OfflineChoices:
        // return 'Trắc nghiệp Trực tiếp'
        // case ExamType.OnlineChoices:
        // return 'Trắc nghiệp Trực tuyến'
        case ExamType.OfflineWritten:
            return 'Tự luận Trực tiếp'
        // case ExamType.OnlineWritten:
        //     return 'Tự luận Trực tuyến'
        case ExamType.Oral:
            return 'Vấn đáp'
        case ExamType.Practice:
            return 'Thực hành'
        case ExamType.Project:
            return 'BTL'
        default:
            return ''
    }
}

const getScheduleVietNamese = (schedule: SubjectClassSchedule) => {
    // Chuyển đổi lịch học sang tiếng Việt
    switch (schedule) {
        case SubjectClassSchedule.MORNING:
            return 'Sáng'
        case SubjectClassSchedule.AFTERNOON:
            return 'Chiều'
        case SubjectClassSchedule.EVENING:
            return 'Tối'
        default:
            return ''
    }
}

export const getDataForExportEachSheetTable = async (
    organizationId: string,
    semesterId: string,
    subjectClassList: any[]
) => {
    let rowIndex = 10
    const dataResult: { cell: string; text: string }[] = []
    const merges: string[] = [] // Mảng riêng để lưu các lệnh gộp ô

    const groupedBySubject = new Map<string, any[]>()

    subjectClassList.forEach((subjectClass) => {
        const subjectName = subjectClass.subject.name
        if (!groupedBySubject.has(subjectName)) {
            groupedBySubject.set(subjectName, [])
        }
        groupedBySubject.get(subjectName)?.push(subjectClass)
    })

    console.log(`Grouped by subject: ${groupedBySubject.size} subjects found`)
    let stt = 0
    for (const subjectGroup of groupedBySubject.values()) {
        stt++
        const startRow = rowIndex // Ghi nhớ dòng bắt đầu của nhóm
        const groupSize = subjectGroup.length // Tổng số lớp trong nhóm
        const firstClassInGroup = subjectGroup[0] // Lấy thông tin chung từ lớp đầu tiên

        dataResult.push({ cell: `A${startRow}`, text: stt.toString() })
        dataResult.push({ cell: `B${startRow}`, text: firstClassInGroup.subject.code || '' })
        dataResult.push({ cell: `C${startRow}`, text: firstClassInGroup.subject.name || '' })
        dataResult.push({
            cell: `D${startRow}`,
            text: firstClassInGroup.subject.credit.toString() || '',
        })
        dataResult.push({
            cell: `E${startRow}`,
            text: (firstClassInGroup.subject.period / 15).toString() || '',
        })
        dataResult.push({
            cell: `F${startRow}`,
            text: firstClassInGroup.subject.period.toString() || '',
        })
        dataResult.push({ cell: `G${startRow}`, text: groupSize.toString() })

        if (groupSize > 1) {
            const endRow = startRow + groupSize - 1
            merges.push(`A${startRow}:A${endRow}`) // Gộp cột STT
            merges.push(`B${startRow}:B${endRow}`) // Gộp cột Mã HP
            merges.push(`C${startRow}:C${endRow}`) // Gộp cột Tên HP
            merges.push(`D${startRow}:D${endRow}`) // Gộp cột Tín chỉ
            merges.push(`E${startRow}:E${endRow}`) // Gộp cột ĐVHT
            merges.push(`F${startRow}:F${endRow}`) // Gộp cột Số tiết
            merges.push(`G${startRow}:G${endRow}`) // Gộp cột Số lớp
            // console.log(`Merged cells in sheet ${merges}`);
        }

        subjectGroup.forEach((subjectClass) => {
            dataResult.push({
                cell: `H${rowIndex}`,
                text: getScheduleVietNamese(subjectClass.schedule) || '',
            })
            dataResult.push({
                cell: `I${rowIndex}`,
                text: (subjectClass.subjectClassStudent?.length || 0).toString(),
            })
            dataResult.push({ cell: `J${rowIndex}`, text: subjectClass.code || 'code' })
            const classNames = subjectClass.fixedClasses
                .map((fc: { name: any }) => fc.name)
                .join(', ')
            dataResult.push({ cell: `K${rowIndex}`, text: classNames || '' })
            dataResult.push({
                cell: `L${rowIndex}`,
                text: subjectClass.room?.building?.trainingLocation?.name || '',
            })
            dataResult.push({
                cell: `M${rowIndex}`,
                text: subjectClass.mainLecturer?.userProfile?.fullname || '',
            })
            dataResult.push({
                cell: `N${rowIndex}`,
                text: subjectClass.extraLecturer?.userProfile?.fullname || '',
            })
            dataResult.push({ cell: `O${rowIndex}`, text: subjectClass.room?.name || '' })
            dataResult.push({
                cell: `P${rowIndex}`,
                text: getExamTypeVietNamese(subjectClass.examType as ExamType) || '',
            })

            rowIndex++
        })
    }
    return { data: dataResult, merges: merges }
}

export const exportPCGDdata = async (organizationId: string, semesterId: string) => {
    const finalResult = {
        cellData: [] as { sheet: string; cell: string; text: string; style?: any }[],
        mergeData: {} as { [key: string]: string[] },
    }
    const SemesterSelection = await prisma.semester.findFirst({
        where: {
            id: semesterId,
        },
        include: {
            schoolYear: true,
        },
    })
    if (!SemesterSelection) {
        throw new Error(`Semester with ID ${semesterId} not found`)
    }

    const OrganizationSelect = await prisma.dM_DonVi.findFirst({
        where: {
            Id: organizationId,
        },
    })
    if (!OrganizationSelect) {
        throw new Error(`Organization with ID ${organizationId} not found`)
    }

    const ListChildrenOrganization = await prisma.dM_DonVi.findMany({
        where: {
            sParentId: organizationId,
        },
        orderBy: {
            sTen: 'asc',
        },
        //TODO: Xoá khi test xong
        // take: 1,
    })

    const lengthChildren = ListChildrenOrganization.length

    // Lấy danh sách lớp môn học
    const subjectClassList = await prisma.subjectClass.findMany({
        where: {
            semesterId: semesterId,
            // TODO: xoá khi xong dữ liệu
            // subject: {
            //     managementOrganizationId: organizationId
            // }
        },
        include: {
            subject: true,
            fixedClasses: true,
            room: {
                include: {
                    building: {
                        include: {
                            trainingLocation: true,
                        },
                    },
                },
            },
            mainLecturer: {
                include: {
                    userProfile: true,
                },
            },
            extraLecturer: {
                include: {
                    userProfile: true,
                },
            },
            subjectClassStudent: true,
        },
        orderBy: {
            subject: {
                name: 'asc',
            },
        },
    })

    // Nếu không có đơn vị cấp con thì chỉ hiển thị đơn vị chính truyền vào
    if (lengthChildren === 0) {
    }
    // Nếu có đơn vị cấp con thì hiển thị danh sách các đơn vị cấp con
    else {
        for (const childrenOrganization of ListChildrenOrganization) {
            console.log(`Child Organization: ${childrenOrganization.sTen}`)
            // Hearder
            // Khoa
            finalResult.cellData.push({
                cell: 'D3',
                sheet: childrenOrganization.sCode || 'Data',
                text: OrganizationSelect.sTen || '',
                style: { font: { bold: true } },
            })
            // Bộ môn
            finalResult.cellData.push({
                cell: 'J3',
                sheet: childrenOrganization.sCode || 'Data',
                text: childrenOrganization.sTen || '',
                style: { font: { bold: true } },
            })
            // Học kỳ
            finalResult.cellData.push({
                cell: 'D4',
                sheet: childrenOrganization.sCode || 'Data',
                text: `Học kỳ ${SemesterSelection.name}` || '',
            })
            // Năm học
            finalResult.cellData.push({
                cell: 'F4',
                sheet: childrenOrganization.sCode || 'Data',
                text: `Năm học: ${SemesterSelection.schoolYear.name}` || '',
            })

            const { data, merges } = await getDataForExportEachSheetTable(
                childrenOrganization.Id,
                semesterId,
                subjectClassList
            )
            console.log(
                `Data length for ${childrenOrganization.sCode}: ${data.length} ${merges.length > 0 ? `with ${merges.length} merges` : ''}`
            )
            data.forEach((item) => {
                finalResult.cellData.push({
                    ...item,
                    sheet: childrenOrganization.sCode || 'Data',
                    style: {
                        font: { name: 'Times New Roman', size: 13 },
                        border: {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' },
                        },
                        // Thêm thuộc tính alignment vào đây
                        alignment: {
                            horizontal: 'center',
                            vertical: 'middle',
                        },
                    },
                })
            })
            if (merges.length > 0) {
                finalResult.mergeData[childrenOrganization.sCode || 'Data'] = merges
            }
        }
    }
    console.log(`Final result cellData length: ${finalResult.cellData.length}`)
    return finalResult
}
