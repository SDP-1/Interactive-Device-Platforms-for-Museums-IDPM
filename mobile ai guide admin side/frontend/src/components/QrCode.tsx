import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  text: string;
  size?: number;
}

const QrCode: React.FC<Props> = ({ text, size = 160 }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(text, { width: size })
      .then((url: string) => {
        if (mounted) setDataUrl(url);
      })
      .catch((error: Error) => {
        if (mounted) setDataUrl(null);
      });
    return () => {
      mounted = false;
    };
  }, [text, size]);

  if (!dataUrl)
    return <div className="text-sm text-gray-500">Generating QR...</div>;
  return (
    <img src={dataUrl} alt={`QR for ${text}`} width={size} height={size} />
  );
};

export default QrCode;
