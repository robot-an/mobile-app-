"use client";

import React, { useState } from "react";
import { X, Link2, Loader2, AlertTriangle, Sparkles } from "lucide-react";

export interface ParsedLabImport {
  full_name: string | null;
  gender: "male" | "female" | "other" | null;
  birth_year: number | null;
  phone: string | null;
  test_code: string | null;
  test_date: string | null;
  facility: string | null;
  ordering_doctor: string | null;
  status: string | null;
  diagnosis: string | null;
  health_classification: string | null;
  recommendations: string | null;
  results: Array<{
    category: string;
    name: string;
    value: string;
    unit?: string | null;
    reference_range?: string | null;
    note?: string | null;
    is_abnormal?: boolean;
  }>;
}

interface ImportLabLinkModalProps {
  onClose: () => void;
  onImported: (data: ParsedLabImport) => void;
}

export default function ImportLabLinkModal({ onClose, onImported }: ImportLabLinkModalProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    const trimmed = link.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://robot-an-backend.onrender.com";
      const res = await fetch(`${backendUrl}/api/import-medical-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: trimmed })
      });

      if (!res.ok) {
        throw new Error(
          res.status === 422
            ? "Không đọc được dữ liệu từ liên kết này. Kiểm tra lại link hoặc thử nhập tay."
            : `Máy chủ trả lỗi (${res.status})`
        );
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error("Không đọc được dữ liệu từ liên kết này.");
      }

      onImported(json.data as ParsedLabImport);
    } catch (err: any) {
      console.error("Lỗi nhập phiếu xét nghiệm:", err);
      setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black/40 flex items-end justify-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-4 pb-6 space-y-3.5 animate-slideUp">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-medical-blue">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-navy-900">Nhập từ phiếu xét nghiệm</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Dán link phiếu kết quả xét nghiệm (VD: MEDLATEC) — hệ thống sẽ tự đọc và điền sẵn thông tin,
          bạn xem lại trước khi lưu vào Sổ Y Bạ.
        </p>

        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://medlatec.vn/phieu-ket-qua?lid=..."
          disabled={loading}
          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:border-medical-blue focus:ring-0 disabled:opacity-60"
        />

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-[11px] font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !link.trim()}
          className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-medical-blue hover:bg-medical-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang đọc dữ liệu...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Đọc & Điền tự động</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
