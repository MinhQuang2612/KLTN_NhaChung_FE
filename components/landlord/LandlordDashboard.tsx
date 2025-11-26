"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getLandlordDashboardSummary,
  DashboardSummaryResponse
} from "@/services/landlordDashboard";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/common/Footer";
import {
  FaClipboardList,
  FaFileAlt,
  FaHome,
  FaMoneyBillWave,
  FaRedoAlt
} from "react-icons/fa";
import { IconType } from "react-icons";

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

  const donut = useMemo(() => {
    const a = summary?.rooms?.available || 0;
    const o = summary?.rooms?.occupied || 0;
    const total = a + o || 1;
    const aDeg = (a / total) * 360;
    return { available: a, occupied: o, total, aDeg };
  }, [summary]);

  const occupancyRate = useMemo(() => {
    if (!summary) return 0;
    const total = summary.rooms.total || 1;
    return Math.round((summary.rooms.occupied / total) * 100);
  }, [summary]);

  const endedContracts = useMemo(() => {
    if (!summary) return 0;
    const expired = summary.contracts.expired || 0;
    const terminated = summary.contracts.terminated ?? 0;
    if (summary.contracts.terminated != null) {
      return expired + terminated;
    }
    const derivedTerminated =
      summary.contracts.total -
      summary.contracts.active -
      summary.contracts.expiringSoon -
      expired;
    return expired + Math.max(derivedTerminated, 0);
  }, [summary]);

  const activePostPercent = useMemo(() => {
    if (!summary) return 0;
    const total = summary.posts.total || 1;
    return Math.round(((summary.posts.byStatus?.active || 0) / total) * 100);
  }, [summary]);

  const formattedRevenue = useMemo(
    () =>
      summary
        ? formatCurrency(summary.revenue.totalPaid)
        : "0 đ",
    [summary]
  );


  const statCards = summary
    ? [
        {
          title: "Doanh thu đã thu",
          value: formattedRevenue,
          subtitle: "Tổng tiền đã thu được trong kỳ",
          icon: FaMoneyBillWave
        },
        {
          title: "Hợp đồng đang hiệu lực",
          value: `${summary.contracts.active}/${summary.contracts.total}`,
          subtitle: "Tỉ lệ hợp đồng còn hiệu lực",
          icon: FaClipboardList
        },
        {
          title: "Tỉ lệ lấp đầy",
          value: `${occupancyRate}%`,
          subtitle: `${summary.rooms.occupied} phòng đang có người`,
          icon: FaHome
        },
        {
          title: "Bài đăng hoạt động",
          value: `${summary.posts.byStatus?.active ?? 0}`,
          subtitle: `${activePostPercent}% bài đăng đang hiển thị`,
          icon: FaFileAlt
        }
      ]
    : [];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !summary ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="px-6 py-5 border-b flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Chỉ số chính</h2>
                  <p className="text-sm text-gray-500">
                    Tổng quan các con số quan trọng giúp bạn nắm tình hình chung.
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <DateInput
                    label="Từ ngày"
                    value={range.from}
                    onChange={(value) => {
                      setRange((prev) => ({ ...prev, from: value }));
                    }}
                    variant="compact"
                  />
                  <DateInput
                    label="Đến ngày"
                    value={range.to}
                    onChange={(value) => {
                      setRange((prev) => ({ ...prev, to: value }));
                    }}
                    variant="compact"
                  />
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {statCards.map((item) => (
                    <StatInline key={item.title} {...item} />
                  ))}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <section className="rounded-3xl border border-gray-100 bg-white shadow-sm xl:col-span-8">
                <div className="px-6 py-5 border-b flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Tình trạng phòng & bài đăng
                    </h2>
                    <p className="text-sm text-gray-500">
                      Theo dõi công suất phòng và hiệu quả bài đăng trong giai đoạn đã chọn.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Tỷ lệ lấp đầy</p>
                    <p className="text-2xl font-semibold text-teal-600">{occupancyRate}%</p>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[220px,minmax(0,1fr)] items-center">
                    <div className="mx-auto">
                      <div className="relative h-44 w-44">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(#0f766e 0deg ${donut.aDeg}deg, #d1fae5 ${donut.aDeg}deg 360deg)`
                          }}
                        />
                        <div className="absolute inset-4 rounded-full bg-white shadow-inner flex items-center justify-center text-3xl font-semibold text-gray-800">
                          {donut.total}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <OccupancyBadge title="Phòng trống" value={donut.available} tone="teal" />
                      <OccupancyBadge title="Phòng đang ở" value={donut.occupied} tone="gray" />
                      <OccupancyBadge
                        title="Hợp đồng sắp hết hạn"
                        value={summary.contracts.expiringSoon}
                        tone="amber"
                      />
                      <OccupancyBadge
                        title="Hợp đồng đã kết thúc"
                        value={endedContracts}
                        tone="rose"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">
                      Bài đăng theo trạng thái
                    </h3>
                    <div className="space-y-4">
                      {(() => {
                        const postStatus = summary.posts.byStatus || {};
                        const viMap: Record<string, string> = {
                          active: "Đang hoạt động",
                          pending: "Chờ duyệt",
                          approved: "Đã duyệt",
                          inactive: "Đã ẩn",
                          rejected: "Bị từ chối"
                        };
                        const order = ["active", "pending", "approved", "inactive", "rejected"];
                        return order
                          .filter((key) => postStatus[key] != null)
                          .map((key) => {
                            const rawValue = postStatus[key] || 0;
                            const percent = summary.posts.total
                              ? Math.round((rawValue / summary.posts.total) * 100)
                              : 0;
                            return (
                              <div key={key} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-gray-700">
                                    {viMap[key] || key}
                                  </span>
                                  <span className="text-gray-500">
                                    {rawValue} bài · {percent}%
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-white overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-teal-500 transition-all"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-6 xl:col-span-4">
                <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
                  <div className="px-6 py-5 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Ghi chú nhanh</h2>
                    <p className="text-sm text-gray-500">
                      Những việc nên ưu tiên để duy trì hiệu suất.
                    </p>
                  </div>
                  <ul className="px-6 py-5 space-y-4 text-sm text-gray-600">
                    <InsightItem
                      title="Doanh thu ổn định"
                      description="Doanh thu đã thu tiếp tục tăng trưởng. Tiếp tục duy trì công suất phòng hiện tại."
                    />
                    <InsightItem
                      title="Theo dõi hợp đồng sắp hết hạn"
                      description={`${summary.contracts.expiringSoon} hợp đồng sẽ hết hạn sớm. Chủ động liên hệ gia hạn với khách thuê.`}
                    />
                    <InsightItem
                      title="Tối ưu bài đăng"
                      description={`${summary.posts.byStatus?.inactive ?? 0} bài đăng đang ở trạng thái ẩn. Cân nhắc kích hoạt lại để tăng khả năng được nhìn thấy.`}
                    />
                  </ul>
                </section>
              </aside>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

function StatInline({
  title,
  value,
  subtitle,
  icon: Icon
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: IconType;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gray-50 px-5 py-4">
      <Icon className="h-7 w-7 text-teal-600" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
  variant
}: {
  label: string;
  value?: string;
  onChange: (value?: string) => void;
  variant?: "compact";
}) {
  const baseLabelClass =
    "flex flex-col text-xs font-medium " +
    (variant === "compact" ? "text-gray-600" : "text-white/80");
  const baseInputClass =
    "rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-500 focus:ring-0";
  const themedInput =
    variant === "compact"
      ? "border border-gray-200 bg-white text-gray-700"
      : "border border-white/30 bg-white/20 text-white placeholder-white/60";

  return (
    <label className={baseLabelClass}>
      <span className="mb-1">{label}</span>
      <input
        type="date"
        value={value?.slice(0, 10) || ""}
        onChange={(e) =>
          onChange(
            e.target.value ? new Date(e.target.value).toISOString() : undefined
          )
        }
        className={`${baseInputClass} ${themedInput}`}
      />
    </label>
  );
}

function OccupancyBadge({
  title,
  value,
  tone
}: {
  title: string;
  value: number;
  tone: "teal" | "gray" | "amber" | "rose";
}) {
  const toneClasses: Record<"teal" | "gray" | "amber" | "rose", string> = {
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100"
  };
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${toneClasses[tone]}`}
    >
      <p className="text-xs uppercase tracking-wide text-current/70 mb-1">
        {title}
      </p>
      <p className="text-lg font-semibold text-current">{value}</p>
    </div>
  );
}

function InsightItem({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <li className="rounded-2xl bg-gray-50 px-4 py-3">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="h-32 rounded-3xl bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-rose-50 px-6 py-12 text-center shadow">
      <p className="text-lg font-semibold text-rose-700 mb-2">
        Đã có lỗi xảy ra
      </p>
      <p className="text-sm text-rose-600 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 transition-colors"
      >
        <FaRedoAlt className="h-4 w-4" />
        Thử lại
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center shadow">
      <p className="text-lg font-semibold text-gray-800 mb-2">
        Chưa có dữ liệu thống kê
      </p>
      <p className="text-sm text-gray-500">
        Hãy đảm bảo bạn đã tạo phòng và bài đăng để bắt đầu theo dõi hiệu suất.
      </p>
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND"
  });
}
