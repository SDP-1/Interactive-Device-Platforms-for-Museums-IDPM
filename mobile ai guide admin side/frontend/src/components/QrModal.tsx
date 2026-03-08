import React from "react";
import Modal from "./Modal";
import QrCode from "./QrCode";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  text?: string | null;
}

const QrModal: React.FC<Props> = ({ isOpen, onClose, text }) => {
  return (
    <Modal title="Session QR" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-3">
        {text ? (
          <div className="flex items-center gap-4">
            <QrCode text={text} size={200} />
            <div className="text-sm">
              Session id:
              <div className="font-mono">{text}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No session id</div>
        )}
      </div>
    </Modal>
  );
};

export default QrModal;
