// =============================================================================
// ConMart — Seller Wallet & Introduction Unlock Revenue Service
// =============================================================================
// Implements the core commercial model:
// 1. Dual-balance seller wallet (Cash vs Non-Withdrawable Credit).
// 2. Category-based Introduction Unlock fee deductions upon Enquiry acceptance.
// 3. Strict revenue event recording via immutable UnlockRecord.
// 4. Deal failure refund-as-credit flow (credited to non-withdrawable creditBalance).
// 5. Telebirr/Bank top-up request processing and administrative settlement.
// =============================================================================

import { db } from "@/lib/db";
import {
  Prisma,
  WalletTxType,
  WalletTxStatus,
  OutcomeType,
  RefundStatus,
  EnquiryStatus,
} from "@prisma/client";

export interface WalletBalanceSummary {
  walletId: string;
  sellerId: string;
  cashBalance: number;
  creditBalance: number;
  totalSpendable: number;
}

/**
 * Retrieves or lazily creates a seller's prepaid wallet.
 */
export async function getOrCreateSellerWallet(
  sellerId: string
): Promise<WalletBalanceSummary> {
  let wallet = await db.wallet.findUnique({
    where: { sellerId },
  });

  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        sellerId,
        cashBalance: 0.0,
        creditBalance: 0.0,
      },
    });
  }

  const cash = Number(wallet.cashBalance);
  const credit = Number(wallet.creditBalance);

  return {
    walletId: wallet.id,
    sellerId: wallet.sellerId,
    cashBalance: cash,
    creditBalance: credit,
    totalSpendable: cash + credit,
  };
}

/**
 * Checks whether the seller can afford an unlock fee.
 */
export async function canAffordUnlock(
  sellerId: string,
  feeAmount: number
): Promise<{ canAfford: boolean; totalSpendable: number; deficit: number }> {
  const wallet = await getOrCreateSellerWallet(sellerId);
  const canAfford = wallet.totalSpendable >= feeAmount;
  const deficit = canAfford ? 0 : feeAmount - wallet.totalSpendable;

  return {
    canAfford,
    totalSpendable: wallet.totalSpendable,
    deficit,
  };
}

/**
 * Executes the core revenue event: "The Contact Unlock"
 * Simultaneously deducts the unlock fee from the seller's wallet and reveals
 * the buyer & seller contact introduction.
 */
