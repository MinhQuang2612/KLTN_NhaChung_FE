"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Footer from "@/components/common/Footer";
import BuildingDetails from "@/components/landlord/BuildingDetails";
import RoomCardVertical from "@/components/landlord/RoomCardVertical";
import RoomForm from "@/components/landlord/RoomForm";
import ChungCuForm from "@/components/landlord/forms/ChungCuForm";
import { getBuildingById } from "@/services/buildings";
import { getRooms, createRoom, deleteRoom } from "@/services/rooms";
import { Building } from "@/types/Building";
import { Room, CreateRoomPayload, RoomListParams } from "@/types/Room";

export default function BuildingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [b, list] = await Promise.all([
          getBuildingById(id),
          getRooms({ buildingId: id } as RoomListParams),
        ]);
        setBuilding(b);
        setRooms(list.rooms ?? list);
      } catch (e: any) {
        setError(e?.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
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
      setShowCreate(false);
      const list = await getRooms({ buildingId: id } as RoomListParams);
      setRooms(list.rooms ?? list);
    } catch (e: any) {
      alert(e?.message || "Không thể tạo phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roomId: number) => router.push(`/landlord/rooms/${roomId}/edit`);
  const handleView = (roomId: number) => router.push(`/landlord/rooms/${roomId}`);
  const handleDelete = async (roomId: number) => {
    if (!confirm("Xóa phòng này?")) return;
    try {
      setLoading(true);
      await deleteRoom(roomId);
      const list = await getRooms({ buildingId: id } as RoomListParams);
      setRooms(list.rooms ?? list);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center">Đang tải...</div>
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
          <BuildingDetails building={building} />
        </div>

        {/* Right: Rooms management */}
        <div className="lg:col-span-2">
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Quản lý phòng</h2>
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
                  title={layout === "grid" ? "Chuyển sang dạng danh sách" : "Chuyển sang dạng lưới"}
                  onClick={() => setLayout(layout === "grid" ? "list" : "grid")}
                  className={`h-11 w-11 grid place-items-center rounded-xl border ${layout === "grid" ? "border-teal-300 bg-teal-50 text-teal-600" : "border-teal-300 bg-teal-50 text-teal-600"}`}
                  aria-label="Toggle layout"
                >
                  {layout === "grid" ? "≡" : "▦"}
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
              <div className={`grid ${layout === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"} gap-5`}>
                {filteredRooms.map((room, idx) => (
                  <RoomCardVertical
                    key={`${room?.id ?? 'no-id'}-${room?.roomNumber ?? 'no-num'}-${idx}`}
                    room={room}
                    onClick={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
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
                />
              ) : (
                <RoomForm
                  buildings={building ? [building] : []}
                  initialData={{ buildingId: id }}
                  onSubmit={handleCreate}
                  onCancel={() => setShowCreate(false)}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}


