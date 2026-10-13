import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  getTemplatesByRubro,
  getTemplate,
  BlockTypeEnum,
  TemplateBlockSchema,
  TemplatePageSchema,
  SiteTemplateSchema,
  REQUIRED_TEMPLATE_VARIABLES,
} from "@/lib/factory/templates";

describe("Template definitions", () => {
  describe("Total count", () => {
    it("has exactly 9 templates (3 rubros × 3 tiers)", () => {
      expect(TEMPLATES).toHaveLength(9);
    });
  });

  describe("Rubro coverage", () => {
    it("has templates for barberia", () => {
      const barberiaTemplates = getTemplatesByRubro("barberia");
      expect(barberiaTemplates).toHaveLength(3);
    });

    it("has templates for taller", () => {
      const tallerTemplates = getTemplatesByRubro("taller");
      expect(tallerTemplates).toHaveLength(3);
    });

    it("has templates for profesional", () => {
      const profesionalTemplates = getTemplatesByRubro("profesional");
      expect(profesionalTemplates).toHaveLength(3);
    });
  });

  describe("Tier coverage per rubro", () => {
    it("barberia has starter, growth, elite", () => {
      const starter = getTemplate("barberia", "starter");
      const growth = getTemplate("barberia", "growth");
      const elite = getTemplate("barberia", "elite");
      expect(starter).toBeDefined();
      expect(growth).toBeDefined();
      expect(elite).toBeDefined();
    });

    it("taller has starter, growth, elite", () => {
      const starter = getTemplate("taller", "starter");
      const growth = getTemplate("taller", "growth");
      const elite = getTemplate("taller", "elite");
      expect(starter).toBeDefined();
      expect(growth).toBeDefined();
      expect(elite).toBeDefined();
    });

    it("profesional has starter, growth, elite", () => {
      const starter = getTemplate("profesional", "starter");
      const growth = getTemplate("profesional", "growth");
      const elite = getTemplate("profesional", "elite");
      expect(starter).toBeDefined();
      expect(growth).toBeDefined();
      expect(elite).toBeDefined();
    });
  });

  describe("Page counts per tier", () => {
    it("starter templates have 3 pages", () => {
      const starterTemplates = TEMPLATES.filter((t) => t.planTier === "starter");
      starterTemplates.forEach((t) => {
        expect(t.pageCount).toBe(3);
        expect(t.structure).toHaveLength(3);
      });
    });

    it("growth templates have 5 pages", () => {
      const growthTemplates = TEMPLATES.filter((t) => t.planTier === "growth");
      growthTemplates.forEach((t) => {
        expect(t.pageCount).toBe(5);
        expect(t.structure).toHaveLength(5);
      });
    });

    it("elite templates have 10 pages", () => {
      const eliteTemplates = TEMPLATES.filter((t) => t.planTier === "elite");
      eliteTemplates.forEach((t) => {
        expect(t.pageCount).toBe(10);
        expect(t.structure).toHaveLength(10);
      });
    });
  });

  describe("Barbería page structure", () => {
    it("starter has Inicio, Servicios, Contacto", () => {
      const t = getTemplate("barberia", "starter")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual(["/", "/servicios", "/contacto"]);
    });

    it("growth adds Equipo, Reservar", () => {
      const t = getTemplate("barberia", "growth")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual(["/", "/servicios", "/contacto", "/equipo", "/reservar"]);
    });

    it("elite adds Blog, Galeria, Promos, FAQ, Resenas", () => {
      const t = getTemplate("barberia", "elite")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual([
        "/",
        "/servicios",
        "/contacto",
        "/equipo",
        "/reservar",
        "/blog",
        "/galeria",
        "/promos",
        "/faq",
        "/resenas",
      ]);
    });
  });

  describe("Taller page structure", () => {
    it("starter has Inicio, Servicios, Contacto", () => {
      const t = getTemplate("taller", "starter")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual(["/", "/servicios", "/contacto"]);
    });

    it("growth adds Equipo, Reservar", () => {
      const t = getTemplate("taller", "growth")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual(["/", "/servicios", "/contacto", "/equipo", "/reservar"]);
    });

    it("elite adds Blog, Galeria, Promos, FAQ, Resenas", () => {
      const t = getTemplate("taller", "elite")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual([
        "/",
        "/servicios",
        "/contacto",
        "/equipo",
        "/reservar",
        "/blog",
        "/galeria",
        "/promos",
        "/faq",
        "/resenas",
      ]);
    });
  });

  describe("Profesional page structure", () => {
    it("starter has Inicio, Servicios, Contacto", () => {
      const t = getTemplate("profesional", "starter")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual(["/", "/servicios", "/contacto"]);
    });

    it("growth adds Equipo, Agendar (not Reservar)", () => {
      const t = getTemplate("profesional", "growth")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual(["/", "/servicios", "/contacto", "/equipo", "/agendar"]);
    });

    it("elite adds Blog, Casos, FAQ, Resenas, Recursos", () => {
      const t = getTemplate("profesional", "elite")!;
      const paths = t.structure.map((p) => p.path);
      expect(paths).toEqual([
        "/",
        "/servicios",
        "/contacto",
        "/equipo",
        "/agendar",
        "/blog",
        "/casos",
        "/faq",
        "/resenas",
        "/recursos",
      ]);
    });
  });

  describe("Required variables per page", () => {
    it("every page has requiredVariables array", () => {
      TEMPLATES.forEach((template) => {
        template.structure.forEach((page) => {
          expect(page.requiredVariables).toBeDefined();
          expect(Array.isArray(page.requiredVariables)).toBe(true);
          expect(page.requiredVariables.length).toBeGreaterThan(0);
        });
      });
    });

    it("home page always requires businessName and tagline", () => {
      TEMPLATES.forEach((template) => {
        const homePage = template.structure.find((p) => p.path === "/");
        expect(homePage).toBeDefined();
        expect(homePage!.requiredVariables).toContain("businessName");
        expect(homePage!.requiredVariables).toContain("tagline");
      });
    });

    it("services page always requires services", () => {
      TEMPLATES.forEach((template) => {
        const servicesPage = template.structure.find((p) => p.path === "/servicios");
        expect(servicesPage).toBeDefined();
        expect(servicesPage!.requiredVariables).toContain("services");
      });
    });

    it("contact page always requires phone, email, address, hours", () => {
      TEMPLATES.forEach((template) => {
        const contactPage = template.structure.find((p) => p.path === "/contacto");
        expect(contactPage).toBeDefined();
        expect(contactPage!.requiredVariables).toContain("phone");
        expect(contactPage!.requiredVariables).toContain("email");
        expect(contactPage!.requiredVariables).toContain("address");
        expect(contactPage!.requiredVariables).toContain("hours");
      });
    });
  });

  describe("Blocks use valid types", () => {
    it("all blocks have valid type from enum", () => {
      TEMPLATES.forEach((template) => {
        template.structure.forEach((page) => {
          page.blocksTemplate.forEach((block) => {
            expect(BlockTypeEnum.safeParse(block.type).success).toBe(true);
          });
        });
      });
    });

    it("all blocks have content and requiredVariables", () => {
      TEMPLATES.forEach((template) => {
        template.structure.forEach((page) => {
          page.blocksTemplate.forEach((block) => {
            expect(block.content).toBeDefined();
            expect(typeof block.content).toBe("object");
            expect(block.requiredVariables).toBeDefined();
            expect(Array.isArray(block.requiredVariables)).toBe(true);
          });
        });
      });
    });

    it("blocks use {{variable}} placeholder syntax in content", () => {
      TEMPLATES.forEach((template) => {
        template.structure.forEach((page) => {
          page.blocksTemplate.forEach((block) => {
            const contentStr = JSON.stringify(block.content);
            // At least one placeholder should exist in blocks that have requiredVariables
            if (block.requiredVariables.length > 0) {
              expect(contentStr).toContain("{{");
            }
          });
        });
      });
    });
  });

  describe("Zod schema validation", () => {
    it("all templates pass SiteTemplateSchema", () => {
      TEMPLATES.forEach((template) => {
        const result = SiteTemplateSchema.safeParse(template);
        expect(result.success).toBe(true);
      });
    });

    it("all pages pass TemplatePageSchema", () => {
      TEMPLATES.forEach((template) => {
        template.structure.forEach((page) => {
          const result = TemplatePageSchema.safeParse(page);
          expect(result.success).toBe(true);
        });
      });
    });

    it("all blocks pass TemplateBlockSchema", () => {
      TEMPLATES.forEach((template) => {
        template.structure.forEach((page) => {
          page.blocksTemplate.forEach((block) => {
            const result = TemplateBlockSchema.safeParse(block);
            expect(result.success).toBe(true);
          });
        });
      });
    });
  });

  describe("Chilean tuteo in copy", () => {
    it("uses 'tu' not 'tu' (voseo check - no 'vos', 'vosotros', 'voseo')", () => {
      const allCopy = TEMPLATES.flatMap((t) =>
        t.structure.flatMap((p) =>
          p.blocksTemplate.flatMap((b) => Object.values(b.content).flat())
        )
      ).join(" ");

      // Should not contain voseo forms
      expect(allCopy).not.toMatch(/vos\b/i);
      expect(allCopy).not.toMatch(/vosotros\b/i);
      // Should use tuteo (tu, tu)
      // Note: we can't easily test for "tú" vs "tu" without accents, but we check no voseo
    });
  });
});