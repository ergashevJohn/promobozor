"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type Props = {
  nonce?: string;
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const YM_ID = process.env.NEXT_PUBLIC_YM_ID || "106390376";

export default function AnalyticsClient({ nonce }: Props) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const applyConsent = () => {
      try {
        const raw = localStorage.getItem("cookie-consent");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.preferences?.analytics || parsed?.preferences?.marketing) {
          const runner = () => setShouldLoad(true);
          if (typeof window.requestIdleCallback === "function") {
            requestIdleCallback(runner, { timeout: 1500 });
          } else {
            setTimeout(runner, 500);
          }
        }
      } catch {
        // ignore malformed consent
      }
    };

    applyConsent();
    window.addEventListener("consent-updated", applyConsent);
    return () => window.removeEventListener("consent-updated", applyConsent);
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
        <Script id="ym" nonce={nonce} strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}','ym');ym(${YM_ID},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}
        </Script>
      ) : null}
    </>
  );
}
