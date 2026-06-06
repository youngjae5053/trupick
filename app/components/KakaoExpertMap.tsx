"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExpertDiscoveryProfile, mockUserLocation } from "@/app/experts/expertDiscoveryData";

type KakaoExpertMapProps = {
  experts: ExpertDiscoveryProfile[];
  selectedExpertId: number | null;
  onSelectExpert: (expert: ExpertDiscoveryProfile) => void;
};

type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
};

type KakaoMap = unknown;

type KakaoMapsApi = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number }
  ) => KakaoMap;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker;
  event: {
    addListener: (target: KakaoMarker, type: "click", callback: () => void) => void;
  };
};

declare global {
  interface Window {
    kakao?: {
      maps?: KakaoMapsApi;
    };
  }
}

const kakaoMapAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
const kakaoMapMissingMessage =
  "Kakao Maps 앱 키 설정 후 실제 지도가 표시됩니다.";

function getExpertCoordinate(expert: ExpertDiscoveryProfile) {
  const bearingRadians = (expert.bearingDegrees * Math.PI) / 180;
  const latDelta = (expert.distanceMeters * Math.cos(bearingRadians)) / 111_320;
  const lngDelta =
    (expert.distanceMeters * Math.sin(bearingRadians)) /
    (111_320 * Math.cos((mockUserLocation.latitude * Math.PI) / 180));

  return {
    latitude: mockUserLocation.latitude + latDelta,
    longitude: mockUserLocation.longitude + lngDelta,
  };
}

function getMarkerPosition(expert: ExpertDiscoveryProfile) {
  const radius = Math.min(expert.distanceMeters / 10_000, 1) * 42;
  const angle = (expert.bearingDegrees - 90) * (Math.PI / 180);

  return {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius}%`,
  };
}

function formatDistance(meters: number) {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

export default function KakaoExpertMap({
  experts,
  selectedExpertId,
  onSelectExpert,
}: KakaoExpertMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(
    kakaoMapAppKey ? "" : kakaoMapMissingMessage
  );

  const selectedExpert = useMemo(
    () => experts.find((expert) => expert.id === selectedExpertId) ?? experts[0],
    [experts, selectedExpertId]
  );

  useEffect(() => {
    if (!kakaoMapAppKey) {
      return;
    }

    if (window.kakao?.maps) {
      window.setTimeout(() => setMapReady(true), 0);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-trupick-kakao-map]"
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setMapReady(true), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.dataset.trupickKakaoMap = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapAppKey}&autoload=false`;
    script.onload = () => setMapReady(true);
    script.onerror = () =>
      setMapError("지도를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !containerRef.current || !window.kakao?.maps) {
      return;
    }

    const kakaoMaps = window.kakao.maps;

    kakaoMaps.load(() => {
      if (!containerRef.current) {
        return;
      }

      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const selectedCoordinate = selectedExpert
        ? getExpertCoordinate(selectedExpert)
        : mockUserLocation;
      const map = new kakaoMaps.Map(containerRef.current, {
        center: new kakaoMaps.LatLng(
          selectedCoordinate.latitude,
          selectedCoordinate.longitude
        ),
        level: 5,
      });

      experts.forEach((expert) => {
        const coordinate = getExpertCoordinate(expert);
        const marker = new kakaoMaps.Marker({
          position: new kakaoMaps.LatLng(coordinate.latitude, coordinate.longitude),
          map,
        });

        kakaoMaps.event.addListener(marker, "click", () => onSelectExpert(expert));
        markersRef.current.push(marker);
      });
    });
  }, [experts, mapReady, onSelectExpert, selectedExpert]);

  return (
    <section className="mt-8 rounded-[8px] border border-[#E5E7EB] bg-white p-4 shadow-[0_18px_60px_rgba(24,24,20,0.06)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F5132]">
            Kakao Maps
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#111111]">
            지도에서 가까운 전문가 보기
          </h2>
        </div>
        <p className="text-sm font-bold text-[#4B5563]">
          {selectedExpert
            ? `${selectedExpert.location} · ${formatDistance(selectedExpert.distanceMeters)}`
            : "전문가 위치를 지도에 표시합니다."}
        </p>
      </div>

      <div className="relative mt-5 min-h-[360px] overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-[#F5F1E8]">
        {mapReady && !mapError ? (
          <div ref={containerRef} className="absolute inset-0" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <div className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-[#ff5a5f] text-xs font-black text-white shadow-lg">
              YOU
            </div>
            {experts.map((expert) => (
              <button
                key={expert.id}
                type="button"
                onClick={() => onSelectExpert(expert)}
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 bg-white px-3 py-2 text-xs font-black shadow-[0_14px_35px_rgba(24,24,20,0.18)] transition hover:scale-105 ${
                  selectedExpertId === expert.id
                    ? "border-[#0F5132] text-[#0F5132]"
                    : "border-white text-[#111111]"
                }`}
                style={getMarkerPosition(expert)}
              >
                {expert.nickname}
              </button>
            ))}
            <div className="absolute bottom-4 left-4 right-4 rounded-[8px] bg-white/95 p-3 text-sm font-bold leading-6 text-[#374151] shadow-sm">
              {mapError || "Kakao Maps를 불러오는 중입니다."}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
