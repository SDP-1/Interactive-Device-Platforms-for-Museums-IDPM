import React, { useState, useRef } from "react";
import { FeaturedExhibit } from "../types/FeaturedExhibit";

interface Props {
  exhibit: FeaturedExhibit;
  language?: "en" | "si";
  onReorder?: (newOrder: string[]) => void;
}

export const FeaturedExhibitList: React.FC<Props> = ({
  exhibit,
  language = "en",
  onReorder,
}) => {
  const [items, setItems] = useState<any[]>(exhibit.artifacts || []);
  const dragIndex = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === undefined) return;
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(dropIndex, 0, moved);
    setItems(updated);
    dragIndex.current = null;
    if (onReorder) onReorder(updated.map((a) => (a._id ? a._id : a)));
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-2">
        {exhibit.name} — {exhibit.estimated_visit_minutes || 0} mins
      </h3>
      <ul>
        {items.map((artifact, idx) => {
          const id = artifact && (artifact._id || artifact);
          const title =
            (artifact &&
              (artifact.title_en || artifact.title_si || artifact.title)) ||
            "Untitled";
          const thumb =
            artifact && artifact.imageUrls && artifact.imageUrls[0]
              ? artifact.imageUrls[0]
              : null;
          return (
            <li
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className="flex items-center gap-3 p-2 border-b last:border-b-0 hover:bg-gray-50 cursor-grab"
            >
              <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                {idx + 1}
              </span>
              {thumb ? (
                <img
                  src={thumb}
                  alt={title}
                  className="w-12 h-8 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-8 bg-gray-100 rounded" />
              )}
              <a className="text-blue-600 truncate" href={`/artifacts/${id}`}>
                {title}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-gray-500 mt-2">
        Drag items to reorder the exhibit.
      </p>
    </div>
  );
};

export default FeaturedExhibitList;
