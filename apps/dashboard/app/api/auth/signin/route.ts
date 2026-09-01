import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const providers = {};
  for (const provider of authOptions.providers) {
    if (provider.type === "credentials") {
      (providers as any)[provider.id] = {
        name: provider.name,
        type: "credentials",
        credentials: provider.credentials,
      };
    }
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>AicoreLink - Ingresar</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center">
  <div class="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
    <h1 class="mb-1 text-2xl font-bold text-navy">AicoreLink</h1>
    <p class="mb-6 text-sm text-slate-500">Ingresa a tu panel</p>
    ${error ? `<p class="mb-4 text-sm text-red-600">${error}</p>` : ""}
    <form method="POST" action="/api/auth/callback/credentials">
      <input type="hidden" name="callbackUrl" value="${callbackUrl}"/>
      <label class="mb-1 block text-sm font-medium">Email</label>
      <input type="email" name="email" class="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required/>
      <label class="mb-1 block text-sm font-medium">Contraseña</label>
      <input type="password" name="password" class="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required/>
      <button type="submit" class="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">
        Ingresar
      </button>
    </form>
  </div>
</body>
</html>
  `;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}