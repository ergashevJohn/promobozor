import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "PromoBozor",
  description: "PromoBozor — chegirmalar va promokodlar bozori",
};

export default function RootPage() {
  permanentRedirect("/uz");
}
