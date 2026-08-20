"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { useRecaptcha } from "@/lib/hooks/use-recaptcha";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const formats = ["listing", "exclusive", "homepage", "collection", "telegram"] as const;

export function PartnerInquiryForm() {
  const t = useTranslations("partners");
  const { executeRecaptcha } = useRecaptcha();
  const [data, setData] = useState({
    company: "",
    contactPerson: "",
    workEmail: "",
    phone: "",
    telegram: "",
    website: "",
    partnerType: "direct_brand",
    requestedFormats: [] as string[],
    campaignDescription: "",
    validUntil: "",
    trackingDetails: "",
    privacyAccepted: false,
    websiteHoneypot: "",
    startedAt: Date.now(),
  });
  const [submitting, setSubmitting] = useState(false);
  const update = (name: string, value: string | boolean) =>
    setData((current) => ({ ...current, [name]: value }));
  const toggleFormat = (format: string) =>
    setData((current) => ({
      ...current,
      requestedFormats: current.requestedFormats.includes(format)
        ? current.requestedFormats.filter((item) => item !== format)
        : [...current.requestedFormats, format],
    }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data.privacyAccepted || !data.requestedFormats.length) {
      toast.error(t("error"));
      return;
    }
    setSubmitting(true);
    try {
      const csrfResponse = await fetch("/api/csrf", { cache: "no-store" });
      const csrf = (await csrfResponse.json()) as { token?: string };
      if (!csrfResponse.ok || !csrf.token) throw new Error();
      const recaptchaToken =
        typeof executeRecaptcha === "function"
          ? await executeRecaptcha("partner_inquiry")
          : undefined;
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
        body: JSON.stringify({ ...data, recaptchaToken }),
      });
      if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error);
      toast.success(t("success"));
      setData({
        company: "",
        contactPerson: "",
        workEmail: "",
        phone: "",
        telegram: "",
        website: "",
        partnerType: "direct_brand",
        requestedFormats: [],
        campaignDescription: "",
        validUntil: "",
        trackingDetails: "",
        privacyAccepted: false,
        websiteHoneypot: "",
        startedAt: Date.now(),
      });
    } catch {
      toast.error(t("error"));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <form onSubmit={submit} className="brand-panel mt-8 grid gap-4 p-6 sm:grid-cols-2">
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          name="websiteHoneypot"
          tabIndex={-1}
          autoComplete="off"
          value={data.websiteHoneypot}
          onChange={(e) => update("websiteHoneypot", e.target.value)}
        />
      </div>
      <Field label={t("company")} name="company" value={data.company} onChange={update} required />
      <Field
        label={t("person")}
        name="contactPerson"
        value={data.contactPerson}
        onChange={update}
        required
      />
      <Field
        label={t("email")}
        name="workEmail"
        value={data.workEmail}
        onChange={update}
        type="email"
        required
      />
      <Field label={t("phone")} name="phone" value={data.phone} onChange={update} />
      <Field label={t("telegram")} name="telegram" value={data.telegram} onChange={update} />
      <Field
        label={t("website")}
        name="website"
        value={data.website}
        onChange={update}
        type="url"
      />
      <div>
        <Label>{t("type")}</Label>
        <select
          className="bg-card mt-1 h-11 w-full rounded-xl border px-3"
          value={data.partnerType}
          onChange={(e) => update("partnerType", e.target.value)}
        >
          <option value="direct_brand">{t("direct_brand")}</option>
          <option value="cpa_network">{t("cpa_network")}</option>
        </select>
      </div>
      <Field
        label={t("validUntil")}
        name="validUntil"
        value={data.validUntil}
        onChange={update}
        type="date"
      />
      <div className="sm:col-span-2">
        <Label>{t("formatsLabel")}</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {formats.map((format) => (
            <label key={format} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.requestedFormats.includes(format)}
                onChange={() => toggleFormat(format)}
              />
              {t(`formats.${format}`)}
            </label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="campaignDescription">{t("campaign")}</Label>
        <Textarea
          id="campaignDescription"
          className="bg-card mt-1 min-h-28"
          required
          value={data.campaignDescription}
          onChange={(e) => update("campaignDescription", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="trackingDetails">{t("tracking")}</Label>
        <Textarea
          id="trackingDetails"
          className="bg-card mt-1"
          value={data.trackingDetails}
          onChange={(e) => update("trackingDetails", e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={data.privacyAccepted}
          onChange={(e) => update("privacyAccepted", e.target.checked)}
          required
        />
        {t("privacy")}{" "}
        <Link className="text-[color:var(--accent-red)] underline" href="/privacy">
          {t("privacy")}
        </Link>
      </label>
      <div className="sm:col-span-2">
        <Button disabled={submitting}>{t("submit")}</Button>
      </div>
    </form>
  );
}
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        required={required}
        maxLength={type === "url" ? 500 : 255}
        className="bg-card mt-1 h-11 rounded-xl"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}
