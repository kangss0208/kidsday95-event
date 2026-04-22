"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import { getMeetingPoints } from "@/lib/store"

const DEFAULT_LOCATION = {
  name: '서울역 10번 출구',
  lat: 37.55441,
  lng: 126.97174,
}

declare global {
  interface Window {
    kakao: any
  }
}

interface Props {
  childId: string
}

export function LocationMap({ childId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
  const [location, setLocation] = useState(DEFAULT_LOCATION)

  // 아이 ID 해시로 집합 장소 고정 배정
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const points = await getMeetingPoints()
          if (points.length > 0 && !cancelled) {
            const hash = parseInt(childId.replace(/-/g, '').slice(0, 8), 16)
            const p = points[hash % points.length]
            setLocation({ name: p.name, lat: p.lat, lng: p.lng })
          }
        } catch { }
      })()
    return () => { cancelled = true }
  }, [childId])

  // 카카오맵 초기화 (location 변경 시 재초기화)
  useEffect(() => {
    if (!apiKey || !mapRef.current) return

    function initMap() {
      if (!mapRef.current) return
      const coords = new window.kakao.maps.LatLng(location.lat, location.lng)
      const map = new window.kakao.maps.Map(mapRef.current, { center: coords, level: 3 })
      const marker = new window.kakao.maps.Marker({ position: coords, map })
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;font-weight:bold;">${location.name}</div>`,
      })
      infowindow.open(map, marker)
    }

    if (window.kakao?.maps) {
      initMap()
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(initMap)
    document.head.appendChild(script)
  }, [apiKey, location])

  const openKakaoMap = () => {
    const appUrl = `kakaomap://look?p=${location.lat},${location.lng}`
    const webUrl = `https://map.kakao.com/link/map/${encodeURIComponent(location.name)},${location.lat},${location.lng}`
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = appUrl
    document.body.appendChild(iframe)
    const timer = setTimeout(() => { window.open(webUrl, '_blank') }, 1500)
    window.addEventListener('blur', () => clearTimeout(timer), { once: true })
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }

  const openNaverMap = () => {
    const appUrl = `nmap://place?lat=${location.lat}&lng=${location.lng}&name=${encodeURIComponent(location.name)}&appname=kr.co.caratEvent`
    const webUrl = `https://map.naver.com/p/search/${encodeURIComponent(location.name)}`
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = appUrl
    document.body.appendChild(iframe)
    const timer = setTimeout(() => { window.open(webUrl, '_blank') }, 1500)
    window.addEventListener('blur', () => clearTimeout(timer), { once: true })
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }

  const openGoogleMap = () => {
    window.open(`https://maps.google.com/?q=${location.lat},${location.lng}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {apiKey ? (
        <div ref={mapRef} className="w-full aspect-video rounded-2xl overflow-hidden border border-border" />
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center border border-border">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">{location.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              NEXT_PUBLIC_KAKAO_MAP_KEY 설정 필요
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border-2 border-primary/20">
        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">만나는 곳</p>
          <p className="font-bold text-foreground">{location.name}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2 text-center">지도 앱에서 열기</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={openKakaoMap}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-colors cursor-pointer"
            style={{ background: '#FEE50020', borderColor: '#FEE50080' }}
          >
            <img src="/kakao_map.png" alt="카카오맵" className="block w-[30%]" />
            <span className="text-xs font-semibold text-foreground">카카오맵</span>
          </button>
          <button
            onClick={openNaverMap}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-colors cursor-pointer"
            style={{ background: '#03C75A20', borderColor: '#03C75A80' }}
          >
            <img src="/naver_map.png" alt="네이버맵" className="block w-[30%]" />
            <span className="text-xs font-semibold text-foreground">네이버맵</span>
          </button>
          <button
            onClick={openGoogleMap}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-colors cursor-pointer"
            style={{ background: '#4285F420', borderColor: '#4285F480' }}
          >
            <img src="/google_map.png" alt="구글맵" className="block w-[30%]" />
            <span className="text-xs font-semibold text-foreground">구글맵</span>
          </button>
        </div>
      </div>
    </div>
  )
}
