"use client";

import { useSearchParams } from "next/navigation";
import ProfileSurvey from "@/components/profile/ProfileSurvey";

export default function ProfileSurveyPage() {
  const params = useSearchParams();
  const role = (params.get("role") as "user" | "landlord") || "user";
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ProfileSurvey role={role} />
    </div>
  );
}


