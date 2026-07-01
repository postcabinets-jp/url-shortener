"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

type Props = { url: string };

export default function QrCodeDisplay({ url }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generate() {
      try {
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 280,
          margin: 2,
          color: { dark: "#18181b", light: "#ffffff" },
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("QR generation failed:", err);
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, [url]);

  function handleDownload() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${url.split("/").pop()}.png`;
    a.click();
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-4 w-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900">QR Code</h3>
      </div>

      <div className="flex justify-center mb-3">
        {loading ? (
          <div className="h-36 w-36 bg-zinc-100 rounded animate-pulse" />
        ) : qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR Code" className="rounded" width={140} height={140} />
        ) : (
          <div className="h-36 w-36 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-center">
            <p className="text-xs text-zinc-400">Failed to generate</p>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        onClick={handleDownload}
        disabled={!qrDataUrl}
      >
        <Download className="h-3.5 w-3.5" />
        Download PNG
      </Button>
    </Card>
  );
}
