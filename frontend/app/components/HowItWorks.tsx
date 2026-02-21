export default function HowItWorks() {
  const steps = [
    { n: 1, title: "Upload", desc: "Add your video from any device." },
    { n: 2, title: "Split", desc: "Auto‑generate segments or select ranges." },
    { n: 3, title: "Preview", desc: "Scrub, fine‑tune, and confirm cuts." },
    { n: 4, title: "Download", desc: "Export clean segments individually." },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#0b0b0b]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">How it works</h2>
        <p className="text-gray-400 text-center mt-3">
          From long footage to clean clips in four simple steps.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div
              key={s.n}
              className="bg-[#141414] border border-[#222] rounded-xl p-6 text-center"
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-red-600/20 text-red-400 flex items-center justify-center font-semibold">
                {s.n}
              </div>
              <h3 className="font-semibold mt-4">{s.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}