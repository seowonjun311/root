import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, X, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FocusLock from 'react-focus-lock';

export default function PhotoConfirmModal({ actionGoal, gpsData, onSave, onSkip }) {
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

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
    onSave(uploadedUrl, gpsData);
  };

  return (
    <AnimatePresence>
      <FocusLock>
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-modal-title"
        >
          <motion.div
            className="w-full max-w-lg bg-background rounded-t-3xl p-6 pb-28"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p id="photo-modal-title" className="font-bold text-base text-amber-900">🦊 오늘도 해냈네요, 용사님!</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                이 순간을 사진으로 남길 수 있어요.
              </p>
            </div>
            <button onClick={onSkip} className="p-2 rounded-full hover:bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Photo preview or GPS map */}
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
          ) : gpsData?.gpsEnabled && gpsData?.coords?.length > 0 ? (
            <div className="mb-4 rounded-2xl overflow-hidden aspect-video bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
              <SimpleMap coords={gpsData.coords} />
            </div>
          ) : (
            <div className="flex gap-3 mb-4">
              <label className="flex-1 aspect-square rounded-2xl border-2 border-dashed border-amber-300/70 bg-amber-50/40 flex flex-col items-center justify-center gap-2 hover:bg-amber-50/80 transition-colors cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <Image className="w-7 h-7 text-amber-500" />
                <span className="text-xs text-amber-700 font-semibold">갤러리</span>
              </label>
              <label className="flex-1 aspect-square rounded-2xl border-2 border-dashed border-amber-300/70 bg-amber-50/40 flex flex-col items-center justify-center gap-2 hover:bg-amber-50/80 transition-colors cursor-pointer">
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                <Camera className="w-7 h-7 text-amber-500" />
                <span className="text-xs text-amber-700 font-semibold">카메라</span>
              </label>
            </div>
          )}

          {/* Info text */}
          {gpsData?.gpsEnabled && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <MapPin className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-700 font-semibold">
                거리: {gpsData.distance?.toFixed(2) || '0'}km
              </p>
            </div>
          )}

          <div className="flex gap-3">
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
                  저장
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
      </FocusLock>
    </AnimatePresence>
  );
}

function SimpleMap({ coords }) {
  if (!coords || coords.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <MapPin className="w-6 h-6 text-blue-600" />
        <p className="text-xs text-blue-600 font-semibold">경로 지도</p>
      </div>
    );
  }

  // 좌표의 범위 계산
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  // SVG 좌표 변환
  const toSvgX = (lng) => ((lng - minLng) / lngRange) * 100;
  const toSvgY = (lat) => 100 - ((lat - minLat) / latRange) * 100;

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      {/* 배경 */}
      <rect width="100" height="100" fill="#e0f2fe" />
      
      {/* 경로 선 */}
      <polyline
        points={coords.map((c) => `${toSvgX(c[1])},${toSvgY(c[0])}`).join(' ')}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* 시작점 */}
      <circle cx={toSvgX(coords[0][1])} cy={toSvgY(coords[0][0])} r="2" fill="#10b981" />
      
      {/* 끝점 */}
      <circle cx={toSvgX(coords[coords.length - 1][1])} cy={toSvgY(coords[coords.length - 1][0])} r="2" fill="#ef4444" />
    </svg>
  );
}