import React from "react";

interface ModalProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  maxWidthClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  isOpen,
  onClose,
  children,
  maxWidthClassName = "max-w-3xl",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-3 sm:p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <div
          className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${maxWidthClassName} w-full mx-1 sm:mx-2 max-h-[92vh] flex flex-col`}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b bg-white/95 rounded-t-2xl sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 w-8 h-8 rounded-md hover:bg-gray-100 transition"
            >
              ✕
            </button>
          </div>
          <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
