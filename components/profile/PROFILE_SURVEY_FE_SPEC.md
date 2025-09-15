## FE ProfileSurvey - Tham chiếu cho Backend

File nguồn: `components/profile/ProfileSurvey.tsx`

Mục tiêu: Liệt kê đầy đủ các field FE đang thu thập cho hai vai trò để BE định nghĩa schema/validation tương ứng và map giá trị khi matching.

### 1) Trường dùng chung (gửi trong cả hai vai trò nếu có giá trị)
- `userId: number` (bắt buộc khi tạo/cập nhật)
- BỎ: `currentLocation` (không còn lưu địa chỉ hiện tại của người thuê). Thay vào đó, lưu mục tiêu tìm trọ qua `preferredCityName` + `preferredWards` (user) hoặc `targetCityName` + `targetWards` (landlord).
- `preferredDistricts?: string[]` – danh sách tên phường (wardName) user ưa thích (đối với role=user) hoặc mục tiêu (role=landlord dùng trường riêng, xem mục 3)
- `contactMethod?: string[]` – ví dụ: "Email", "Điện thoại", "Zalo", "Facebook", ...
- `availableTime?: { weekdays?: string; weekends?: string }`
- `bankAccount?: { bankName: string; accountNumber: string; accountHolder: string }`
- `businessLicense?: string` – URL ảnh giấy phép (chỉ xuất hiện khi role=landlord, nhưng giữ chung type)

Lưu ý: FE đảm bảo không gửi các trường không có giá trị (undefined) trừ những nơi đã nêu bắt buộc.

---

### 2) Người thuê (role = "user")

Các field thu thập và format:
- `dateOfBirth: string` – định dạng ISO `YYYY-MM-DD`
- `gender?: 'male' | 'female' | 'other'`
- `occupation?: string` – FE dùng như "thuê cho" 1 lựa chọn duy nhất:
  - Giá trị: `student | office_worker | family | couple | group_friends`
- `income?: number`
- `preferredCity?: string` – tên Tỉnh/Thành phố user muốn tìm trọ
- `preferredWards?: string[]` – danh sách tên phường thuộc thành phố trên
- `budgetRange?: { min?: number; max?: number }`
- `roomType?: string[]` – giá trị: `phong_tro | chung_cu | nha_nguyen_can | can_ho_dv | officetel | studio`
- `amenities?: string[]` – một số key thông dụng phục vụ matching:
  - `wifi, internet, camera_an_ninh, bao_ve_24_7, thang_may, gym, dieu_hoa, tu_lanh, may_giat, bep, ban_cong, nuoc_nong, san_thuong, san_vuon, ho_boi, phong_gym, sieu_thi, cho, truong_hoc, benh_vien, ben_xe, ga_tau, bai_do_xe`
- `lifestyle?: 'quiet' | 'social' | 'party' | 'study'`
- `smoking?: boolean`
- `pets?: boolean`
- `cleanliness?: number` (1–5)
- `socialLevel?: number` (1–5)

Validation FE (đã tách riêng):
- Bắt buộc: `dateOfBirth` đủ 18 tuổi, `preferredDistricts` >= 1, `roomType` >= 1.
- Không bắt buộc: `occupation` (vì là nhóm đối tượng thuê cho – 1 lựa chọn), `income`, các field khác tùy chọn.

---

### 3) Chủ nhà (role = "landlord")

Các field thu thập và format:
- `businessType?: 'individual' | 'company' | 'agency'` (bắt buộc)
- `experience?: 'new' | '1-2_years' | '3-5_years' | '5+_years'` (bắt buộc)
// BỎ: `propertiesCount` – không thu thập ở FE vì không xác thực được số lượng tài sản thực tế.
- `propertyTypes?: string[]` – giá trị: `phong_tro | chung_cu | nha_nguyen_can | can_ho_dv | officetel | studio` (>= 1)
- `priceRange?: { min?: number; max?: number }` (bắt buộc `min` và `max`)
- `targetTenants?: string[]` – nhóm khách mục tiêu, FE dùng bộ key chuẩn (phục vụ matching 1-1 với "thuê cho" của user):
  - `student | office_worker | family | couple | group_friends`
  - Lưu ý hiện tại BE đang yêu cầu set giá trị kiểu cũ: `sinh_vien | nhan_vien_vp | gia_dinh | cap_doi | nhom_ban`.
  - FE đang MAP khi submit: `student→sinh_vien`, `office_worker→nhan_vien_vp`, `family→gia_dinh`, `couple→cap_doi`, `group_friends→nhom_ban`.
  - Khuyến nghị: BE cập nhật để nhận trực tiếp bộ key mới nhằm đồng bộ với user. Khi BE chuyển đổi, FE sẽ bỏ bước map.
