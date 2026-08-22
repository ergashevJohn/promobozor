import type { DataFastWeb } from "datafast";

const WEBSITE_ID = process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID || "dfid_mIgSHspqbKPBDQU5PeNMl";

let client: DataFastWeb | null = null;
let pending: Promise<DataFastWeb> | null = null;

export function getDataFast(): Promise<DataFastWeb> {
  if (client) return Promise.resolve(client);
  if (!pending) {
    pending = import("datafast")
      .then(({ initDataFast }) =>
        initDataFast({
          websiteId: WEBSITE_ID,
          domain: process.env.NEXT_PUBLIC_DATAFAST_DOMAIN,
          autoCapturePageviews: true,
        })
      )
      .then((instance) => {
        client = instance;
        return instance;
      });
  }
  return pending;
}
