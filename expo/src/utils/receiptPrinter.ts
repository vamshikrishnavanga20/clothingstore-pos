/**
 * Receipt Printer Utility — Generates thermal-style HTML receipt and triggers print.
 * Uses expo-print for native print dialog and expo-sharing for digital invoice sharing.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ReceiptData {
  billingId: string;
  branchName: string;
  customerName: string;
  customerPhone: string;
  cashierName: string;
  paymentMethod: string;
  items: Array<{
    productName: string;
    size: string;
    quantity: number;
    unitSellingPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  createdAt: string;
}

function formatCurrency(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function generateReceiptHTML(data: ReceiptData): string {
  const itemsRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="text-align:left;padding:4px 0;font-size:11px;border-bottom:1px dashed #333;">
          ${item.productName}<br/>
          <span style="color:#888;font-size:10px;">Size: ${item.size} × ${item.quantity}</span>
        </td>
        <td style="text-align:right;padding:4px 0;font-size:11px;border-bottom:1px dashed #333;">
          ${formatCurrency(item.subtotal)}
        </td>
      </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          background: #fff;
          color: #111;
          width: 280px;
          margin: 0 auto;
          padding: 12px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .brand {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 2px;
        }
        .branch {
          font-size: 10px;
          color: #555;
          margin-top: 2px;
        }
        .bill-id {
          font-size: 12px;
          font-weight: bold;
          margin-top: 6px;
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #444;
          padding: 2px 0;
        }
        .divider {
          border-top: 1px dashed #888;
          margin: 8px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 11px;
        }
        .grand-total {
          font-size: 16px;
          font-weight: 900;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 8px 0;
          margin: 6px 0;
        }
        .footer {
          text-align: center;
          margin-top: 12px;
          font-size: 10px;
          color: #666;
          line-height: 1.5;
        }
        .loyalty {
          background: #f8f4e8;
          border: 1px solid #d4af37;
          border-radius: 4px;
          padding: 6px;
          text-align: center;
          margin: 8px 0;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">ROMAN ISLAND</div>
        <div class="branch">${data.branchName}</div>
        <div class="bill-id">${data.billingId}</div>
      </div>

      <div class="info-row">
        <span>Date:</span>
        <span>${formatDate(data.createdAt)}</span>
      </div>
      <div class="info-row">
        <span>Customer:</span>
        <span>${data.customerName}</span>
      </div>
      <div class="info-row">
        <span>Phone:</span>
        <span>${data.customerPhone}</span>
      </div>
      <div class="info-row">
        <span>Cashier:</span>
        <span>${data.cashierName}</span>
      </div>
      <div class="info-row">
        <span>Payment:</span>
        <span>${data.paymentMethod}</span>
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;font-size:10px;padding-bottom:4px;border-bottom:1px solid #000;">Item</th>
            <th style="text-align:right;font-size:10px;padding-bottom:4px;border-bottom:1px solid #000;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${
        data.discount > 0
          ? `<div class="totals-row" style="color:#e53e3e;">
              <span>Discount:</span>
              <span>-${formatCurrency(data.discount)}</span>
            </div>`
          : ''
      }
      ${
        data.pointsRedeemed && data.pointsRedeemed > 0
          ? `<div class="totals-row" style="color:#d69e2e;">
              <span>Points Redeemed:</span>
              <span>-${formatCurrency(data.pointsRedeemed)}</span>
            </div>`
          : ''
      }
      <div class="totals-row">
        <span>GST (5%):</span>
        <span>${formatCurrency(data.tax)}</span>
      </div>

      <div class="totals-row grand-total">
        <span>GRAND TOTAL:</span>
        <span>${formatCurrency(data.total)}</span>
      </div>

      ${
        data.pointsEarned && data.pointsEarned > 0
          ? `<div class="loyalty">
              ⭐ +${data.pointsEarned} Loyalty Points Earned!
            </div>`
          : ''
      }

      <div class="footer">
        Thank you for shopping at Roman Island!<br/>
        Exchange within 7 days with original bill.<br/>
        No refunds on sale items.<br/>
        <br/>
        ── Roman Island Clothing ──
      </div>
    </body>
    </html>
  `;
}

/**
 * Print a receipt via the native print dialog (works with AirPrint, USB, Bluetooth printers)
 */
export async function printReceipt(data: ReceiptData): Promise<void> {
  const html = generateReceiptHTML(data);
  await Print.printAsync({ html });
}

/**
 * Generate a PDF of the receipt and share it via native share sheet
 */
export async function shareReceipt(data: ReceiptData): Promise<void> {
  const html = generateReceiptHTML(data);
  const { uri } = await Print.printToFileAsync({
    html,
    width: 280,
    height: 800,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      UTI: 'com.adobe.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Roman Island Invoice - ${data.billingId}`,
    });
  }
}
