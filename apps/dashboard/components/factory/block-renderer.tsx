"use client";

import { HeroBlock } from "./blocks/hero";
import { ServicesBlock } from "./blocks/services";
import { TeamBlock } from "./blocks/team";
import { ContactBlock } from "./blocks/contact";
import { BookingBlock } from "./blocks/booking";
import { GalleryBlock } from "./blocks/gallery";
import { BlogBlock } from "./blocks/blog";
import { FaqBlock } from "./blocks/faq";
import { ReviewsBlock } from "./blocks/reviews";
import { PromosBlock } from "./blocks/promos";
import { CasesBlock } from "./blocks/cases";
import { ResourcesBlock } from "./blocks/resources";
import { CtaBlock } from "./blocks/cta";

export type BlockType =
  | "hero"
  | "services"
  | "team"
  | "contact"
  | "booking"
  | "gallery"
  | "blog"
  | "faq"
  | "reviews"
  | "promos"
  | "cases"
  | "resources"
  | "cta";

export interface Block {
  type: BlockType;
  content: Record<string, any>;
}

interface BlockRendererProps {
  block: Block;
  index: number;
}

const BLOCK_COMPONENTS: Record<BlockType, React.FC<{ block: Block }>> = {
  hero: ({ block }) => <HeroBlock content={block.content} />,
  services: ({ block }) => <ServicesBlock content={block.content} />,
  team: ({ block }) => <TeamBlock content={block.content} />,
  contact: ({ block }) => <ContactBlock content={block.content} />,
  booking: ({ block }) => <BookingBlock content={block.content} />,
  gallery: ({ block }) => <GalleryBlock content={block.content} />,
  blog: ({ block }) => <BlogBlock content={block.content} />,
  faq: ({ block }) => <FaqBlock content={block.content} />,
  reviews: ({ block }) => <ReviewsBlock content={block.content} />,
  promos: ({ block }) => <PromosBlock content={block.content} />,
  cases: ({ block }) => <CasesBlock content={block.content} />,
  resources: ({ block }) => <ResourcesBlock content={block.content} />,
  cta: ({ block }) => <CtaBlock content={block.content} />,
};

export function BlockRenderer({ block }: BlockRendererProps) {
  const Component = BLOCK_COMPONENTS[block.type];
  if (!Component) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Bloque no soportado:</strong> {block.type}
      </div>
    );
  }
  return <Component block={block} />;
}

export function renderBlocks(blocks: Block[]) {
  return blocks.map((block, index) => (
    <div key={index} className="mb-6">
      <BlockRenderer block={block} index={index} />
    </div>
  ));
}