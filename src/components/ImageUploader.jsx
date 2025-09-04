import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

function ImageUploader({ onImageSelected, selectedImage, variant = 'default' }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelected(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelected(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeImage = () => {
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (variant === 'preview' && selectedImage) {
    return (
      <div className="relative group">
        <img
          src={selectedImage}
          alt="Selected product"
          className="w-full h-48 object-cover rounded-lg"
        />
        <button
          onClick={removeImage}
          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full
                   opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedImage ? (
        <div className="relative">
          <img
            src={selectedImage}
            alt="Selected product"
            className="w-full h-64 object-cover rounded-lg border-2 border-white/20"
          />
          <button
            onClick={removeImage}
            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full
                     hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center
                   hover:border-accent transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Upload Product Image
          </h3>
          <p className="text-white/70 mb-4">
            Drag and drop your image here, or click to browse
          </p>
          <p className="text-sm text-white/50">
            Supports: JPG, PNG, GIF (max 10MB)
          </p>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default ImageUploader;