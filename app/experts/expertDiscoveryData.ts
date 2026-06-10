import { ExpertCategory } from "@/app/expertCategories";

export type ExpertDiscoveryProfile = {
  id: number;
  nickname: string;
  profession: string;
  category: ExpertCategory;
  location: string;
  description: string;
  career: string;
  certifications: string[];
  specialtyTags: string[];
  consultationMethods: string[];
  snsUrl: string | null;
  portfolioUrl: string | null;
  planType: "free" | "premium";
  rating: number;
  reviewCount: number;
  distanceMeters: number;
  bearingDegrees: number;
  photoUrl: string;
};

export type UserDiscoveryLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export const mockUserLocation: UserDiscoveryLocation = {
  label: "서울 성수동 기준",
  latitude: 37.5446,
  longitude: 127.0557,
};

export async function getNearbyExperts(): Promise<ExpertDiscoveryProfile[]> {
  return [];
}
