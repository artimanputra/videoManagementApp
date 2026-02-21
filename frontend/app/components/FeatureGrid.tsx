export default function FeatureGrid() {
  const features = [
    {
      title: "Upload & Split",
      desc: "Drag‑and‑drop your video. Generate precise segments in one click.",
      icon: UploadIcon,
    },
    {
      title: "Instant Preview",
      desc: "Scrub and preview each cut in‑app before exporting.",
      icon: PreviewIcon,
    },
    {
      title: "Export Clean Cuts",
      desc: "Download segments individually at high quality.",
      icon: DownloadIcon,
    },
    {
      title: "Organize Easily",
      desc: "Titles, statuses, search, and filters to stay on top of projects.",
      icon: FolderIcon,
    },
    {
      title: "Fast & Minimal",
      desc: "Dark UI, keyboard‑friendly, built for speed.",
      icon: LightningIcon,
    },
    {
      title: "Secure by Design",
      desc: "Your account‑scoped media with token‑based access.",
      icon: ShieldIcon,
    },
  ];

  return (
    <section id="features" className="py-8 bg-[#0b0b0b]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Everything you need to cut faster
        </h2>
        <p className="text-gray-400 text-center mt-3">
          From upload to export — optimized for a smooth, focused workflow.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[#141414] border border-[#222] rounded-xl p-6 hover:border-red-500 transition"
            >
              <div className="w-10 h-10 rounded bg-red-600/20 text-red-400 flex items-center justify-center mb-4">
                <f.icon />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
function PreviewIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="3" strokeWidth="1.6" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 8v12m0 0l4-4m-4 4-4-4M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
function LightningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M13 3L4 14h7l-1 7 9-11h-7l1-7Z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4Z" />
      <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.5l1.5 1.5 3.5-3.5" />
    </svg>
  );
}