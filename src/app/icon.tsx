import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Original, simple geometric mark: a coral rounded square on the site's
// dark navy background, no text or borrowed iconography — deliberately
// minimal so it reads clearly at favicon size.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121A2B",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: "#FF795B",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
