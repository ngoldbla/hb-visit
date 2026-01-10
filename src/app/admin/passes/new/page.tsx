"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Check, Copy, Download, Printer, Smartphone } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading QR...</span>
      </div>
    ),
  }
);

interface CreatedPass {
  id: string;
  pass_code: string;
  qr_data: string;
  expires_at: string;
  apple_wallet_url: string | null;
  google_wallet_url: string | null;
}

export default function CreatePassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdPass, setCreatedPass] = useState<CreatedPass | null>(null);
  const [walletLoading, setWalletLoading] = useState<"apple" | "google" | null>(null);
  const [formData, setFormData] = useState({
    visitor_name: "",
    visitor_email: "",
    visitor_company: "",
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_time: "10:00",
    host_name: "",
    host_email: "",
    purpose: "",
    meeting_room: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create pass");
      }

      setCreatedPass(data.pass);
      toast.success("Pass created successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create pass");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  function handleDownloadQR() {
    if (!createdPass) return;
    const svg = document.getElementById("pass-qr-code");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svg);
    const img = document.createElement("img");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const link = document.createElement("a");
      link.download = `pass-${createdPass.pass_code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }

  function handlePrintPass() {
    if (!createdPass) return;
    const svg = document.getElementById("pass-qr-code")?.outerHTML;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Could not open print window");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Pass - ${createdPass.pass_code}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px;
            }
            .pass-code {
              font-size: 32px;
              font-weight: bold;
              font-family: monospace;
              margin: 20px 0;
            }
            .qr-container { margin: 30px 0; }
            .details { color: #666; margin: 8px 0; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>HatchBridge Visitor Pass</h1>
          <div class="pass-code">${createdPass.pass_code}</div>
          <div class="qr-container">${svg}</div>
          <div class="details">
            Valid until: ${new Date(createdPass.expires_at).toLocaleString()}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function handleAppleWallet() {
    if (!createdPass) return;
    setWalletLoading("apple");
    try {
      // Direct download of .pkpass file
      const link = document.createElement("a");
      link.href = `/api/wallet/apple/${createdPass.id}`;
      link.download = `HatchBridge-${createdPass.pass_code}.pkpass`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Apple Wallet pass downloaded!");
    } catch (error) {
      toast.error("Failed to generate Apple Wallet pass");
    } finally {
      setWalletLoading(null);
    }
  }

  async function handleGoogleWallet() {
    if (!createdPass) return;
    setWalletLoading("google");
    try {
      const response = await fetch(`/api/wallet/google/${createdPass.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate Google Wallet pass");
      }

      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Opening Google Wallet...");
      } else {
        throw new Error("No URL returned");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate Google Wallet pass");
    } finally {
      setWalletLoading(null);
    }
  }

  if (createdPass) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/admin/passes"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Passes
        </Link>

        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pass Created!</h1>
            <p className="text-gray-600">
              The visitor pass has been created successfully.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm text-gray-500">Pass Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-mono font-bold text-[#000824]">
                  {createdPass.pass_code}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(createdPass.pass_code)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 flex flex-col items-center border">
              <Label className="text-sm text-gray-500 mb-4">Scan to Check In</Label>
              <QRCodeSVG
                id="pass-qr-code"
                value={createdPass.qr_data}
                size={200}
                level="M"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQR}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintPass}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm text-gray-500">Expires</Label>
              <p className="text-gray-900 mt-1">
                {new Date(createdPass.expires_at).toLocaleString()}
              </p>
            </div>

            {/* Wallet Passes Section */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
              <Label className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                <Smartphone className="w-4 h-4" />
                Add to Mobile Wallet
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleAppleWallet}
                  disabled={walletLoading !== null}
                  className="flex-1 h-12 bg-black hover:bg-gray-800 text-white border-0"
                >
                  {walletLoading === "apple" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  )}
                  Add to Apple Wallet
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoogleWallet}
                  disabled={walletLoading !== null}
                  className="flex-1 h-12 bg-white hover:bg-gray-50 border-gray-300"
                >
                  {walletLoading === "google" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Add to Google Wallet
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Send this pass to the visitor&apos;s phone for easy check-in
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              onClick={() => setCreatedPass(null)}
              variant="outline"
              className="flex-1"
            >
              Create Another
            </Button>
            <Button
              onClick={() => router.push("/admin/passes")}
              className="flex-1 bg-[#2153ff] hover:bg-[#1a42cc]"
            >
              View All Passes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/admin/passes"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Passes
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Visitor Pass</h1>
        <p className="text-gray-600 mt-1">
          Generate a QR code pass for a visitor
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visitor Info */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Visitor Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="visitor_name">Full Name *</Label>
                <Input
                  id="visitor_name"
                  name="visitor_name"
                  value={formData.visitor_name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="visitor_email">Email *</Label>
                <Input
                  id="visitor_email"
                  name="visitor_email"
                  type="email"
                  value={formData.visitor_email}
                  onChange={handleChange}
                  required
                  placeholder="jane@example.com"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="visitor_company">Company</Label>
                <Input
                  id="visitor_company"
                  name="visitor_company"
                  value={formData.visitor_company}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                />
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Visit Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_date">Date *</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduled_time">Time</Label>
                <Input
                  id="scheduled_time"
                  name="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <Input
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Client meeting, Interview, etc."
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="meeting_room">Meeting Room</Label>
                <Input
                  id="meeting_room"
                  name="meeting_room"
                  value={formData.meeting_room}
                  onChange={handleChange}
                  placeholder="Conference Room A, Floor 2"
                />
              </div>
            </div>
          </div>

          {/* Host Info */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Host Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="host_name">Host Name</Label>
                <Input
                  id="host_name"
                  name="host_name"
                  value={formData.host_name}
                  onChange={handleChange}
                  placeholder="John Smith"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="host_email">Host Email</Label>
                <Input
                  id="host_email"
                  name="host_email"
                  type="email"
                  value={formData.host_email}
                  onChange={handleChange}
                  placeholder="john@hatchbridge.com"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#2153ff] hover:bg-[#1a42cc]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Pass...
              </>
            ) : (
              "Create Pass"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
