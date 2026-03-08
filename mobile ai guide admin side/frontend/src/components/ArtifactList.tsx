import React, { useState } from "react";
import { Artifact } from "../types/Artifact";

interface ArtifactListProps {
  artifacts: Artifact[];
  language: "en" | "si";
  onEdit: (artifact: Artifact) => void;
  onDelete: (id: string) => void;
  isDeleting?: string;
}

interface ImageGalleryProps {
  images: string[];
  title: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (images.length === 0) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-48 bg-gray-200">
      <img
        src={images[currentImageIndex]}
        alt={`${title} - Image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75 transition"
          >
            &#10094;
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-75 transition"
          >
            &#10095;
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

export const ArtifactList: React.FC<ArtifactListProps> = ({
  artifacts,
  language,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const getText = (en: string, si: string) => (language === "en" ? en : si);
  const sortedArtifacts = [...artifacts].sort((a, b) => {
    const aId = String(a.artifact_id || a._id || "");
    const bId = String(b.artifact_id || b._id || "");
    return aId.localeCompare(bId, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  if (artifacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No artifacts found</p>
      </div>
    );
  }

  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-6">
      {sortedArtifacts.map((artifact) => (
        <div
          key={artifact._id}
          className="w-full h-full max-w-[420px] justify-self-center bg-white rounded-2xl shadow-sm overflow-hidden transition duration-200 border border-transparent hover:shadow-md flex flex-col"
        >
          {artifact.imageUrls && artifact.imageUrls.length > 0 && (
            <div className="bg-white p-6">
              <ImageGallery
                images={artifact.imageUrls}
                title={getText(artifact.title_en, artifact.title_si)}
              />
            </div>
          )}
          <div className="p-6 flex flex-col flex-1">
            <h3 className="text-2xl font-serif font-semibold mb-2 text-gray-800">
              {getText(artifact.title_en, artifact.title_si)}
            </h3>

            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>
                <span className="font-semibold text-gray-700">ID:</span>{" "}
                {artifact.artifact_id || artifact._id}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Origin:</span>{" "}
                {getText(artifact.origin_en, artifact.origin_si) || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Year:</span>{" "}
                {artifact.year || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Category:</span>{" "}
                {getText(artifact.category_en, artifact.category_si) || "-"}
              </p>
            </div>

            <div className="flex gap-3 items-center mt-auto">
              <button
                onClick={() => artifact._id && onDelete(artifact._id)}
                disabled={isDeleting === artifact._id}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-60 transition"
              >
                {isDeleting === artifact._id ? "..." : "Delete"}
              </button>

              <button
                onClick={() => onEdit(artifact)}
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
