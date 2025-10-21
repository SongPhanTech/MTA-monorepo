"use client";
import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { Button } from 'antd';

// 1. IMPORT HÀM CHÍNH XÁC
import { downloadXlsx, generateXlsx } from 'xlsx-template-browser';

// Định nghĩa Props không đổi
interface IExcelDownloaderProps {
    templateUrl: string;
    data: object;
    outputFileNamePrefix?: string;
    children: React.ReactNode;
    onError?: (error: Error) => void;
    /**
     * (Tùy chọn) Chỉ định sheet cần điền dữ liệu.
     * Mặc định là 1 (sheet đầu tiên).
     */
    sheetNumber?: number;
}
// Interface IMonHoc (Không thay đổi)
export interface IMonHoc {
    TenMonhoc: string
    MaMH: string
    soTC: number
    diem01: number
    diem02: number
    diem07: number
    diemhe10: number
    diemhe4: number
    diemchu: string
    ghichu: string
}


export interface IHocKi {
    TenHocKi: string;
    SoTinChiKy: number; 
    DiemTBKyHe10: number; 
    DiemTBKyHe4: number; 
    monHocs: IMonHoc[]; 
}

export interface IBaoCaoDiem {
    fullname: string
    dateOfBirth: string
    maSV: string
    htdt: string
    nganh: string
    lop: string
    
 
    hocKis: IHocKi[]; 

    SoTinChiTichLuy: number;
    DiemTBTichLuyHe10: number;
    DiemTBTichLuyHe4: number;
}

const ExcelTemplateDownloader: React.FC<IExcelDownloaderProps> = ({
    templateUrl,
    data,
    outputFileNamePrefix = 'BaoCao',
    children
}) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            // ---- BẮT ĐẦU PHẦN KIỂM TRA ----
            const response = await fetch(templateUrl);
    
            // Ghi log để xem chuyện gì xảy ra
            console.log("Fetching template. Status:", response.status);
            console.log("Content-Type:", response.headers.get('Content-Type'));
    
            // Kiểm tra xem request có thành công không
            if (!response.ok) {
                // Nếu là 404 hoặc 500, ném ra lỗi rõ ràng
                throw new Error(`Không thể tải template: ${response.status} ${response.statusText} (URL: ${templateUrl})`);
            }
            // ---- KẾT THÚC PHẦN KIỂM TRA ----
    
            const templateArrayBuffer = await response.arrayBuffer();
    
            console.log("Template data:", data);
            console.log("Generating Excel file...");
            const outputBlob = await generateXlsx(
                templateArrayBuffer,
                data 
            );
    
            const time = dayjs().format('DDMMYYYY_HHmm');
            const fileName = `${outputFileNamePrefix}_${time}.xlsx`;
            saveAs(outputBlob, fileName);
    
        } catch (error: any) {
            console.error('Lỗi khi tạo file Excel:', error);
            alert(error.message || 'Đã xảy ra lỗi khi tạo file Excel.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="primary"
            onClick={handleDownload}
            loading={loading}
        >
            {children}
        </Button>
    );
};

export default ExcelTemplateDownloader;