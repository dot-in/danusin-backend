import midtransClient from "midtrans-client";
import { config } from "../../core/config/env.config.js";
import { prisma } from "../../core/config/database.config.js";
import { ORDER_STATUS } from "../../shared/constants/status.constant.js";
import type { OrderStatus } from "@prisma/client";

export class PaymentService {
  private snap: any;

  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: config.midtrans.isProduction,
      serverKey: config.midtrans.serverKey,
      clientKey: config.midtrans.clientKey,
    });
  }

  /**
   * Create Midtrans Snap Transaction
   */
  async createTransaction(orderId: number, grossAmount: number) {
    const parameter = {
      transaction_details: {
        order_id: String(orderId),
        gross_amount: grossAmount,
      },
    };

    const transaction = await this.snap.createTransaction(parameter);
    return transaction.token;
  }

  /**
   * Handle Midtrans Webhook Notification
   */
  async handleWebhook(notification: any) {
    const statusResponse = await this.snap.transaction.notification(notification);
    const orderId = parseInt(statusResponse.order_id);
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let orderStatus: OrderStatus | undefined;

    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        // Handle challenge if necessary
      } else if (fraudStatus === "accept") {
        orderStatus = ORDER_STATUS.PENDING as OrderStatus;
      }
    } else if (transactionStatus === "settlement") {
      orderStatus = ORDER_STATUS.PENDING as OrderStatus;
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      orderStatus = ORDER_STATUS.CANCELLED as OrderStatus;
    } else if (transactionStatus === "pending") {
      orderStatus = ORDER_STATUS.PENDING_PAYMENT as OrderStatus;
    }

    if (orderStatus) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: orderStatus },
      });
    }

    return statusResponse;
  }
}
