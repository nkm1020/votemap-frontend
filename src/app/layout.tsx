import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VOTEMAP.LIVE - 실시간 한국 여론 지형 지도",
  description: "실시간으로 한국의 지역별 투표 결과를 지도로 확인하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Kakao SDK Initialization */}
        {/* <Script 
            src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" 
            integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2txfLE10q6Uy36q17JEJGN" 
            crossOrigin="anonymous" 
            onLoad={() => {
                if (window.Kakao) {
                    // [IMPORTANT] Replace with your actual Kakao JavaScript Key
                    window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY_HERE'); 
                }
            }}
        /> */}
      </body>
    </html>
  );
}
