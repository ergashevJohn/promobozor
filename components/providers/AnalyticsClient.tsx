"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type Props = {
  nonce?: string;
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const YM_ID = process.env.NEXT_PUBLIC_YM_ID || "106390376";

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
  }
}

export default function AnalyticsClient({ nonce }: Props) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const timerIds: number[] = [];

    const applyConsent = () => {
      try {
        const raw = localStorage.getItem("cookie-consent");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.preferences?.analytics || parsed?.preferences?.marketing) {
          const runner = () => setShouldLoad(true);
          if (typeof window.requestIdleCallback === "function") {
            const id = requestIdleCallback(runner, { timeout: 1500 });
            timerIds.push(id);
          } else {
            const id = window.setTimeout(runner, 500);
            timerIds.push(id);
          }
        }
      } catch {
        // ignore malformed consent
      }
    };

    applyConsent();
    window.addEventListener("consent-updated", applyConsent);

    return () => {
      window.removeEventListener("consent-updated", applyConsent);
      timerIds.forEach((id) => {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(id);
        } else {
          window.clearTimeout(id);
        }
      });
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <>
      {process.env.NODE_ENV === "production" && GTM_ID ? (
        <>
          <Script
            id="gtm"
            nonce={nonce}
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
          />
          <Script id="gtm-init" nonce={nonce} strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GTM_ID}');
            `}
          </Script>
        </>
      ) : null}

      {process.env.NODE_ENV === "production" ? (
        <>
          <Script id="ym-stub" nonce={nonce} strategy="afterInteractive">
            {`
              (function(m,i){
                if (typeof m[i] === 'function') return;
                m[i] = function(){(m[i].a = m[i].a || []).push(arguments)};
                m[i].l = 1 * new Date();
              })(window, 'ym');
              if (typeof window.ym === 'function') {
                window.ym(${YM_ID}, 'init', {
                  ssr: true,
                  webvisor: true,
                  clickmap: true,
                  ecommerce: 'dataLayer',
                  accurateTrackBounce: true,
                  trackLinks: true
                });
              }
            `}
          </Script>
          <Script
            id="ym-tag"
            nonce={nonce}
            strategy="afterInteractive"
            src={`https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`}
          />
        </>
      ) : null}
    </>
  );
}
