import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import type { BeaverBazaarWire } from "../generated/wire.ts";
import { assembleApplication } from "../src/assembly.ts";
import { db, client as mongoClient } from "../src/db.ts";

async function runScenario() {
  console.log("🚀 Starting clean MongoDB scenario verification...");

  // Verify ping to ensure database is ready
  await db.command({ ping: 1 });
  console.log("✅ MongoDB ping successful.");

  // Clean collections for clean scenario run
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    if (!c.name.startsWith("system.")) {
      await db.collection(c.name).deleteMany({});
    }
  }
  console.log("✅ Cleaned database collections for test isolation.");

  // Assemble BeaverBazaar with real MongoDB connection
  const application = assembleApplication();
  const gateway = createGateway<BeaverBazaarWire>({ application });
  const client = createLocalClient<BeaverBazaarWire>({ invoker: gateway });

  // 1. Alice logs in via Touchstone
  console.log("\n[Step 1] Alice authenticates via Touchstone...");
  const aliceLogin = await client["/auth/login"]({ username: "alice@mit.edu" });
  if ("error" in aliceLogin) throw new Error(`Alice login failed: ${String(aliceLogin.error)}`);
  const aliceSession = aliceLogin.session;
  console.log(`  -> Alice session created: ${aliceSession.slice(0, 8)}...`);

  // Verify Alice subject resolution
  const aliceMe = await client["/auth/me"]({ session: aliceSession });
  if ("error" in aliceMe) throw new Error(String(aliceMe.error));
  if (aliceMe.user !== "alice@mit.edu") throw new Error(`Unexpected user: ${aliceMe.user}`);
  console.log(`  -> Verified user is ${aliceMe.user}`);

  // 2. Alice sets contact profile info
  console.log("\n[Step 2] Alice updates contact profile...");
  const aliceProfRes = await client["/profile/update"]({
    session: aliceSession,
    name: "Alice Doe",
    contact: "617-555-0101",
  });
  if ("error" in aliceProfRes) throw new Error(String(aliceProfRes.error));

  const aliceProfile = await client["/profile/get"]({ session: aliceSession });
  if ("error" in aliceProfile) throw new Error(String(aliceProfile.error));
  console.log(`  -> Alice profile: Name="${aliceProfile.profile?.name}", Contact="${aliceProfile.profile?.contact}"`);

  // 3. Alice creates bicycle auction listing ($60 start, $5 increment, $75 buyout)
  console.log("\n[Step 3] Alice posts bicycle auction listing ($60 start, $5 min inc, $75 buyout)...");
  const listingRes = await client["/listings/create"]({
    session: aliceSession,
    item: "Vintage Road Bicycle",
    startPrice: 60,
    increment: 5,
    buyout: 75,
  });
  if ("error" in listingRes) throw new Error(String(listingRes.error));
  const { listing: listingId, auction: auctionId } = listingRes;
  console.log(`  -> Created Listing ID: ${listingId}`);
  console.log(`  -> Created Auction ID: ${auctionId}`);

  // 4. Bob logs in via Touchstone
  console.log("\n[Step 4] Bob authenticates via Touchstone...");
  const bobLogin = await client["/auth/login"]({ username: "bob@mit.edu" });
  if ("error" in bobLogin) throw new Error(String(bobLogin.error));
  const bobSession = bobLogin.session;
  console.log(`  -> Bob session created: ${bobSession.slice(0, 8)}...`);

  // 5. Bob sets contact profile info
  console.log("\n[Step 5] Bob updates contact profile...");
  const bobProfRes = await client["/profile/update"]({
    session: bobSession,
    name: "Bob Smith",
    contact: "bob@mit.edu",
  });
  if ("error" in bobProfRes) throw new Error(String(bobProfRes.error));
  const bobProfile = await client["/profile/get"]({ session: bobSession });
  if ("error" in bobProfile) throw new Error(String(bobProfile.error));
  console.log(`  -> Bob profile: Name="${bobProfile.profile?.name}", Contact="${bobProfile.profile?.contact}"`);

  // 6. Bob browses feed and inspects anonymous listing
  console.log("\n[Step 6] Bob queries active marketplace feed...");
  const feedBefore = await client["/marketplace/feed"]({});
  if ("error" in feedBefore) throw new Error(String(feedBefore.error));
  console.log(`  -> Active feed listing count: ${feedBefore.feed.listings.length}`);

  const targetItem = feedBefore.feed.listings.find((l) => l.listing === listingId);
  if (!targetItem) throw new Error("Created bicycle not found in marketplace feed!");
  console.log(`  -> Item: "${targetItem.item}"`);
  console.log(`  -> Current Price: $${targetItem.price}`);
  console.log(`  -> Min Increment: $${targetItem.increment}`);
  console.log(`  -> Instant Buyout: $${targetItem.buyout}`);
  console.log(`  -> Masked Seller Alias: ${targetItem.sellerAlias}`);

  if (targetItem.sellerAlias === "alice@mit.edu") {
    throw new Error("PRIVACY VIOLATION: Seller email leaked instead of masked pseudonym!");
  }
  console.log("  -> ✅ Seller pseudonymity verified (Alice's email is concealed behind alias).");

  // 7. Bob submits $75 instant buyout bid
  console.log("\n[Step 7] Bob places instant buyout bid of $75...");
  const bidRes = await client["/auctions/bid"]({
    session: bobSession,
    auction: auctionId,
    item: listingId,
    amount: 75,
  });
  if ("error" in bidRes) throw new Error(`Bid failed: ${String(bidRes.error)}`);
  console.log("  -> Bid submitted successfully.");

  // 8. Verify automated reactive synchronization:
  console.log("\n[Step 8] Verifying automated reactions...");

  // 8a. Verify listing deactivation from feed
  const feedAfter = await client["/marketplace/feed"]({});
  if ("error" in feedAfter) throw new Error(String(feedAfter.error));
  const itemInFeedAfter = feedAfter.feed.listings.find((l) => l.listing === listingId);
  if (itemInFeedAfter) {
    throw new Error("FAILURE: Listing still present in active feed after buyout closure!");
  }
  console.log("  -> ✅ Listing automatically removed from active feed (SyncAuctionListingStatus verified).");

  // 8b. Verify listing detail shows inactive
  const detailRes = await client["/listings/get"]({ listing: listingId });
  if ("error" in detailRes) throw new Error(String(detailRes.error));
  if (detailRes.detail?.active !== false || detailRes.detail?.auctionActive !== false) {
    throw new Error("FAILURE: Listing or auction detail not marked inactive!");
  }
  console.log("  -> ✅ Listing and Auction status marked inactive.");

  // 8c. Verify bilateral settlement notifications delivered with counterpart details
  const aliceNotifs = await client["/notifications/list"]({ session: aliceSession });
  if ("error" in aliceNotifs) throw new Error(String(aliceNotifs.error));
  console.log(`  -> Alice has ${aliceNotifs.notifications.notifications.length} notification(s):`);
  for (const n of aliceNotifs.notifications.notifications) {
    console.log(`     [Alice Inbox] ${n.message}`);
  }
  const sellerNotif = aliceNotifs.notifications.notifications.find((n) =>
    n.message.includes("Bob Smith") && n.message.includes("bob@mit.edu"),
  );
  if (!sellerNotif) {
    throw new Error("FAILURE: Alice did not receive seller notification with Bob's contact details!");
  }
  console.log("  -> ✅ Alice received private seller settlement notification (NotifySellerOnClose verified).");

  const bobNotifs = await client["/notifications/list"]({ session: bobSession });
  if ("error" in bobNotifs) throw new Error(String(bobNotifs.error));
  console.log(`  -> Bob has ${bobNotifs.notifications.notifications.length} notification(s):`);
  for (const n of bobNotifs.notifications.notifications) {
    console.log(`     [Bob Inbox] ${n.message}`);
  }
  const buyerNotif = bobNotifs.notifications.notifications.find((n) =>
    n.message.includes("Alice Doe") && n.message.includes("617-555-0101"),
  );
  if (!buyerNotif) {
    throw new Error("FAILURE: Bob did not receive buyer notification with Alice's contact details!");
  }
  console.log("  -> ✅ Bob received private buyer winning notification (NotifyBuyerOnClose verified).");

  console.log("\n🎉 ALL SCENARIO VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
  await mongoClient.close();
  process.exit(0);
}

runScenario().catch(async (err) => {
  console.error("❌ Scenario verification failed:", err);
  await mongoClient.close();
  process.exit(1);
});
