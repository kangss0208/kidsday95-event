import type { Metadata, Viewport } from 'next';
import { Nunito, Nunito_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://v0-kidsday95-event.vercel.app'),
  title: '95들의 어린이날',
  description: '제1회 뮤우어린이집 현장학습',
  generator: 'v0.app',
  openGraph: {
    title: '95들의 어린이날',
    description: '제1회 뮤우어린이집 현장학습',
    url: 'https://v0-kidsday95-event.vercel.app',
    siteName: '95들의 어린이날',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: '/kakao_share2.png',
        width: 1200,
        height: 630,
        alt: '95들의 어린이날 - 제1회 뮤우어린이집 현장학습',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '95들의 어린이날',
    description: '제1회 뮤우어린이집 현장학습',
    images: ['/kakao_share2.png'],
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/favicon.ico', rel: 'shortcut icon' },
    ],
    apple: [
      { url: '/favicon/apple-icon.png' },
      { url: '/favicon/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/favicon/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/favicon/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/favicon/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/favicon/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/favicon/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/favicon/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/favicon/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/favicon/apple-icon-180x180.png', sizes: '180x180' },
    ],
    other: [{ rel: 'manifest', url: '/favicon/manifest.json' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fce7f3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-background">
      <head>
        <link rel="preload" as="font" type="font/ttf" href="/font/NEXON_Maplestory/TTF/Maplestory%20Light.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/ttf" href="/font/NEXON_Maplestory/TTF/Maplestory%20Bold.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/ttf" href="/font/cildren/BMKkubulimTTF.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/ttf" href="/font/cildren/Griun%EF%BC%BFSimsimche%EF%BC%8DRg.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/ttf" href="/font/cildren/junwu.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/ttf" href="/font/cildren/kim.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/ttf" href="/font/cildren/YoonChildfundkoreaManSeh.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/ttf" href="/font/cildren/YoonChildfundkoreaMinGuk.ttf" crossOrigin="anonymous" />
      </head>
      <body className={`${nunito.variable} ${nunitoSans.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
