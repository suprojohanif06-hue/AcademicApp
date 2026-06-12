"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface PdfViewerProps {
  url: string;
  page: number;
}

export interface PdfViewerHandle {
  jumpToPage: (page: number, label?: string) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(function PdfViewer({ url, page }, ref) {
  const [nonce, setNonce] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Delay mounting the iframe to bypass React 18 Strict Mode's rapid mount-unmount-mount cycle.
    // This prevents the browser from aborting the PDF request, which crashes Next.js with EPIPE.
    const t = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  useImperativeHandle(ref, () => ({
    jumpToPage: (targetPage: number) => {
      setNonce(Date.now());
    },
  }));

  const safeUrl = url || "/materials/UU-No-1-Tahun-1970.pdf";

  if (!isMounted) return <div className="w-full h-full flex items-center justify-center text-xs font-mono text-gray-400 bg-white">Loading PDF...</div>;

  return (
    <iframe
      key={`${safeUrl}-${page}-${nonce}`}
      src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(safeUrl)}#page=${page}&zoom=page-width`}
      className="w-full h-full border-0 bg-white shadow-inner rounded-xl"
      title="Mozilla PDF.js Viewer"
      allow="fullscreen"
    />
  );
});

export default PdfViewer;