- `managementStyle?: 'strict' | 'flexible' | 'friendly'`
- `responseTime?: 'immediate' | 'within_hour' | 'within_day'`
- `additionalServices?: string[]` – CHUYỂN sang dùng cùng bộ key với `amenities` để matching 1-1 (ví dụ: `wifi, internet, bao_ve_24_7, thang_may, gym, dieu_hoa, tu_lanh, may_giat, bep, ban_cong, nuoc_nong, san_thuong, san_vuon, ho_boi, sieu_thi, cho, truong_hoc, benh_vien, ben_xe, ga_tau, bai_do_xe, camera_an_ninh ...`).
- `targetCityName?: string` – tên Tỉnh/Thành phố chủ muốn cho thuê
- `targetWards?: string[]` – danh sách tên phường mục tiêu (bắt buộc >=1)

Các field hỗ trợ giấy tờ/doanh nghiệp:
- `businessLicense?: string` – URL ảnh (FE upload S3, gửi URL)
- `taxCode?: string`
- `bankAccount?: { bankName: string; accountNumber: string; accountHolder: string }`

Validation FE (đã tách riêng):
- Bắt buộc: `businessType`, `experience`, `propertyTypes` (>=1), `priceRange.min/max`, `targetDistricts` (>=1 thông qua giao diện Phường/Xã mục tiêu), `Thành phố mục tiêu`.
- Không bắt buộc: `dateOfBirth`, `gender`, `occupation` dạng user, `budgetRange`, `roomType`, ...

---

### 4) Khác biệt định danh/chuẩn hóa để BE matching
- "Thuê cho" (user) ↔ "Đối tượng khách thuê mục tiêu" (landlord) nên dùng chung bộ key: `student | office_worker | family | couple | group_friends`.
- Khuyến nghị BE lưu trực tiếp theo bộ key trên cho cả 2 vai trò.
- Nếu BE giữ bộ key cũ với tiếng Việt không dấu gạch dưới, đề nghị dựng bảng map 1-1 và áp dụng tại tầng API.

Về tiện ích/dịch vụ để matching:
- FE phía người thuê gửi `amenities` (các tiện ích họ mong muốn).
- FE phía chủ nhà gửi `additionalServices`.
- Để matching ổn định, đề nghị BE hiểu các nhóm tương đương:
  - `amenities.internet` ⇄ `additionalServices.internet`
  - `amenities.bao_ve_24_7` ⇄ `additionalServices.bao_ve_24_7`
  - `amenities.bai_do_xe` ⇄ `additionalServices.bai_do_xe` (FE đã đổi từ `giu_xe` → `bai_do_xe` cho thống nhất)
- Các mục còn lại mang tính "dịch vụ vận hành" (vệ sinh, quản lý tòa nhà, bảo trì, thu gom rác, giặt là, sửa chữa nhỏ) không có đối ứng trực tiếp trong amenities; đề nghị BE ưu tiên matching theo nhóm riêng, ví dụ cùng prefix `service_*`.

---

### 5) Gợi ý kiểm tra BE
- Validate `targetTenants` theo bộ key mới (hoặc nhận cả 2 dạng và map nội bộ).
- Cho phép `preferredDistricts`/`targetDistricts` là mảng tên phường (wardName). Nếu cần ID, BE cung cấp endpoint tra cứu để FE gửi ID.
- Chấp nhận `dateOfBirth` dạng `YYYY-MM-DD`.
- Chấp nhận `businessLicense` là URL công khai.

---

### 6) Payload ví dụ

