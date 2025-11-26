"use client";

interface ProfileHeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    isVerified?: boolean;
  };
  isEditing: boolean;
  onEditClick: () => void;
}

export default function ProfileHeader({ user, isEditing, onEditClick }: ProfileHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-8">
      <div className="flex items-center gap-6">
        <div className="relative">
          <img
            src={user.avatar || '/home/avt1.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/home/avt1.png') {
                target.src = '/home/avt1.png';
              }
            }}
          />
          {isEditing && (
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-white">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            {user.isVerified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white border border-green-400">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Đã xác thực
              </span>
            )}
          </div>
          <p className="text-teal-100">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-teal-100">Đang hoạt động</span>
          </div>
        </div>
      </div>
    </div>
  );
}

