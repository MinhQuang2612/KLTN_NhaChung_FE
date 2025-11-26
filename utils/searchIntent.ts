/**
 * Phân tích ý định tìm kiếm từ câu truy vấn tự nhiên
 * Suy luận: có phải tìm "ở ghép" và giới tính (nếu có)
 */
export function parseIntent(q: string): {
  isRoommate: boolean;
  gender?: 'male' | 'female';
} {
  const raw = (q || '').toLowerCase().trim();
  if (!raw) return { isRoommate: false };

  const roommateSignals = [
    'ở ghép', 'o ghep', 'oghep', 'ở chung', 'o chung',
    'share phòng', 'share phong', 'roommate', 'tim o ghep'
  ];
  const isRoommate = roommateSignals.some(k => raw.includes(k));

  const femaleSignals = [
    'nữ', 'nu', 'female', 'ban nu', 'o ghep nu', 'oghep nu',
    'tim o ghep nu', 'nu ghep', 'nữ ghép'
  ];
  const maleSignals = [
    'nam', 'male', 'ban nam', 'o ghep nam', 'oghep nam',
    'tim o ghep nam', 'nam ghep'
  ];

  let gender: 'male' | 'female' | undefined;
  if (femaleSignals.some(k => raw.includes(k))) {
    gender = 'female';
  } else if (maleSignals.some(k => raw.includes(k))) {
    gender = 'male';
  }

  return { isRoommate, gender };
}

