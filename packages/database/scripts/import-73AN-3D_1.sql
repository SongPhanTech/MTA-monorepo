-- Import 73AN-3D_1 essay questions into QuestionBank
-- Bank: cms5jz1sf0001sh3196x8vxp4 | count: 45
BEGIN;
UPDATE "khao-thi"."Question" SET "deletedAt" = NOW()
WHERE "questionBankId" = 'cms5jz1sf0001sh3196x8vxp4' AND "deletedAt" IS NULL;
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c5tz99ka3tc43ue8q7ygcsrxs', '73AN-3D_1-C001', true, 'Phân tích chức năng của tầng vật lý trong mô hình OSI?', 'ESSAY', 3.0, '-   Mã hóa tín hiệu đường truyền.
1.5 đ
Điều chế tín hiệu.
1.5 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cqnq9y12zzll66pkpt1xhxvyi', '73AN-3D_1-C002', true, 'Phân tích chức năng của tầng liên kết dữ liệu trong mô hình OSI ?', 'ESSAY', 3.0, 'Điều khiển liên kết logic: Tạo và tái tạo khung tin; Kiểm soát lỗi và điều khiển luồng; Phát hiện và sửa lỗi.
2.0 đ
Điều khiển truy cập thiết bị.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('czp4718asfti1ibqdoyvyjr03', '73AN-3D_1-C003', true, 'Trình bày phương pháp mã hóa NRZ-L. Phân tích ưu nhược điểm của NRZ-L. Sử dụng phương pháp mã hóa NRZ-L biến đổi chuỗi bit dữ liệu sau thành tín hiệu với giả thiết bit cuối cùng trước đó có mức logic dương:  
a. 01010101
b. 00110011
Hãy vẽ đồ thị tín hiệu tương ứng với các chuỗi dữ liệu đã cho.', 'ESSAY', 4.0, '-  Trình bày phương pháp mã hóa NRZ-L, phân tích ưu nhược điểm của mã  NRZ-L.
2.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (a).
1.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (b).
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('ce731wsgbe4h5tpu86uuxr1kn', '73AN-3D_1-C004', true, 'Trình bày phương pháp mã hóa NRZ-I. Phân tích ưu nhược điểm của NRZ-I. Sử dụng phương pháp mã hóa NRZ-I biến đổi chuỗi bit dữ liệu sau thành tín hiệu với giả thiết bit cuối cùng trước đó có mức logic dương:  
a. 01010101
b. 00110011
Hãy vẽ đồ thị tín hiệu tương ứng với các chuỗi dữ liệu đã cho.', 'ESSAY', 4.0, '-  Trình bày phương pháp mã hóa NRZ-I, phân tích ưu nhược điểm của mã   NRZ-I.
2.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (a).
1.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (b).
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c4l25iz5o33qxx02jpe0vm7uf', '73AN-3D_1-C005', true, 'Trình bày phương pháp mã hóa Manchester. Phân tích ưu nhược điểm của Manchester. Sử dụng phương pháp mã hóa Manchester biến đổi chuỗi bit dữ liệu sau thành tín hiệu với giả thiết bit cuối cùng trước đó có mức logic dương:  
a. 01010101
b. 00110011
Hãy vẽ đồ thị tín hiệu tương ứng với các chuỗi dữ liệu đã cho.', 'ESSAY', 4.0, '-  Trình bày phương pháp mã hóa Manchester, phân tích ưu nhược điểm của mã  Manchester.
2.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (a).
1.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (b).
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cz3a7bk707jl4iia3eiyofjkc', '73AN-3D_1-C006', true, 'Trình bày phương pháp mã hóa Manchester vi sai. Phân tích ưu nhược điểm của Manchester. Sử dụng phương pháp mã hóa Manchester vi sai biến đổi chuỗi bit dữ liệu sau thành tín hiệu với giả thiết bit cuối cùng trước đó có mức logic dương:  
a. 01010101
b. 00110011
Hãy vẽ đồ thị tín hiệu tương ứng với các chuỗi dữ liệu đã cho.', 'ESSAY', 4.0, '-  Trình bày phương pháp mã hóa Manchester vi sai, phân tích ưu nhược điểm của mã  Manchester vi sai.
2.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (a).
1.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (b).
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cvnzf2o1e4k11ml0k6vtv2vft', '73AN-3D_1-C007', true, 'Trình bày phương pháp mã hóa AMI. Phân tích ưu nhược điểm của AMI. Sử dụng phương pháp mã hóa AMI biến đổi chuỗi bit dữ liệu sau thành tín hiệu với giả thiết bit cuối cùng trước đó có mức logic dương:  
a. 01010101
b. 00110011
Hãy vẽ đồ thị tín hiệu tương ứng với các chuỗi dữ liệu đã cho.', 'ESSAY', 4.0, '-  Trình bày phương pháp mã hóa AMI, phân tích ưu nhược điểm của mã  AMI.
2.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (a).
1.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (b).
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cp692r6g5rrdccgq6ebsfjhv7', '73AN-3D_1-C008', true, 'Trình bày phương pháp mã hóa 2B1Q. Phân tích ưu nhược điểm của 2B1Q. Sử dụng phương pháp mã hóa 2B1Q biến đổi chuỗi bit dữ liệu sau thành tín hiệu với giả thiết bit cuối cùng trước đó có mức logic dương:  
a. 0101010101010101
b. 0011001100110011
Hãy vẽ đồ thị tín hiệu tương ứng với các chuỗi dữ liệu đã cho.', 'ESSAY', 4.0, '-  Trình bày phương pháp mã hóa 2B1Q, phân tích ưu nhược điểm của mã  2B1Q.
2.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (a).
1.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (b).
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c10l33eqvi35mxcot206w09ci', '73AN-3D_1-C009', true, 'Trình bày phương pháp mã hóa MLT-3. Phân tích ưu nhược điểm của MLT-3. Sử dụng phương pháp mã hóa MLT-3 biến đổi chuỗi bit dữ liệu sau thành tín hiệu với giả thiết bit cuối cùng trước đó có mức logic dương:  
a. 01010101
b. 00011000
Hãy vẽ đồ thị tín hiệu tương ứng với các chuỗi dữ liệu đã cho.', 'ESSAY', 4.0, '-  Trình bày phương pháp mã hóa MLT-3, phân tích ưu nhược điểm của mã  MLT-3.
2.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (a).
1.0 đ
-  Vẽ đồ thị tín hiệu của chuỗi dữ liệu (b).
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cbi9wa7iorx0gekt3zsr1a6od', '73AN-3D_1-C010', true, 'Phân loại các phương pháp điều chế tín hiệu. Trình bày phương pháp ASK và cho ví dụ minh họa, phân tích ưu nhược điểm của phương pháp ASK?', 'ESSAY', 3.0, 'Phân loại các phương pháp điều chế tín hiệu.
0.5 đ
-   Trình bày phương pháp ASK và ví dụ minh họa.
2.0 đ
Phân tích ưu, nhược điểm của phương pháp ASK.
0.5 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c9nhm9882fukjtcv196fxqwzj', '73AN-3D_1-C011', true, 'Phân loại các phương pháp điều chế tín hiệu. Trình bày phương pháp FSK và cho ví dụ minh họa, phân tích ưu nhược điểm của phương pháp FSK?', 'ESSAY', 3.0, 'Phân loại các phương pháp điều chế tín hiệu.
0.5 đ
-   Trình bày phương pháp FSK và ví dụ minh họa.
2.0 đ
Phân tích ưu, nhược điểm của phương pháp FSK.
0.5 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('ctd5oxqyj93ki704tv4k6mk2y', '73AN-3D_1-C012', true, 'Phân loại các phương pháp điều chế tín hiệu. Trình bày phương pháp PSK và cho ví dụ minh họa, phân tích ưu nhược điểm của phương pháp PSK?', 'ESSAY', 3.0, 'Phân loại các phương pháp điều chế tín hiệu.
0.5 đ
-   Trình bày phương pháp FSK và ví dụ minh họa.
2.0 đ
Phân tích ưu, nhược điểm của phương pháp FSK.
0.5 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('ckwq0c1247bpnbc1p30w8ua2t', '73AN-3D_1-C013', true, 'Phân loại các phương pháp điều chế tín hiệu. Trình bày phương pháp QAM và cho ví dụ minh họa, phân tích ưu nhược điểm của phương pháp QAM?', 'ESSAY', 3.0, 'Phân loại các phương pháp điều chế tín hiệu.
0.5 đ
-   Trình bày phương pháp QAM và ví dụ minh họa.
2.0 đ
Phân tích ưu, nhược điểm của phương pháp QAM.
0.5 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cqq083ivl9mng29detlqr5mso', '73AN-3D_1-C014', true, 'Trình bày khái niệm, cơ chế phát hiện và sửa lỗi của mã khối?', 'ESSAY', 3.0, 'Khái niệm mã khối.
0.5 đ
-   Cơ chế phát hiện lỗi của mã khối.
1.0 đ
Cơ chế sửa lỗi của mã khối.
1.5 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cm78my4f9r2lupuku4tsi05wc', '73AN-3D_1-C015', true, 'Trình bày khái niệm mã khối tuyến tính, các đặc tính và cơ chế phát hiện lỗi của mã kiểm tra chẵn – lẻ (parity-check code), cho ví dụ minh họa?', 'ESSAY', 3.0, 'Khái niệm mã khối tuyến tính.
0.5 đ
-   Mã kiểm tra chẵn – lẻ và các đặc tính của mã kiểm tra chẵn – lẻ.
0.5 đ
Cơ chế phát hiện lỗi của mã kiểm tra chẵn – lẻ và ví dụ minh họa.
2.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cqwy3wwbnz8uuiujbyjx8x023', '73AN-3D_1-C016', true, 'Trình bày khái niệm mã khối tuyến tính, các đặc tính và cơ chế phát hiện lỗi, sửa lỗi của mã Hamming, cho ví dụ minh họa?', 'ESSAY', 3.0, 'Khái niệm mã khối tuyến tính.
0.5 đ
-   Mã Hamming và các đặc tính của mã Hamming.
0.5 đ
Cơ chế phát hiện và sửa lỗi của mã Hamming, ví dụ minh họa.
2.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cym8x1mlcacn74wwedx1e6mz2', '73AN-3D_1-C017', true, 'Trình bày khái niệm mã khối tuyến tính, các đặc tính và cơ chế phát hiện lỗi, sửa lỗi  của mã Cyclic, cho ví dụ minh họa?', 'ESSAY', 3.0, 'Khái niệm mã khối tuyến tính.
0.5 đ
-   Mã Cyclic và các đặc tính của mã Cyclic.
0.5 đ
Cơ chế phát hiện và sửa lỗi của mã Cyclic, ví dụ minh họa.
2.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c3fnpomgc97wltyv0ys6ewanj', '73AN-3D_1-C018', true, 'Giả sử một kênh băng cơ sở có độ rộng giải thông 1 MHz, hãy tính tốc độ dữ liệu tương ứng khi sử dụng các phương pháp mã hóa đường truyền:  
a. NRZ
b. Manchster
c. 2B1Q', 'ESSAY', 3.0, 'a. NRZ: N = 2 Mbps.
1.0 đ
b. Manchester: N = 1 Mbps.
1.0 đ
c. 2B1Q: N = 4 Mbps.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c24ivouzmba83d4232kurvxpr', '73AN-3D_1-C019', true, 'Giả sử một kênh băng cơ sở có độ rộng giải thông 1 MHz, hãy tính tốc độ dữ liệu tương ứng khi sử dụng các phương pháp mã hóa đường truyền:  
a. NRZ
b. Manchster
c. MLT-3', 'ESSAY', 3.0, 'a. NRZ: N = 2 Mbps.
1.0 đ
b. Manchester: N = 1 Mbps.
1.0 đ
c. MLT-3: N= 3 Mbps.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('casykg4g1pjj1dz5joqixaikn', '73AN-3D_1-C020', true, 'Giả sử một kênh băng cơ sở có độ rộng giải thông 1 MHz, hãy tính tốc độ dữ liệu tương ứng khi sử dụng các phương pháp mã hóa đường truyền:  
a. NRZ
b. 2B1Q
c. MLT-3', 'ESSAY', 3.0, 'a. NRZ: N = 2 Mbps.
1.0 đ
b. 2B1Q: N = 4 Mbps.
1.0 đ
c. MLT-3: N= 3 Mbps.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c0z92da9vtg4nfvtsukghn8jf', '73AN-3D_1-C021', true, 'Giả sử một kênh băng cơ sở có độ rộng giải thông 1 MHz, hãy tính tốc độ dữ liệu tương ứng khi sử dụng các phương pháp mã hóa đường truyền:  
a. MLT-3
b. Manchster
c. 2B1Q', 'ESSAY', 3.0, 'a. MLT-3: N= 3 Mbps.
1.0 đ
b. Manchester: N = 1 Mbps.
1.0 đ
c. 2B1Q: N = 4 Mbps.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cqchlehmne8nojtus77qflkbn', '73AN-3D_1-C022', true, 'Tính tốc độ baud cho các dạng điều chế với tốc độ bit tương ứng như sau:  
a. FSK, 2000 bps.
b. ASK, 4000 bps.
c. QPSK, 6000 bps.', 'ESSAY', 3.0, 'a. FSK, 2000 bps: S = 2000 baud.
1.0 đ
b. ASK, 4000 bps: S = 4000 baud.
1.0 đ
c. QPSK, 6000 bps: S = 3000 baud.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cxk5klytlmk2r2rk9fclilldx', '73AN-3D_1-C023', true, 'Tính tốc độ baud cho các dạng điều chế với tốc độ bit tương ứng như sau:  
a. FSK, 2000 bps.
b. ASK, 4000 bps.
c. 64-QAM, 36.000 bps.', 'ESSAY', 3.0, 'a. FSK, 2000 bps: S = 2000 baud.
1.0 đ
b. ASK, 4000 bps: S = 4000 baud.
1.0 đ
c. 64-QAM, 36.000 bps: S = 6000 baud.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cwir6qlxjp2p536mlxl15fqdf', '73AN-3D_1-C024', true, 'Tính tốc độ baud cho các dạng điều chế với tốc độ bit tương ứng như sau:  
a. FSK, 2000 bps.
b. QPSK, 6000 bps.
c. 64-QAM, 36.000 bps.', 'ESSAY', 3.0, 'a. FSK, 2000 bps: S = 2000 baud.
1.0 đ
b. QPSK, 6000 bps: S = 3000 baud.
1.0 đ
c. 64-QAM, 36.000 bps: S = 6000 baud.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('ce7a313b9j6ez57u0x449vk0g', '73AN-3D_1-C025', true, 'Tính tốc độ baud cho các dạng điều chế với tốc độ bit tương ứng như sau:  
a. 64-QAM, 36.000 bps.
b. ASK, 4000 bps.
c. QPSK, 6000 bps.', 'ESSAY', 3.0, 'a. 64-QAM, 36.000 bps: S = 6000 baud.
1.0 đ
b. ASK, 4000 bps: S = 4000 baud.
1.0 đ
c. QPSK, 6000 bps: S = 3000 baud.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cnhzk29u23o45v0kfjaz7lkm5', '73AN-3D_1-C026', true, 'Tính tốc độ bit cho các dạng điều chế với tốc độ baud tương ứng như sau:  
a. FSK, 1000 baud.
b. ASK, 1000 baud.
c. BPSK, 1000 baud.', 'ESSAY', 3.0, 'a. FSK, 1000 baud: N = 1000 bps.
1.0 đ
b. ASK, 1000 baud: N = 1000 bps.
1.0 đ
c. BPSK, 1000 baud: N = 1000 bps.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cama2l43ghcmotuw3jaxq9k8a', '73AN-3D_1-C027', true, 'Tính tốc độ bit cho các dạng điều chế với tốc độ baud tương ứng như sau:  
a. FSK, 1000 baud.
b. ASK, 1000 baud.
c. 16-QAM, 1000 baud.', 'ESSAY', 3.0, 'a. FSK, 1000 baud: N = 1000 bps.
1.0 đ
b. ASK, 1000 baud: N = 1000 bps.
1.0 đ
c. 16-QAM, 1000 baud: N= 4000 bps.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cz1pw0n5s0tnwrqig8qu661xm', '73AN-3D_1-C028', true, 'Tính tốc độ bit cho các dạng điều chế với tốc độ baud tương ứng như sau:  
a. FSK, 1000 baud.
b. BPSK, 1000 baud.
c. 16-QAM, 1000 baud.', 'ESSAY', 3.0, 'a. FSK, 1000 baud: N = 1000 bps.
1.0 đ
b. BPSK, 1000 baud: N = 1000 bps.
1.0 đ
c. 16-QAM, 1000 baud: N= 4000 bps.
1.0 đ
 Câu 29
Câu hỏi: Tính tốc độ bit cho các dạng điều chế với tốc độ baud tương ứng như sau:  
a. 16-QAM, 1000 baud.
b. ASK, 1000 baud.
c. BPSK, 1000 baud.
3 đ
a. 16-QAM, 1000 baud: N= 4000 bps.
1.0 đ
b. ASK, 1000 baud: N = 1000 bps.
1.0 đ
c. BPSK, 1000 baud: N = 1000 bps.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c2juqcdrskr509ts8nldc31ym', '73AN-3D_1-C030', true, 'Vẽ đồ thị pha – biên độ tương ứng với các phương pháp điều chế sau:
a. ASK, với các giá trị biên độ cực đại là 1 và 3. 
b. BPSK, với giá trị biên độ cực đại là 2. 
c. QPSK, với giá trị biên độ cực đại là 3.', 'ESSAY', 3.0, 'a. ASK, với các giá trị biên độ cực đại là 1 và 3.
1.0 đ
b. BPSK, với giá trị biên độ cực đại là 2.
1.0 đ
c. QPSK, với giá trị biên độ cực đại là 3.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('ciggy1laeee0d9h06zbj1ss87', '73AN-3D_1-C031', true, 'Vẽ đồ thị pha – biên độ tương ứng với các phương pháp điều chế sau:
a. ASK, với các giá trị biên độ cực đại là 1 và 3. 
b. BPSK, với giá trị biên độ cực đại là 2. 
c. 8-QAM với hai giá trị biên độ đỉnh khác nhau là 1, 3 và bốn pha khác nhau.', 'ESSAY', 3.0, 'a. ASK, với các giá trị biên độ cực đại là 1 và 3.
1.0 đ
b. BPSK, với giá trị biên độ cực đại là 2.
1.0 đ
c. 8-QAM với hai giá trị biên độ đỉnh khác nhau là 1, 3 và bốn pha khác nhau.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cd9u0kowky0kpkayh6s89h75z', '73AN-3D_1-C032', true, 'Vẽ đồ thị pha – biên độ tương ứng với các phương pháp điều chế sau:
a. ASK, với các giá trị biên độ cực đại là 1 và 3. 
b. QPSK, với giá trị biên độ cực đại là 3. 
c. 8-QAM với hai giá trị biên độ đỉnh khác nhau là 1, 3 và bốn pha khác nhau.', 'ESSAY', 3.0, 'a. ASK, với các giá trị biên độ cực đại là 1 và 3.
1.0 đ
b. QPSK, với giá trị biên độ cực đại là 3.
1.0 đ
c. 8-QAM với hai giá trị biên độ đỉnh khác nhau là 1, 3 và bốn pha khác nhau.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('csnzzq0ndiprch0baj6knv9fx', '73AN-3D_1-C033', true, 'Vẽ đồ thị pha – biên độ tương ứng với các phương pháp điều chế sau:
a. 8-QAM với hai giá trị biên độ đỉnh khác nhau là 1, 3 và bốn pha khác nhau. 
b. BPSK, với giá trị biên độ cực đại là 2. 
c. QPSK, với giá trị biên độ cực đại là 3.', 'ESSAY', 3.0, 'a. 8-QAM với hai giá trị biên độ đỉnh khác nhau là 1, 3 và bốn pha khác nhau.
1.0 đ
b. BPSK, với giá trị biên độ cực đại là 2.
1.0 đ
c. QPSK, với giá trị biên độ cực đại là 3.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cu9mbnaf5257sgbrswkh1xkig', '73AN-3D_1-C034', true, 'Vẽ đồ thị pha – biên độ, xác định dạng điều chế (ASK, FSK, PSK hoặc QAM) và giá trị biên độ cực đại tương ứng với các trường hợp sau:
a. Hai điểm tại (2, 0) và (3, 0). 
b. Hai điểm tại (3, 0) và (-3, 0). 
c. Bốn điểm tại (2, 2), (-2, 2), (-2, -2) và (2, -2). 
Trong đó: các số trong ngoặc đơn xác định giá trị của I và Q tương ứng.', 'ESSAY', 3.0, 'a. ASK, peak amplitudes = {2,3}, phase = 0.
1.0 đ
b. BPSK, peak amplitude = 3, phases = {0,180}.
1.0 đ
c. QPSK, peak amplitude = 2.83, phases = {45,135,225,315}.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('czz7vt0szkod0h5ou5357hdrz', '73AN-3D_1-C035', true, 'Vẽ đồ thị pha – biên độ, xác định dạng điều chế (ASK, FSK, PSK hoặc QAM) và giá trị biên độ cực đại tương ứng với các trường hợp sau:
a. Hai điểm tại (2, 0) và (3, 0). 
b. Hai điểm tại (3, 0) và (-3, 0). 
c. Hai điểm tại (0, 2) và (0, -2).
Trong đó: các số trong ngoặc đơn xác định giá trị của I và Q tương ứng.', 'ESSAY', 3.0, 'a. ASK, peak amplitudes = {2,3}, phase = 0.
1.0 đ
b. BPSK, peak amplitude = 3, phases = {0,180}.
1.0 đ
c. BPSK, peak amplitude = 3, phases = {90,270}.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c15pup78cbmcdhjfpiqs720kr', '73AN-3D_1-C036', true, 'Vẽ đồ thị pha – biên độ, xác định dạng điều chế (ASK, FSK, PSK hoặc QAM) và giá trị biên độ cực đại tương ứng với các trường hợp sau:
a. Hai điểm tại (2, 0) và (3, 0). 
b. Bốn điểm tại (2, 2), (-2, 2), (-2, -2) và (2, -2). 
c. Hai điểm tại (0, 2) và (0, -2).
Trong đó: các số trong ngoặc đơn xác định giá trị của I và Q tương ứng.', 'ESSAY', 3.0, 'a. ASK, peak amplitudes = {2,3}, phase = 0.
1.0 đ
b. QPSK, peak amplitude = 2.83, phases = {45,135,225,315}.
1.0 đ
c. BPSK, peak amplitude = 3, phases = {90,270}.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c0m5ul8vchcdz2xwgn8k26gl7', '73AN-3D_1-C037', true, 'Vẽ đồ thị pha – biên độ, xác định dạng điều chế (ASK, FSK, PSK hoặc QAM) và giá trị biên độ cực đại tương ứng với các trường hợp sau:
a. Hai điểm tại (0, 2) và (0, -2). 
b. Hai điểm tại (3, 0) và (-3, 0). 
c. Bốn điểm tại (2, 2), (-2, 2), (-2, -2) và (2, -2). 
Trong đó: các số trong ngoặc đơn xác định giá trị của I và Q tương ứng.', 'ESSAY', 3.0, 'a. BPSK, peak amplitude = 3, phases = {90,270}.
1.0 đ
b. BPSK, peak amplitude = 3, phases = {0,180}.
1.0 đ
c. QPSK, peak amplitude = 2.83, phases = {45,135,225,315}.
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c7mnc9waegybdf25v35rxfh90', '73AN-3D_1-C038', true, 'Tính băng thông cần thiết của kênh truyền, nếu tốc độ bit là 4000 bps khi sử dụng các phương pháp điều chế sau: 
a. ASK
b. FSK với 2Δf = 4 KHz 
c. QPSK 
Giả thiết cho d = 1.', 'ESSAY', 3.0, 'a. B = 8000 Hz
1.0 đ
b. B = 8000 Hz
1.0 đ
c. B = 2000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cw951h5ltvvtpe2rm5zd7cmgb', '73AN-3D_1-C039', true, 'Tính băng thông cần thiết của kênh truyền, nếu tốc độ bit là 4000 bps khi sử dụng các phương pháp điều chế sau: 
a. ASK
b. FSK với 2Δf = 4 KHz 
c. 16-QAM
Giả thiết cho d = 1.', 'ESSAY', 3.0, 'a. B = 8000 Hz
1.0 đ
b. B = 8000 Hz
1.0 đ
c. B = 1000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cm1cmzu42nnpilfokzfcitv42', '73AN-3D_1-C040', true, 'Tính băng thông cần thiết của kênh truyền, nếu tốc độ bit là 4000 bps khi sử dụng các phương pháp điều chế sau: 
a. ASK
b. QPSK 
c. 16-QAM
Giả thiết cho d = 1.', 'ESSAY', 3.0, 'a. B = 8000 Hz
1.0 đ
b. B = 2000 Hz
1.0 đ
c. B = 1000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('c4zh4bcra6q5le9nucg71j3c6', '73AN-3D_1-C041', true, 'Tính băng thông cần thiết của kênh truyền, nếu tốc độ bit là 4000 bps khi sử dụng các phương pháp điều chế sau: 
a. 16-QAM
b. FSK với 2Δf = 4 KHz 
c. QPSK 
Giả thiết cho d = 1.', 'ESSAY', 3.0, 'a. B = 1000 Hz
1.0 đ
b. B = 8000 Hz
1.0 đ
c. B = 2000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('ccqbc3ozs1byk95rupma09o9c', '73AN-3D_1-C042', true, 'Kênh truyền có băng thông 4 KHz, tính số bit tối đa có thể truyền đi khi sử dụng các phương pháp điều chế sau:
a. ASK
b. QPSK 
c. 16-QAM 
Giả thiết cho d = 0.', 'ESSAY', 3.0, 'a. B = 8000 Hz
1.0 đ
b. B = 8000 Hz
1.0 đ
c. B = 2000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('co11mvivnn050xucb2is1x8su', '73AN-3D_1-C043', true, 'Kênh truyền có băng thông 4 KHz, tính số bit tối đa có thể truyền đi khi sử dụng các phương pháp điều chế sau:
a. ASK
b. QPSK 
c. 64-QAM
Giả thiết cho d = 0.', 'ESSAY', 3.0, 'a. B = 8000 Hz
1.0 đ
b. B = 8000 Hz
1.0 đ
c. B = 1000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('coozid72m8bhnxvqzfjnlz552', '73AN-3D_1-C044', true, 'Kênh truyền có băng thông 4 KHz, tính số bit tối đa có thể truyền đi khi sử dụng các phương pháp điều chế sau:
a. ASK
b. 16-QAM 
c. 64-QAM
Giả thiết cho d = 0.', 'ESSAY', 3.0, 'a. B = 8000 Hz
1.0 đ
b. B = 2000 Hz
1.0 đ
c. B = 1000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('crxmbngjvptqs1bo7bioxhxjm', '73AN-3D_1-C045', true, 'Kênh truyền có băng thông 4 KHz, tính số bit tối đa có thể truyền đi khi sử dụng các phương pháp điều chế sau:
a. 64-QAM
b. QPSK 
c. 16-QAM 
Giả thiết cho d = 0.', 'ESSAY', 3.0, 'a. B = 1000 Hz
1.0 đ
b. B = 8000 Hz
1.0 đ
c. B = 2000 Hz
1.0 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
INSERT INTO "khao-thi"."Question"
  (id, code, active, content, type, point, explanation, "isAutoGraded", difficult, "questionBankId", "createdAt", "updatedAt")
VALUES
  ('cvuzg6rcfmbvju02f25s4x8qj', '73AN-3D_1-C046', true, 'Đường truyền có băng thông 1 MHz, cần tạo ra 10 kênh riêng biệt sử dụng công nghệ QAM và mỗi kênh có khả năng gửi ít nhất 10 Mbps. Hãy tính:
a. Số bit tối thiểu trên mỗi baud cho mỗi kênh.
b. Số điểm trong đồ thị pha – biên độ  của mỗi kênh. 
Giả thiết cho d = 0.', 'ESSAY', 3.0, 'a. r = 10
1.5 đ
b. L = 1024 (1024 – QAM)
1.5 đ', false, 'D3', 'cms5jz1sf0001sh3196x8vxp4', NOW(), NOW());
COMMIT;
-- verify: SELECT COUNT(*) FROM "khao-thi"."Question" WHERE "questionBankId"='cms5jz1sf0001sh3196x8vxp4' AND "deletedAt" IS NULL;