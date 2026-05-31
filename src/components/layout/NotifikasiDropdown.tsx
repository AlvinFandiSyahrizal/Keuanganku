"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Notifikasi {
  id: string;
  tipe: "warning" | "danger" | "info";
  judul: string;
  pesan: string;
  href: string;
}

export default function NotifikasiDropdown() {
  const [notifs, setNotifs] = useState<Notifikasi[]>([]);
  const [open, setOpen] = useState(false);
  const [dibaca, setDibaca] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notifikasi")
      .then((r) => r.json())
      .then((data) => setNotifs(Array.isArray(data) ? data : []));
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const belumDibaca = notifs.filter((n) => !dibaca.has(n.id)).length;

  const handleKlik = (notif: Notifikasi) => {
    setDibaca((prev) => new Set([...prev, notif.id]));
    setOpen(false);
    router.push(notif.href);
  };

  const tandaiSemuaDibaca = () => {
    setDibaca(new Set(notifs.map((n) => n.id)));
  };

  const warnaTipe = {
    danger: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-100", dot: "bg-red-500" },
    warning: { bg: "bg-amber-50", icon: "text-amber-500", border: "border-amber-100", dot: "bg-amber-400" },
    info: { bg: "bg-blue-50", icon: "text-blue-500", border: "border-blue-100", dot: "bg-blue-400" },
  };

  const ikonTipe = {
    danger: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {belumDibaca > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {belumDibaca > 9 ? "9+" : belumDibaca}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Notifikasi</p>
            {belumDibaca > 0 && (
              <button onClick={tandaiSemuaDibaca}
                className="text-xs text-purple-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifs.map((n) => {
                const w = warnaTipe[n.tipe];
                const sudahDibaca = dibaca.has(n.id);
                return (
                  <button key={n.id} onClick={() => handleKlik(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex gap-3 items-start
                      ${sudahDibaca ? "opacity-60" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg ${w.bg} ${w.icon} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {ikonTipe[n.tipe]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-gray-800 truncate">{n.judul}</p>
                        {!sudahDibaca && (
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${w.dot}`} />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.pesan}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}