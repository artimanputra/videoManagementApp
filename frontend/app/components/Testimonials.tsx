export default function Testimonials() {
  const quotes = [
    {
      quote:
        "I trimmed a 90‑minute recording into 12 clean clips in minutes. The preview is 🔥.",
      author: "Creator",
    },
    {
      quote:
        "Fast, minimal, and it just works. The segment export saved me a ton of time.",
      author: "Editor",
    },
    {
      quote:
        "Perfect for cutting talks and tutorials into chapters for socials.",
      author: "Educator",
    },
  ];

  return (
    <section className="py-20 bg-[#0b0b0b]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Loved by editors & creators
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="bg-[#141414] border border-[#222] rounded-xl p-6"
            >
              <blockquote className="text-gray-200">“{q.quote}”</blockquote>
              <figcaption className="text-gray-500 text-sm mt-4">
                — {q.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}