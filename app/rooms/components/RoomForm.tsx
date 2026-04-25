"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, X, Upload } from "lucide-react";

export interface RoomFormData {
  roomID?: string; // Made optional since it's auto-generated for new rooms
  roomNumber: string;
  roomType: string;
  description: string;
  price: number | string;
  floor: number | string;
  roomSize: number | string;
  bed: number | string;
  person: number | string;
  bathroom: number | string;
  isPetAllowed: boolean;
  isBalcony: boolean;
  roomStatus?: string; // Added roomStatus
  images?: string[];
}

interface RoomFormProps {
  initialData?: RoomFormData;
  onSubmit: (data: FormData) => Promise<void>; // Changed to accept FormData
}

export default function RoomForm({ initialData, onSubmit }: RoomFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [formData, setFormData] = useState({
    roomNumber: initialData?.roomNumber || "",
    roomType: initialData?.roomType || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    floor: initialData?.floor || "",
    roomSize: initialData?.roomSize || "",
    bed: initialData?.bed || "",
    person: initialData?.person || "",
    bathroom: initialData?.bathroom || "",
    isPetAllowed: initialData?.isPetAllowed || false,
    isBalcony: initialData?.isBalcony || false,
    roomStatus: initialData?.roomStatus || "available",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    // Basic validation
    const requiredFields = ["roomNumber", "roomType", "price", "floor", "roomSize", "bed", "person", "bathroom", "description"];
    const isMissing = requiredFields.some(field => !formData[field as keyof typeof formData]);
    if (isMissing) {
      alert("Please Fill all the required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitFormData = new FormData();

      // Append all form fields from the component state
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          submitFormData.append(key, String(value));
        }
      });

      // Handle images
      const newImages = images.filter(img => img.startsWith('data:'));
      const existingImages = images.filter(img => img.startsWith('/uploads/'));

      // Always send existing images - even if empty array
      submitFormData.append('existingImages', JSON.stringify(existingImages));

      // Convert and append new images
      for (let i = 0; i < newImages.length; i++) {
        const image = newImages[i];
        const response = await fetch(image);
        const blob = await response.blob();
        const file = new File([blob], `image-${Date.now()}-${i}.jpg`, { type: 'image/jpeg' });
        submitFormData.append('images', file);
      }

      const url = initialData
        ? `/api/rooms/${initialData.roomID}`
        : '/api/rooms';

      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: submitFormData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to save room');
      }

      router.push('/rooms');
      router.refresh();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save room");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto text-black">


      <div className="bg-white rounded-lg shadow-lg p-6">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Number */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.roomNumber ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Room Number <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.roomNumber ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="e.g., 101"
            />
          </div>

          {/* Room Type */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.roomType ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Room Type <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <select
              name="roomType"
              value={formData.roomType}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.roomType ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            >
              <option value="">Select type</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Family">Family</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.price ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Price per Night (MMK) <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="price"
              min="0"
              step="1"
              value={formData.price}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.price ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="0"
            />
          </div>

          {/* Floor */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.floor ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Floor <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="floor"
              min="1"
              value={formData.floor}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.floor ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="1"
            />
          </div>

          {/* Room Size */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.roomSize ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Room Size (m²) <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="roomSize"
              min="1"
              value={formData.roomSize}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.roomSize ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="25"
            />
          </div>

          {/* Bed */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.bed ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Number of Beds <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="bed"
              min="1"
              value={formData.bed}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.bed ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="1"
            />
          </div>

          {/* Person */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.person ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Maximum Guests <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="person"
              min="1"
              value={formData.person}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.person ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="2"
            />
          </div>

          {/* Bathroom */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.bathroom ? "text-red-500" : "text-gray-500 text-sm"}`}>
              Number of Bathrooms <span className="text-[10px] font-normal opacity-70">(required)</span>
            </label>
            <input
              type="number"
              name="bathroom"
              min="1"
              value={formData.bathroom}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.bathroom ? "border-red-500 bg-red-50" : "border-gray-200"}`}
              placeholder="1"
            />
          </div>

          {/* Room Status - Only show for editing */}
          {initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Status
              </label>
              <select
                name="roomStatus"
                value={formData.roomStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
          )}

          {/* Pet Allowed */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPetAllowed"
              id="isPetAllowed"
              checked={formData.isPetAllowed}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPetAllowed" className="ml-2 block text-sm text-gray-700">
              Pets Allowed
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isBalcony"
              id="isBalcony"
              checked={formData.isBalcony}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isBalcony" className="ml-2 block text-sm text-gray-700">
              Blcony Contain
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <label className={`block font-bold uppercase tracking-wider mb-2 ${attemptedSubmit && !formData.description ? "text-red-500" : "text-gray-500 text-sm"}`}>
            Description <span className="text-[10px] font-normal opacity-70">(required)</span>
          </label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-black ${attemptedSubmit && !formData.description ? "border-red-500 bg-red-50" : "border-gray-200"}`}
            placeholder="Describe the room, amenities, etc."
          />
        </div>

        {/* Image Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Images
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center justify-center py-4"
            >
              <Upload className="text-gray-400 mb-2" size={24} />
              <span className="text-sm text-gray-600">Click to upload images</span>
            </label>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative h-24 bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`Room image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all"
          >
            {loading ? "Saving..." : initialData ? "Update Room" : "Create Room"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}