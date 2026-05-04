<p align="center">
  <a href="https://www.uit.edu.vn/" title="Trường Đại học Công nghệ Thông tin">
    <img src="/docs/uit.png" alt="Trường Đại học Công nghệ Thông tin | University of Information Technology">
  </a>
</p>
<h1 align="center"><b>NT118 - PHÁT TRIỂN ỨNG DỤNG TRÊN THIẾT BỊ DI ĐỘNG</b></h1>

## BẢNG MỤC LỤC

- [Giới thiệu môn học](#giới-thiệu-môn-học)
- [Giới thiệu đồ án môn học](#giới-thiệu-đồ-án-môn-học)
- [Thành viên nhóm](#thành-viên-nhóm)
- [Cài đặt và khởi chạy](#cài-đặt-phần-mềm)
- [Cấu trúc dự án](#khởi-chạy-dự-án)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)

## GIỚI THIỆU MÔN HỌC

- **Tên môn học**: Phát triển ứng dụng trên thiết bị di động - Mobile Application Development
- **Mã môn học**: NT118
- **Lớp học**: NT118.Q22
- **Năm học**: HK2 2025-2026
- **Giảng viên hướng dẫn:** ThS. **Trần Hồng Nghi**
- **Email:** *nghith@uit.edu.vn*

---

## GIỚI THIỆU ĐỒ ÁN MÔN HỌC

- **Đề tài đồ án nhóm:** Hippimo - Ứng dụng quản lý chi tiêu cá nhân kết hợp AI

---

## THÀNH VIÊN NHÓM

| STT |   MSSV   |                                                                       Họ và Tên |                  Email |
| --- | :------: | ------------------------------------------------------------------------------: | ---------------------: |
| 1   | 23521142 | Lê Thành Phát ([LeThanhPhat-ATTT2023](https://github.com/LeThanhPhat-ATTT2023)) | 23521142@gm.uit.edu.vn |
| 2   | 23521167 |                   Nguyễn Chấn Phong ([Ngchphong](https://github.com/Ngchphong)) | 23521167@gm.uit.edu.vn |
| 3   | 23521757 |                                 Nguyễn Lộc Tỷ ([ltln](https://github.com/ltln)) |         louis@lt.id.vn |

---

## CÀI ĐẶT VÀ KHỞI CHẠY

### 1. Yêu cầu môi trường

- **Node.js** bản LTS, khuyến nghị `>= 20`
- **npm** để cài đặt dependency và chạy script
- **Android Studio** nếu muốn chạy trên Android Emulator hoặc thiết bị Android
- **Xcode** nếu muốn chạy trên iOS (chỉ khả dụng trên macOS)
- **Expo Dev Client** để kiểm thử ứng dụng

### 2. Cài đặt dependency

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Nếu dùng Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

_(Tùy chọn nếu dev Backend)_ Cập nhật các biến cần thiết trong `.env`:

```env
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api/v1
```

Lưu ý:

- `EXPO_PUBLIC_API_BASE_URL` là địa chỉ backend mà ứng dụng sẽ gọi tới.
- `http://10.0.2.2:3000` phù hợp khi chạy ứng dụng trên **Android Emulator** và backend chạy trên máy local.
- Nếu chạy trên thiết bị thật hoặc môi trường khác, hãy đổi sang IP/URL backend tương ứng.
- Nếu cần đăng nhập Google trên iOS, bổ sung thêm biến `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` vào file `.env`.

### 4. Khởi chạy dự án

Khởi động Expo development server:

```bash
npm run start
```

Chạy với Expo Dev Client:

```bash
npm run dev
```

Chạy trên Android:

```bash
npm run android
```

Chạy trên iOS:

```bash
npm run ios
```

### 5. Một số lệnh hỗ trợ

Kiểm tra lỗi lint:

```bash
npm run lint
```

Kiểm tra kiểu dữ liệu TypeScript:

```bash
npm run typecheck
```

Format mã nguồn:

```bash
npm run format:fix
```

### 6. Ghi chú

- Dự án hiện dùng **Expo Router**, **Expo Dev Client**, `expo-auth-session` và `expo-secure-store`.
- Nếu gặp lỗi thiếu native module khi test đăng nhập Google hoặc lưu phiên đăng nhập, hãy rebuild và cài lại **Expo Dev Client**.
