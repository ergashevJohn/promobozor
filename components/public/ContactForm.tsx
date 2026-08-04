"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRecaptcha } from "@/lib/hooks/use-recaptcha";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type PhoneValidationErrorKey =
  | "phoneRequired"
  | "invalidOperatorCode"
  | "invalidPhoneFormat"
  | "invalidPhoneNumber";

// O'zbekiston telefon raqam validatsiyasi
function validateUzbekPhone(phone: string): {
  isValid: boolean;
  errorKey?: PhoneValidationErrorKey;
} {
  if (!phone || phone.trim() === "") {
    return { isValid: false, errorKey: "phoneRequired" };
  }

  // Faqat raqamlarni olib tashlash
  const cleaned = phone.replace(/\D/g, "");

  // O'zbekiston telefon raqam formatlari:
  // +998XXXXXXXXX (13 ta raqam)
  // 998XXXXXXXXX (12 ta raqam)
  // 90XXXXXXX (9 ta raqam - mobil)
  // va boshqalar...

  if (cleaned.length === 13 && cleaned.startsWith("998")) {
    // +998XXXXXXXXX format
    const mobileCode = cleaned.substring(3, 5);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    if (!validMobileCodes.includes(mobileCode)) {
      return { isValid: false, errorKey: "invalidOperatorCode" };
    }
    return { isValid: true };
  }

  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    // 998XXXXXXXXX format
    const mobileCode = cleaned.substring(3, 5);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    if (!validMobileCodes.includes(mobileCode)) {
      return { isValid: false, errorKey: "invalidOperatorCode" };
    }
    return { isValid: true };
  }

  if (cleaned.length === 9) {
    // 90XXXXXXX format (faqat raqamlar)
    const mobileCode = cleaned.substring(0, 2);
    const validMobileCodes = ["90", "91", "93", "94", "95", "97", "99", "88", "33"];
    if (!validMobileCodes.includes(mobileCode)) {
      return { isValid: false, errorKey: "invalidOperatorCode" };
    }
    return { isValid: true };
  }

  return {
    isValid: false,
    errorKey: "invalidPhoneFormat",
  };
}

export function ContactForm() {
  const t = useTranslations("contact");
  const { executeRecaptcha } = useRecaptcha();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
    website: "", // Honeypot field - should remain empty for legitimate users
    startedAt: Date.now(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const getPhoneErrorMessage = (errorKey?: PhoneValidationErrorKey) => {
    if (errorKey === "phoneRequired") return t("form.phoneRequired");
    if (errorKey === "invalidOperatorCode") return t("form.invalidOperatorCode");
    if (errorKey === "invalidPhoneFormat") return t("form.invalidPhoneFormat");
    return t("form.invalidPhoneNumber");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));

    // Real-time validatsiya
    if (value.trim() === "") {
      setPhoneError(null);
      return;
    }

    const validation = validateUzbekPhone(value);
    if (!validation.isValid) {
      setPhoneError(getPhoneErrorMessage(validation.errorKey));
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot field - if filled, it's likely a bot
    if (formData.website.trim() !== "") {
      // Silently fail for bots - don't show any error
      return;
    }

    // Validatsiya
    const phoneValidation = validateUzbekPhone(formData.phone);
    if (!phoneValidation.isValid) {
      const errorMessage = getPhoneErrorMessage(phoneValidation.errorKey);
      setPhoneError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);
    setPhoneError(null);

    try {
      const csrfResponse = await fetch("/api/csrf", {
        method: "GET",
        cache: "no-store",
      });
      if (!csrfResponse.ok) {
        throw new Error(t("form.error"));
      }
      const csrfData = (await csrfResponse.json()) as { token?: string };
      if (!csrfData.token) {
        throw new Error(t("form.error"));
      }

      const recaptchaToken =
        typeof executeRecaptcha === "function"
          ? await executeRecaptcha("contact_submit")
          : undefined;

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfData.token,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
          recaptchaToken,
          startedAt: formData.startedAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("form.error"));
      }

      toast.success(t("form.success"));
      setFormData({ name: "", phone: "", message: "", website: "", startedAt: Date.now() });
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : t("form.error");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.target.name === "phone") {
      handlePhoneChange(e as React.ChangeEvent<HTMLInputElement>);
    } else {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  };

  return (
    <div className="brand-panel p-6">
      <h2 className="text-foreground mb-6 text-2xl font-semibold">{t("form.message")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field - hidden from users, visible to bots */}
        <div inert style={{ position: "absolute", left: "-5000px" }}>
          <label htmlFor="website">{t("form.websiteHoneypot")}</label>
          <input
            type="text"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="name">{t("form.name")}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 h-11 rounded-xl bg-card"
          />
        </div>

        <div>
          <Label htmlFor="phone">{t("form.phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="+998901234567"
            className={`mt-1 h-11 rounded-xl bg-white ${phoneError ? "border-destructive" : ""}`}
            aria-invalid={phoneError ? "true" : "false"}
            aria-describedby={phoneError ? "phone-error" : undefined}
          />
          {phoneError && (
            <p id="phone-error" className="text-destructive mt-1 text-sm">
              {phoneError}
            </p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">{t("form.phoneHint")}</p>
        </div>

        <div>
          <Label htmlFor="message">{t("form.message")}</Label>
          <Textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className="mt-1 rounded-xl bg-card"
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full rounded-2xl" size="lg">
          {isSubmitting ? (
            <>
              <span className="mr-2">{t("form.sending")}</span>
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {t("form.send")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
