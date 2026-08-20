import React, { useState, useEffect } from 'react';
import { Calendar, X, Sparkles } from 'lucide-react';
import { Santri, Lembaga } from '../../types';
import { formatTanggalMasukDMY } from '../../lib/nismHelper';

interface NismGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetSantri?: Santri | null;
  students: Santri[];
  selectedLembaga?: Lembaga | null;
  onConfirm: (payload: {
    tanggalMasukDMY: string;
    applyDateToAll: boolean;
    overwriteExisting: boolean;
    targetSantri?: Santri | null;
  }) => void;
}

export const NismGenerateDialog: React.FC<NismGenerateDialogProps> = ({
  isOpen,
  onClose,
  targetSantri,
  students,
  selectedLembaga,
  onConfirm
}) => {
  const isSingle = Boolean(targetSantri);
  const [tanggalMasukInput, setTanggalMasukInput] = useState<string>('');
  const [applyDateToAll, setApplyDateToAll] = useState<boolean>(true);
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (targetSantri) {
        const existing = formatTanggalMasukDMY(targetSantri.tanggalMasukLembaga || targetSantri.tahunMasukLembaga);
        setTanggalMasukInput(existing || '15/07/2024');
      } else {
        const yr = new Date().getFullYear();
        setTanggalMasukInput(`15/07/${yr}`);
      }
      setApplyDateToAll(true);
      setOverwriteExisting(false);
    }
  }, [isOpen, targetSantri]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      tanggalMasukDMY: tanggalMasukInput.trim(),
      applyDateToAll,
      overwriteExisting,
      targetSantri: targetSantri || null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight text-white">
              {isSingle ? 'Tanggal Masuk Lembaga' : 'Tanggal Masuk Lembaga (Masal)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Minimalist Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Tanggal Masuk Lembaga (dd/mm/yyyy)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="dd/mm/yyyy (contoh: 15/07/2024)"
                value={tanggalMasukInput}
                onChange={(e) => setTanggalMasukInput(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
              />
            </div>
            <span className="text-3xs text-slate-400">
              Format: tanggal/bulan/tahun (contoh: 15/07/2024)
            </span>
          </div>

          {!isSingle && (
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyDateToAll}
                  onChange={(e) => setApplyDateToAll(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Terapkan ke semua santri di lembaga ini
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Perbarui juga santri yang sudah ada NISM
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate NISM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
