"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRooms, createRoom, deleteRoom, softDeleteRoom, getRoomTenant } from "@/services/rooms";
import { getBuildingById } from "@/services/buildings";
import { getPostsByRoom, deletePost } from "@/services/posts";
import { FaUser } from "react-icons/fa";
import { Room, RoomListParams, CreateRoomPayload } from "@/types/Room";
import { Building } from "@/types/Building";
import { extractApiErrorMessage } from "@/utils/api";
import RoomCardVertical from "@/components/landlord/RoomCardVertical";
import NotificationModal from "@/components/common/NotificationModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useNotification } from "@/hooks/useNotification";
import { useConfirm } from "@/hooks/useConfirm";
import ChungCuForm from "@/components/landlord/forms/ChungCuForm";
import RoomForm from "@/components/landlord/RoomForm";

export default function BuildingRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const buildingId = Number(params.id);
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirm, showConfirm, hideConfirm, setLoading: setConfirmLoading, handleConfirm, handleCancel } = useConfirm();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);

  const translateContractStatus = (s?: string) => {
    if (!s) return '';
    const map: Record<string, string> = {
      active: 'Đang hiệu lực',
      expired: 'Hết hạn',
      pending: 'Chờ hiệu lực',
      cancelled: 'Đã hủy',
    };
    return map[s] || s;
  };

  const loadData = async () => {
    if (!buildingId) return;
    try {
      setLoading(true);
      setError(null);
      const [b, list] = await Promise.all([
        getBuildingById(buildingId),
        getRooms({ buildingId } as RoomListParams),
      ]);
      setBuilding(b);
      setRooms(list.rooms ?? list);
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "landlord") loadData();
  }, [user?.role, buildingId]);

  const filteredRooms = useMemo(() => {
    if (!search) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) =>
      [r.roomNumber, r.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rooms, search]);

  const handleCreate = async (data: CreateRoomPayload | Partial<CreateRoomPayload>) => {
    const payload = data as CreateRoomPayload;
    payload.buildingId = buildingId;
    try {
      setLoading(true);
      await createRoom(payload);
      // Optimistic update: cập nhật updatedAt và tăng tổng phòng nếu có
      setBuilding((prev) => prev ? { 
        ...prev, 
        updatedAt: new Date().toISOString(),
        totalRooms: (prev.totalRooms ?? 0) + 1
      } : prev);
      // Thông báo danh sách dãy để cập nhật ngay
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rooms:changed', { detail: { buildingId, at: new Date().toISOString(), type: 'create' } }));
      }
      setShowCreate(false);
      // Fetch lại từ BE để đồng bộ dữ liệu
      try {
        const fresh = await getBuildingById(buildingId);
        setBuilding(fresh);
      } catch (_) {}
      await loadData();
    } catch (e: any) {
      alert(e?.message || "Không thể tạo phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => router.push(`/landlord/rooms/${id}/edit`);
  const handleView = (id: number) => router.push(`/landlord/rooms/${id}`);

  const handleCardClick = async (id: number) => {
    const r = rooms.find((x) => ((x as any).roomId || x.id) === id);
    if (r?.status === 'occupied') {
      try {
        setTenantLoading(true);
        const info = await getRoomTenant(id);
        if (info) {
          setTenantInfo(info);
          setShowTenantModal(true);
        } else {
          // Mở modal rỗng để hiển thị thông điệp không có người thuê
          setTenantInfo(null);
          setShowTenantModal(true);
        }
      } catch (e: any) {
        showError("Không thể tải thông tin người thuê", e?.message || "Vui lòng thử lại");
      } finally {
        setTenantLoading(false);
      }
    } else {
      // Phòng chưa cho thuê: cũng mở modal thông báo
      setTenantInfo(null);
      setShowTenantModal(true);
    }
  };
  const handleDelete = (id: number) => {
    // Tìm room để lấy roomNumber
    const roomToDelete = rooms.find(room => {
      const roomId = (room as any).roomId || room.id;
      return roomId === id;
    });
    
    if (!roomToDelete) {
      showError(
        "Không tìm thấy phòng",
        "Phòng này có thể đã bị xóa hoặc không tồn tại."
      );
      return;
    }
    
    // Hiển thị confirm modal
    showConfirm(
      "Xác nhận xóa phòng",
      `Bạn có chắc chắn muốn xóa phòng ${roomToDelete.roomNumber}? Hành động này không thể hoàn tác.`,
      () => performDelete(id, roomToDelete.roomNumber),
      {
        confirmText: "Xóa phòng",
        cancelText: "Hủy",
        type: "danger"
      }
    );
  };

  const performDelete = async (id: number, roomNumber: string) => {
    // Validate roomId
    const validRoomId = Number(id);
    if (!validRoomId || isNaN(validRoomId) || validRoomId <= 0) {
      showError(
        "ID phòng không hợp lệ",
        "Vui lòng thử lại hoặc liên hệ hỗ trợ."
      );
      hideConfirm();
      return;
    }
    
    try {
      setConfirmLoading(true);
      await deleteRoom(validRoomId);

      // Xóa tất cả bài post liên quan đến phòng
      try {
        const relatedPosts = await getPostsByRoom(validRoomId);
        if (Array.isArray(relatedPosts) && relatedPosts.length > 0) {
          await Promise.all(
            relatedPosts.map((p: any) => deletePost((p as any).id || (p as any).postId))
          );
        }
      } catch (postErr) {
      }
      
      // Cập nhật state ngay lập tức (theo integration guide)
      setRooms(prev => prev.filter(room => {
        const roomId = (room as any).roomId || room.id;
        return roomId !== validRoomId;
      }));
      // Tải lại thông tin dãy để cập nhật updatedAt hoặc cập nhật tức thời
      try {
        const fresh = await getBuildingById(buildingId);
        setBuilding(fresh);
      } catch (_) {
        // Fallback: nếu không fetch được, cập nhật updatedAt tạm thời để UI phản ánh thay đổi
        setBuilding(prev => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
      }
      // Phát sự kiện để trang danh sách dãy cập nhật ngay
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rooms:changed', { detail: { buildingId, at: new Date().toISOString(), type: 'delete' } }));
      }
      
      // Đóng confirm modal
      hideConfirm();
      
      // Hiển thị thông báo thành công
      showSuccess(
        "Xóa phòng thành công!",
        `Phòng ${roomNumber} đã được xóa khỏi danh sách.`
      );
      
    } catch (error: any) {
      
      // Xử lý lỗi theo integration guide
      let errorMessage = "Có lỗi xảy ra khi xóa phòng";
      if (error?.status === 404) {
        errorMessage = "Không tìm thấy phòng để xóa";
      } else if (error?.status === 403) {
        errorMessage = "Bạn không có quyền xóa phòng này";
      } else if (error?.status === 500) {
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Đóng confirm modal
      hideConfirm();
      
      showError(
        "Không thể xóa phòng",
        errorMessage
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen grid place-items-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phòng trong dãy {building?.name || `#${buildingId}`}</h1>
            <p className="text-gray-500 text-sm">Quản lý các phòng thuộc dãy này</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
          >
            Thêm phòng
          </button>
        </div>

        <div className="mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm số phòng, mô tả..."
            className="w-full md:w-96 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Đang tải...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600 mb-4">Chưa có phòng nào.</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Tạo phòng đầu tiên</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRooms.map((room) => (
              <RoomCardVertical
                key={room.id}
                room={room}
                onClick={handleCardClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal create room */}
      {showCreate && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full max-h-[92vh] overflow-auto relative z-10">
              {building?.buildingType === "chung-cu" ? (
                <ChungCuForm
                  building={building}
                  initialData={{ buildingId }}
                  onSubmit={handleCreate}
                  onCancel={() => setShowCreate(false)}
                  loading={loading}
                  existingRooms={rooms.map(r => ({ 
                    roomNumber: r.roomNumber, 
                    id: (r as any).roomId || r.id 
                  }))}
                />
              ) : (
                <RoomForm
                  buildings={building ? [building] : []}
                  initialData={{ buildingId }}
                  onSubmit={handleCreate}
                  onCancel={() => setShowCreate(false)}
                  loading={loading}
                  existingRooms={rooms.map(r => ({ 
                    roomNumber: r.roomNumber, 
                    id: (r as any).roomId || r.id 
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Tenant Info Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTenantModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin người thuê</h3>
                <button onClick={() => setShowTenantModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 grid place-items-center text-gray-500">×</button>
              </div>
              <div className="px-6 py-5">
                {tenantLoading ? (
                  <div className="py-10 text-center text-gray-500">Đang tải...</div>
                ) : tenantInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {tenantInfo?.tenant?.avatarUrl ? (
                        <img src={tenantInfo.tenant.avatarUrl} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 grid place-items-center text-gray-500">
                          <FaUser />
                        </div>
                      )}
                      <div>
                        <div className="text-base font-semibold text-gray-900">{tenantInfo?.tenant?.fullName || '—'}</div>
                        <div className="text-sm text-gray-600">{tenantInfo?.tenant?.email || '—'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Số điện thoại</div>
                        <div className="text-gray-900">{tenantInfo?.tenant?.phone || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Trạng thái HĐ</div>
                        <div className="text-gray-900">{translateContractStatus(tenantInfo?.contractStatus) || '—'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Thời hạn</div>
                        <div className="text-gray-900">
                          {tenantInfo?.period?.startDate ? new Date(tenantInfo.period.startDate).toLocaleDateString('vi-VN') : '—'} 
                          {" - "}
                          {tenantInfo?.period?.endDate ? new Date(tenantInfo.period.endDate).toLocaleDateString('vi-VN') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Giá thuê</div>
                        <div className="text-gray-900">{new Intl.NumberFormat('vi-VN').format(tenantInfo?.monthlyRent || 0)} đ/tháng</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Đặt cọc</div>
                        <div className="text-gray-900">{new Intl.NumberFormat('vi-VN').format(tenantInfo?.deposit || 0)} đ</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">Không có dữ liệu người thuê.</div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => {
                      if (tenantInfo?.contractId) {
                        router.push(`/landlord/billing?contractId=${tenantInfo.contractId}`);
                      }
                    }}
                    disabled={!tenantInfo?.contractId}
                    className="px-4 py-2 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tính tiền
                  </button>
                </div>
                <button onClick={() => setShowTenantModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={notification.duration}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
        loading={confirm.loading}
      />
    </div>
  );
}


