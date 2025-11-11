"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { FaPaperPlane, FaImage, FaFile, FaVideo, FaTimes } from "react-icons/fa";

interface ChatInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'file') => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Nhập tin nhắn..."
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string; type: 'image' | 'video' | 'file' }>>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, [message]);

  // Convert file to base64 data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Detect file type
  const getFileType = (file: File): 'image' | 'video' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  // Handle file selection
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: Array<{ file: File; preview: string; type: 'image' | 'video' | 'file' }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = getFileType(file);
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn. Kích thước tối đa là 10MB.`);
        continue;
      }

      try {
        const dataURL = await fileToDataURL(file);
        newFiles.push({
          file,
          preview: fileType === 'image' || fileType === 'video' ? dataURL : '',
          type: fileType
        });
      } catch (error) {
        alert(`Không thể đọc file ${file.name}`);
      }
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Send message with files
  const handleSend = async () => {
    if (disabled || uploading) return;

    const trimmedMessage = message.trim();
    const hasContent = trimmedMessage || selectedFiles.length > 0;

    if (!hasContent) return;

    setUploading(true);

    try {
      // Send files first
      for (const fileData of selectedFiles) {
        try {
          const dataURL = await fileToDataURL(fileData.file);
          onSendMessage(dataURL, fileData.type);
        } catch (error) {
          alert(`Không thể gửi file ${fileData.file.name}`);
        }
      }

      // Send text message if any
      if (trimmedMessage) {
        onSendMessage(trimmedMessage, 'text');
      }

      // Reset state
      setMessage("");
      setSelectedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((fileData, index) => (
            <div key={index} className="relative group">
              {fileData.type === 'image' && (
                <div className="relative">
                  <img
                    src={fileData.preview}
                    alt={fileData.file.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}
              {fileData.type === 'video' && (
                <div className="relative">
                  <video
                    src={fileData.preview}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                    controls={false}
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}
              {fileData.type === 'file' && (
                <div className="relative bg-gray-100 rounded-lg p-2 border border-gray-300 min-w-[120px]">
                  <FaFile className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-700 truncate">{fileData.file.name}</p>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="
            p-2 text-gray-600 hover:bg-gray-100 rounded-lg
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center
            flex-shrink-0
          "
          title="Đính kèm file"
        >
          <FaImage className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || uploading}
          rows={1}
          className="
            flex-1 px-4 py-2 border border-gray-300 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            resize-none disabled:bg-gray-100 disabled:cursor-not-allowed
            overflow-y-auto
          "
          style={{
            minHeight: '40px',
            maxHeight: '128px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || uploading || (!message.trim() && selectedFiles.length === 0)}
          className="
            p-2 bg-teal-600 text-white rounded-lg 
            hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center
            flex-shrink-0
          "
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FaPaperPlane className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

