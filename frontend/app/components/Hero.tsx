"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function Hero() {
  const [isAuthed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      setAuthed(!!localStorage.getItem("token"));
    } catch {
      setAuthed(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {}
    setAuthed(false);
    router.replace("/");
  }, [router]);

  return (
    <section className="relative overflow-hidden bg-[#0b0b0b]">
      {/* subtle glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-red-600/10 blur-3xl rounded-full" />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center relative">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Split Videos in Seconds.
          <br />
          <span className="text-red-500">
            Edit smarter. Download faster.
          </span>
        </h1>

        <p className="text-gray-400 max-w-2xl mx-auto text-lg mt-6">
          Upload a video, generate precise cuts, preview instantly, and export
          clean segments — all in a fast, distraction-free interface.
        </p>

        <div className="flex items-center justify-center gap-4 mt-10">
          {!isAuthed ? (
            <>
              <Link
                href="/signup"
                className="px-6 py-3 rounded bg-red-600 hover:bg-red-700 font-medium"
              >
                Try it free →
              </Link>

              <a
                href="#demo"
                className="px-6 py-3 rounded border border-[#2a2a2a] bg-[#121212] hover:bg-[#181818]"
              >
                See demo
              </a>
            </>
          ) : (
            <>
              <Link
                href="/videos/create"
                className="px-6 py-3 rounded bg-red-600 hover:bg-red-700 font-medium"
              >
                <div className="flex items-center justify-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
              </svg>
                Upload a video
                </div>
              </Link>

              <Link
                href="/dashboard"
                className="px-4 py-3 text-sm rounded bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a]"
              >  
              <div className="flex items-center justify-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>             
                Go To Dashboard
              </div>
              </Link>
            </>
          )}
        </div>

        <div className="aspect-video rounded-lg overflow-hidden relative mt-6">
          <video
            src="/demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        </div>

        <div className="text-xs text-gray-500 mt-6">
          No watermark • Browser-based • Fast exports
        </div>
      </div>
    </section>
  );
}