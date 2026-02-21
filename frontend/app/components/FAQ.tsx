export default function FAQ() {
  const faq = [
    {
      q: "Do you store my videos?",
      a: "Your videos are tied to your account. You can delete them anytime. We keep only what’s needed to process and deliver your segments.",
    },
    {
      q: "Is it free?",
      a: "You can try it free while we’re in beta. We’ll announce pricing later with a generous free tier.",
    },
    {
      q: "What formats are supported?",
      a: "Common formats like MP4/MOV/WEBM typically work well. If something fails, let us know via Issues on GitHub.",
    },
    {
      q: "Can I download each cut separately?",
      a: "Yes — that’s the core feature. Preview cuts, then download individual segments.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-[#0b0b0b]">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">FAQ</h2>
        <div className="mt-10 space-y-4">
          {faq.map((f) => (
            <details
              key={f.q}
              className="group bg-[#141414] border border-[#222] rounded-xl p-5"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between">
                <span className="font-medium">{f.q}</span>
                <span className="text-gray-400 group-open:rotate-180 transition">
                  ▼
                </span>
              </summary>
              <p className="text-gray-400 text-sm mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}