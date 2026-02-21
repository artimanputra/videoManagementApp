import Link from "next/link";
import Image from "next/image";

export default function DemoStrip() {
  return (
    <section id="demo" className="py-20 bg-[#0b0b0b]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-12">
              <h3 className="text-2xl font-bold">See it in action</h3>
              <p className="text-gray-400 mt-3">
                Upload a file, generate segments, and export — the workflow is
                fast, clean, and built to keep you focused.
              </p>

              <ul className="text-sm text-gray-300 mt-6 space-y-2">
                <li>✓ Drag & drop upload</li>
                <li>✓ One-click segment generation</li>
                <li>✓ Preview and tweak each cut</li>
                <li>✓ Download segments with filenames</li>
              </ul>

              <div className="mt-8 flex gap-3">
                <Link
                  href="/signup "
                  className="px-5 py-3 rounded bg-red-600 hover:bg-red-700 text-sm font-medium"
                >
                  Try it now →
                </Link>

                <Link
                  href="/videos/create"
                  className="px-5 py-3 rounded border border-[#2a2a2a] bg-[#121212] hover:bg-[#181818] text-sm"
                >
                  Upload a video
                </Link>
              </div>
            </div>

            <div className="relative h-80 lg:h-full bg-black">
              <Image
                src="/demo-screenshot.png"
                alt="Demo preview"
                fill
                className="object-cover opacity-90"
              />
              <div className="absolute bottom-4 right-4 text-[11px] text-white/80 bg-black/40 px-2 py-1 rounded">
                Demo preview
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}