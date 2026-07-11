import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  History,
  Sparkles,
  Check,
  Trash2,
  Edit3,
  AlertCircle,
  Settings
} from 'lucide-react';
import { dbAPI } from '../db/dbClient';
import type { Invoice, Profile } from '../db/dbClient';
import { getCategoryByName } from '../utils/categories';
import { getDueLabel, getInvoiceStatus } from '../utils/dateUtils';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import confetti from 'canvas-confetti';
import type { ViewState } from '../types';

const MONTHS_SWEDISH = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

interface DashboardViewProps {
  userId: string;
  onNavigate: (view: ViewState) => void;
  onSelectEditInvoice: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userId,
  onNavigate,
  onSelectEditInvoice
}) => {
  // Use actual current date
  const today = new Date();
  const CURRENT_YEAR = today.getFullYear();
  const CURRENT_MONTH = today.getMonth() + 1; // 1-indexed

  const [currentYear, setCurrentYear] = useState(CURRENT_YEAR);
  const [currentMonth, setCurrentMonth] = useState(CURRENT_MONTH); // 1-indexed (1-12)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const isCurrentMonth = currentYear === CURRENT_YEAR && currentMonth === CURRENT_MONTH;
  const isHistoryMonth = currentYear < CURRENT_YEAR || (currentYear === CURRENT_YEAR && currentMonth < CURRENT_MONTH);

  // Load profile and invoices
  const loadData = async () => {
    setLoading(true);
    try {
      const p = await dbAPI.profile.get(userId);
      setProfile(p);

      // Only fetch invoices if premium or if viewing current month
      const invs = await dbAPI.invoices.list(userId, monthKey);
      setInvoices(invs);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentMonth, currentYear, isCurrentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calculations
  const totalToPay = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.is_paid ? Number(inv.amount) : 0), 0);
  const totalLeft = totalToPay - totalPaid;
  const percentCompleted = totalToPay > 0 ? Math.round((totalPaid / totalToPay) * 100) : 0;
  const fixedInvoices = invoices.filter(inv => inv.recurring_id);
  const variableInvoices = invoices.filter(inv => !inv.recurring_id);


  // Toggle invoice paid
  const handleTogglePaid = async (invoice: Invoice) => {
    if (isHistoryMonth) return; // read-only history

    const newPaidStatus = !invoice.is_paid;
    try {
      const updated = await dbAPI.invoices.togglePaid(userId, invoice.id, newPaidStatus);
      if (updated) {
        // Update local list
        setInvoices(invoices.map(inv => inv.id === invoice.id ? updated : inv));
        if (selectedInvoice?.id === invoice.id) {
          setSelectedInvoice(updated);
        }

        // Trigger confetti if all invoices in the current month are now paid!
        if (newPaidStatus) {
          const remainingUnpaid = invoices.filter(inv => inv.id !== invoice.id && !inv.is_paid).length;
          if (remainingUnpaid === 0) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#00C2D1', '#0D1B2A', '#FFB347']
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    setIsDeleting(true);
    try {
      const success = await dbAPI.invoices.delete(userId, selectedInvoice.id);
      if (success) {
        // If it was a recurring invoice template, ask user if they want to delete future ones too?
        // For MVP, just delete this specific month instance.
        setInvoices(invoices.filter(i => i.id !== selectedInvoice.id));
        setSelectedInvoice(null);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderInvoiceCard = (inv: Invoice) => {
    const categoryInfo = getCategoryByName(inv.category || inv.icon);
    const statusInfo = getInvoiceStatus(inv);
    const CatIcon = categoryInfo.icon;

    return (
      <div
        key={inv.id}
        onClick={() => setSelectedInvoice(inv)}
        className={`bg-white hover:bg-iceWhite/50 active:bg-iceWhite border border-deepNavy/5 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md cursor-pointer transition-all duration-150 transform hover:-translate-y-0.5 ${inv.is_paid ? 'opacity-85' : ''
          }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: categoryInfo.color }}
          >
            <CatIcon size={20} />
          </div>
          <div>
            <h4 className={`text-sm font-bold text-deepNavy ${inv.is_paid ? 'line-through opacity-60' : ''}`}>
              {inv.name}
            </h4>
            <p className="text-[11px] text-deepNavy/50 mt-0.5 font-medium">
              {getDueLabel(inv, currentMonth)}
            </p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <span className={`text-sm font-black text-deepNavy ${inv.is_paid ? 'opacity-60' : ''}`}>
            {Number(inv.amount).toLocaleString('sv-SE')} kr
          </span>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusInfo.bgClass}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>
    );
  };


  return (
    <div className="flex-1 flex flex-col justify-between pb-safe relative h-full">
      {/* Scrollable View Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 space-y-5">
        {/* Top Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar
              name={profile?.name}
              avatarUrl={profile?.avatar_url}
              size="md"
              className="border-2 border-white shadow-sm"
              onClick={() => onNavigate('settings')}
            />
            <div>
              <h3 className="text-xs text-deepNavy/50 font-bold">Hej!</h3>
              <h2 className="text-sm font-extrabold text-deepNavy -mt-0.5">{profile?.name || 'Laddar...'}</h2>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 bg-white border border-deepNavy/5 rounded-full flex items-center justify-center text-deepNavy/70 shadow-sm active:scale-95 transition-transform"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center py-1">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center text-deepNavy hover:bg-white border border-transparent hover:border-deepNavy/5 rounded-full transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-extrabold text-deepNavy tracking-tight select-none">
            {MONTHS_SWEDISH[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center text-deepNavy hover:bg-white border border-transparent hover:border-deepNavy/5 rounded-full transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <>
          {/* Glassmorphism Budget Card */}
          <div className="glass-card rounded-[32px] p-6 text-deepNavy relative overflow-hidden transition-all duration-300">
            <span className="text-xs font-bold text-deepNavy/50 uppercase tracking-wider">Totalt att betala</span>
            <div className="text-3xl font-black mt-1 flex items-baseline gap-1">
              {totalToPay.toLocaleString('sv-SE')} <span className="text-lg font-extrabold text-deepNavy/70">kr</span>
            </div>

            {/* Aggregates Row */}
            <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-deepNavy/5">
              <div>
                <span className="text-[10px] font-bold text-deepNavy/50 uppercase tracking-wider">Kvar att betala</span>
                <div className="text-[15px] font-extrabold text-overdueRed mt-0.5">
                  {totalLeft.toLocaleString('sv-SE')} kr
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-deepNavy/50 uppercase tracking-wider">Redan betalt</span>
                <div className="text-[15px] font-extrabold text-electricTeal mt-0.5">
                  {totalPaid.toLocaleString('sv-SE')} kr
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 space-y-1.5">
              <div className="w-full bg-deepNavy/5 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-electricTeal h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentCompleted}%` }}
                ></div>
              </div>
              <div className="text-[11px] font-bold text-deepNavy/50 flex justify-between">
                <span>{percentCompleted}% avklarat</span>
                {percentCompleted === 100 && totalToPay > 0 && (
                  <span className="text-electricTeal flex items-center gap-1 text-[10px]">
                    <Sparkles size={11} /> Allt betalt denna månad!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Invoices List Section */}
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-deepNavy">Fakturor</h2>
              {isHistoryMonth && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-deepNavy/5 rounded-full text-deepNavy/50 flex items-center gap-1">
                  <History size={10} /> Skrivskyddad historik
                </span>
              )}
            </div>

            {invoices.length === 0 ? (
              <div className="bg-white/50 border border-deepNavy/5 rounded-[24px] py-12 px-4 text-center text-xs text-deepNavy/40 font-medium">
                {loading ? 'Hämtar fakturor...' : 'Inga fakturor tillagda denna månad.'}
              </div>
            ) : (
              <>
                {fixedInvoices.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold text-deepNavy/40 uppercase tracking-widest pl-1">Fasta räkningar</h3>
                    <div className="space-y-3">
                      {fixedInvoices.map(renderInvoiceCard)}
                    </div>
                  </div>
                )}

                {variableInvoices.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold text-deepNavy/40 uppercase tracking-widest pl-1">Rörliga fakturor</h3>
                    <div className="space-y-3">
                      {variableInvoices.map(renderInvoiceCard)}
                    </div>
                  </div>
                )}
              </>
            )}

            <p className="text-center text-[10px] text-deepNavy/30 font-medium py-2">
              Tryck på en faktura för att ändra status eller redigera.
            </p>
          </div>
        </>
      </div>

      <BottomNav
        activeView="dashboard"
        onNavigate={onNavigate}
        onAddBill={() => onNavigate('add-bill')}
      />

      {/* DETAIL ACTION MODAL */}
      {selectedInvoice && (
        <div className="absolute inset-0 bg-deepNavy/60 backdrop-blur-xs flex items-end justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-t-[32px] rounded-b-[24px] w-full max-w-[360px] p-6 space-y-5 shadow-2xl animate-slide-up border border-deepNavy/5">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-deepNavy/40 uppercase tracking-widest bg-deepNavy/5 px-2 py-0.5 rounded-full">
                  {selectedInvoice.recurring_id ? 'Fast faktura' : 'Rörlig faktura'}
                </span>
                <h3 className="text-lg font-black text-deepNavy mt-1">{selectedInvoice.name}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-iceWhite flex items-center justify-center text-deepNavy/50"
              >
                ✕
              </button>
            </div>

            {/* Info details */}
            <div className="bg-iceWhite rounded-2xl p-4 space-y-3.5 text-xs text-deepNavy/70">
              <div className="flex justify-between">
                <span className="font-semibold text-deepNavy/40">Belopp:</span>
                <span className="font-extrabold text-deepNavy text-sm">
                  {Number(selectedInvoice.amount).toLocaleString('sv-SE')} kr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-deepNavy/40">Förfallodatum:</span>
                <span className="font-bold text-deepNavy">{selectedInvoice.due_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-deepNavy/40">Kategori:</span>
                <span className="font-bold text-deepNavy">{selectedInvoice.category}</span>
              </div>
              {selectedInvoice.notes && (
                <div className="pt-2 border-t border-deepNavy/5">
                  <span className="font-semibold text-deepNavy/40 block mb-1">Anteckning:</span>
                  <p className="text-deepNavy/80 bg-white/50 p-2.5 rounded-xl border border-deepNavy/5 italic">
                    {selectedInvoice.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions list */}
            <div className="space-y-2.5">
              {!isHistoryMonth && (
                <button
                  onClick={() => handleTogglePaid(selectedInvoice)}
                  className={`w-full font-bold text-sm py-3 px-4 rounded-full flex items-center justify-center gap-1.5 transition-all ${selectedInvoice.is_paid
                    ? 'bg-deepNavy/10 hover:bg-deepNavy/15 text-deepNavy'
                    : 'bg-electricTeal hover:bg-electricTeal/90 text-white shadow-md shadow-electricTeal/10'
                    }`}
                >
                  {selectedInvoice.is_paid ? (
                    <>Ångra betalning</>
                  ) : (
                    <>
                      <Check size={16} /> Markera som betald
                    </>
                  )}
                </button>
              )}

              {/* Only allow editing / deleting for active current/future bills, or premium in active months */}
              {!isHistoryMonth && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      onSelectEditInvoice(selectedInvoice);
                      setSelectedInvoice(null);
                    }}
                    className="bg-iceWhite hover:bg-deepNavy/5 text-deepNavy font-bold text-xs py-3 px-4 rounded-full border border-deepNavy/5 flex items-center justify-center gap-1 transition-all"
                  >
                    <Edit3 size={14} /> Redigera
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-overdueRed/10 hover:bg-overdueRed/15 text-overdueRed font-bold text-xs py-3 px-4 rounded-full border border-overdueRed/5 flex items-center justify-center gap-1 transition-all"
                  >
                    <Trash2 size={14} /> Ta bort
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {showDeleteConfirm && selectedInvoice && (
        <div className="absolute inset-0 bg-deepNavy/70 backdrop-blur-xs flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[28px] p-6 max-w-[300px] w-full text-center space-y-4 shadow-2xl animate-scale-up border border-deepNavy/5">
            <div className="w-12 h-12 bg-overdueRed/10 rounded-full flex items-center justify-center text-overdueRed mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-deepNavy text-sm">Ta bort faktura?</h4>
              <p className="text-xs text-deepNavy/50 leading-relaxed">
                Är du säker på att du vill ta bort <strong>{selectedInvoice.name}</strong>? Detta kan inte ångras.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 bg-iceWhite hover:bg-deepNavy/5 text-deepNavy font-bold text-xs py-2.5 rounded-full border border-deepNavy/5 transition-all"
              >
                Avbryt
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteInvoice}
                className="flex-1 bg-overdueRed hover:bg-overdueRed/90 text-white font-bold text-xs py-2.5 rounded-full shadow-md shadow-overdueRed/10 transition-all"
              >
                {isDeleting ? 'Tar bort...' : 'Ja, ta bort'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
