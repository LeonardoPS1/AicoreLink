"use client";

export function BlogBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Blog", posts = [] } = content;

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any, index: number) => (
              <article key={index} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {post.image && (
                  <div className="aspect-video bg-slate-100">
                    <img src={post.image} alt={post.title || `Post ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-navy mb-2">{post.title || `Artículo ${index + 1}`}</h3>
                  {post.excerpt && <p className="text-slate-600 mb-4">{post.excerpt}</p>}
                  <a href={post.url || "#"} className="text-brand font-medium hover:underline">
                    Leer más →
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No hay artículos en el blog.</p>
          </div>
        )}
      </div>
    </section>
  );
}