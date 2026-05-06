import { permanentRedirect } from 'next/navigation';

/** Locale-aware routes live under `/[locale]`. Send `/` to the default locale. */
export default function RootPage() {
  permanentRedirect('/en');
}
