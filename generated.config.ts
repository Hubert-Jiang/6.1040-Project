import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { assembleApplication } from "./src/assembly.ts";
import { policy } from "./src/http.ts";

export default {
  assemble: assembleApplication,
  title: "BeaverBazaar",
  wireName: "BeaverBazaarWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/BeaverBazaar.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy, name: "BeaverBazaarWireHttp" })],
};
