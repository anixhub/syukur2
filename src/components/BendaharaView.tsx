import React from 'react';
import { BendaharaRecord, Santri } from '../types';
import WalletSubView from './bendahara/WalletSubView';
import PembayaranSubView from './bendahara/PembayaranSubView';

interface BendaharaViewProps {
  bendaharaList?: BendaharaRecord[];
  santriList?: Santri[];
  onToggleStatus?: (id: string) => void;
  activeSubTab?: string;
  onChangeSubTab?: (tab: string) => void;
}

export default function BendaharaView({ 
  bendaharaList = [], 
  santriList = [],
  onToggleStatus,
  activeSubTab = 'wallet',
  onChangeSubTab
}: BendaharaViewProps) {
  const [localSubTab, setLocalSubTab] = React.useState<'wallet' | 'pembayaran'>('wallet');

  // Sync with prop if provided
  React.useEffect(() => {
    if (activeSubTab === 'wallet' || activeSubTab === 'pembayaran') {
      setLocalSubTab(activeSubTab as 'wallet' | 'pembayaran');
    } else if (activeSubTab === 'syahriah' || activeSubTab === 'syahriyah') {
      setLocalSubTab('pembayaran');
      if (onChangeSubTab) {
        onChangeSubTab('pembayaran');
      }
    }
  }, [activeSubTab, onChangeSubTab]);

  const currentTab = (activeSubTab === 'wallet' || activeSubTab === 'pembayaran') ? activeSubTab : localSubTab;

  return (
    <div className="w-full">
      {/* Conditional Sub-View */}
      {currentTab === 'pembayaran' ? (
        <PembayaranSubView
          santriList={santriList}
          bendaharaList={bendaharaList}
          onUpdateBendaharaStatus={onToggleStatus}
        />
      ) : (
        <WalletSubView />
      )}
    </div>
  );
}
