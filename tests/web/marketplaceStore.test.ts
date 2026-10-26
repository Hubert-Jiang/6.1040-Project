import { describe, expect, test } from "bun:test";
import { createListing, marketplaceState } from "../../web/stores/marketplace.ts";
import { uiState } from "../../web/stores/ui.ts";

describe("Marketplace Store validation", () => {
  test("enforces reasonable description restrictions: length <= 1000 and lines <= 12", async () => {
    // Description > 1000 characters
    const longDesc = "a".repeat(1001);
    const resLong = await createListing("fake-session", "Title", longDesc, [], 10, 1, null);
    expect(resLong).toBe(false);
    expect(uiState.statusMessage).toContain("1,000 character maximum limit");

    // Description with > 12 newlines
    const manyLinesDesc = Array(15).fill("line").join("\n");
    const resLines = await createListing("fake-session", "Title", manyLinesDesc, [], 10, 1, null);
    expect(resLines).toBe(false);
    expect(uiState.statusMessage).toContain("cannot have more than 12 lines");

    // Valid description with reasonable line count
    const validDesc = "Excellent condition road bike.\nPickup near Stata Center.\nIncludes helmet.";
    // Will fail only at network/fake session call, proving validation passed
    await createListing("fake-session", "Title", validDesc, [], 10, 1, null);
    expect(uiState.statusMessage).not.toContain("1,000 character maximum limit");
    expect(uiState.statusMessage).not.toContain("cannot have more than 12 lines");
  });

  test("caps the number of images at 5", async () => {
    const sixImages = ["img1", "img2", "img3", "img4", "img5", "img6"];
    const res = await createListing("fake-session", "Title", "Desc", sixImages, 10, 1, null);
    expect(res).toBe(false);
    expect(uiState.statusMessage).toContain("Maximum of 5 photos allowed");

    const fiveImages = ["img1", "img2", "img3", "img4", "img5"];
    await createListing("fake-session", "Title", "Desc", fiveImages, 10, 1, null);
    expect(uiState.statusMessage).not.toContain("Maximum of 5 photos allowed");
  });
});
