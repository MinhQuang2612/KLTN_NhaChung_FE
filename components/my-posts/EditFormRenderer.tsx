"use client";

import type { Category } from "../../types/RentPostApi";
import PhongTroEditForm from "./forms/PhongTroEditForm";
import ChungCuEditForm from "./forms/ChungCuEditForm";
import NhaNguyenCanEditForm from "./forms/NhaNguyenCanEditForm";
import RoommateEditForm from "./forms/RoommateEditForm";

interface EditFormRendererProps {
  category: Category;
  formData: any;
  onInputChange: (name: string, value: any) => void;
  onNumberChange: (name: string, value: string | number) => void;
}

export default function EditFormRenderer({
  category,
  formData,
  onInputChange,
  onNumberChange,
}: EditFormRendererProps) {
  const rentCategories = ["phong-tro", "chung-cu", "nha-nguyen-can"] as const;
  const isRoommatePost = !rentCategories.includes(
    String(category || "").toLowerCase() as any
  );

  if (isRoommatePost) {
    return (
      <RoommateEditForm
        formData={formData}
        onInputChange={onInputChange}
        onNumberChange={onNumberChange}
      />
    );
  }

  switch (category) {
    case "phong-tro":
      return (
        <PhongTroEditForm
          formData={formData}
          onInputChange={onInputChange}
          onNumberChange={onNumberChange}
        />
      );
    case "chung-cu":
      return (
        <ChungCuEditForm
          formData={formData}
          onInputChange={onInputChange}
          onNumberChange={onNumberChange}
        />
      );
    case "nha-nguyen-can":
      return (
        <NhaNguyenCanEditForm
          formData={formData}
          onInputChange={onInputChange}
          onNumberChange={onNumberChange}
        />
      );
    default:
      return (
        <PhongTroEditForm
          formData={formData}
          onInputChange={onInputChange}
          onNumberChange={onNumberChange}
        />
      );
  }
}


