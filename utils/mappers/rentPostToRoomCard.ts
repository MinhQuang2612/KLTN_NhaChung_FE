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
    address: p.address,
    city: p.address.city, // Backward compatibility
    price: p.basicInfo.price,
    isVerified: p.isVerified,
  };
}
