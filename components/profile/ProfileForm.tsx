"use client";

import { type ReactNode } from "react";

interface ProfileFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    avatar: string;
  };
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarPreview?: string;
  onSave: () => void;
  onCancel: () => void;
  onEditClick: () => void;
}

function FieldBox({ label, children, className = "", required = false }: { label: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <fieldset
      className={`rounded-lg border ${className}`}
      onClick={(e) => {
        const el = (e.currentTarget as HTMLElement).querySelector(
          "input, select, textarea, [contenteditable=true]"
        ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null);
        el?.focus();
      }}
    >
      <legend className="px-2 ml-2 text-sm text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </legend>
      <div className="px-3 pb-2 pt-0.5">
        {children}
      </div>
    </fieldset>
  );
}

export default function ProfileForm({ 
  formData, 
  isEditing, 
  onInputChange, 
  onAvatarChange, 
  avatarPreview,
  onSave, 
  onCancel, 
  onEditClick 
}: ProfileFormProps) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h3>
        {!isEditing ? (
          <button
            onClick={onEditClick}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled={true}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email không thể thay đổi. Liên hệ admin nếu cần hỗ trợ.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            disabled={!isEditing}
            placeholder="Nhập số điện thoại"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh đại diện
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <img
                src={avatarPreview || formData.avatar || '/home/avt1.png'}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/home/avt1.png') {
                    target.src = '/home/avt1.png';
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chọn ảnh từ máy tính của bạn (JPG, PNG, GIF)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
