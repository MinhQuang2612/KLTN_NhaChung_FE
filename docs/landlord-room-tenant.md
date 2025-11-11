## API Spec: Lấy thông tin người thuê hiện tại của phòng (Landlord)

Mục tiêu: Chủ nhà xem nhanh người thuê đang ở phòng thuộc dãy của họ, phục vụ quản lý trong trang danh sách phòng của từng dãy.

### 1) Endpoint

- Method: GET
- URL: `/landlord/rooms/{roomId}/tenant`
- Auth: Yêu cầu Bearer Token. Chỉ landlord là chủ sở hữu phòng đó mới được truy cập.

### 2) Quy tắc truy xuất

- Xác định phòng theo `roomId`.
- Xác định hợp đồng/thuê đang có hiệu lực (status = `active`) gắn với phòng đó. Trường hợp nhiều bản ghi, lấy bản gần nhất theo `startDate` (hoặc theo logic nghiệp vụ hiện có).
- Nếu không có hợp đồng active → trả `204 No Content`.

### 3) Response 200

```json
{
  "roomId": 123,
  "contractId": 456,
  "contractStatus": "active",
  "tenant": {
    "userId": 789,
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "a@example.com",
    "avatarUrl": "https://.../avatar.jpg"
  },
  "period": {
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T00:00:00.000Z"
  },
  "monthlyRent": 5500000,
  "deposit": 5500000
}
```

Ghi chú:
- `monthlyRent`, `deposit`: số nguyên VNĐ.
- `period.startDate/endDate`: ISO 8601.

### 4) Response khi không có người thuê

- `204 No Content`

### 5) Lỗi

- `401 Unauthorized`: Thiếu/Token không hợp lệ.
- `403 FORBIDDEN`: Người gọi không phải chủ của phòng.
- `404 ROOM_NOT_FOUND`: Không tìm thấy phòng theo `roomId`.
- `500 INTERNAL_SERVER_ERROR`: Lỗi máy chủ.

### 6) Ví dụ cURL

```bash
curl -X GET \
  -H "Authorization: Bearer <TOKEN>" \
  https://api.example.com/landlord/rooms/123/tenant
```

### 7) Phương án thay thế (tùy chọn)

Nếu muốn gom vào endpoint chi tiết phòng:

- GET `/rooms/{id}?include=building,tenant`

Thêm trường trong payload chi tiết phòng:

```json
{
  "id": 123,
  "...": "...",
  "currentTenant": {
    "userId": 789,
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "a@example.com",
    "avatarUrl": "https://.../avatar.jpg",
    "contractId": 456,
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T00:00:00.000Z"
    },
    "monthlyRent": 5500000,
    "deposit": 5500000
  }
}
```

### 8) Ảnh hưởng tới FE

- FE sẽ gọi endpoint này khi người dùng (landlord) bấm vào card phòng có `status = "occupied"` trong trang `app/landlord/buildings/[id]/rooms/page.tsx`.
- Nếu trả về 200: hiển thị modal thông tin người thuê.
- Nếu 204: hiển thị thông báo “Chưa có người thuê hiện tại”.
- Nếu 403/404: hiển thị toast lỗi phù hợp.


