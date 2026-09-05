async function compressImageToDataUrl(file, options = {}) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("imageType");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("imageSize");
  const maxDim = options.maxDimension || 1280;
  const quality = options.quality || 0.82;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round(height * maxDim / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round(width * maxDim / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("imageProcess"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length > 3 * 1024 * 1024) {
          reject(new Error("imageSize"));
          return;
        }
        resolve(dataUrl);
      };
      img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
  });
}
async function uploadFreeImage(file, fallbackDataUrl) {
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (cloudinaryCloudName && cloudinaryPreset) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", cloudinaryPreset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.secure_url || data.url;
      }
    } catch (err) {
      console.warn("Cloudinary upload failed, using compressed local data URL:", err);
    }
  }
  if (fallbackDataUrl) {
    return fallbackDataUrl;
  }
  return compressImageToDataUrl(file);
}
export {
  compressImageToDataUrl,
  uploadFreeImage
};
