// =============================================================================
// ConMart — Purchase Request & Enquiry Server Actions
// =============================================================================
// Coordinates the core workflow:
// 1. Buyer submits purchase request (enquiry).
// 2. Seller receives masked notification.
// 3. Seller accepts -> Wallet fee deducted -> Verified introduction unlocked.
// 4. Seller declines -> Zero charge.
// 5. Deal outcome reporting (Success vs Failure -> Refund-as-credit flow).
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  executeUnlockIntroductionTransaction,
  processDealFailureRefund,
} from "@/lib/wallet/wallet-service";
import {
  sanitizeEnquiryForViewer,
  filterLeakedContactText,
} from "@/lib/security/masking";
import {
  EnquiryStatus,
  DeliveryPreference,
  OutcomeType,
  DisputeClaimType,
} from "@prisma/client";
import crypto from "crypto";

function generateEnquiryReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return `ENQ-${code}`;
}

export async function submitPurchaseEnquiryAction(data: {
  listingId: string;
  qty: number;
  deliveryPreference?: DeliveryPreference;
  deliveryAddress: string;
  accessConstraints?: string;
  requiredDate?: string;
  onBehalfOfBuyerPhone?: string;
  onBehalfOfBuyerName?: string;
}) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Please sign in to submit a purchase request." };
  }

  const caller = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!caller) {
    return { success: false, error: "User profile not found." };
  }

  let finalBuyerId = caller.id;
  let assignedAgentId: string | null = null;

  // Field Agent Assisted Mode (Guide Section 13)
  if ((caller.role === "FIELD_AGENT" || caller.role === "ADMIN") && data.onBehalfOfBuyerPhone) {
    assignedAgentId = caller.id;
    const existing = await db.user.findFirst({
      where: { phone: data.onBehalfOfBuyerPhone },
    });
    if (existing) {
      finalBuyerId = existing.id;
    } else {
      const assistedBuyer = await db.user.create({
        data: {
          authId: `assisted-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: "BUYER",
          name: data.onBehalfOfBuyerName || "Assisted Contractor",
          phone: data.onBehalfOfBuyerPhone,
          companyName: data.onBehalfOfBuyerName ? `${data.onBehalfOfBuyerName} (Site)` : "Offline Contractor",
        },
      });
      finalBuyerId = assistedBuyer.id;
    }
  }

  const listing = await db.listing.findUnique({
    where: { id: data.listingId },
    include: {
      product: { select: { unit: true, title: true } },
    },
  });

  if (!listing || !listing.active) {
    return { success: false, error: "Material listing is no longer available." };
  }

  if (listing.sellerId === finalBuyerId) {
    return { success: false, error: "You cannot submit a purchase request for your own listing." };
  }

  if (data.qty <= 0) {
    return { success: false, error: "Please enter a valid positive quantity." };
  }

  const referenceCode = generateEnquiryReference();
  const sanitizedAddress = filterLeakedContactText(data.deliveryAddress);
  const sanitizedConstraints = filterLeakedContactText(data.accessConstraints);

  let safeRequiredDate: Date | undefined = undefined;
  if (data.requiredDate) {
    const d = new Date(data.requiredDate);
    if (!isNaN(d.getTime())) {
      safeRequiredDate = d;
    }
  }

  const enquiry = await db.enquiry.create({
    data: {
      referenceCode,
      buyerId: finalBuyerId,
      sellerId: listing.sellerId,
      listingId: listing.id,
      agentId: assignedAgentId,
      qty: data.qty,
      unit: listing.product.unit,
      deliveryPreference: data.deliveryPreference || DeliveryPreference.SELLER_DELIVERED,
      deliveryAddress: sanitizedAddress,
      accessConstraints: sanitizedConstraints,
      requiredDate: safeRequiredDate,
      status: EnquiryStatus.PENDING,
    },
  });

  revalidatePath("/buyer/enquiries");
  revalidatePath("/seller/enquiries");

  return {
    success: true,
    data: {
      enquiryId: enquiry.id,
      referenceCode: enquiry.referenceCode,
    },
  };
}

export async function sellerAcceptEnquiryAction(enquiryId: string) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const seller = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!seller) {
    return { success: false, error: "Seller profile not found." };
  }

  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      listing: {
        include: {
          product: {
            include: { category: { select: { id: true, unlockFee: true, name: true } } },
          },
        },
      },
    },
  });

  if (!enquiry) {
    return { success: false, error: "Enquiry not found." };
  }

  if (enquiry.sellerId !== seller.id && seller.role !== "ADMIN") {
    return { success: false, error: "You do not have permission to accept this enquiry." };
  }

  if (enquiry.status !== EnquiryStatus.PENDING) {
    return { success: false, error: `Enquiry is already ${enquiry.status}.` };
  }

  const feeAmount = Number(enquiry.listing.product.category.unlockFee);

  try {
    const result = await executeUnlockIntroductionTransaction({
      enquiryId: enquiry.id,
      sellerId: enquiry.sellerId,
      buyerId: enquiry.buyerId,
      feeAmount,
    });

    revalidatePath("/seller/enquiries");
    revalidatePath("/buyer/enquiries");
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to unlock introduction.";
    return { success: false, error: message };
  }
}

export async function sellerDeclineEnquiryAction(enquiryId: string) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const seller = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!seller) {
    return { success: false, error: "Seller profile not found." };
  }

  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
  });

  if (!enquiry || enquiry.sellerId !== seller.id) {
    return { success: false, error: "Enquiry not found or access denied." };
  }

  await db.enquiry.update({
    where: { id: enquiryId },
    data: {
      status: EnquiryStatus.DECLINED,
      respondedAt: new Date(),
    },
  });

  revalidatePath("/seller/enquiries");
  return { success: true };
}

export async function reportDealOutcomeAction({
  enquiryId,
  outcome,
  reason,
}: {
  enquiryId: string;
  outcome: "SUCCESS" | "FAILURE";
  reason?: string;
}) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    include: { unlockRecord: true },
  });

  if (!enquiry || !enquiry.unlockRecord) {
    return { success: false, error: "Unlocked deal record not found." };
  }

  if (outcome === "FAILURE") {
    // Process 80% majority refund back to seller wallet as non-withdrawable credit
    const refundResult = await processDealFailureRefund({
      unlockRecordId: enquiry.unlockRecord.id,
      refundPercentage: 80,
      reason,
    });

    await db.enquiry.update({
      where: { id: enquiry.id },
      data: { status: EnquiryStatus.FAILED },
    });

    // Automatic Suspension Rule (Guide Section 9 & 25):
    // If seller has >= 4 failed deals and failure rate exceeds 60%, automatically suspend
    const updatedProfile = await db.sellerProfile.findUnique({
      where: { userId: enquiry.sellerId },
    });
    if (updatedProfile && updatedProfile.failedDealsCount >= 4) {
      const totalDeals = updatedProfile.completedDealsCount + updatedProfile.failedDealsCount;
      if (totalDeals > 0) {
        const failureRate = updatedProfile.failedDealsCount / totalDeals;
        if (failureRate > 0.6) {
          await db.sellerProfile.update({
            where: { id: updatedProfile.id },
            data: { verificationStatus: "SUSPENDED" },
          });
        }
      }
    }

    revalidatePath("/seller/enquiries");
    revalidatePath("/seller/wallet");
    revalidatePath("/buyer/enquiries");
    revalidatePath("/admin/command-center");
    return { success: true, data: refundResult };
  } else {
    // Success outcome
    await db.unlockRecord.update({
      where: { id: enquiry.unlockRecord.id },
      data: {
        sellerReportedOutcome: OutcomeType.SUCCESS,
      },
    });

    await db.enquiry.update({
      where: { id: enquiry.id },
      data: { status: EnquiryStatus.COMPLETED },
    });

    // Increment seller completed deal counter
    await db.sellerProfile.upsert({
      where: { userId: enquiry.sellerId },
      update: { completedDealsCount: { increment: 1 } },
      create: { userId: enquiry.sellerId, completedDealsCount: 1 },
    });

    revalidatePath("/seller/enquiries");
    return { success: true };
  }
}

export async function raiseDisputeAction({
  enquiryId,
  claimType,
  description,
  evidenceUrls = [],
}: {
  enquiryId: string;
  claimType: DisputeClaimType;
  description: string;
  evidenceUrls?: string[];
}) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
    include: { unlockRecord: true },
  });

  if (!enquiry || !enquiry.unlockRecord) {
    return { success: false, error: "Unlocked deal not found for dispute." };
  }

  const dispute = await db.disputeCase.create({
    data: {
      enquiryId: enquiry.id,
      unlockRecordId: enquiry.unlockRecord.id,
      raisedBy: user.role,
      claimType,
      description,
      evidenceUrls,
    },
  });

  await db.enquiry.update({
    where: { id: enquiry.id },
    data: { status: EnquiryStatus.DISPUTED },
  });

  revalidatePath("/buyer/enquiries");
  revalidatePath("/seller/enquiries");
  return { success: true, data: { disputeId: dispute.id } };
}

export async function getAdminDisputesAction() {
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

  const disputes = await db.disputeCase.findMany({
    include: {
      enquiry: {
        include: {
          buyer: { select: { name: true, phone: true, companyName: true } },
          seller: { select: { name: true, phone: true, companyName: true } },
          listing: { include: { product: { select: { title: true } } } },
        },
      },
      unlockRecord: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: disputes.map((d) => ({
      id: d.id,
      enquiryId: d.enquiryId,
      referenceCode: d.enquiry.referenceCode,
      productTitle: d.enquiry.listing.product.title,
      raisedBy: d.raisedBy,
      claimType: d.claimType,
      description: d.description,
      status: d.status,
      resolutionNotes: d.resolutionNotes,
      createdAt: d.createdAt.toISOString(),
      resolvedAt: d.resolvedAt ? d.resolvedAt.toISOString() : null,
      buyerName: d.enquiry.buyer.name,
      buyerPhone: d.enquiry.buyer.phone,
      sellerName: d.enquiry.seller.name,
      sellerCompany: d.enquiry.seller.companyName,
      sellerPhone: d.enquiry.seller.phone,
      feeAmount: Number(d.unlockRecord.feeAmount),
    })),
  };
}

export async function resolveDisputeAction({
  disputeId,
  status,
  resolutionNotes,
  grantRefund,
}: {
  disputeId: string;
  status: "RESOLVED_SELLER_CREDIT" | "RESOLVED_NO_REFUND" | "CLOSED";
  resolutionNotes: string;
  grantRefund: boolean;
}) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const admin = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Only administrators can resolve dispute cases." };
  }

  const dispute = await db.disputeCase.findUnique({
    where: { id: disputeId },
    include: { unlockRecord: true, enquiry: true },
  });

  if (!dispute) {
    return { success: false, error: "Dispute not found." };
  }

  if (grantRefund && dispute.unlockRecord.refundStatus !== "REFUNDED_CREDIT") {
    await processDealFailureRefund({
      unlockRecordId: dispute.unlockRecord.id,
      refundPercentage: 80,
      reason: `Dispute Resolution: ${resolutionNotes}`,
    });
  }

  await db.disputeCase.update({
    where: { id: disputeId },
    data: {
      status,
      resolutionNotes,
      resolvedAt: new Date(),
    },
  });

  await db.enquiry.update({
    where: { id: dispute.enquiryId },
    data: {
      status: grantRefund ? EnquiryStatus.FAILED : EnquiryStatus.COMPLETED,
    },
  });

  revalidatePath("/admin/command-center");
  revalidatePath("/seller/enquiries");
  revalidatePath("/buyer/enquiries");

  return { success: true };
}

export async function getSellerEnquiriesAction() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const seller = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!seller) {
    return { success: false, error: "Seller profile not found." };
  }

  const enquiries = await db.enquiry.findMany({
    where: { sellerId: seller.id },
    include: {
      buyer: { select: { id: true, name: true, phone: true, companyName: true } },
      seller: { select: { id: true, name: true, phone: true, companyName: true } },
      listing: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true, unlockFee: true } } },
          },
        },
      },
      unlockRecord: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: enquiries.map((enq) => {
      const contact = sanitizeEnquiryForViewer({
        enquiry: enq,
        viewerUserId: seller.id,
        viewerRole: seller.role,
      });

      return {
        id: enq.id,
        referenceCode: enq.referenceCode,
        qty: enq.qty,
        unit: enq.unit,
        deliveryPreference: enq.deliveryPreference,
        deliveryAddress: enq.deliveryAddress,
        accessConstraints: enq.accessConstraints,
        status: enq.status,
        createdAt: enq.createdAt.toISOString(),
        productTitle: enq.listing.product.title,
        categoryName: enq.listing.product.category.name,
        unlockFee: Number(enq.listing.product.category.unlockFee),
        isUnlocked: contact.isUnlocked,
        buyerContact: contact.buyer,
        unlockRecord: enq.unlockRecord
          ? {
              feeAmount: Number(enq.unlockRecord.feeAmount),
              unlockedAt: enq.unlockRecord.unlockedAt.toISOString(),
              refundStatus: enq.unlockRecord.refundStatus,
              sellerReportedOutcome: enq.unlockRecord.sellerReportedOutcome,
            }
          : null,
      };
    }),
  };
}

export async function getBuyerEnquiriesAction() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { success: false, error: "Unauthorized" };
  }

  const buyer = await db.user.findUnique({
    where: { authId: authUser.id },
  });

  if (!buyer) {
    return { success: false, error: "Buyer profile not found." };
  }

  const enquiries = await db.enquiry.findMany({
    where: { buyerId: buyer.id },
    include: {
      buyer: { select: { id: true, name: true, phone: true, companyName: true } },
      seller: { select: { id: true, name: true, phone: true, companyName: true } },
      listing: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true, unlockFee: true } } },
          },
        },
      },
      unlockRecord: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: enquiries.map((enq) => {
      const contact = sanitizeEnquiryForViewer({
        enquiry: enq,
        viewerUserId: buyer.id,
        viewerRole: buyer.role,
      });

      return {
        id: enq.id,
        referenceCode: enq.referenceCode,
        qty: enq.qty,
        unit: enq.unit,
        deliveryPreference: enq.deliveryPreference,
        deliveryAddress: enq.deliveryAddress,
        accessConstraints: enq.accessConstraints,
        status: enq.status,
        createdAt: enq.createdAt.toISOString(),
        productTitle: enq.listing.product.title,
        categoryName: enq.listing.product.category.name,
        listingLocation: enq.listing.location,
        isUnlocked: contact.isUnlocked,
        sellerContact: contact.seller,
        unlockRecord: enq.unlockRecord
          ? {
              unlockedAt: enq.unlockRecord.unlockedAt.toISOString(),
              sellerReportedOutcome: enq.unlockRecord.sellerReportedOutcome,
            }
          : null,
      };
    }),
  };
}
