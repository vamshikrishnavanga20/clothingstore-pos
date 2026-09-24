'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Share2,
  CheckCircle,
  ShieldCheck,
  Crown,
  Sparkles,
  Download,
  Building,
  Calendar,
  CreditCard,
  User,
  Phone,
  ArrowLeft,
  ExternalLink,
  Leaf,
  QrCode as QrIcon,
} from 'lucide-react';
import { Order } from '../../../lib/types';

export default function DigitalInvoicePage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/${encodeURIComponent(params.id)}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Invoice not found or expired.');
        }
      } catch (err) {
        setError('Network error while retrieving invoice.');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [params.id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const text = `🛍️ *Roman Island Store Invoice*\nBill #${order.billingId}\nTotal: ₹${order.total.toFixed(2)}\nView Digital Tax Invoice: ${typeof window !== 'undefined' ? window.location.href : ''}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          Loading Official Digital Invoice...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-[#111728] border border-red-500/30 rounded-2xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center text-xl font-bold">
            !
          </div>
          <h1 className="text-lg font-bold text-white">Invoice Unavailable</h1>
          <p className="text-xs text-slate-400">{error || 'The requested digital bill could not be found.'}</p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Store POS
          </Link>
        </div>
      </div>
    );
  }

  const invoiceUrl = typeof window !== 'undefined' ? window.location.href : `https://romanisland.store/invoice/${order.billingId}`;
  const verificationQrUri = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(invoiceUrl)}`;

  const cgst = (order.tax / 2).toFixed(2);
  const sgst = (order.tax / 2).toFixed(2);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 py-6 px-4 sm:px-6 font-sans antialiased">
      {/* Top action controls (hidden on print) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Link
            href="/billing"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Boutique POS
          </Link>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
            <Leaf className="w-3 h-3 text-emerald-400" /> 100% Paperless Digital Bill
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-[#11192C] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            {copiedLink ? 'Link Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Share WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Save PDF / Print
          </button>
        </div>
      </div>

      {/* Main Luxury Boutique Invoice Container */}
      <div className="max-w-3xl mx-auto bg-[#0E1526] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Boutique Header */}
        <div className="p-8 sm:p-10 border-b border-slate-800/80 bg-gradient-to-b from-[#131E35] to-[#0E1526] relative overflow-hidden print:bg-white print:border-b-2 print:border-neutral-300">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center font-black text-black shadow-xl shadow-amber-500/20 text-lg">
                  RI
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent print:text-black">
                    ROMAN ISLAND
                  </h1>
                  <p className="text-[11px] font-semibold text-amber-400/90 tracking-widest uppercase">
                    Luxury Ready-To-Wear • Retail Flagship
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-0.5 mt-3 print:text-neutral-600">
                <p className="flex items-center gap-1.5 font-medium text-slate-300 print:text-neutral-800">
                  <Building className="w-3.5 h-3.5 text-slate-400 print:text-neutral-500" />
                  {order.branchName}
                </p>
                <p>Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033</p>
                <p className="font-mono text-[11px]">
                  GSTIN: <span className="font-bold text-slate-200 print:text-neutral-900">36ABCDE1234F1Z5</span> | CIN: U74999TG2020PTC145620
                </p>
              </div>
            </div>

            {/* Tax Invoice Badge */}
            <div className="sm:text-right bg-[#141E33] sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-slate-700/60 w-full sm:w-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider mb-2 print:border-neutral-400 print:text-neutral-800">
                ORIGINAL TAX INVOICE
              </span>
              <p className="text-xs text-slate-400 uppercase tracking-wider print:text-neutral-600">Invoice Number</p>
              <p className="text-base font-black font-mono text-white tracking-tight print:text-black">
                {order.billingId}
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center sm:justify-end gap-1.5 print:text-neutral-600">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & VIP Club Details */}
        <div className="p-6 sm:p-8 bg-[#11182A]/70 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs print:bg-neutral-50 print:border-neutral-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Billed To Customer
            </span>
            <p className="font-bold text-sm text-white print:text-black flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {order.customerName}
            </p>
            <p className="text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 print:text-neutral-700">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              {order.customerPhone.length === 10 ? `+91 ${order.customerPhone}` : order.customerPhone}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Payment & Staff
            </span>
            <p className="font-bold text-slate-200 print:text-black flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Tender: <span className="text-emerald-400 print:text-neutral-900 font-bold uppercase">{order.paymentMethod}</span>
            </p>
            <p className="text-slate-400 mt-0.5 print:text-neutral-600">
              Cashier: <span className="text-slate-300 print:text-neutral-800">{order.cashierName}</span>
            </p>
          </div>

          {/* VIP Tier Badge Card */}
          <div className="bg-[#162138] border border-amber-500/30 rounded-2xl p-3 flex flex-col justify-between print:border-neutral-400 print:bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> VIP Privilege
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase">
                {order.customerTier || 'Member'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 print:text-neutral-600">Points Accrued Today:</span>
              <span className="font-black text-amber-400 font-mono">
                +⭐ {order.pointsEarned || 0} Pts
              </span>
            </div>
          </div>
        </div>

        {/* Garment Itemization Table */}
        <div className="p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 print:text-neutral-800">
            Garment Itemization ({order.items.length} items)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider print:border-neutral-400 print:text-neutral-700">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Garment & Description</th>
                  <th className="pb-3 font-semibold text-center">Fit / Size</th>
                  <th className="pb-3 font-semibold text-center">Qty</th>
                  <th className="pb-3 font-semibold text-right">Unit Price</th>
                  <th className="pb-3 font-semibold text-right">Item Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-neutral-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3.5">
                      <p className="font-bold text-white print:text-black">{item.productName}</p>
                      <p className="text-[10px] text-slate-400 print:text-neutral-500">{item.category} • HSN 6205</p>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#162035] border border-slate-700 text-slate-200 font-bold font-mono text-[11px] print:bg-neutral-100 print:border-neutral-300 print:text-neutral-800">
                        {item.size}
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-bold font-mono text-slate-200 print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-300 print:text-black">
                      ₹{item.unitSellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-white print:text-black">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Tax Details */}
          <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start print:border-neutral-400">
            {/* Left Column: QR Verification & Paperless Seal */}
            <div className="bg-[#11192C]/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 print:border-neutral-300 print:bg-white">
              {/* Dynamic QR code */}
              <div className="bg-white p-2 rounded-xl flex-shrink-0 shadow">
                <img
                  src={verificationQrUri}
                  alt="Invoice Verification QR"
                  className="w-20 h-20"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white print:text-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Authenticated Bill
                </p>
                <p className="text-[10px] text-slate-400 print:text-neutral-600 leading-relaxed">
                  Scan QR with any camera to verify official electronic tax invoice on Roman Island Cloud.
                </p>
                <span className="inline-block text-[9px] font-mono text-slate-500">
                  REF: {order.billingId}
                </span>
              </div>
            </div>

            {/* Right Column: Pricing & GST Matrix */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 print:text-neutral-700">
                <span>Subtotal (Gross Value):</span>
                <span className="font-mono font-semibold text-slate-200 print:text-black">
                  ₹{order.subtotal.toFixed(2)}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Store Discount Applied:</span>
                  <span className="font-mono font-semibold">−₹{order.discount.toFixed(2)}</span>
                </div>
              )}

              {order.pointsRedeemed && order.pointsRedeemed > 0 ? (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>⭐ VIP Points Redeemed:</span>
                  <span className="font-mono">−₹{order.pointsRedeemed.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-400 print:text-neutral-700">
                <span>CGST (2.5%):</span>
                <span className="font-mono">₹{cgst}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-neutral-700">
                <span>SGST (2.5%):</span>
                <span className="font-mono">₹{sgst}</span>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-between items-center print:border-neutral-900">
                <div>
                  <span className="text-sm font-black text-white uppercase tracking-wider print:text-black">
                    Net Grand Total
                  </span>
                  <p className="text-[10px] text-slate-400 print:text-neutral-600">Inclusive of all taxes</p>
                </div>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 print:text-black">
                  ₹{order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* VIP Accrual Highlight Banner */}
          {order.pointsEarned && order.pointsEarned > 0 ? (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between text-xs print:border-neutral-400">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-amber-300">You earned {order.pointsEarned} VIP Loyalty Points!</p>
                  <p className="text-[10px] text-slate-400">
                    Redeemable on your next visit across all Roman Island Boutiques.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">+⭐ {order.pointsEarned} Pts</span>
            </div>
          ) : null}

          {/* Terms & Conditions Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-[10px] text-slate-500 space-y-1 text-center print:border-neutral-300 print:text-neutral-600">
            <p className="font-semibold text-slate-400 print:text-neutral-800">
              Thank you for choosing Roman Island Ready-To-Wear!
            </p>
            <p>
              1. Goods once sold may be exchanged within 7 days in original condition with garment tags intact.
            </p>
            <p>
              2. This is an authenticated computer-generated digital tax invoice requiring no physical signature.
            </p>
            <p className="text-emerald-400/80 font-medium pt-1">
              🌱 Roman Island is a 100% Paperless Store. Thank you for protecting the planet with digital bills!
            </p>
          </div>
        </div>
      </div>

      {/* Print stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
