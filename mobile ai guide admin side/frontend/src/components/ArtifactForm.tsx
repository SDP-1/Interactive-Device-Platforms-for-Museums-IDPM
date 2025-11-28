import React, { useState } from "react";
import { Artifact } from "@/types/Artifact";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface ArtifactFormProps {
  artifact?: Artifact;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const ArtifactForm: React.FC<ArtifactFormProps> = ({
  artifact,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<any>({
    title_en: artifact?.title_en || "",
    title_si: artifact?.title_si || "",
    origin_en: artifact?.origin_en || "",
    origin_si: artifact?.origin_si || "",
    year: artifact?.year || "",
    category_en: artifact?.category_en || "",
    category_si: artifact?.category_si || "",
    description_en: artifact?.description_en || "",
    description_si: artifact?.description_si || "",
    material_en: artifact?.material_en || "",
    material_si: artifact?.material_si || "",
    dimensions_en: artifact?.dimensions_en || "",
    dimensions_si: artifact?.dimensions_si || "",
    culturalSignificance_en: artifact?.culturalSignificance_en || "",
    culturalSignificance_si: artifact?.culturalSignificance_si || "",
    gallery_en: artifact?.gallery_en || "",
    gallery_si: artifact?.gallery_si || "",
    imageUrls: artifact?.imageUrls?.join(",") || "",
  });

  // Quill modules configuration for rich text editor
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link'
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (value: string, fieldName: string) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      imageUrls: formData.imageUrls
        .split(",")
        .map((url: string) => url.trim())
        .filter((url: string) => url),
    };
    onSubmit(submitData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title (English) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="title_en"
            value={formData.title_en}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title (Sinhala) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="title_si"
            value={formData.title_si}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Origin (English) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="origin_en"
            value={formData.origin_en}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Origin (Sinhala) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="origin_si"
            value={formData.origin_si}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Year <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Category in same row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category (English) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="category_en"
            value={formData.category_en}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category (Sinhala) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="category_si"
            value={formData.category_si}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Material (English)
          </label>
          <input
            type="text"
            name="material_en"
            value={formData.material_en}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Material (Sinhala)
          </label>
          <input
            type="text"
            name="material_si"
            value={formData.material_si}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dimensions (English)
          </label>
          <input
            type="text"
            name="dimensions_en"
            value={formData.dimensions_en}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dimensions (Sinhala)
          </label>
          <input
            type="text"
            name="dimensions_si"
            value={formData.dimensions_si}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Gallery (English)
          </label>
          <input
            type="text"
            name="gallery_en"
            value={formData.gallery_en}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Gallery (Sinhala)
          </label>
          <input
            type="text"
            name="gallery_si"
            value={formData.gallery_si}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Rich text editor for descriptions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (English) <span className="text-red-600">*</span>
        </label>
        <ReactQuill
          theme="snow"
          value={formData.description_en}
          onChange={(value) => handleRichTextChange(value, 'description_en')}
          modules={modules}
          formats={formats}
          className="bg-white"
          placeholder="Enter description with formatting..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Sinhala) <span className="text-red-600">*</span>
        </label>
        <ReactQuill
          theme="snow"
          value={formData.description_si}
          onChange={(value) => handleRichTextChange(value, 'description_si')}
          modules={modules}
          formats={formats}
          className="bg-white"
          placeholder="සවිස්තරය ආකෘතිකරණය සමඟ ඇතුළත් කරන්න..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cultural Significance (English)
        </label>
        <ReactQuill
          theme="snow"
          value={formData.culturalSignificance_en}
          onChange={(value) => handleRichTextChange(value, 'culturalSignificance_en')}
          modules={modules}
          formats={formats}
          className="bg-white"
          placeholder="Enter cultural significance with formatting..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cultural Significance (Sinhala)
        </label>
        <ReactQuill
          theme="snow"
          value={formData.culturalSignificance_si}
          onChange={(value) => handleRichTextChange(value, 'culturalSignificance_si')}
          modules={modules}
          formats={formats}
          className="bg-white"
          placeholder="සංස්කෘතික වැදගත්කම ආකෘතිකරණය සමඟ ඇතුළත් කරන්න..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Image URLs (comma-separated) <span className="text-red-600">*</span>
        </label>
        <textarea
          name="imageUrls"
          value={formData.imageUrls}
          onChange={handleChange}
          required
          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
          rows={2}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
      >
        {isLoading
          ? "Saving..."
          : artifact
          ? "Update Artifact"
          : "Create Artifact"}
      </button>
    </form>
  );
};
