"use client";

export function ReviewsBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Reseñas de clientes", reviews = [] } = content;

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review: any, index: number) => (
              <article key={index} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${star <= (review.rating || 5) ? "text-amber-400 fill-current" : "text-slate-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.91l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.67-.38-1.91.588-1.91h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 mb-4">{review.comment || "Excelente servicio, muy recomendado."}</p>
                <div className="flex items-center gap-3">
                  {review.avatar && (
                    <img src={review.avatar} alt={review.author || "Cliente"} className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-medium text-navy">{review.author || "Cliente"}</p>
                    {review.date && <p className="text-sm text-slate-500">{review.date}</p>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No hay reseñas aún.</p>
          </div>
        )}
      </div>
    </section>
  );
}