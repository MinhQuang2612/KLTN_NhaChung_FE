"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Footer from "@/components/common/Footer";
import BuildingDetails from "@/components/landlord/BuildingDetails";
import RoomCardVertical from "@/components/landlord/RoomCardVertical";
import RoomCardHorizontal from "@/components/landlord/RoomCardHorizontal";
import RoomForm from "@/components/landlord/RoomForm";
import ChungCuForm from "@/components/landlord/forms/ChungCuForm";
import NotificationModal from "@/components/common/NotificationModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import { getBuildingById } from "@/services/buildings";
import { getRooms, createRoom, deleteRoom, softDeleteRoom, getRoomTenant } from "@/services/rooms";
import { getPostsByRoom, deletePost } from "@/services/posts";
import { Building } from "@/types/Building";
import { Room, CreateRoomPayload, RoomListParams } from "@/types/Room";
import { extractApiErrorMessage } from "@/utils/api";
import { useNotification } from "@/hooks/useNotification";
import { useConfirm } from "@/hooks/useConfirm";
import { FaUser } from "react-icons/fa";

export default function BuildingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirm, showConfirm, hideConfirm, setLoading: setConfirmLoading, handleConfirm, handleCancel } = useConfirm();
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");

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
    try {
      setLoading(true);
      const [b, list] = await Promise.all([
        getBuildingById(id),
        getRooms({ buildingId: id } as RoomListParams),
      ]);
      setBuilding(b);
      const roomsData = list.rooms ?? list;
      
      
      // Fallback: nếu room không có building info, thêm từ building hiện tại
      const roomsWithBuilding = Array.isArray(roomsData) 
        ? roomsData.map(room => ({
            ...room,
              building: room.building || { id: b.buildingId, name: b.name, buildingType: b.buildingType }
          }))
        : [];
      
      setRooms(roomsWithBuilding);
    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);
  
  // Refresh when window gains focus (e.g., returning from edit page)
  // Tránh reload khi đang mở modal tạo phòng để không gây remount form
  useEffect(() => {
    const handleFocus = () => {
      if (showCreate) return; // giữ nguyên form khi modal đang mở
      loadData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, showCreate]);
  
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const filteredRooms = useMemo(() => {
    if (!search) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) => [r.roomNumber, r.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [rooms, search]);

  const handleCreate = async (data: CreateRoomPayload | Partial<CreateRoomPayload>) => {
    const payload = data as CreateRoomPayload;
    payload.buildingId = id;
    try {
      setLoading(true);
      await createRoom(payload);
      // Optimistic update: cập nhật updatedAt và số phòng
      setBuilding((prev) => prev ? { 
        ...prev, 
        updatedAt: new Date().toISOString(),
        totalRooms: (prev.totalRooms ?? 0) + 1
      } : prev);
      setShowCreate(false);
      // Refresh rooms và building
      const [freshBuilding, list] = await Promise.all([
        getBuildingById(id),
        getRooms({ buildingId: id } as RoomListParams),
      ]);
      setBuilding(freshBuilding);
      setRooms(list.rooms ?? list);
    } catch (e: any) {
      alert(e?.message || "Không thể tạo phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roomId: number) => router.push(`/landlord/rooms/${roomId}/edit`);
  const handleView = (roomId: number) => router.push(`/landlord/rooms/${roomId}`);

  const handleCardClick = async (roomId: number) => {
    const r = rooms.find((x) => (((x as any).roomId || x.id) === roomId));
    if (r?.status === 'occupied') {
      try {
        setTenantLoading(true);
        const info = await getRoomTenant(roomId);
        if (info) {
          setTenantInfo(info);
          setShowTenantModal(true);
        } else {
          // Không có người thuê active: mở modal với trạng thái rỗng
          setTenantInfo(null);
          setShowTenantModal(true);
        }
      } catch (e: any) {
        showError("Không thể tải thông tin người thuê", e?.message || "Vui lòng thử lại");
      } finally {
        setTenantLoading(false);
      }
    } else {
      // Phòng chưa thuê: cũng mở modal thông báo
      setTenantInfo(null);
      setShowTenantModal(true);
    }
  };
  const handleDelete = (roomId: number) => {
    // Tìm room để lấy roomNumber
    const roomToDelete = rooms.find(room => {
      const id = (room as any).roomId || room.id;
      return id === roomId;
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
      () => performDelete(roomId, roomToDelete.roomNumber),
      {
        confirmText: "Xóa phòng",
        cancelText: "Hủy",
        type: "danger"
      }
    );
  };

  const performDelete = async (roomId: number, roomNumber: string) => {
    // Validate roomId
    const validRoomId = Number(roomId);
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
      
      // Sử dụng deleteRoom service function (theo integration guide)
      const result = await deleteRoom(validRoomId);
      
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
        const id = (room as any).roomId || room.id;
        return id !== validRoomId;
      }));
      // Optimistic: cập nhật updatedAt và giảm số phòng
      setBuilding(prev => prev ? {
        ...prev,
        updatedAt: new Date().toISOString(),
        totalRooms: Math.max(0, (prev.totalRooms ?? 0) - 1)
      } : prev);
      // Refresh building từ BE
      try {
        const fresh = await getBuildingById(id);
        setBuilding(fresh);
      } catch (_) {}
      
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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center">
        <div className="text-center">
          <p className="mb-3 text-gray-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center">
        <div className="text-center">
          <p className="mb-3 text-gray-700">{error || "Không tìm thấy dãy"}</p>
          <button
            onClick={() => router.push("/landlord/buildings")}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Building info */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 self-start">
          <BuildingDetails building={building} rooms={rooms} />
        </div>

        {/* Right: Rooms management */}
        <div className="lg:col-span-2">
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/landlord/buildings")}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span>←</span>
                  <span>Trở về quản lý chung</span>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Quản lý phòng</h2>
              </div>
              <div className="flex-1 max-w-xl">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo số phòng, mô tả..."
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  title={layout === "vertical" ? "Chuyển sang dạng ngang" : "Chuyển sang dạng đứng"}
                  onClick={() => setLayout(layout === "vertical" ? "horizontal" : "vertical")}
                  className={`h-11 w-11 grid place-items-center rounded-xl border ${layout === "vertical" ? "border-teal-300 bg-teal-50 text-teal-600" : "border-teal-300 bg-teal-50 text-teal-600"}`}
                  aria-label="Toggle layout"
                >
                  {layout === "vertical" ? "▦" : "≡"}
                </button>
                <button onClick={() => setShowCreate(true)} className="h-11 px-5 rounded-xl bg-teal-600 text-white hover:bg-teal-700">Thêm phòng</button>
              </div>
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Đang tải...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-8 text-center">
                <div className="inline-block rounded-2xl border border-dashed border-gray-300 px-8 py-10 bg-gray-50">
                  <p className="text-gray-600 mb-4">Chưa có phòng nào trong dãy.</p>
                  <button onClick={() => setShowCreate(true)} className="h-11 px-5 rounded-xl bg-teal-600 text-white hover:bg-teal-700">Tạo phòng đầu tiên</button>
                </div>
              </div>
            ) : (
              <div className={`grid ${layout === "vertical" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"} gap-5`}>
                {filteredRooms.map((room, idx) => 
                  layout === "vertical" ? (
                    <RoomCardVertical
                      key={`${room?.id ?? 'no-id'}-${room?.roomNumber ?? 'no-num'}-${idx}`}
                      room={room}
                      onClick={handleCardClick}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ) : (
                    <RoomCardHorizontal
                      key={`${room?.id ?? 'no-id'}-${room?.roomNumber ?? 'no-num'}-${idx}`}
                      room={room}
                      onClick={handleCardClick}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create room modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full max-h-[92vh] overflow-auto relative z-10">
              {building?.buildingType === "chung-cu" ? (
                <ChungCuForm
                  building={building}
                  initialData={{ buildingId: id }}
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
                  initialData={{ buildingId: id }}
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

      <Footer />

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
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                <div className="flex items-center justify-between w-full">
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
                  <button onClick={() => setShowTenantModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Đóng</button>
                </div>
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


