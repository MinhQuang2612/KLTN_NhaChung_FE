## Vote cho phản hồi (Reply) của đánh giá

Mục tiêu: Hỗ trợ người dùng vote Hữu ích/Không hữu ích cho từng reply của một đánh giá, thống nhất hành vi với vote của bình luận chính (review).

### Tổng quan
- Mỗi người dùng chỉ có 1 vote cho mỗi reply.
- Gọi lại endpoint với giá trị khác sẽ “đổi vote” (update).
- Có thể “bỏ vote” (unvote) bằng DELETE.
- Trả về tổng số lượt hữu ích/không hữu ích và lựa chọn của chính người gọi (`myVote`) để FE hiển thị trạng thái.

---

### 1) Tạo/Cập nhật vote cho reply
- Method: POST
- URL: `/reviews/{reviewId}/replies/{replyId}/vote`
- Auth: Yêu cầu (Bearer token). Backend lấy `userId` từ token; nếu khó, tạm chấp nhận query/body `userId`.

Request body (JSON):
```json
{
  "userId": 123,             // Khuyến nghị lấy từ token
  "isHelpful": true          // true = Hữu ích, false = Không hữu ích
}
```

Response 200 (JSON) – tạo mới hoặc đổi vote thành công:
```json
{
  "replyId": 456,
  "votesHelpful": 10,
  "votesUnhelpful": 3,
  "myVote": "helpful"        // "helpful" | "unhelpful"
}
```

Mã lỗi có thể có:
- 400: Thiếu trường bắt buộc, `isHelpful` không hợp lệ
- 401: Chưa đăng nhập/Token không hợp lệ
- 404: Không tìm thấy review/reply
- 409: Trạng thái dữ liệu xung đột (hiếm khi xảy ra)
- 500: Lỗi hệ thống

Ví dụ cURL:
```bash
curl -X POST "https://api.example.com/reviews/12/replies/456/vote" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "userId": 123, "isHelpful": true }'
```

---

### 2) Bỏ vote (Unvote) cho reply
- Method: DELETE
- URL: `/reviews/{reviewId}/replies/{replyId}/vote`
- Auth: Yêu cầu (Bearer token). Backend xác định user từ token; hoặc chấp nhận `userId` qua query/body nếu cần.

Query (tùy chọn nếu chưa có token parsing):
- `userId`: số nguyên

Response 200 (JSON):
```json
{
  "replyId": 456,
  "votesHelpful": 9,
  "votesUnhelpful": 3,
  "myVote": null
}
```

Mã lỗi:
- 401: Chưa đăng nhập
- 404: Không có record vote để xóa hoặc không tìm thấy reply

Ví dụ cURL:
```bash
curl -X DELETE "https://api.example.com/reviews/12/replies/456/vote?userId=123" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### 3) Gợi ý mở rộng API đọc dữ liệu
Khi trả về danh sách đánh giá và replies, BE nên bao gồm các trường cho từng reply:
```json
{
  "replyId": 456,
  "content": "…",
  "userId": 123,
  "createdAt": "2025-11-11T10:00:00Z",
  "votesHelpful": 10,
  "votesUnhelpful": 3,
  "myVote": "helpful"  // null nếu người gọi chưa vote
}
```

Để có `myVote`, FE sẽ gửi kèm `userId` (nếu BE chưa trích xuất từ token) khi gọi API list:
- Ví dụ: `GET /reviews?targetType=POST&targetId=99&userId=123`

---

### 4) Ràng buộc & Lưu ý
- Mỗi cặp `(userId, replyId)` là duy nhất trong bảng `reply_votes`.
- Bảng gợi ý:
  - `reply_votes(user_id, reply_id, choice, created_at, updated_at)`
  - `choice` enum: `HELPFUL` | `UNHELPFUL`
- Nên cập nhật counters `votesHelpful`, `votesUnhelpful` theo 1 trong 2 cách:
  1) Tính động bằng COUNT theo `reply_votes` mỗi lần trả về
  2) Lưu đếm trong bảng `replies` và cập nhật tăng/giảm khi vote/change/unvote (hiệu năng tốt hơn)
- Idempotent:
  - POST cùng `choice` với lần hiện tại thì có thể trả 200 và giữ nguyên số liệu.
  - POST với `choice` khác thì thực hiện đổi vote và cập nhật counters.

---

### 5) Ảnh hưởng FE
- FE đã có hàm dự kiến: `voteReply(reviewId: number, replyId: number, userId: number, isHelpful: boolean)`
- Khi trả về 200, FE sẽ:
  - Cập nhật `votesHelpful`, `votesUnhelpful`, `myVote` cho reply tương ứng
  - Hiển thị nhãn “Đã vote hữu ích/không hữu ích” như với review chính
- FE cũng sẽ sử dụng DELETE để cho phép “Hủy vote” (nếu cần trong UX tương lai).

---

### 6) Kiểm thử
1) Người A vote hữu ích cho reply X → `votesHelpful` +1, `myVote=helpful`
2) Người A đổi sang không hữu ích → `votesHelpful` -1, `votesUnhelpful` +1, `myVote=unhelpful`
3) Người A bỏ vote → số đếm giảm tương ứng, `myVote=null`
4) Người B xem danh sách replies → thấy `votesHelpful`, `votesUnhelpful`; nếu có `userId` của B, trả về `myVote` của B cho từng reply.

---

### 7) Ví dụ response lỗi chuẩn
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Reply not found"
}
```


