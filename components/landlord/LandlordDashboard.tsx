"use client";

import { useEffect, useMemo, useState } from "react";
import { getLandlordDashboardSummary, DashboardSummaryResponse } from "@/services/landlordDashboard";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/common/Footer";

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [range, setRange] = useState<{ from?: string; to?: string }>({});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLandlordDashboardSummary(range);
      setSummary(res);
    } catch (e: any) {
      setError("Không tải được dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "landlord") return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, range?.from, range?.to]);

  const revenueMax = useMemo(() => {
    const vals = summary?.revenue?.byMonth?.map((m) => m.amount) || [];
    return Math.max(1, ...vals);
  }, [summary]);

  const donut = useMemo(() => {
    const a = summary?.rooms?.available || 0;
    const o = summary?.rooms?.occupied || 0;
    const total = a + o || 1;
    const aDeg = (a / total) * 360;
    return { a, o, aDeg };
  }, [summary]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Tổng quan</h1>
          <p className="text-sm text-gray-500">Thống kê hợp đồng, doanh thu, phòng và bài đăng.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Từ ngày</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={range.from?.slice(0,10) || ''}
              onChange={(e)=>setRange((r)=>({ ...r, from: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Đến ngày</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={range.to?.slice(0,10) || ''}
              onChange={(e)=>setRange((r)=>({ ...r, to: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
          </div>
          <div className="flex items-end">
            <button onClick={load} className="px-4 py-2 bg-teal-600 text-white rounded-lg w-full md:w-auto">Áp dụng</button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-600">Đang tải...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">{error}</div>
        ) : !summary ? null : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card title="Hợp đồng" subtitle={`${summary.contracts.active}/${summary.contracts.total} đang hiệu lực`} value={summary.contracts.total} />
              <Card title="Doanh thu (đã thu)" value={summary.revenue.totalPaid.toLocaleString('vi-VN') + ' đ'} />
              <Card title="Phòng (trống/tổng phòng)" value={`${summary.rooms.available}/${summary.rooms.total}`} />
              <Card title="Bài đăng" subtitle={`Đang hoạt động: ${summary.posts.byStatus?.active ?? 0}`} value={summary.posts.total} />
            </div>

            {/* Removed revenue by month section as requested */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white border rounded-xl p-6">
                <h3 className="font-medium text-gray-900 mb-4">Phòng</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32 rounded-full" style={{
                    background: `conic-gradient(#14b8a6 0deg ${donut.aDeg}deg, #e5e7eb ${donut.aDeg}deg 360deg)`
                  }}>
                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center text-sm font-medium">
                      {summary.rooms.total}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-teal-500"/> Trống: {summary.rooms.available}</div>
                    <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-gray-300"/> Đang ở: {summary.rooms.occupied}</div>
                  </div>
                </div>
              </section>

              <section className="bg-white border rounded-xl p-6">
                <h3 className="font-medium text-gray-900 mb-4">Bài đăng theo trạng thái</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {(() => {
                    const m = summary.posts.byStatus || {} as any;
                    const viMap: Record<string, string> = {
                      pending: 'Chờ duyệt',
                      active: 'Đang hoạt động',
                      inactive: 'Đã ẩn',
                      rejected: 'Bị từ chối',
                      approved: 'Đã duyệt',
                    };
                    const order = ['pending','active','inactive','rejected','approved'];
                    return order
                      .filter((k) => k in m)
                      .map((k) => (
                        <li key={k} className="flex justify-between"><span>{viMap[k] || k}</span><span className="font-medium">{m[k]}</span></li>
                      ));
                  })()}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

function Card({ title, subtitle, value }: { title: string; subtitle?: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}
    </div>
  );
}
