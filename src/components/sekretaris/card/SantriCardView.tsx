import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical } from 'lucide-react';
import { Santri, Lembaga, Kelas } from '../../../types';
import { fetchTableData, getApiUrl } from '../../../lib/api';
import { isCustomPasFoto } from '../../SekretarisHelper';
import { AgeFilterConfig, calculateAgeOnDate } from '../AgeFilterModal';

interface SantriCardViewProps {
  paginatedSantri: Santri[];
  isSelectionMode: boolean;
  selectedSantriIds: string[];
  setSelectedSantriIds: (ids: string[]) => void;
  setSelectedSantri: (s: Santri) => void;
  handleStartEditSantri: (s: Santri) => void;
  handlePrintClick: (s: Santri) => void;
  handleDeleteClick: (id: string, name: string) => void;
  activeSantriDropdownId: string | null;
  setActiveSantriDropdownId: (id: string | null) => void;
  setIsSelectionMode: (val: boolean) => void;
  canWritePutra: boolean;
  canWritePutri: boolean;
  ageFilterConfig?: AgeFilterConfig;
  onUpdateSantri?: (s: Santri) => void;
  lembagasList?: Lembaga[];
  kelasList?: Kelas[];
}

export default function SantriCardView({
  paginatedSantri,
  isSelectionMode,
  selectedSantriIds,
  setSelectedSantriIds,
  setSelectedSantri,
  handleStartEditSantri,
  handlePrintClick,
  handleDeleteClick,
  activeSantriDropdownId,
  setActiveSantriDropdownId,
  setIsSelectionMode,
  canWritePutra,
  canWritePutri,
  ageFilterConfig,
  onUpdateSantri,
  lembagasList,
  kelasList
}: SantriCardViewProps) {
  const [internalLembagas, setInternalLembagas] = React.useState<Lembaga[]>(lembagasList || []);
  const [internalKelas, setInternalKelas] = React.useState<Kelas[]>(kelasList || []);

  React.useEffect(() => {
    if (lembagasList) setInternalLembagas(lembagasList);
    if (kelasList) setInternalKelas(kelasList);
  }, [lembagasList, kelasList]);

  React.useEffect(() => {
    if ((!lembagasList || lembagasList.length === 0) || (!kelasList || kelasList.length === 0)) {
      const loadEdu = async () => {
        try {
          const [lems, kls] = await Promise.all([
            fetchTableData<Lembaga>('lembaga', 'smartsantri_lembagas', []),
            fetchTableData<Kelas>('kelas', 'smartsantri_kelas', [])
          ]);
          if (lems && lems.length > 0) setInternalLembagas(lems);
          if (kls && kls.length > 0) setInternalKelas(kls);
        } catch {}
      };
      loadEdu();
    }
  }, []);

  const activeLembagas = lembagasList || internalLembagas;
  const activeKelas = kelasList || internalKelas;

  const [activeEmisDropdownId, setActiveEmisDropdownId] = React.useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);
  const [lastAction, setLastAction] = React.useState<'select' | 'deselect' | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = React.useState<{ pageX: number; pageY: number } | null>(null);
  const [dragBox, setDragBox] = React.useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const mousePosRef = React.useRef<{ clientX: number; clientY: number } | null>(null);
  const initialSelectedIdsRef = React.useRef<string[]>([]);

  const lastSelectedIndexRef = React.useRef(lastSelectedIndex);
  const lastActionRef = React.useRef(lastAction);
  const paginatedSantriRef = React.useRef(paginatedSantri);
  const selectedSantriIdsRef = React.useRef(selectedSantriIds);
  const draggedRef = React.useRef<boolean>(false);
  const clickedIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    lastSelectedIndexRef.current = lastSelectedIndex;
  }, [lastSelectedIndex]);

  React.useEffect(() => {
    lastActionRef.current = lastAction;
  }, [lastAction]);

  React.useEffect(() => {
    paginatedSantriRef.current = paginatedSantri;
  }, [paginatedSantri]);

  React.useEffect(() => {
    selectedSantriIdsRef.current = selectedSantriIds;
  }, [selectedSantriIds]);

  const toggleSingleSelection = (id: string, shiftKey: boolean) => {
    const paginated = paginatedSantriRef.current;
    const lastIdx = lastSelectedIndexRef.current;
    const lastAct = lastActionRef.current;
    const prevSelected = selectedSantriIdsRef.current;

    const index = paginated.findIndex(x => x.id === id);
    if (index === -1) return;

    const s = paginated[index];
    const isSelected = prevSelected.includes(s.id);

    if (shiftKey && lastIdx !== null && lastAct !== null) {
      const start = Math.min(lastIdx, index);
      const end = Math.max(lastIdx, index);
      const rangeIds = paginated.slice(start, end + 1).map(x => x.id);

      if (lastAct === 'select') {
        const unionSet = new Set([...prevSelected, ...rangeIds]);
        setSelectedSantriIds(Array.from(unionSet));
      } else { // 'deselect'
        setSelectedSantriIds(prevSelected.filter(x => !rangeIds.includes(x)));
      }
    } else {
      if (isSelected) {
        setLastSelectedIndex(index);
        setLastAction('deselect');
        setSelectedSantriIds(prevSelected.filter(x => x !== s.id));
      } else {
        setLastSelectedIndex(index);
        setLastAction('select');
        setSelectedSantriIds([...prevSelected, s.id]);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectionMode) return;
    if (e.button !== 0) return; // Left click only

    const target = e.target as HTMLElement;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    initialSelectedIdsRef.current = selectedSantriIds;
    draggedRef.current = false;
    
    // Find closest card to determine clicked target
    const cardEl = target.closest('[data-drag-id]');
    clickedIdRef.current = cardEl?.getAttribute('data-drag-id') || null;

    setDragStart({ pageX: e.clientX + window.scrollX, pageY: e.clientY + window.scrollY });
    setDragBox(null);
  };

  React.useEffect(() => {
    if (!dragStart) {
      mousePosRef.current = null;
      return;
    }

    mousePosRef.current = { clientX: dragStart.pageX - window.scrollX, clientY: dragStart.pageY - window.scrollY };
    let animationFrameId: number;

    const updateSelection = () => {
      const container = containerRef.current;
      const mousePos = mousePosRef.current;
      if (!container || !mousePos) return;

      const containerRect = container.getBoundingClientRect();

      // Page-absolute box coordinates
      const currentPageX = mousePos.clientX + window.scrollX;
      const currentPageY = mousePos.clientY + window.scrollY;

      const dist = Math.sqrt(
        Math.pow(currentPageX - dragStart.pageX, 2) + 
        Math.pow(currentPageY - dragStart.pageY, 2)
      );

      if (dist <= 4 && !draggedRef.current) {
        setDragBox(null);
        return;
      }

      draggedRef.current = true;

      const pageLeft = Math.min(dragStart.pageX, currentPageX);
      const pageTop = Math.min(dragStart.pageY, currentPageY);
      const pageWidth = Math.abs(dragStart.pageX - currentPageX);
      const pageHeight = Math.abs(dragStart.pageY - currentPageY);
      const pageRight = pageLeft + pageWidth;
      const pageBottom = pageTop + pageHeight;

      // Convert page-absolute coordinates to container-relative coordinates for rendering the absolute dragBox
      const containerPageLeft = containerRect.left + window.scrollX;
      const containerPageTop = containerRect.top + window.scrollY;

      const left = pageLeft - containerPageLeft + container.scrollLeft;
      const top = pageTop - containerPageTop + container.scrollTop;

      setDragBox({ left, top, width: pageWidth, height: pageHeight });

      const itemElements = container.querySelectorAll('[data-drag-id]');
      const intersectedIds: string[] = [];

      itemElements.forEach((el) => {
         const elRect = el.getBoundingClientRect();
         const id = el.getAttribute('data-drag-id');
         if (!id) return;

         const elPageLeft = elRect.left + window.scrollX;
         const elPageRight = elRect.right + window.scrollX;
         const elPageTop = elRect.top + window.scrollY;
         const elPageBottom = elRect.bottom + window.scrollY;

         const isOverlapping = !(
           elPageRight < pageLeft ||
           elPageLeft > pageRight ||
           elPageBottom < pageTop ||
           elPageTop > pageBottom
         );

         if (isOverlapping) {
           intersectedIds.push(id);
         }
      });

      const unionSet = new Set([...initialSelectedIdsRef.current, ...intersectedIds]);
      setSelectedSantriIds(Array.from(unionSet));
    };

    const scrollAndLoop = () => {
      const mousePos = mousePosRef.current;
      if (!mousePos) return;

      const viewportHeight = window.innerHeight;
      const { clientY } = mousePos;
      const scrollThreshold = 60; // distance from top/bottom edge to start scrolling
      const maxScrollSpeed = 15; // max scroll increment in pixels

      let scrolled = false;

      if (clientY > viewportHeight - scrollThreshold) {
        const ratio = (clientY - (viewportHeight - scrollThreshold)) / scrollThreshold;
        const speed = Math.max(1, Math.min(maxScrollSpeed, ratio * maxScrollSpeed));
        window.scrollBy(0, speed);
        scrolled = true;
      } else if (clientY < scrollThreshold) {
        const ratio = (scrollThreshold - clientY) / scrollThreshold;
        const speed = Math.max(1, Math.min(maxScrollSpeed, ratio * maxScrollSpeed));
        window.scrollBy(0, -speed);
        scrolled = true;
      }

      updateSelection();
      animationFrameId = requestAnimationFrame(scrollAndLoop);
    };

    animationFrameId = requestAnimationFrame(scrollAndLoop);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { clientX: e.clientX, clientY: e.clientY };
      updateSelection();
    };

    const handleMouseUp = () => {
      setDragStart(null);
      setDragBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart, setSelectedSantriIds]);

  const handleCardClick = (e: React.MouseEvent, index: number, s: Santri) => {
    if (isSelectionMode) {
      if (draggedRef.current) return;
      toggleSingleSelection(s.id, e.shiftKey);
    } else {
      setSelectedSantri(s);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="relative select-none"
    >
      {dragBox && (
        <div
          className="absolute border border-[#00b0f0] bg-[#00b0f0]/15 pointer-events-none z-[15] rounded"
          style={{
            left: dragBox.left,
            top: dragBox.top,
            width: dragBox.width,
            height: dragBox.height,
          }}
        />
      )}
      <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedSantri.map((s, index) => {
          const isSelected = selectedSantriIds.includes(s.id);
          const canWriteForSantri = s.gender === 'Putri' ? canWritePutri : canWritePutra;
          const isPutri = s.gender === 'Putri';
          const isAlumni = s.statusKeanggotaan === 'Alumni';

          // Initials helper
          const getInitials = (name: string): string => {
            const words = (name || '').trim().split(/\s+/);
            if (words.length === 0 || !words[0]) return '?';
            if (words.length === 1) {
              return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
            }
            return (words[0][0] + words[1][0]).toUpperCase();
          };

          const hasUploadedPhoto = isCustomPasFoto(s.filePasFoto);
          
          // Address helper
          const addressParts = [s.desa, s.kecamatan, s.kabupaten].filter(val => val && val.trim() !== '');
          const addressText = addressParts.length > 0 ? addressParts.join(', ') : (s.alamat || s.asal || '-');

          // Age calculation
          const refDate = ageFilterConfig?.enabled && ageFilterConfig.refType === 'custom' && ageFilterConfig.customDate
            ? new Date(ageFilterConfig.customDate)
            : new Date();
          const age = calculateAgeOnDate(s.tanggalLahir, refDate);
          const displayAge = age !== null && age !== undefined ? age : '-';

          // Outer ring border color matching screenshot
          const ringBorderColor = isPutri
            ? 'border-rose-400'
            : isAlumni
            ? 'border-indigo-400'
            : 'border-blue-400';

          // Inner background / text color for initials
          const bgClass = isPutri
            ? 'bg-slate-100 text-slate-700'
            : isAlumni
            ? 'bg-indigo-600 text-white'
            : 'bg-[#2b6cb0] text-white';

          // Status Keanggotaan badge style
          const statusKeanggotaanStyle = isAlumni
            ? 'bg-[#eaf1fb] text-[#2b6cb0]'
            : s.statusKeanggotaan === 'Meninggal'
            ? 'bg-rose-50 text-rose-600'
            : s.statusKeanggotaan === 'Mutasi'
            ? 'bg-amber-50 text-amber-600'
            : 'bg-[#e6f8ef] text-[#00a86b]';

          // Second badge text (domisili or alumni condition)
          const secondBadgeText = isAlumni
            ? (s.statusDomisili ? s.statusDomisili.toUpperCase() : 'HIDUP')
            : s.statusKeanggotaan === 'Meninggal'
            ? 'WAFAT'
            : (s.statusDomisili ? s.statusDomisili.toUpperCase() : 'MUQIM');

          return (
            <div 
              key={`${s.id}-${index}`} 
              data-drag-id={s.id}
              onClick={(e) => handleCardClick(e, index, s)}
              className={`group relative flex flex-row items-center justify-between gap-3 sm:gap-4 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 select-none cursor-pointer ${
                isSelectionMode
                  ? isSelected
                    ? 'border-blue-300 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Left Section: Avatar & Info */}
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                {/* Avatar with circular outline and bottom-left Age Badge */}
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 ${ringBorderColor} overflow-hidden flex items-center justify-center bg-slate-50 shadow-xs`}>
                    {hasUploadedPhoto ? (
                      <img 
                        src={getApiUrl(s.filePasFoto!)} 
                        className="w-full h-full object-cover rounded-full" 
                        alt={s.nama} 
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-sans font-bold text-base sm:text-lg ${bgClass}`}>
                        {getInitials(s.nama)}
                      </div>
                    )}
                  </div>

                  {/* Age Badge in bottom-left corner of profile circle */}
                  <div 
                    className="absolute -bottom-0.5 -left-0.5 min-w-[20px] h-[20px] sm:min-w-[22px] sm:h-[22px] px-1 rounded-full bg-[#00a86b] text-white font-bold text-[10px] sm:text-[11px] flex items-center justify-center border-2 border-white shadow-xs select-none"
                    title={`Umur: ${displayAge} Tahun`}
                  >
                    {displayAge}
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex flex-col min-w-0 flex-1 gap-1">
                  {/* Nama */}
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base uppercase tracking-tight truncate leading-snug">
                    {s.nama}
                  </h3>

                  {/* Badges: Status Keanggotaan & Domisili/Kondisi */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Badge 1: Status Keanggotaan */}
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tracking-wider uppercase ${statusKeanggotaanStyle}`}>
                      {s.statusKeanggotaan || 'AKTIF'}
                    </span>

                    {/* Badge 2: Status Domisili / Kondisi */}
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium tracking-wider uppercase bg-[#f1f4f8] text-[#5c6f84]">
                      {secondBadgeText}
                    </span>
                  </div>

                  {/* Subtitle: NIS . Alamat */}
                  <p className="text-xs text-slate-400 font-normal truncate" title={`${s.nis || '-'} . ${addressText}`}>
                    {s.nis || '-'} . {addressText}
                  </p>
                </div>
              </div>

              {/* Right Section: 3-Dots Action / Selection Checkbox */}
              {isSelectionMode ? (
                <div 
                  className="shrink-0 p-1 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSingleSelection(s.id, e.shiftKey);
                  }}
                >
                  {isSelected ? (
                    <div className="w-5 h-5 bg-[#00a86b] rounded flex items-center justify-center text-white shadow-xs cursor-pointer active:scale-90 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-white border border-slate-300 rounded hover:border-slate-400 transition-colors cursor-pointer active:scale-90 transition-transform" />
                  )}
                </div>
              ) : (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSantriDropdownId(activeSantriDropdownId === s.id ? null : s.id);
                    }}
                    className="dropdown-trigger-btn text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Menu Pilihan"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Dropdown Popover */}
                  <AnimatePresence>
                    {activeSantriDropdownId === s.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSantriDropdownId(null);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                          className="dropdown-container-box absolute right-0 mt-1 w-28 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-40 text-slate-700 font-sans"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSantriDropdownId(null);
                              setIsSelectionMode(true);
                              setLastSelectedIndex(index);
                              setLastAction('select');
                              if (!selectedSantriIds.includes(s.id)) {
                                setSelectedSantriIds([...selectedSantriIds, s.id]);
                              }
                            }}
                            className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Pilih
                          </button>

                          {canWriteForSantri && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSantriDropdownId(null);
                                handleStartEditSantri(s);
                              }}
                              className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSantriDropdownId(null);
                              handlePrintClick(s);
                            }}
                            className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Print
                          </button>

                          {canWriteForSantri && (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSantriDropdownId(null);
                                  handleDeleteClick(s.id, s.nama);
                                }}
                                className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
