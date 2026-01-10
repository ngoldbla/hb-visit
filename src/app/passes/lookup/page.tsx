"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Download, Printer, QrCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="w-[160px] h-[160px] bg-gray-100 animate-pulse rounded flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    ),
  }
);

interface Pass {
  id: string;
  pass_code: string;
  visitor_name: string;
  visitor_company: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  host_name: string | null;
  meeting_room: string | null;
  purpose: string | null;
  status: string;
  expires_at: string;
  qr_payload: object;
}

type PageState = "form" | "loading" | "results";

export default function PassLookupPage() {
  const [state, setState] = useState<PageState>("form");
  const [email, setEmail] = useState("");
  const [passes, setPasses] = useState<Pass[]>([]);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");

    try {
      const response = await fetch("/api/passes/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to look up passes");
      }

      setPasses(data.passes);
      setMessage(data.message);
      setState("results");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setState("form");
    }
  }

  function handleDownload(pass: Pass) {
    const svg = document.getElementById(`qr-${pass.id}`);
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
      link.download = `pass-${pass.pass_code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }

  function handlePrint(pass: Pass) {
    const svg = document.getElementById(`qr-${pass.id}`)?.outerHTML;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Could not open print window");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Pass - ${pass.pass_code}</title>
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
            .visitor-name { font-size: 24px; margin: 10px 0; }
            .details { color: #666; margin: 8px 0; }
            .qr-container { margin: 30px 0; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>HatchBridge Visitor Pass</h1>
          <div class="pass-code">${pass.pass_code}</div>
          <div class="visitor-name">${pass.visitor_name}</div>
          ${pass.visitor_company ? `<div class="details">${pass.visitor_company}</div>` : ""}
          <div class="qr-container">${svg}</div>
          <div class="details">
            ${formatDate(pass.scheduled_date)} ${pass.scheduled_time ? `at ${formatTime(pass.scheduled_time)}` : ""}
          </div>
          ${pass.host_name ? `<div class="details">Meeting with: ${pass.host_name}</div>` : ""}
          ${pass.meeting_room ? `<div class="details">Location: ${pass.meeting_room}</div>` : ""}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function formatDate(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  function handleReset() {
    setEmail("");
    setPasses([]);
    setMessage("");
    setState("form");
  }

  // Form state
  if (state === "form" || state === "loading") {
    return (
      <div className="min-h-screen bg-[#fff9e9] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#000824] rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-[#ffc421]" />
            </div>
            <CardTitle className="text-2xl text-[#000824]">
              Find Your Visitor Pass
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Enter the email address used when your pass was created
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    disabled={state === "loading"}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-[#2153ff] hover:bg-[#1a42cc]"
                disabled={state === "loading"}
              >
                {state === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking up passes...
                  </>
                ) : (
                  "Find My Passes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results state
  return (
    <div className="min-h-screen bg-[#fff9e9] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#000824]">Your Visitor Passes</h1>
          <p className="text-gray-600 mt-1">{message}</p>
          <Button
            variant="link"
            onClick={handleReset}
            className="mt-2 text-[#2153ff]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Search with different email
          </Button>
        </div>

        {passes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700">No Active Passes</h2>
              <p className="text-gray-500 mt-2">
                No active passes were found for this email address.
              </p>
              <p className="text-gray-500 mt-1">
                Contact your host if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {passes.map((pass) => (
              <Card key={pass.id} className="overflow-hidden">
                <div className="bg-[#000824] text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#ffc421] uppercase tracking-wide">
                        Visitor Pass
                      </p>
                      <p className="text-2xl font-mono font-bold mt-1">
                        {pass.pass_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">
                        {formatDate(pass.scheduled_date)}
                      </p>
                      {pass.scheduled_time && (
                        <p className="text-lg font-semibold">
                          {formatTime(pass.scheduled_time)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* QR Code */}
                    <div className="flex-shrink-0 bg-white p-4 rounded-lg border shadow-sm mx-auto sm:mx-0">
                      <QRCodeSVG
                        id={`qr-${pass.id}`}
                        value={JSON.stringify(pass.qr_payload)}
                        size={160}
                        level="M"
                      />
                    </div>

                    {/* Pass Details */}
                    <div className="flex-grow space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Visitor</p>
                        <p className="font-semibold text-lg">{pass.visitor_name}</p>
                        {pass.visitor_company && (
                          <p className="text-gray-600">{pass.visitor_company}</p>
                        )}
                      </div>

                      {pass.host_name && (
                        <div>
                          <p className="text-sm text-gray-500">Meeting with</p>
                          <p className="font-medium">{pass.host_name}</p>
                        </div>
                      )}

                      {pass.meeting_room && (
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{pass.meeting_room}</p>
                        </div>
                      )}

                      {pass.purpose && (
                        <div>
                          <p className="text-sm text-gray-500">Purpose</p>
                          <p className="font-medium">{pass.purpose}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(pass)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePrint(pass)}
                      className="flex-1"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Pass
                    </Button>
                  </div>
                </CardContent>

                {/* Expiration warning */}
                <div className="bg-gray-50 px-6 py-3 text-center">
                  <p className="text-sm text-gray-500">
                    Valid until {new Date(pass.expires_at).toLocaleString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to Check In</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
              <li>When you arrive, walk to the kiosk in the main lobby</li>
              <li>Tap &quot;Scan QR Code&quot; on the kiosk screen</li>
              <li>Hold your phone up to the camera showing the QR code above</li>
              <li>You&apos;ll be checked in automatically!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
