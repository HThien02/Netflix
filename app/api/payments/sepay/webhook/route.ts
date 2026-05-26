import { NextResponse } from "next/server";
import { tryCompletePayosFromBankWebhook } from "@/lib/payos/complete-from-bank-webhook";
import {
  amountMatchesOrder,
  extractPaymentCodeFromWebhook,
} from "@/lib/sepay/client";
import { completeSepayOrderFromPending } from "@/lib/sepay/complete-sepay-order";
import { verifySepayWebhookRequest } from "@/lib/sepay/signature";
import { sepayWebhookOk } from "@/lib/sepay/webhook-response";
import {
  isSepayOrderAlreadyCompleted,
  isSepayWebhookProcessed,
  loadSepayPendingFromDb,
  markSepayWebhookProcessed,
} from "@/lib/sepay/pending-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SepayWebhookPayload = {
  id: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  description?: string;
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "sepay-webhook",
    correctUrl: "https://www.netflixhub.com.vn/api/payments/sepay/webhook",
    message: "POST JSON — xác thực Apikey (SEPAY_WEBHOOK_API_KEY), không HMAC",
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const auth = verifySepayWebhookRequest(request, rawBody);
  if (!auth.ok) {
    console.warn("[sepay webhook] auth failed", auth.message);
    return NextResponse.json(
      { success: false, message: auth.message },
      { status: 401 },
    );
  }

  let payload: SepayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SepayWebhookPayload;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 },
    );
  }

  const txId = Number(payload.id);
  if (!txId) {
    return NextResponse.json(
      { success: false, message: "Missing transaction id" },
      { status: 400 },
    );
  }

  if (payload.transferType && payload.transferType !== "in") {
    console.info("[sepay webhook] skipped not_incoming", txId);
    return sepayWebhookOk();
  }

  const paymentCode = extractPaymentCodeFromWebhook({
    code: payload.code,
    content: payload.content,
    description: payload.description,
  });

  if (await isSepayWebhookProcessed(txId)) {
    console.info("[sepay webhook] duplicate tx", txId, paymentCode);
    return sepayWebhookOk();
  }

  if (!paymentCode) {
    const payosResult = await tryCompletePayosFromBankWebhook({
      code: payload.code,
      content: payload.content,
      transferAmount: payload.transferAmount,
    });
    if (payosResult.handled && payosResult.completed) {
      await markSepayWebhookProcessed(
        txId,
        `PAYOS-${payosResult.orderCode}`,
        Number(payload.transferAmount) || 0,
      );
      console.info(
        "[sepay webhook] payos via bank",
        payosResult.orderCode,
        txId,
      );
      return sepayWebhookOk();
    }
    console.info("[sepay webhook] no payment code", {
      id: txId,
      code: payload.code,
      content: payload.content?.slice(0, 120),
    });
    return sepayWebhookOk();
  }

  if (await isSepayOrderAlreadyCompleted(paymentCode)) {
    await markSepayWebhookProcessed(
      txId,
      paymentCode,
      Number(payload.transferAmount) || 0,
    );
    console.info("[sepay webhook] already completed", paymentCode, txId);
    return sepayWebhookOk();
  }

  const pending = await loadSepayPendingFromDb(paymentCode);
  if (!pending) {
    const payosResult = await tryCompletePayosFromBankWebhook({
      code: payload.code,
      content: payload.content,
      transferAmount: payload.transferAmount,
    });
    if (payosResult.handled && payosResult.completed) {
      await markSepayWebhookProcessed(
        txId,
        `PAYOS-${payosResult.orderCode}`,
        Number(payload.transferAmount) || 0,
      );
      return sepayWebhookOk();
    }
    console.warn("[sepay webhook] no pending order", { paymentCode, txId });
    return sepayWebhookOk();
  }

  const transferAmount = Number(payload.transferAmount) || 0;
  if (!amountMatchesOrder(transferAmount, pending.amountVnd)) {
    console.warn("[sepay webhook] amount mismatch", {
      paymentCode,
      transferAmount,
      expected: pending.amountVnd,
    });
    return sepayWebhookOk();
  }

  try {
    await completeSepayOrderFromPending(pending, txId);
    await markSepayWebhookProcessed(txId, paymentCode, transferAmount);
    console.info("[sepay webhook] order completed", paymentCode, txId);
    return sepayWebhookOk();
  } catch (err) {
    console.error("[sepay webhook] complete failed", paymentCode, err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Complete order failed",
      },
      { status: 500 },
    );
  }
}
