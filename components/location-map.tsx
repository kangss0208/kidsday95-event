"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import { getMeetingPoints, pickMeetingPointForChild } from "@/lib/store"

let kakaoScriptState: 'idle' | 'loading' | 'loaded' = 'idle'
const kakaoReadyCallbacks: Array<() => void> = []

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
  const [mapsLoaded, setMapsLoaded] = useState(false)

  // 아이 ID 해시로 집합 장소 고정 배정
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const points = await getMeetingPoints()
          if (cancelled) return
          const p = pickMeetingPointForChild(childId, points)
          if (p) {
            setLocation({ name: p.name, lat: p.lat, lng: p.lng })
          }
        } catch { }
      })()
    return () => { cancelled = true }
  }, [childId])

  // 카카오맵 스크립트 로딩 (apiKey만 의존 — location 변경 시 재실행 없음)
  useEffect(() => {
    if (!apiKey) return
    if (window.kakao?.maps) { setMapsLoaded(true); return }

    const onReady = () => window.kakao.maps.load(() => setMapsLoaded(true))

    if (kakaoScriptState === 'loaded') { onReady(); return }
    if (kakaoScriptState === 'loading') { kakaoReadyCallbacks.push(onReady); return }

    kakaoScriptState = 'loading'
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`
    script.async = true
    script.onload = () => {
      kakaoScriptState = 'loaded'
      onReady()
      kakaoReadyCallbacks.forEach(cb => cb())
      kakaoReadyCallbacks.length = 0
    }
    script.onerror = () => {
      kakaoScriptState = 'idle'
      console.warn('Kakao Maps 로딩 실패')
    }
    document.head.appendChild(script)
  }, [apiKey])

  // 지도 초기화 (스크립트 준비 완료 후, location 변경 시 재초기화)
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return
    const coords = new window.kakao.maps.LatLng(location.lat, location.lng)
    const map = new window.kakao.maps.Map(mapRef.current, { center: coords, level: 3 })
    const marker = new window.kakao.maps.Marker({ position: coords, map })
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:6px 10px;font-size:13px;font-weight:bold;">${location.name}</div>`,
    })
    infowindow.open(map, marker)
  }, [mapsLoaded, location])

  const openKakaoMap = () => {
    const appUrl = `kakaomap://look?p=${location.lat},${location.lng}`
    const webUrl = `https://map.kakao.com/link/map/${encodeURIComponent(location.name)},${location.lat},${location.lng}`
    window.open(appUrl)
    const timer = setTimeout(() => { window.open(webUrl, '_blank') }, 1500)
    window.addEventListener('blur', () => clearTimeout(timer), { once: true })
  }

  const openNaverMap = () => {
    const appUrl = `nmap://place?lat=${location.lat}&lng=${location.lng}&name=${encodeURIComponent(location.name)}&appname=kr.co.caratEvent`
    const webUrl = `https://map.naver.com/p/search/${encodeURIComponent(location.name)}`
    window.open(appUrl)
    const timer = setTimeout(() => { window.open(webUrl, '_blank') }, 1500)
    window.addEventListener('blur', () => clearTimeout(timer), { once: true })
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
