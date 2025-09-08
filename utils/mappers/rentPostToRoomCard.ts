// utils/mappers/rentPostToRoomCard.ts
import type { RentPostApi, RoomCardData } from "@/types/RentPostApi";

export function rentPostToRoomCard(p: RentPostApi): RoomCardData {
  const showBedsBaths = p.category !== "phong-tro";
  return {
    rentPostId: p.rentPostId,
    category: p.category,
    title: p.title,
    cover: p.images?.[0] ?? "",
    photoCount: p.images?.length ?? 0,
    area: p.basicInfo.area,
    bedrooms: showBedsBaths ? p.basicInfo.bedrooms : undefined,
    bathrooms: showBedsBaths ? p.basicInfo.bathrooms : undefined,
    district: p.address.district,
    city: p.address.city,
    price: p.basicInfo.price,
    isVerified: p.isVerified,
  };
}
