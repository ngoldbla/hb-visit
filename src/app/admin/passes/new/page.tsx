"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CreatedPass {
  pass_code: string;
  qr_data: string;
  expires_at: string;
}

export default function CreatePassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdPass, setCreatedPass] = useState<CreatedPass | null>(null);
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

            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm text-gray-500">QR Data</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-mono text-gray-600 truncate flex-1">
                  {createdPass.qr_data}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(createdPass.qr_data)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm text-gray-500">Expires</Label>
              <p className="text-gray-900 mt-1">
                {new Date(createdPass.expires_at).toLocaleString()}
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
