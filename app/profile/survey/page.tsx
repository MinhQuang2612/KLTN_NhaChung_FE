"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProfileSurvey from "@/components/profile/ProfileSurvey";

function ProfileSurveyContent() {
  const params = useSearchParams();
  const role = (params.get("role") as "user" | "landlord") || "user";
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ProfileSurvey role={role} />
    </div>
  );
}

export default function ProfileSurveyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">Đang tải...</div>}>
      <ProfileSurveyContent />
    </Suspense>
  );
}


