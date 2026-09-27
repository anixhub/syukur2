import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Receipt, 
  SlidersHorizontal, 
  Layers, 
  Calendar,
  Users,
  Building2,
  Tag
} from 'lucide-react';
import { SantriPaymentItem } from './pembayaranTypes';

interface ManagePaymentItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentItems: SantriPaymentItem[];
  onAddNew: () => void;
  onEditItem: (item: SantriPaymentItem) => void;
  onDeleteItem: (item: SantriPaymentItem) => void;
}

export default function ManagePaymentItemsModal({
  isOpen,
  onClose,
  paymentItems,
  onAddNew,
  onEditItem,
  onDeleteItem,
}: ManagePaymentItemsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');

  const filteredItems = useMemo(() => {
    return paymentItems.filter((item) => {
      const matchSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchGender = genderFilter === 'Semua' || 
                          !item.targetGender || 
                          item.targetGender === 'Semua' || 
                          item.targetGender === genderFilter;

      const matchCat = categoryFilter === 'Semua' || item.category === categoryFilter;

      return matchSearch && matchGender && matchCat;
    });
  }, [paymentItems, searchQuery, genderFilter, categoryFilter]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-slate-900">
                  Kelola Item Pembayaran
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 font-mono">
                  {paymentItems.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur tarif, komponen biaya, dan jenis tagihan pembayaran santri pondok
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNew();
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Item</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pembayaran atau keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Gender Filter Buttons */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 text-xs">
              {(['Semua', 'Putra', 'Putri'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    genderFilter === g
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="syahriah">Syahriah / SPP</option>
              <option value="makan">Uang Makan</option>
              <option value="kitab">Kitab & Modul</option>
              <option value="infaq">Infaq & Gedung</option>
              <option value="seragam">Seragam</option>
              <option value="kegiatan">Kegiatan</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-300 mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700">
                Tidak ada item pembayaran yang sesuai
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silakan ubah kata kunci pencarian atau buat item pembayaran baru.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const frequencyLabel = 
                item.paymentFrequency === 'sekali' ? 'Sekali Bayar' :
                item.paymentFrequency === 'bulanan' ? 'Bulanan' :
                item.paymentFrequency === 'triwulan' ? 'Triwulan' :
                item.paymentFrequency === 'caturwulan' ? 'Caturwulan' :
                item.paymentFrequency === 'semester' ? 'Semester' : 'Berkala';

              const subPeriodsCount = item.subPeriods?.length || 0;

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {item.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        {item.category || 'Lainnya'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {frequencyLabel}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sasaran: {item.targetGender || 'Semua'}</span>
                      </span>

                      {item.targetLembaga && item.targetLembaga !== 'Semua' && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lembaga: {item.targetLembaga}</span>
                        </span>
                      )}

                      {subPeriodsCount > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{subPeriodsCount} Sub-Periode</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right sm:text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Tarif / Nominal
                      </div>
                      <div className="font-mono font-bold text-sm text-emerald-800">
                        Rp {item.defaultAmount.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditItem(item);
                        }}
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-600 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Edit item pembayaran ini"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onDeleteItem(item);
                        }}
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Hapus item pembayaran ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Total {filteredItems.length} dari {paymentItems.length} item pembayaran</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
