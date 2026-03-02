import React, { useState } from "react";
import { King } from "../types/King";

interface KingListProps {
  kings: King[];
  language: "en" | "si";
  onEdit: (king: King) => void;
  onDelete: (id: string) => void;
  isDeleting?: string;
}

const ImageGallery: React.FC<{ images: string[]; title: string }> = ({
  images,
  title,
}) => {
  const [index, setIndex] = useState(0);
  if (!images || images.length === 0) return null;
  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  return (
    <div className="relative w-full h-48 bg-gray-200">
      <img
        src={images[index]}
        alt={`${title} ${index + 1}`}
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded"
          >
            &#10094;
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded"
          >
            &#10095;
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

export const KingList: React.FC<KingListProps> = ({
  kings,
  language,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const getText = (en: string, si: string) => (language === "en" ? en : si);
  const sortedKings = [...kings].sort((a, b) => {
    const aId = String(a.king_id || a._id || "");
    const bId = String(b.king_id || b._id || "");
    return aId.localeCompare(bId, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  if (!kings || kings.length === 0)
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No kings found</p>
      </div>
    );

  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-6">
      {sortedKings.map((king) => (
        <div
          key={king._id}
          className="w-full h-full max-w-[420px] justify-self-center bg-white rounded-2xl shadow-sm overflow-hidden transition duration-200 border border-transparent hover:shadow-md flex flex-col"
        >
          {king.imageUrls && king.imageUrls.length > 0 && (
            <div className="bg-white p-6">
              <ImageGallery
                images={king.imageUrls}
                title={getText(king.name_en, king.name_si)}
              />
            </div>
          )}
          <div className="p-6 flex flex-col flex-1">
            <h3 className="text-2xl font-serif font-semibold mb-2 text-gray-800">
              {getText(king.name_en, king.name_si)}
            </h3>

            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>
                <span className="font-semibold text-gray-700">ID:</span>{" "}
                {king.king_id || king._id}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Capital:</span>{" "}
                {getText(king.capital_en || "", king.capital_si || "") || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Period:</span>{" "}
                {getText(king.period_en || "", king.period_si || "") || "-"}
              </p>
            </div>

            <div className="flex gap-3 items-center mt-auto">
              <button
                onClick={() => king._id && onDelete(king._id)}
                disabled={isDeleting === king._id}
                className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-60 transition"
              >
                {isDeleting === king._id ? "..." : "🗑"}
              </button>

              <button
                onClick={() => onEdit(king)}
                className="flex-1 border-2 border-amber-400 text-amber-600 py-3 rounded-xl font-medium hover:bg-amber-50 transition flex items-center justify-center gap-2"
              >
                View Details
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
