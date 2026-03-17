import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-base-content/5 px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-content">
            <svg className="h-4 w-4" viewBox="0 0 502.664 502.664" fill="" xmlns="http://www.w3.org/2000/svg">
              <path d="M153.821,358.226L0,274.337v-46.463l153.821-83.414v54.574L46.636,250.523l107.185,53.431 C153.821,303.954,153.821,358.226,153.821,358.226z" />
              <path d="M180.094,387.584L282.103,115.08h32.227L212.084,387.584H180.094z" />
              <path d="M348.843,358.226v-54.272l107.164-52.999l-107.164-52.59v-53.927l153.821,83.522v46.183 L348.843,358.226z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-base-content/70">
            Noam
          </span>
        </Link>
        <p className="text-base-content/40 text-sm">
          © {new Date().getFullYear()} Noam Guez. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