User (role=user):
```json
{
  "userId": 12,
  "dateOfBirth": "2000-05-10",
  "gender": "male",
  "occupation": "student",
  "preferredCity": "TP.HCM",
  "preferredWards": ["Phường 7", "Phường 10"],
  "budgetRange": { "min": 2000000, "max": 5000000 },
  "roomType": ["phong_tro", "chung_cu"],
  "amenities": ["wifi", "thang_may", "ban_cong"],
  "lifestyle": "quiet",
  "smoking": false,
  "pets": false,
  "cleanliness": 4,
  "socialLevel": 3,
  "contactMethod": ["Zalo", "Điện thoại"],
  "availableTime": { "weekdays": "Sau 18:00", "weekends": "Cả ngày" }
}
```

Landlord (role=landlord):
```json
{
  "userId": 34,
  "businessType": "individual",
  "experience": "1-2_years",
  "propertyTypes": ["phong_tro", "chung_cu"],
  "priceRange": { "min": 2500000, "max": 10000000 },
  "targetCity": "TP.HCM",
  "targetWards": ["Phường 7", "Phường 10"],
  "targetTenants": ["student", "office_worker"],
  "managementStyle": "friendly",
  "responseTime": "within_day",
  "additionalServices": ["bao_ve_24_7", "ve_sinh_khu_chung"],
  "businessLicense": "https://cdn.example.com/licenses/abc.jpg",
  "bankAccount": { "bankName": "Vietcombank", "accountNumber": "0123456789", "accountHolder": "Nguyen Van A" },
  "contactMethod": ["Điện thoại"],
  "availableTime": { "weekdays": "9:00-17:00", "weekends": "linh hoạt" }
}
```

Landlord – phiên bản tạm thời (nếu BE vẫn yêu cầu key cũ cho `targetTenants`):
```json
{
  "targetTenants": ["sinh_vien", "nhan_vien_vp", "gia_dinh"]
}
```

FE hiện đang auto-map các key mới → key cũ khi submit. Khi BE chuyển sang dùng key mới, FE sẽ bỏ map.


---

### 7) Luồng Đăng ký OTP → Lấy userId → Điền Survey (BE cần nắm)

Mục tiêu: Sau khi người dùng verify OTP, FE có được `userId` thật và (lý tưởng) cả `access_token` để tiếp tục survey và upload.

1) Gửi OTP (đăng ký)
- Endpoint FE gọi: `POST /auth/register` (BE gửi OTP về email)
- Payload ví dụ:
```json
{ "name": "A", "email": "a@b.com", "password": "***", "role": "user|landlord", "phone": "0123", "avatar": "" }
```

2) Xác thực OTP
- Endpoint FE gọi: `POST /auth/verify-registration`
- BE cần trả về: `{ access_token, user }` trong đó `user.userId` là ID thật vừa tạo.
- FE lưu:
  - `localStorage.token = access_token`
  - `localStorage.user = user`
  - Đồng thời lưu `registrationData` để phục vụ màn survey (bao gồm `userId` vừa tạo).

3) Điều hướng sang Survey
- FE chuyển trang: `/profile/survey?role=user|landlord`
- FE set cờ `isRegistrationFlow = true` trong `localStorage` để biết đang ở luồng tạo mới.

4) Tải/Upload trong Survey
- Nếu BE trả token ở bước 2, presign upload sẽ dùng được ngay (`Authorization: Bearer <token>`), tránh lỗi 401.
- Nếu vì lý do nào đó chưa có token, FE vẫn lưu `userId` từ `registrationData` để gửi profile bằng endpoint public (`createProfilePublic`) cho luồng đăng ký.

5) Gửi Profile
- Khi `isRegistrationFlow = true` và đã có `userId` thật, FE gọi `POST /user-profiles` (public) với payload ở mục 6.
- Nếu public thất bại, FE thử fallback (`createProfilePublicFallback`) với cùng payload.
- Khi người dùng đã đăng nhập (có token), FE dùng API thường `POST /user-profiles` hoặc `PATCH /user-profiles/user/:userId`.
 
6) Hoàn tất
- FE xóa cờ `isRegistrationFlow`, xóa `registrationData`, điều hướng về `/`.

Quan trọng phía BE:
- Trả `access_token` + `user` ngay sau `verify-registration` để FE có token làm presign upload.
- Đảm bảo `user.userId` là ID thật (không phải tạm) để FE đính kèm vào profile.
- Cho phép endpoint public tạo profile trong luồng đăng ký (nếu quyết định giữ cơ chế này), hoặc yêu cầu FE tự đăng nhập bằng token vừa trả.


