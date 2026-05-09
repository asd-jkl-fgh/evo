'use client';

import { useRef, useState, useEffect } from 'react';

interface SignatureCanvasProps {
  signatureValue: string | null;
  signatureDateValue: string | null;
  onSignatureChange: (value: string) => void;
  onSignatureDateChange: (value: string) => void;
}

export function SignatureCanvas({ 
  signatureValue, 
  signatureDateValue,
  onSignatureChange, 
  onSignatureDateChange 
}: SignatureCanvasProps) {
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const signatureDateRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [isDrawingDate, setIsDrawingDate] = useState(false);

  // 初始化签名画布
  useEffect(() => {
    const canvas = signatureRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (signatureValue) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = signatureValue;
    }
  }, [signatureValue]);

  // 初始化日期画布
  useEffect(() => {
    const canvas = signatureDateRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (signatureDateValue) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = signatureDateValue;
    }
  }, [signatureDateValue]);

  const getPosition = (canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // 签名画布操作
  const startSignature = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPosition(canvas, e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawingSig(true);
  };

  const drawSignature = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingSig) return;
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPosition(canvas, e.nativeEvent);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endSignature = () => {
    if (isDrawingSig && signatureRef.current) {
      setIsDrawingSig(false);
      onSignatureChange(signatureRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange('');
  };

  // 日期画布操作
  const startDate = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = signatureDateRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPosition(canvas, e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawingDate(true);
  };

  const drawDate = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingDate) return;
    const canvas = signatureDateRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPosition(canvas, e.nativeEvent);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDate = () => {
    if (isDrawingDate && signatureDateRef.current) {
      setIsDrawingDate(false);
      onSignatureDateChange(signatureDateRef.current.toDataURL('image/png'));
    }
  };

  const clearDate = () => {
    const canvas = signatureDateRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureDateChange('');
  };

  return (
    <div className="space-y-4">
      {/* 签名区域 */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">签名</label>
          <button
            type="button"
            onClick={clearSignature}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            清除
          </button>
        </div>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={signatureRef}
            width={500}
            height={80}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startSignature}
            onMouseMove={drawSignature}
            onMouseUp={endSignature}
            onMouseLeave={endSignature}
            onTouchStart={startSignature}
            onTouchMove={drawSignature}
            onTouchEnd={endSignature}
          />
        </div>
      </div>

      {/* 日期区域 */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">日期</label>
          <button
            type="button"
            onClick={clearDate}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            清除
          </button>
        </div>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={signatureDateRef}
            width={500}
            height={60}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startDate}
            onMouseMove={drawDate}
            onMouseUp={endDate}
            onMouseLeave={endDate}
            onTouchStart={startDate}
            onTouchMove={drawDate}
            onTouchEnd={endDate}
          />
        </div>
      </div>

      {/* 验证提示 */}
      {(!signatureValue || !signatureDateValue) && (
        <p className="text-sm text-red-500">
          请完成签名和日期填写
        </p>
      )}
    </div>
  );
}
