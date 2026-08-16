import { describe, expect, it } from "vitest";
import { getSiteVoice, resolveSiteVoiceProfile } from "./site-voice";

describe("site voice", () => {
  it("defaults to promobozor-editorial", () => {
    expect(resolveSiteVoiceProfile(undefined)).toBe("promobozor-editorial");
    expect(getSiteVoice().brand).toBe("PromoBozor");
  });

  it("exposes comparison framing in all locales", () => {
    const voice = getSiteVoice("promobozor-editorial");
    expect(voice.framing.uz.toLowerCase()).toContain("solishtirish");
    expect(voice.framing.ru.toLowerCase()).toContain("сравнивать");
    expect(voice.framing.en.toLowerCase()).toContain("compare");
  });

  it("discloses shared social network without merging domains", () => {
    const voice = getSiteVoice();
    expect(voice.socialNetworkDisclosure.uz).toContain("Promokoduz");
    expect(voice.socialNetworkDisclosure.uz).toContain("alohida");
  });
});
