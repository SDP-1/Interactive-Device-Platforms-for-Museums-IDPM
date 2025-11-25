import React, { useState } from "react";
import { Artifact } from "@/types/Artifact";

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

  if (artifacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No artifacts found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artifacts.map((artifact) => (
        <div
          key={artifact._id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200"
        >
          {artifact.imageUrls && artifact.imageUrls.length > 0 && (
            <ImageGallery
              images={artifact.imageUrls}
              title={getText(artifact.title_en, artifact.title_si)}
            />
          )}
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2">
              {getText(artifact.title_en, artifact.title_si)}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              <strong>Origin:</strong>{" "}
              {getText(artifact.origin_en, artifact.origin_si)}
            </p>
            <p className="text-gray-600 text-sm mb-2">
              <strong>Year:</strong> {artifact.year}
            </p>
            <p className="text-gray-600 text-sm mb-2">
              <strong>Category:</strong>{" "}
              {getText(artifact.category_en, artifact.category_si)}
            </p>
            <p className="text-gray-700 text-sm mb-4 line-clamp-2">
              {getText(artifact.description_en, artifact.description_si)}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(artifact)}
                className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600 transition"
              >
                Edit
              </button>
              <button
                onClick={() => artifact._id && onDelete(artifact._id)}
                disabled={isDeleting === artifact._id}
                className="flex-1 bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 disabled:bg-gray-400 transition"
              >
                {isDeleting === artifact._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
