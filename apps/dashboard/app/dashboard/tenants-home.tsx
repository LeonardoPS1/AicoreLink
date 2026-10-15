/**
 * Main menu of the Aicore panel. Placeholder on purpose: the health strip, the
 * alerts and the per-client glance of the design (§6) arrive in the next phase,
 * and this screen shows an honest empty state until then.
 */
export function TenantsHome() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Menú principal</h1>
      <p className="text-sm text-slate-500">
        Todavía no hay datos: el estado de los clientes se conecta en la próxima fase.
      </p>
    </div>
  );
}
