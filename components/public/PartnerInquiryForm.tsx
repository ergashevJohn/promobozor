"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { useRecaptcha } from "@/lib/hooks/use-recaptcha";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
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
    <form onSubmit={submit} className="brand-panel relative grid gap-6 p-5 sm:p-6">
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input
          name="websiteHoneypot"
          tabIndex={-1}
          autoComplete="off"
          value={data.websiteHoneypot}
          onChange={(e) => update("websiteHoneypot", e.target.value)}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-foreground text-sm font-semibold">{t("contactSection")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("company")}
            name="company"
            value={data.company}
            onChange={update}
            required
          />
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
            <Label htmlFor="partnerType">{t("type")}</Label>
            <select
              id="partnerType"
              className="bg-background mt-1 h-11 w-full rounded-xl border border-[color:var(--border)] px-3"
              value={data.partnerType}
              onChange={(e) => update("partnerType", e.target.value)}
            >
              <option value="direct_brand">{t("direct_brand")}</option>
              <option value="cpa_network">{t("cpa_network")}</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-foreground text-sm font-semibold">{t("campaignSection")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label id="formats-label">{t("formatsLabel")}</Label>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="formats-label">
              {formats.map((format) => {
                const selected = data.requestedFormats.includes(format);
                return (
                  <button
                    key={format}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleFormat(format)}
                    className={`min-h-10 rounded-full border px-3 text-sm font-medium transition-[color,background-color,border-color] duration-200 ${
                      selected
                        ? "text-foreground border-[color:var(--accent-red)] bg-[color:var(--accent)]"
                        : "bg-background text-muted-foreground border-[color:var(--border)] hover:border-[color:var(--accent-red)]/40"
                    }`}
                  >
                    {t(`formats.${format}`)}
                  </button>
                );
              })}
            </div>
          </div>
          <Field
            label={t("validUntil")}
            name="validUntil"
            value={data.validUntil}
            onChange={update}
            type="date"
          />
          <div className="sm:col-span-2">
            <Label htmlFor="campaignDescription">{t("campaign")}</Label>
            <Textarea
              id="campaignDescription"
              className="bg-background mt-1 min-h-28"
              required
              value={data.campaignDescription}
              onChange={(e) => update("campaignDescription", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="trackingDetails">{t("tracking")}</Label>
            <Textarea
              id="trackingDetails"
              className="bg-background mt-1"
              value={data.trackingDetails}
              onChange={(e) => update("trackingDetails", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <label className="flex items-start gap-2 text-sm sm:items-center">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 sm:mt-0"
          checked={data.privacyAccepted}
          onChange={(e) => update("privacyAccepted", e.target.checked)}
          required
        />
        <span>
          {t.rich("privacy", {
            policy: (chunks) => (
              <Link className="text-[color:var(--accent-red)] underline" href="/privacy">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      <Button className="w-full" disabled={submitting}>
        <PaperPlaneTiltIcon className="h-4 w-4" />
        {submitting ? t("submitting") : t("submit")}
      </Button>
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
        className="bg-background mt-1 h-11 rounded-xl"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}
