import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LeadForm } from "@/components/marketing/lead-form";

const VALID_LEAD = {
  nombre: "Juan Pérez",
  negocio: "Barbería El Corte",
  whatsapp: "+54 9 11 5555 5555",
  rubro: "barberia",
  mensaje: "Pierdo consultas por no contestar a tiempo.",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Tu nombre"), VALID_LEAD.nombre);
  await user.type(screen.getByLabelText("Tu negocio"), VALID_LEAD.negocio);
  await user.type(screen.getByLabelText("Tu WhatsApp"), VALID_LEAD.whatsapp);
  await user.selectOptions(screen.getByLabelText("Tu rubro"), VALID_LEAD.rubro);
  await user.type(screen.getByLabelText("¿Qué te gustaría resolver?"), VALID_LEAD.mensaje);
}
describe("LeadForm", () => {
  it("renders every field with a real label", () => {
    render(<LeadForm />);

    expect(screen.getByLabelText("Tu nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Tu negocio")).toBeInTheDocument();
    expect(screen.getByLabelText("Tu WhatsApp")).toBeInTheDocument();
    expect(screen.getByLabelText("Tu rubro")).toBeInTheDocument();
    expect(screen.getByLabelText("¿Qué te gustaría resolver?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Solicitar diagnóstico gratis/ }),
    ).toBeInTheDocument();
  });

  it("does not call the API when required fields are empty", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<LeadForm />);
    await user.click(screen.getByRole("button", { name: /Solicitar diagnóstico gratis/ }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Cuéntanos tu nombre")).toBeInTheDocument();
    expect(screen.getByText("Ingresa un número válido")).toBeInTheDocument();
    expect(screen.getByText("Elige tu rubro")).toBeInTheDocument();
  });

  it("posts the lead and swaps to a success state", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchMock);

    render(<LeadForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /Solicitar diagnóstico gratis/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/leads");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject(VALID_LEAD);

    expect(await screen.findByRole("status")).toHaveTextContent("¡Recibimos tus datos!");
    expect(screen.queryByLabelText("Tu nombre")).not.toBeInTheDocument();
  });

  it("keeps the form usable and explains the failure when the API errors", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    render(<LeadForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /Solicitar diagnóstico gratis/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/No pudimos enviar tus datos/);
    expect(screen.getByLabelText("Tu nombre")).toBeInTheDocument();
  });
});
