'use client';

import React, { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface DeleteConfirmModalProps {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  title,
  description,
  confirmLabel = 'Hapus Permanen',
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      setError('');
      await onConfirm();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Gagal menghapus data. Silakan coba lagi.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && onCancel()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7">

        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <FiAlertTriangle className="text-red-500" size={28} />
          </div>
        </div>

        <div className="text-center text-lg font-semibold text-gray-900 mb-2">{title}</div>
        <div className="text-center text-sm text-gray-600 mb-6">{description}</div>

        {error && <div className="text-center text-sm text-red-600 mb-4">{error}</div>}

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="w-full cursor-pointer px-4 py-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium transition-colors"
          >
            {deleting ? 'Menghapus...' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="w-full cursor-pointer px-4 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium transition-colors"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}