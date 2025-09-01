"use client";

export default function ContactCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden">
          <img 
            src="/home/avt1.png" 
            alt="Hữu Trí"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center" style={{display: 'none'}}>
            <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Hữu Trí</h3>
          <p className="text-sm text-gray-600">Là Người cho thuê</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <span>Đã đăng 10+ tin</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>Tham gia trên 3 năm</span>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors">
          0789****
        </button>
        <button className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors">
          Chat Với Người Bán
        </button>
      </div>
    </div>
  );
}