export async function executeUnlockIntroductionTransaction({
  enquiryId,
  sellerId,
  buyerId,
  feeAmount,
}: {
  enquiryId: string;
  sellerId: string;
  buyerId: string;
  feeAmount: number;
}) {
  return await db.$transaction(async (tx) => {
    // 1. Fetch enquiry and verify status
    const enquiry = await tx.enquiry.findUnique({
      where: { id: enquiryId },
      include: {
        buyer: { select: { id: true, name: true, phone: true, companyName: true } },
        seller: { select: { id: true, name: true, phone: true, companyName: true } },
        listing: { select: { id: true, location: true, product: { select: { title: true } } } },
      },
    });

    if (!enquiry) {
      throw new Error("Enquiry not found.");
    }

    if (enquiry.status !== EnquiryStatus.PENDING) {
      throw new Error(`Enquiry cannot be unlocked in status: ${enquiry.status}`);
    }

    // 2. Fetch or create seller wallet
    let wallet = await tx.wallet.findUnique({
      where: { sellerId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { sellerId, cashBalance: 0.0, creditBalance: 0.0 },
      });
    }

    const currentCash = Number(wallet.cashBalance);
    const currentCredit = Number(wallet.creditBalance);
    const totalSpendable = currentCash + currentCredit;

    if (totalSpendable < feeAmount) {
      throw new Error(
        `Insufficient wallet balance. Total spendable: ${totalSpendable.toFixed(2)} ETB, required: ${feeAmount.toFixed(2)} ETB.`
      );
    }

    // 3. Priority deduction: Burn non-withdrawable credit first
    const creditDeduction = Math.min(currentCredit, feeAmount);
    const cashDeduction = feeAmount - creditDeduction;

    const newCredit = currentCredit - creditDeduction;
    const newCash = currentCash - cashDeduction;

    // 4. Update wallet balances
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        cashBalance: new Prisma.Decimal(newCash),
        creditBalance: new Prisma.Decimal(newCredit),
      },
    });

    // 5. Record immutable wallet ledger entry
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(-feeAmount),
        type: WalletTxType.UNLOCK_FEE,
        status: WalletTxStatus.COMPLETED,
        reference: `UNLOCK-${enquiry.referenceCode}`,
        description: `Contact Unlock Introduction for #${enquiry.referenceCode} (${enquiry.listing.product.title})`,
        balanceAfterCash: new Prisma.Decimal(newCash),
        balanceAfterCredit: new Prisma.Decimal(newCredit),
      },
    });

    // 6. Create immutable UnlockRecord
    const unlockRecord = await tx.unlockRecord.create({
      data: {
        enquiryId: enquiry.id,
        sellerId,
        buyerId,
        feeAmount: new Prisma.Decimal(feeAmount),
        paidFromCash: new Prisma.Decimal(cashDeduction),
        paidFromCredit: new Prisma.Decimal(creditDeduction),
        sellerReportedOutcome: OutcomeType.PENDING,
        buyerOutcomeResponse: OutcomeType.PENDING,
        refundStatus: RefundStatus.NONE,
      },
    });

    // 7. Advance enquiry state to ACCEPTED
    await tx.enquiry.update({
      where: { id: enquiry.id },
      data: {
        status: EnquiryStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    return {
      success: true,
      unlockRecord,
      buyerContact: {
        name: enquiry.buyer.name,
        companyName: enquiry.buyer.companyName,
        phone: enquiry.buyer.phone,
        deliveryAddress: enquiry.deliveryAddress,
      },
      sellerContact: {
        name: enquiry.seller.name,
        companyName: enquiry.seller.companyName,
        phone: enquiry.seller.phone,
        depotLocation: enquiry.listing.location,
      },
    };
  });
}

/**
 * Processes a deal failure refund: Returns a majority percentage of the unlock fee
 * back to the seller's wallet as NON-WITHDRAWABLE creditBalance.
 */
export async function processDealFailureRefund({
  unlockRecordId,
  refundPercentage = 80,
  reason,
}: {
  unlockRecordId: string;
  refundPercentage?: number;
  reason?: string;
}) {
  return await db.$transaction(async (tx) => {
    const unlockRecord = await tx.unlockRecord.findUnique({
      where: { id: unlockRecordId },
      include: {
        enquiry: { select: { referenceCode: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    if (!unlockRecord) {
      throw new Error("Unlock record not found.");
    }

    if (unlockRecord.refundStatus !== RefundStatus.NONE) {
      throw new Error(`Refund already processed: ${unlockRecord.refundStatus}`);
    }

    const feePaid = Number(unlockRecord.feeAmount);
    const refundAmount = Math.round(feePaid * (refundPercentage / 100) * 100) / 100;

    const wallet = await tx.wallet.findUnique({
      where: { sellerId: unlockRecord.sellerId },
    });

    if (!wallet) {
      throw new Error("Seller wallet not found.");
    }

    const newCredit = Number(wallet.creditBalance) + refundAmount;
    const currentCash = Number(wallet.cashBalance);

    // Update wallet credit balance
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        creditBalance: new Prisma.Decimal(newCredit),
      },
    });

    // Ledger transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(refundAmount),
        type: WalletTxType.REFUND_CREDIT,
        status: WalletTxStatus.COMPLETED,
        reference: `REFUND-${unlockRecord.enquiry.referenceCode}`,
        description: `Deal Failure Refund Credit (${refundPercentage}%) for #${unlockRecord.enquiry.referenceCode}: ${reason || "Deal did not materialize"}`,
        balanceAfterCash: new Prisma.Decimal(currentCash),
        balanceAfterCredit: new Prisma.Decimal(newCredit),
      },
    });

    // Update unlock record
    const updatedRecord = await tx.unlockRecord.update({
      where: { id: unlockRecordId },
      data: {
        refundStatus: RefundStatus.REFUNDED_CREDIT,
        refundCreditAmount: new Prisma.Decimal(refundAmount),
        sellerReportedOutcome: OutcomeType.FAILURE,
      },
    });

    // Update seller metrics
    await tx.sellerProfile.upsert({
      where: { userId: unlockRecord.sellerId },
      update: {
        failedDealsCount: { increment: 1 },
      },
      create: {
        userId: unlockRecord.sellerId,
        failedDealsCount: 1,
      },
    });

    return {
      success: true,
      refundAmount,
      updatedRecord,
      newCreditBalance: newCredit,
    };
  });
}

