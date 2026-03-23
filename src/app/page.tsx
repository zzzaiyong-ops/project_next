"use client";

import dynamic from "next/dynamic";

const SSGLiveApp = dynamic(() => import("@/components/SSGLiveApp"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f4f5f8",
        fontFamily: "Pretendard, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 900,
            color: "#C8102E",
            marginBottom: "8px",
          }}
        >
          SSGLIVE
        </div>
        <div style={{ fontSize: "13px", color: "#9496aa" }}>로딩 중...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <SSGLiveApp />;
}
