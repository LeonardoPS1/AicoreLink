"use client";

import Image from "next/image";

export function GalleryBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Galería", images = [] } = content;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image: any, index: number) => {
              const src = typeof image === "string" ? image : image.url || image.src;
              const alt = typeof image === "string" ? `Imagen ${index + 1}` : image.alt || `Imagen ${index + 1}`;
              return (
                <div key={index} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No hay imágenes en la galería. Agrega imágenes en el perfil del negocio.</p>
          </div>
        )}
      </div>
    </section>
  );
}