import { describe, expect, it } from "vitest";
import {
  classifySimilarity,
  combinedSimilarity,
  compareFields,
  contentFingerprint,
  normalizeForCompare,
  normalizeSlugKey,
  tokenJaccard,
  worstBucket,
} from "./content-similarity";

describe("content similarity", () => {
  it("normalizes punctuation and case", () => {
    expect(normalizeForCompare("Payme — PROMOKOD!")).toBe("payme promokod");
  });

  it("fingerprints identical normalized text the same way", () => {
    expect(contentFingerprint("A  B")).toBe(contentFingerprint("a b"));
  });

  it("scores identical text as exact", () => {
    const score = combinedSimilarity("Payme Plus 30 kun bepul", "Payme Plus 30 kun bepul");
    expect(score).toBeGreaterThan(0.99);
    expect(classifySimilarity(score)).toBe("exact");
  });

  it("scores unrelated text as unique", () => {
    const score = tokenJaccard("payme plus cashback", "yandex eats delivery");
    expect(score).toBeLessThan(0.3);
    expect(classifySimilarity(score)).toBe("unique");
  });

  it("normalizes hub suffix slugs", () => {
    expect(normalizeSlugKey("payme-chegirmalar")).toBe("payme");
    expect(normalizeSlugKey("payme-promokod")).toBe("payme");
  });

  it("picks the worst field bucket", () => {
    const fields = compareFields(
      { title: "same title", body: "completely different body about banking" },
      { title: "same title", body: "food delivery coupons and restaurants" }
    );
    expect(worstBucket(fields)).toBe("exact");
  });
});