/**
 * Submits a new wallet top-up request (Telebirr, CBE Bank, etc.)
 */
export async function submitWalletTopUpRequest({
  sellerId,
  amount,
  paymentMethod,
  referenceCode,
  slipUrl,
}: {
  sellerId: string;
  amount: number;
  paymentMethod: "TELEBIRR" | "CBE_BANK" | "AWASH_BANK" | "CASH_DEPOSIT";
  referenceCode: string;
  slipUrl?: string;
}) {
  const wallet = await getOrCreateSellerWallet(sellerId);

  const topUp = await db.topUpRequest.create({
    data: {
      sellerId,
      walletId: wallet.walletId,
      amount: new Prisma.Decimal(amount),
      paymentMethod,
      referenceCode,
      slipUrl,
      status: WalletTxStatus.PENDING,
    },
  });

  return topUp;
}

/**
 * Admin approves a top-up request and credits the seller's cash balance.
 */
export async function approveTopUpRequest({
  topUpId,
  adminUserId,
}: {
  topUpId: string;
  adminUserId: string;
}) {
  return await db.$transaction(async (tx) => {
    const topUp = await tx.topUpRequest.findUnique({
      where: { id: topUpId },
      include: { wallet: true },
    });

    if (!topUp) {
      throw new Error("Top-up request not found.");
    }

    if (topUp.status !== WalletTxStatus.PENDING) {
      throw new Error(`Top-up request is already ${topUp.status}`);
    }

    const creditAmount = Number(topUp.amount);
    const newCash = Number(topUp.wallet.cashBalance) + creditAmount;
    const currentCredit = Number(topUp.wallet.creditBalance);

    // Update wallet balance
    await tx.wallet.update({
      where: { id: topUp.walletId },
      data: {
        cashBalance: new Prisma.Decimal(newCash),
      },
    });

    // Create ledger entry
    await tx.walletTransaction.create({
      data: {
        walletId: topUp.walletId,
        amount: new Prisma.Decimal(creditAmount),
        type: WalletTxType.TOP_UP,
        status: WalletTxStatus.COMPLETED,
        reference: `TOPUP-${topUp.referenceCode}`,
        description: `Wallet deposit approved via ${topUp.paymentMethod} (Ref: ${topUp.referenceCode})`,
        balanceAfterCash: new Prisma.Decimal(newCash),
        balanceAfterCredit: new Prisma.Decimal(currentCredit),
      },
    });

    // Update top-up status
    const updatedTopUp = await tx.topUpRequest.update({
      where: { id: topUpId },
      data: {
        status: WalletTxStatus.COMPLETED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    return {
      success: true,
      topUp: updatedTopUp,
      newCashBalance: newCash,
    };
  });
}

/**
 * Admin rejects a top-up request.
 */
export async function rejectTopUpRequest({
  topUpId,
  adminUserId,
  reason,
}: {
  topUpId: string;
  adminUserId: string;
  reason?: string;
}) {
  const topUp = await db.topUpRequest.findUnique({
    where: { id: topUpId },
  });

  if (!topUp) {
    throw new Error("Top-up request not found.");
  }

  if (topUp.status !== WalletTxStatus.PENDING) {
    throw new Error(`Top-up request is already ${topUp.status}`);
  }

  return await db.topUpRequest.update({
    where: { id: topUpId },
    data: {
      status: WalletTxStatus.FAILED,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  });
}
