import React from 'react';
import { UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SignatureUploader = ({ signature, setSignature, label = "Upload Signature", inline = false }) => {

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Check size < 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignature(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className={inline ? "w-full max-w-[200px]" : "w-full"}>
      {!inline && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      
      {!signature ? (
        <div 
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={inline 
            ? "border border-dashed border-slate-300 rounded p-2 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative h-20"
            : "border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative"
          }
        >
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className={inline ? "w-5 h-5 text-slate-400 mb-1" : "w-8 h-8 text-slate-400 mb-2"} />
          <p className={inline ? "text-xs font-medium text-slate-500 text-center" : "text-sm font-medium text-slate-600"}>
            {inline ? "Click or Drag Signature" : "Drag & drop signature here"}
          </p>
          {!inline && <p className="text-xs text-slate-400 mt-1">or click to browse (Max: 2MB)</p>}
        </div>
      ) : (
        <div className={`relative group ${inline ? "inline-block" : "border border-slate-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center"}`}>
          <img src={signature} alt="Signature" className={`${inline ? "h-16" : "max-h-24"} object-contain mix-blend-multiply`} />
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); setSignature(''); }}
            className={`absolute ${inline ? "-top-2 -right-2" : "top-2 right-2"} p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm`}
            title="Remove Signature"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SignatureUploader;
