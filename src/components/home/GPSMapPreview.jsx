export default function GPSMapPreview({ coords }) {
  if (!coords || coords.length < 2) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-blue-600">경로 데이터 없음</p>
      </div>
    );
  }

  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const toSvgX = (lng) => ((lng - minLng) / lngRange) * 100;
  const toSvgY = (lat) => 100 - ((lat - minLat) / latRange) * 100;

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <rect width="100" height="100" fill="#e0f2fe" />
      <polyline
        points={coords.map((c) => `${toSvgX(c[1])},${toSvgY(c[0])}`).join(' ')}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={toSvgX(coords[0][1])} cy={toSvgY(coords[0][0])} r="1.5" fill="#10b981" />
      <circle cx={toSvgX(coords[coords.length - 1][1])} cy={toSvgY(coords[coords.length - 1][0])} r="1.5" fill="#ef4444" />
    </svg>
  );
}