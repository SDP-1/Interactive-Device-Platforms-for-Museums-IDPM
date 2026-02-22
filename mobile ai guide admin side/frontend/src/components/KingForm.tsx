import React, { useState } from "react";
import { King } from "../types/King";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface KingFormProps {
  king?: King;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const KingForm: React.FC<KingFormProps> = ({
  king,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<any>({
    name_en: king?.name_en || "",
    name_si: king?.name_si || "",
    capital_en: king?.capital_en || "",
    capital_si: king?.capital_si || "",
    biography_en: king?.biography_en || "",
    biography_si: king?.biography_si || "",
    aiKnowlageBase_en: king?.aiKnowlageBase_en || "",
    aiKnowlageBase_si: king?.aiKnowlageBase_si || "",
    imageUrls: king?.imageUrls?.join(",") || "",
  });

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (value: string, fieldName: string) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: value }));
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure biographies are not empty (Quill may return HTML)
    if (
      !formData.biography_en ||
      stripHtml(formData.biography_en).trim() === ""
    ) {
      alert("Biography (English) is required");
      return;
    }
    if (
      !formData.biography_si ||
      stripHtml(formData.biography_si).trim() === ""
    ) {
      alert("Biography (Sinhala) is required");
      return;
    }

    // Ensure AI knowledge base fields are not empty
    if (
      !formData.aiKnowlageBase_en ||
      stripHtml(formData.aiKnowlageBase_en).trim() === ""
    ) {
      alert("AI Knowledge Base (English) is required");
      return;
    }
    if (
      !formData.aiKnowlageBase_si ||
      stripHtml(formData.aiKnowlageBase_si).trim() === ""
    ) {
      alert("AI Knowledge Base (Sinhala) is required");
      return;
    }

    const submitData = {
      ...formData,
      imageUrls: formData.imageUrls
        ? formData.imageUrls
            .split(",")
            .map((url: string) => url.trim())
            .filter((url: string) => url)
        : [],
    };
    onSubmit(submitData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name (English) <span className="text-red-600">*</span>
          </label>
          <input
            name="name_en"
            value={formData.name_en}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name (Sinhala) <span className="text-red-600">*</span>
          </label>
          <input
            name="name_si"
            value={formData.name_si}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Capital (English)
          </label>
          <input
            name="capital_en"
            value={formData.capital_en}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Capital (Sinhala)
          </label>
          <input
            name="capital_si"
            value={formData.capital_si}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biography (English) <span className="text-red-600">*</span>
        </label>
        <ReactQuill
          theme="snow"
          value={formData.biography_en}
          onChange={(v) => handleRichTextChange(v, "biography_en")}
          modules={modules}
          formats={formats}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biography (Sinhala) <span className="text-red-600">*</span>
        </label>
        <ReactQuill
          theme="snow"
          value={formData.biography_si}
          onChange={(v) => handleRichTextChange(v, "biography_si")}
          modules={modules}
          formats={formats}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Knowledge Base (English) <span className="text-red-600">*</span>
        </label>
        <ReactQuill
          theme="snow"
          value={formData.aiKnowlageBase_en}
          onChange={(v) => handleRichTextChange(v, "aiKnowlageBase_en")}
          modules={modules}
          formats={formats}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Knowledge Base (Sinhala) <span className="text-red-600">*</span>
        </label>
        <ReactQuill
          theme="snow"
          value={formData.aiKnowlageBase_si}
          onChange={(v) => handleRichTextChange(v, "aiKnowlageBase_si")}
          modules={modules}
          formats={formats}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Image URLs (comma-separated)
        </label>
        <textarea
          name="imageUrls"
          value={formData.imageUrls}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? "Saving..." : king ? "Update King" : "Create King"}
      </button>
    </form>
  );
};
