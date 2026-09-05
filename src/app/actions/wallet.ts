// =============================================================================
// ConMart — Wallet Server Actions
// =============================================================================
// Enables sellers to view balances, submit top-ups, and admins to review deposits.
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  getOrCreateSellerWallet,
  submitWalletTopUpRequest,
  approveTopUpRequest,
  rejectTopUpRequest,
} from "@/lib/wallet/wallet-service";
import { PaymentMethod, WalletTxStatus } from "@prisma/client";

export async function getSellerWalletAction() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const summary = await getOrCreateSellerWallet(user.id);

  const transactions = await db.walletTransaction.findMany({
    where: { walletId: summary.walletId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pendingTopUps = await db.topUpRequest.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    success: true,
    data: {
      ...summary,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        reference: t.reference,
        description: t.description,
        balanceAfterCash: Number(t.balanceAfterCash),
        balanceAfterCredit: Number(t.balanceAfterCredit),
        createdAt: t.createdAt.toISOString(),
      })),
      pendingTopUps: pendingTopUps.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        referenceCode: p.referenceCode,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
    },
  };
}

export async function submitTopUpRequestAction(formData: FormData) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const amountStr = formData.get("amount") as string;
  const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.TELEBIRR;
  const referenceCode = formData.get("referenceCode") as string;
  const slipUrl = (formData.get("slipUrl") as string) || undefined;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "Please enter a valid deposit amount in ETB." };
  }

  if (!referenceCode || !referenceCode.trim()) {
    return { success: false, error: "Please provide the bank or Telebirr reference code / transaction ID." };
  }

  try {
    const topUp = await submitWalletTopUpRequest({
      sellerId: user.id,
      amount,
      paymentMethod,
      referenceCode: referenceCode.trim(),
      slipUrl,
    });

    revalidatePath("/seller/wallet");
    return { success: true, data: { topUpId: topUp.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit top up";
    return { success: false, error: message };
  }
}

export async function approveTopUpAction(topUpId: string) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const admin = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Only administrators can approve wallet top-ups." };
  }

  try {
    const result = await approveTopUpRequest({
      topUpId,
      adminUserId: admin.id,
    });

    revalidatePath("/admin/command-center");
    revalidatePath("/seller/wallet");
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve top-up";
    return { success: false, error: message };
  }
}

export async function rejectTopUpAction(topUpId: string, reason?: string) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const admin = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Only administrators can reject wallet top-ups." };
  }

  try {
    const result = await rejectTopUpRequest({
      topUpId,
      adminUserId: admin.id,
      reason,
    });

    revalidatePath("/admin/command-center");
    revalidatePath("/seller/wallet");
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reject top-up";
    return { success: false, error: message };
  }
}

export async function getAdminPendingTopUpsAction() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const admin = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const topUps = await db.topUpRequest.findMany({
    where: { status: WalletTxStatus.PENDING },
    include: {
      seller: { select: { id: true, name: true, companyName: true, phone: true } },
      wallet: { select: { cashBalance: true, creditBalance: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: topUps.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      paymentMethod: t.paymentMethod,
      referenceCode: t.referenceCode,
      slipUrl: t.slipUrl,
      createdAt: t.createdAt.toISOString(),
      sellerName: t.seller.name,
      sellerCompany: t.seller.companyName,
      sellerPhone: t.seller.phone,
      currentBalance: Number(t.wallet.cashBalance) + Number(t.wallet.creditBalance),
    })),
  };
}
