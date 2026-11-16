/**
 * Rejoué à chaque navigation (un template est re-monté) : un rideau signal
 * remonte et la page glisse en place. Animations en CSS pur, pour qu'elles
 * tournent avant l'hydratation et ne bloquent jamais l'affichage.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="page-curtain opal-fill pointer-events-none fixed inset-0 z-[80] origin-top" />
      <div className="page-enter">{children}</div>
    </>
  );
}
