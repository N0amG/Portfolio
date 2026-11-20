/* ───────────────────────────────────────────────────────────
   Temps GPU réel par image (EXT_disjoint_timer_query_webgl2) : indépendant de la synchro verticale, contrairement
   au temps entre deux images (plafonné à 16,7 ms sur un écran 60 Hz, qui ne dit rien de la marge restante).
   Les résultats arrivent quelques images plus tard (jamais avant le retour à la boucle d'événements du navigateur) :
   une file de requêtes, relue à chaque image. Sans l'extension (certains navigateurs), `available` vaut false.
   ─────────────────────────────────────────────────────────── */

export type GpuTimer = ReturnType<typeof createGpuTimer>;

export function createGpuTimer(gl: WebGL2RenderingContext, maxPending = 16) {
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  const pending: WebGLQuery[] = [];
  const free: WebGLQuery[] = [];
  let active: WebGLQuery | null = null;

  return {
    available: !!ext,
    /** Début de la mesure (une seule à la fois ; ignoré si trop de résultats sont en attente). */
    begin() {
      if (!ext || active || pending.length >= maxPending) return;
      const q = free.pop() ?? gl.createQuery();
      if (!q) return;
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      active = q;
    },
    end() {
      if (!ext || !active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      // envoi immédiat des commandes : sinon la fin de la requête peut ne partir qu'avec l'image suivante, et le temps
      // mesuré inclut l'attente entre deux images (mesuré : 45 ms pour des images espacées de 33 ms)
      gl.flush();
      pending.push(active);
      active = null;
    },
    /** Transmet les résultats disponibles, dans l'ordre, en ms ; ceux faussés par un « disjoint » (GPU changé
     *  d'état, onglet en arrière-plan…) sont jetés. */
    poll(out: (ms: number) => void) {
      if (!ext || !pending.length) return;
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) as boolean;
      while (pending.length) {
        const q = pending[0];
        // requête jamais démarrée (une autre mesure du même type était déjà en cours) : abandonnée
        if (!gl.isQuery(q)) { pending.shift(); free.push(q); continue; }
        if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
        const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
        pending.shift();
        free.push(q);
        if (!disjoint) out(ns / 1e6);
      }
    },
    dispose() {
      if (active && ext) gl.endQuery(ext.TIME_ELAPSED_EXT);
      for (const q of [...pending, ...free]) gl.deleteQuery(q);
      if (active) gl.deleteQuery(active);
      pending.length = free.length = 0;
      active = null;
    },
  };
}
