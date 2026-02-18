"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      alert("Invalid credentials");
      return;
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b]">
      <div className="w-full max-w-md bg-[#141414] border border-[#222] rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white text-center">
          Video Management App
        </h1>
        <p className="text-sm text-gray-400 text-center mt-2">
          Sign in to continue
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            className="w-full px-4 py-3 rounded-md bg-[#0f0f0f] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />

          <input
            className="w-full px-4 py-3 rounded-md bg-[#0f0f0f] border border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />

          <button
            type="submit"
            className="w-full py-3 rounded-md bg-red-600 hover:bg-red-700 transition text-white font-medium"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-red-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
