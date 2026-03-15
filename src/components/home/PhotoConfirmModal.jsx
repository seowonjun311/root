import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PhotoConfirmModal({ actionGoal, onSave, onSkip }) {
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    let uploadedUrl = null;
    if (photo) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file: photo });
      uploadedUrl = res.file_url;
      setUploading(false);
    }
    onSave(uploadedUrl);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg bg-background rounded-t-3xl p-6 pb-10"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-bold text-base text-amber-900">🦊 오늘도 해냈네요, 용사님!</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                이 순간을 사진으로 남길 수 있어요.
              </p>
            </div>
            <button onClick={onSkip} className="p-2 rounded-full hover:bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Photo preview */}
          {photoUrl ? (
            <div className="relative mb-4 rounded-2xl overflow-hidden aspect-video bg-secondary">
              <img src={photoUrl} alt="수련 사진" className="w-full h-full object-cover" />
              <button
                onClick={() => { setPhoto(null); setPhotoUrl(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-amber-300/70 bg-amber-50/40 flex flex-col items-center justify-center gap-2 mb-4 hover:bg-amber-50/80 transition-colors"
            >
              <Camera className="w-8 h-8 text-amber-400" />
              <span className="text-sm text-amber-600 font-medium">사진 촬영 또는 선택</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1 h-12 rounded-xl font-semibold"
            >
              기록만 저장
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploading}
              className="flex-1 h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-amber-200/50 border-t-amber-50 rounded-full animate-spin" />
                  업로드 중...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {photo ? '사진과 함께 저장' : '저장'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}