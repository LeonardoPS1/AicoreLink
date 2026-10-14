/**
 * Main menu of the business owner. Placeholder on purpose: the usage, the recent
 * leads and the site status of the design (§7) arrive in the next phase, and
 * this screen shows an honest empty state until then.
 */
export function OwnerHome() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Resumen</h1>
      <p className="text-sm text-slate-500">
        Todavía no hay datos: el resumen del negocio se conecta en la próxima fase.
      </p>
    </div>
  );
}
