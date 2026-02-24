import React, { useState } from "react";
import { King } from "@/types/King";

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

  if (!kings || kings.length === 0)
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No kings found</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kings.map((king) => (
        <div
          key={king._id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
        >
          {king.imageUrls && king.imageUrls.length > 0 && (
            <ImageGallery
              images={king.imageUrls}
              title={getText(king.name_en, king.name_si)}
            />
          )}
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2">
              {getText(king.name_en, king.name_si)}
            </h3>
            {(king.capital_en || king.capital_si) && (
              <p className="text-gray-600 text-sm mb-2">
                <strong>Capital:</strong>{" "}
                {getText(king.capital_en || "", king.capital_si || "")}
              </p>
            )}
            {(king.period_en || king.period_si) && (
              <p className="text-gray-600 text-sm mb-2">
                <strong>Period:</strong>{" "}
                {getText(king.period_en || "", king.period_si || "")}
              </p>
            )}
            <p
              className="text-gray-700 text-sm mb-4 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: getText(
                  king.biography_en || "",
                  king.biography_si || "",
                ),
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(king)}
                className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => king._id && onDelete(king._id)}
                disabled={isDeleting === king._id}
                className="flex-1 bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 disabled:bg-gray-400"
              >
                {isDeleting === king._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
