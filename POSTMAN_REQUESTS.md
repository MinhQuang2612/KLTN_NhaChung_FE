# Postman Requests cho BE Test

## 1. Auth/OTP Flow

### POST /auth/verify-registration
```
Method: POST
URL: http://localhost:3001/api/auth/verify-registration
Headers:
  Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "otp": "123456"
}

Expected Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 11,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  },
  "nextStep": "survey"
}
```

## 2. Profile Creation (ngay sau OTP)

### POST /user-profiles/me
```
Method: POST
URL: http://localhost:3001/api/user-profiles/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body:
{
  "userId": 11
}

Expected Response:
{
  "profileId": 1,
  "userId": 11,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 3. Profile Update (trong Survey)

### PATCH /user-profiles/me
```
Method: PATCH
URL: http://localhost:3001/api/user-profiles/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body (User - 40% Preferences + 30% Basic):
{
  "userId": 11,
  "dateOfBirth": "1995-01-01",
  "gender": "male",
  "occupation": "student",
  "income": 5000000,
  "currentLocation": "Hồ Chí Minh",
  "preferredWards": ["Phường Bến Nghé", "Phường Đa Kao"],
  "budgetRange": {
    "min": 3000000,
    "max": 8000000
  },
  "roomType": ["phong_tro", "chung_cu"],
  "amenities": ["wifi", "thang_may", "ban_cong"],
  "lifestyle": "quiet"
}
```

### PATCH /user-profiles/me (Landlord)
```
Method: PATCH
URL: http://localhost:3001/api/user-profiles/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body (Landlord - 30% Role + 30% Basic):
{
  "userId": 11,
  "dateOfBirth": "1990-01-01",
  "gender": "female",
  "occupation": "business_owner",
  "income": 20000000,
  "currentLocation": "Hà Nội",
  "experience": "3-5_years",
  "propertyTypes": ["chung_cu", "nha_nguyen_can"],
  "priceRange": {
    "min": 5000000,
    "max": 15000000
  },
  "targetWards": ["Phường Cầu Giấy", "Phường Đống Đa"],
  "additionalServices": ["wifi", "bao_ve_24_7", "thang_may"]
}
```

## 4. Get Profile

### GET /user-profiles/me
```
Method: GET
URL: http://localhost:3001/api/user-profiles/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Expected Response:
{
  "profileId": 1,
  "userId": 11,
  "dateOfBirth": "1995-01-01",
  "gender": "male",
  "occupation": "student",
  "income": 5000000,
  "currentLocation": "Hồ Chí Minh",
  "preferredWards": ["Phường Bến Nghé", "Phường Đa Kao"],
  "budgetRange": {
    "min": 3000000,
    "max": 8000000
  },
  "roomType": ["phong_tro", "chung_cu"],
  "amenities": ["wifi", "thang_may", "ban_cong"],
  "lifestyle": "quiet",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 5. Test Cases

### Test Case 1: User Registration Flow
1. POST /auth/verify-registration → nhận access_token
2. POST /user-profiles/me → tạo profile cơ bản
3. PATCH /user-profiles/me → cập nhật đầy đủ thông tin user

### Test Case 2: Landlord Registration Flow
1. POST /auth/verify-registration → nhận access_token
2. POST /user-profiles/me → tạo profile cơ bản
3. PATCH /user-profiles/me → cập nhật đầy đủ thông tin landlord

### Test Case 3: Completion Validation
- User: cần preferred* + budgetRange + roomType + amenities + lifestyle (40%) + basic fields (30%)
- Landlord: cần experience + propertyTypes + priceRange + target* (30%) + basic fields (30%)

## 6. Notes
- Tất cả enum constraints đã được bỏ, BE lưu raw values từ FE
- Không gửi đồng thời preferred* và target* trong cùng payload
- completion logic: User 40% + Basic 30%, Landlord 30% + Basic 30%
- FE sẽ gọi POST /user-profiles/me ngay sau OTP, sau đó PATCH trong survey
