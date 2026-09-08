"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone,
  CheckCircle2
} from "lucide-react";
import ThreeDTiltCard from "./ThreeDTiltCard";

interface QRCodeCardProps {
  platform: "ios" | "android";
  title: string;
  subtitle: string;
  url: string;
  badgeLabel: string;
  versionReq: string;
  features: string[];
  fallbackDirectDownloadUrl?: string;
}

export default function QRCodeCard({
  platform,
  title,
  subtitle,
  url,
  badgeLabel,
  versionReq,
  features,
  fallbackDirectDownloadUrl
}: QRCodeCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1.5,
      width: 360,
      color: {
        dark: "#1E293B",
        light: "#FFFFFF",
      },
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error("Lỗi tạo mã QR:", err));
  }, [url]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Không thể sao chép:", e);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `roboaian-qr-${platform}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const isApple = platform === "ios";

  return (
    <ThreeDTiltCard
      maxTilt={8}
      perspective={1000}
      scale={1.015}
      className="p-[1px] rounded-3xl h-full"
    >
      <div
        className="relative w-full h-full rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-orange-100 hover:border-orange-300 p-4 sm:p-5 lg:p-6 flex flex-col justify-between shadow-xl shadow-orange-500/10 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Subtle Ambient Glow */}
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 -z-10 bg-orange-200"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Left Column: Info & Actions */}
          <div className="flex-1 w-full text-left flex flex-col justify-between" style={{ transform: "translateZ(25px)" }}>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-orange-50 text-orange-600 border-orange-200 shadow-sm">
                  {isApple ? (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.04-1.9.57-2.51 1.28-.54.62-.97 1.63-.85 2.61.96.07 1.92-.51 2.48-1.17z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5517 0 .9999.4486.9999 1.0003.0001.5517-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5516 0 .9999.4486.9999 1.0003 0 .5517-.4483 1.0003-.9999 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5898 8.4116 13.8483 8.1 12 8.1c-1.8485 0-3.5902.3116-5.1367.8497L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>
                    </svg>
                  )}
                  <span>{badgeLabel}</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {versionReq}
                </span>
              </div>

              <h3 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 mb-2">{subtitle}</p>
            </div>

            {/* Feature Points */}
            <div className="space-y-1 mb-3">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 transition-all transform active:scale-95"
              >
                <span>{isApple ? "Mở cài đặt App Store" : "Mở tải Google Play"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Sao chép liên kết"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Chép link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadQR}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Tải ảnh mã QR"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Lưu QR</span>
                </button>

                {fallbackDirectDownloadUrl && (
                  <a
                    href={fallbackDirectDownloadUrl}
                    download
                    className="py-1.5 px-2.5 rounded-lg bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                    title={isApple ? "Tải hồ sơ cấu hình iOS (.mobileconfig)" : "Tải file APK trực tiếp"}
                  >
                    <span>{isApple ? "Tải hồ sơ" : "Tải APK"}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 3D Floating QR Code */}
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center"
            style={{ transform: "translateZ(45px)" }}
          >
            <div className="relative p-2.5 bg-white rounded-2xl shadow-md border-2 border-orange-100 group-hover:border-orange-300 transition-all duration-300 group-hover:scale-105">
              {qrDataUrl ? (
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 xl:w-44 xl:h-44 overflow-hidden rounded-xl">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${title}`}
                    className="w-full h-full object-contain block"
                  />

                  <div className="absolute inset-0 m-auto w-9 h-9 bg-white rounded-lg shadow border border-slate-200 flex items-center justify-center pointer-events-none">
                    {isApple ? (
                      <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.04-1.9.57-2.51 1.28-.54.62-.97 1.63-.85 2.61.96.07 1.92-.51 2.48-1.17z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 fill-orange-600" viewBox="0 0 24 24">
                        <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5517 0 .9999.4486.9999 1.0003.0001.5517-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5516 0 .9999.4486.9999 1.0003 0 .5517-.4483 1.0003-.9999 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5898 8.4116 13.8483 8.1 12 8.1c-1.8485 0-3.5902.3116-5.1367.8497L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>
                      </svg>
                    )}
                  </div>

                  <div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_12px_#f97316] pointer-events-none animate-scan"
                    style={{
                      animation: "scanBeam 3s ease-in-out infinite alternate",
                    }}
                  />
                </div>
              ) : (
                <div className="w-36 h-36 sm:w-40 sm:h-40 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
              <Smartphone className="w-3 h-3 text-orange-500" />
              Mở Camera quét để tải ngay
            </p>
          </div>
        </div>
      </div>
    </ThreeDTiltCard>
  );
}
