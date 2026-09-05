// =============================================================================
// ConMart — Automated Wallet & Unlock Revenue Engine Verification Test Suite
// =============================================================================
// Tests:
// 1. Dual-balance wallet initialization (Cash vs Non-Withdrawable Credit).
// 2. Strict pre-unlock contact masking (buyer/seller phone numbers hidden).
// 3. Insufficient balance guard blocks acceptance.
// 4. Successful Unlock Transaction (priority credit deduction, ledger, revealed contact).
// 5. Deal Failure Refund-as-Credit flow (80% credit returned, non-withdrawable).
// =============================================================================

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createRequire } from "module";
const require = createRequire(import.meta.url);
try {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  };
} catch {
  // Ignore if not present
}

import { PrismaClient, EnquiryStatus, RefundStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sanitizeEnquiryForViewer } from "../src/lib/security/masking.ts";

const {
  getOrCreateSellerWallet,
  executeUnlockIntroductionTransaction,
  processDealFailureRefund,
} = await import("../src/lib/wallet/wallet-service.ts");

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres.nmvhhxnctzpsngvqcnbm:conmartyakob@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function runTest() {
  console.log("===============================================================================");
  console.log("       CONMART PREPAID WALLET & CONTACT UNLOCK VERIFICATION SUITE              ");
  console.log("===============================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Wallet Initialization & Dual Balance
    // -------------------------------------------------------------------------
    console.log("\n[DOMAIN 1: Seller Wallet & Balances]");
    const seller = await prisma.user.findFirst({
      where: { role: "SELLER" },
    });
    assert(!!seller, `Found registered seller: ${seller?.name} (${seller?.companyName})`);

    const wallet = await getOrCreateSellerWallet(seller.id);
    assert(
      wallet.cashBalance >= 0 && wallet.creditBalance >= 0,
      `Wallet active (Cash: ${wallet.cashBalance} ETB, Credit: ${wallet.creditBalance} ETB, Spendable: ${wallet.totalSpendable} ETB)`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Pre-Unlock Masking Verification
    // -------------------------------------------------------------------------
    console.log("\n[DOMAIN 2: Strict Pre-Unlock Contact Masking]");
    const buyer = await prisma.user.findFirst({
      where: { role: "BUYER" },
    });
    const listing = await prisma.listing.findFirst({
      where: { sellerId: seller.id, active: true },
      include: { product: { include: { category: true } } },
    });

    assert(!!buyer && !!listing, "Retrieved buyer and active seller listing");

    // Create a mock pending enquiry
    const testEnquiry = await prisma.enquiry.create({
      data: {
        referenceCode: `ENQ-TEST-${Date.now().toString().slice(-4)}`,
        buyerId: buyer.id,
        sellerId: seller.id,
        listingId: listing.id,
        qty: 150,
        unit: listing.product.unit,
        deliveryAddress: "Addis Ababa, Bole Sub-City, Woreda 03",
        status: EnquiryStatus.PENDING,
      },
      include: {
        buyer: true,
        seller: true,
        listing: true,
      },
    });

    // Test masking from Seller's perspective
    const maskedForSeller = sanitizeEnquiryForViewer({
      enquiry: testEnquiry,
      viewerUserId: seller.id,
      viewerRole: "SELLER",
    });

    assert(
      maskedForSeller.isUnlocked === false,
      "Enquiry marked as isUnlocked = false prior to payment"
    );
    assert(
      maskedForSeller.buyer.phone === undefined,
      "Buyer phone number is completely scrubbed from seller payload"
    );
    assert(
      maskedForSeller.buyer.name === "Prospective Commercial Contractor",
      "Buyer personal name is replaced with generic commercial contractor persona"
    );

    // Test masking from Buyer's perspective
    const maskedForBuyer = sanitizeEnquiryForViewer({
      enquiry: testEnquiry,
      viewerUserId: buyer.id,
      viewerRole: "BUYER",
    });

    assert(
      maskedForBuyer.seller.phone === undefined,
      "Seller phone number is completely scrubbed from buyer payload"
    );
    assert(
      maskedForBuyer.seller.companyName.includes("ConMart Verified Supplier Depot"),
      `Seller legal name masked as verified depot introduction asset: "${maskedForBuyer.seller.companyName}"`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Insufficient Balance Guard
    // -------------------------------------------------------------------------
    console.log("\n[DOMAIN 3: Insufficient Wallet Balance Guard]");
    let blockedError = null;
    try {
      // Attempt unlock with an absurd fee that exceeds seller balance
      await executeUnlockIntroductionTransaction({
        enquiryId: testEnquiry.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        feeAmount: 9999999.0,
      });
    } catch (err) {
      blockedError = err;
    }

    assert(
      !!blockedError && blockedError.message.includes("Insufficient wallet balance"),
      `Insufficient wallet balance correctly blocks acceptance: "${blockedError?.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 4: The Core Revenue Event (Contact Introduction Unlock)
    // -------------------------------------------------------------------------
    console.log("\n[DOMAIN 4: Successful Contact Unlock & Introduction Exchange]");
    const feeAmount = 250.0;
    const initialCredit = wallet.creditBalance;
    const initialCash = wallet.cashBalance;

    const unlockResult = await executeUnlockIntroductionTransaction({
      enquiryId: testEnquiry.id,
      sellerId: seller.id,
      buyerId: buyer.id,
      feeAmount,
    });

    assert(unlockResult.success === true, "Unlock transaction executed successfully in atomic ACID transaction");
    assert(!!unlockResult.unlockRecord.id, `Immutable UnlockRecord generated (#${unlockResult.unlockRecord.id})`);
    assert(
      Number(unlockResult.unlockRecord.feeAmount) === feeAmount,
      `Exact fee charged: ${feeAmount} ETB`
    );

    // Verify contact revelation
    assert(
      unlockResult.buyerContact.phone === buyer.phone,
      `Buyer phone revealed to seller upon unlock: ${unlockResult.buyerContact.phone}`
    );
    assert(
      unlockResult.sellerContact.phone === seller.phone,
      `Seller direct phone revealed to buyer upon unlock: ${unlockResult.sellerContact.phone}`
    );
    assert(
      unlockResult.sellerContact.companyName === seller.companyName,
      `Seller business entity revealed: ${unlockResult.sellerContact.companyName}`
    );

    // Verify wallet deductions (Credit was burned first)
    const updatedWallet = await getOrCreateSellerWallet(seller.id);
    const expectedCreditDeduction = Math.min(initialCredit, feeAmount);
    const expectedCashDeduction = feeAmount - expectedCreditDeduction;

    assert(
      updatedWallet.creditBalance === initialCredit - expectedCreditDeduction,
      `Priority deduction burned non-withdrawable credit first (Deducted: ${expectedCreditDeduction} ETB, Remaining: ${updatedWallet.creditBalance} ETB)`
    );
    assert(
      updatedWallet.cashBalance === initialCash - expectedCashDeduction,
      `Remainder deducted from cash balance (Deducted: ${expectedCashDeduction} ETB, Remaining: ${updatedWallet.cashBalance} ETB)`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Deal Failure Refund-as-Credit Flow
    // -------------------------------------------------------------------------
    console.log("\n[DOMAIN 5: Deal Failure Refund-as-Credit Engine]");
    const refundPercentage = 80;
    const expectedRefundAmount = Math.round(feeAmount * (refundPercentage / 100) * 100) / 100; // 200 ETB

    const refundResult = await processDealFailureRefund({
      unlockRecordId: unlockResult.unlockRecord.id,
      refundPercentage,
      reason: "Buyer site postponed project start date",
    });

    assert(
      refundResult.success === true,
      `Deal failure reported and processed (${refundPercentage}% credit refund)`
    );
    assert(
      refundResult.refundAmount === expectedRefundAmount,
      `Calculated refund amount: ${refundResult.refundAmount} ETB (80% of ${feeAmount} ETB)`
    );
    assert(
      refundResult.updatedRecord.refundStatus === RefundStatus.REFUNDED_CREDIT,
      `Unlock record marked as REFUNDED_CREDIT`
    );

    // Verify wallet: refund must be credited to NON-WITHDRAWABLE creditBalance, NEVER cash!
    const walletAfterRefund = await getOrCreateSellerWallet(seller.id);
    assert(
      walletAfterRefund.cashBalance === updatedWallet.cashBalance,
      `Cash balance untouched: ${walletAfterRefund.cashBalance} ETB (Cash cannot be withdrawn on failed leads)`
    );
    assert(
      walletAfterRefund.creditBalance === updatedWallet.creditBalance + expectedRefundAmount,
      `Refund credited strictly into creditBalance: ${walletAfterRefund.creditBalance} ETB`
    );

    // Verify ledger entry
    const ledgerTx = await prisma.walletTransaction.findFirst({
      where: { reference: `REFUND-${testEnquiry.referenceCode}` },
    });
    assert(
      !!ledgerTx && Number(ledgerTx.amount) === expectedRefundAmount,
      `Immutable ledger entry recorded for refund credit (#${ledgerTx?.reference})`
    );

    // -------------------------------------------------------------------------
    // TEARDOWN
    // -------------------------------------------------------------------------
    console.log("\n[TEARDOWN]");
    await prisma.walletTransaction.deleteMany({
      where: { reference: { in: [`UNLOCK-${testEnquiry.referenceCode}`, `REFUND-${testEnquiry.referenceCode}`] } },
    });
    await prisma.unlockRecord.delete({ where: { enquiryId: testEnquiry.id } });
    await prisma.enquiry.delete({ where: { id: testEnquiry.id } });
    console.log("  ✅ Test records cleanly torn down.");

    console.log("\n=======================================================");
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("=======================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fatal test failure:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
