import { readdir } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

// 파일시스템에서 직접 읽어 한국어 파일명 인코딩 문제 우회
export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'game_img');
    const files = await readdir(dir);
    const names = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map((f) => f.replace(/\.(jpg|jpeg|png|webp)$/i, ''));
    return NextResponse.json({ names });
  } catch {
    return NextResponse.json({ names: [] });
  }
}
