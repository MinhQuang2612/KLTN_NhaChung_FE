"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { findRoommate, findRoommateAuto, getSeekerPreference } from "../../services/roommatePreferences";
import { FindRoommateDto, RoomMatch, SeekerPreferenceResponse } from "../../types/RoommatePreference";
import { Requirements } from "../../types/Post";
import RoomMatchCard from "../roommate/RoomMatchCard";
import FindRoommateForm from "../roommate/FindRoommateForm";
import { useToast } from "../../contexts/ToastContext";
import { extractApiErrorMessage } from "../../utils/api";
import { getMyProfile } from "../../services/userProfiles";
  
export default function FindRoommate() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [matches, setMatches] = useState<RoomMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [lastRequirements, setLastRequirements] = useState<Requirements | null>(null);
  const [lastPersonalInfo, setLastPersonalInfo] = useState<{ age: number; gender: 'male' | 'female' | 'other' } | null>(null);
  const [seekerPreferences, setSeekerPreferences] = useState<SeekerPreferenceResponse | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoMatchCalled, setAutoMatchCalled] = useState(false);

  // Load profile và preferences khi component mount
  useEffect(() => {
    if (user) {
      loadProfile();
      loadSeekerPreferences();
    }
  }, [user]);

  // Tự động match khi có preferences
  useEffect(() => {
    if (
      user &&
      seekerPreferences !== null &&
      !hasSearched &&
      !autoLoading &&
      !autoMatchCalled
    ) {
      setAutoMatchCalled(true);
      handleAutoMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, seekerPreferences]);

  const loadProfile = async () => {
    try {
      const profileData = await getMyProfile();
      setProfile(profileData);
    } catch (error) {
      // Nếu không có profile, không sao
    }
  };

  // Load preferences đã lưu của Seeker
  const loadSeekerPreferences = async () => {
    try {
      const preferences = await getSeekerPreference();
      setSeekerPreferences(preferences);
      
      // Nếu có preferences, điền form tự động
      if (preferences.hasPreferences && preferences.requirements) {
        setLastRequirements(preferences.requirements as Requirements);
      }
    } catch (error: any) {
      // getSeekerPreference đã handle 400/404
      setSeekerPreferences({
        hasPreferences: false,
        requirements: null,
        seekerTraits: null,
      });
    }
  };

  // Tự động match với preferences đã lưu
  const handleAutoMatch = async () => {
    if (autoLoading) {
      return;
    }

    try {
      setAutoLoading(true);
      setLoading(true);
      
      const response = await findRoommateAuto();
      
      setHasSearched(true);
      setShowForm(false);
      
      if (response.matches && response.matches.length > 0) {
        setMatches(response.matches);
      } else {
        setMatches([]);
      }
    } catch (error: any) {
      // Xử lý lỗi 400/404 (không có preferences hoặc không có matches)
      if (error?.status === 404 || error?.status === 400) {
        setHasSearched(true);
        setShowForm(false);
        setMatches([]);
      }
      // Lỗi khác (500, etc.) - để backend fix, không xử lý ở đây
    } finally {
      setAutoLoading(false);
      setLoading(false);
    }
  };

  // Helper: Lấy personalInfo từ user/profile
  const getInitialPersonalInfo = (): { age: number; gender: 'male' | 'female' | 'other' } | null => {
    if (lastPersonalInfo) {
      return lastPersonalInfo;
    }

    // Tính age từ dateOfBirth nếu có
    let age: number | undefined;
    if ((profile as any)?.age) {
      age = (profile as any).age;
    } else if ((user as any)?.dateOfBirth) {
      try {
        const dob = new Date((user as any).dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      } catch {
        // Ignore date parsing errors
      }
    }

    // Chuẩn hóa gender
    let gender: 'male' | 'female' | 'other' = 'male';
    const userGender = (profile as any)?.gender || (user as any)?.gender;
    if (userGender) {
      const normalizedGender = String(userGender).toLowerCase();
      if (normalizedGender === 'male' || normalizedGender === 'nam') {
        gender = 'male';
      } else if (normalizedGender === 'female' || normalizedGender === 'nữ') {
        gender = 'female';
      } else {
        gender = 'other';
      }
    }

    // Trả về personalInfo nếu có age, nếu không trả về null (form sẽ dùng giá trị mặc định)
    if (age && age >= 18) {
      return { age, gender };
    }

    return null;
  };

  // Chỉ hiển thị khi user đã đăng nhập
  if (!user) {
    return null;
  }

  const handleSetupForm = () => {
    setShowForm(true);
  };

  const handleFindRoommate = async (
    requirements: Requirements,
    personalInfo: { age: number; gender: 'male' | 'female' | 'other' },
    seekerTraits: string[]
  ) => {
    try {
      setLoading(true);
      setLastRequirements(requirements);
      setLastPersonalInfo(personalInfo);

      // Tạo FindRoommateDto từ requirements và personalInfo
      const findRoommateDto: FindRoommateDto = {
        ageRange: requirements.ageRange,
        gender: requirements.gender,
        traits: seekerTraits || [],
        maxPrice: requirements.maxPrice,
        personalInfo: {
          fullName: (user as any)?.fullName || (user as any)?.name || (profile as any)?.fullName || '',
          age: personalInfo.age,
          gender: personalInfo.gender,
          occupation: (profile as any)?.occupation || (user as any)?.occupation || undefined,
          hobbies: Array.isArray((profile as any)?.hobbies) ? (profile as any).hobbies : [],
          lifestyle: (profile as any)?.lifestyle || 'normal',
          cleanliness: (profile as any)?.cleanliness || 'normal',
        },
      };

      const response = await findRoommate(findRoommateDto);
      
      // Backend tự động lưu preferences khi gọi POST /posts/roommate/find
      setMatches(response.matches || []);
      setHasSearched(true);
      setShowForm(false);
      
      // Reload preferences sau khi submit form thành công
      try {
        await loadSeekerPreferences();
      } catch (error) {
        // Ignore
      }
      
      if (!response.matches || response.matches.length === 0) {
        showError(
          'Không tìm thấy phòng phù hợp', 
          'Có thể chưa có phòng nào đang tìm ở ghép phù hợp với yêu cầu của bạn.'
        );
      } else {
        showSuccess(`Tìm thấy ${response.matches.length} phòng phù hợp`, 'Bạn có thể xem chi tiết và liên hệ.');
      }
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError('Không thể tìm phòng', message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mb-2">
            Tìm người chung tổ ấm
          </h3>
          <p className="text-gray-600 mb-4">
            Điền form để tìm phòng ở ghép phù hợp với bạn
          </p>
        </div>

        {/* Loading state - Khi đang auto-match với saved preferences */}
        {autoLoading && !hasSearched && (
          <div className="mb-6">
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Đang tải preferences đã lưu...</p>
              </div>
            </div>
          </div>
        )}

        {/* Setup Form Button - Chỉ hiển thị khi chưa có preferences hoặc chưa searched */}
        {!seekerPreferences?.hasPreferences && !hasSearched && !autoLoading && seekerPreferences !== null && (
          <div className="mb-6">
            <button
              onClick={handleSetupForm}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Thiết lập form
            </button>
          </div>
        )}

        {/* Search Again Button - Hiển thị khi đã có preferences hoặc đã searched */}
        {(seekerPreferences?.hasPreferences || hasSearched) && !autoLoading && (
          <div className="mb-6">
            <button
              onClick={handleSetupForm}
              className="px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium"
            >
              {seekerPreferences?.hasPreferences ? 'Sửa form tìm kiếm' : 'Tìm kiếm lại'}
            </button>
          </div>
        )}

        {/* Matches List - Chỉ hiển thị khi đã searched (không hiển thị khi chỉ có preferences nhưng chưa searched) */}
        {hasSearched && (
          <div className="mb-6">
            {(loading || autoLoading) ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Đang tìm kiếm phòng phù hợp...</p>
                </div>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-4">Không tìm thấy phòng phù hợp</p>
                  <button
                    onClick={handleSetupForm}
                    className="px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium"
                  >
                    Thử lại với tiêu chí khác
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Phòng phù hợp với bạn ({matches.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((match) => (
                    <RoomMatchCard
                      key={match.postId}
                      match={match}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Find Roommate Form */}
        <FindRoommateForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleFindRoommate}
          initialRequirements={lastRequirements || seekerPreferences?.requirements as Requirements || null}
          initialPersonalInfo={lastPersonalInfo || getInitialPersonalInfo() || null}
          initialSeekerTraits={seekerPreferences?.seekerTraits || null}
          loading={loading}
        />
      </div>
    </section>
  );
}
