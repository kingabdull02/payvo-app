import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Lightbulb, ChevronRight } from 'lucide-react';
import { dbAPI } from '../db/dbClient';
import type { Invoice } from '../db/dbClient';
import { CATEGORIES, getCategoryByName } from '../utils/categories';
import type { ViewState } from '../types';

interface AddBillViewProps {
  userId: string;
  editInvoice: Invoice | null;
  onNavigate: (view: ViewState) => void;
  onSuccess: () => void;
}

export const AddBillView: React.FC<AddBillViewProps> = ({
  userId,
  editInvoice,
  onNavigate,
  onSuccess
}) => {
  const isEditMode = !!editInvoice;

  // Form Fields
  const [isRecurring, setIsRecurring] = useState(true);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('25'); // default salary day
  const [dueDate, setDueDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-25`;
  });
  const [selectedCategoryName, setSelectedCategoryName] = useState('Boende');
  const [notes, setNotes] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  // Validation/Error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Category Selector Modal State
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);

  // Initialize form if editing
  useEffect(() => {
    if (editInvoice) {
      setName(editInvoice.name);
      setAmount(String(editInvoice.amount));
      setSelectedCategoryName(editInvoice.category);
      setNotes(editInvoice.notes || '');
      setIsPaid(editInvoice.is_paid);

      if (editInvoice.recurring_id) {
        setIsRecurring(true);
        // Look up the recurring invoice to find its due day
        dbAPI.recurring.list(userId).then(list => {
          const matched = list.find(r => r.id === editInvoice.recurring_id);
          if (matched) {
            setDueDay(String(matched.due_day));
          }
        });
      } else {
        setIsRecurring(false);
        setDueDate(editInvoice.due_date);
      }
    }
  }, [editInvoice, userId]);

  const activeCategory = getCategoryByName(selectedCategoryName);
  const CategoryIcon = activeCategory.icon;

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Fakturanamn får inte vara tomt.';
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Beloppet måste vara ett positivt tal.';
    }

    if (isRecurring) {
      const day = parseInt(dueDay, 10);
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.dueDay = 'Dagen måste vara mellan 1 och 31.';
      }
    } else {
      if (!dueDate) {
        newErrors.dueDate = 'Välj ett förfallodatum.';
      } else {
        const selectedDate = new Date(dueDate);
        const todayCheck = new Date();
        // Set hours to 0 to compare days
        selectedDate.setHours(0, 0, 0, 0);
        todayCheck.setHours(0, 0, 0, 0);

        if (selectedDate < todayCheck && !isEditMode) {
          newErrors.dueDate = 'Förfallodatumet kan inte vara i det förflutna.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    const parsedAmount = parseFloat(amount);

    try {
      if (isEditMode && editInvoice) {
        // Redigera faktura
        // Update the invoice instance
        const updatedInvoice = await dbAPI.invoices.update(userId, editInvoice.id, {
          name,
          amount: parsedAmount,
          category: selectedCategoryName,
          icon: activeCategory.iconName,
          notes,
          is_paid: isPaid,
          due_date: isRecurring
            ? editInvoice.due_date // Keep existing date but name/amount changes
            : dueDate
        });

        // If it's linked to a recurring config, update the master name/amount too.
        if (editInvoice.recurring_id && updatedInvoice) {
          await dbAPI.recurring.update(userId, editInvoice.recurring_id, {
            name,
            amount: parsedAmount,
            due_day: parseInt(dueDay, 10),
            category: selectedCategoryName,
            icon: activeCategory.iconName,
            notes
          });
        }
      } else {
        // Skapa ny faktura
        if (isRecurring) {
          // 1. Create recurring config
          const master = await dbAPI.recurring.create(userId, {
            name,
            amount: parsedAmount,
            due_day: parseInt(dueDay, 10),
            category: selectedCategoryName,
            icon: activeCategory.iconName,
            notes
          });

          // 2. Generate instance for the current month if applicable
          if (master) {
            // Note: dbAPI.invoices.list automatically instantiates this when user navigates,
            // but we can generate it immediately for the current month so they see it instantly!
            const nowDate = new Date();
            const year = nowDate.getFullYear();
            const month = nowDate.getMonth() + 1;
            const paddedMonth = String(month).padStart(2, '0');

            // Format safe day date
            const daysInMonth = new Date(year, month, 0).getDate();
            const safeDay = Math.min(master.due_day, daysInMonth);
            const targetDateStr = `${year}-${paddedMonth}-${String(safeDay).padStart(2, '0')}`;

            await dbAPI.invoices.create(userId, {
              recurring_id: master.id,
              name: master.name,
              amount: master.amount,
              due_date: targetDateStr,
              is_paid: isPaid,
              category: master.category,
              icon: master.icon,
              notes: master.notes
            });
          }
        } else {
          // Create variable invoice directly
          await dbAPI.invoices.create(userId, {
            recurring_id: null,
            name,
            amount: parsedAmount,
            due_date: dueDate,
            is_paid: isPaid,
            category: selectedCategoryName,
            icon: activeCategory.iconName,
            notes
          });
        }
      }
      onSuccess();
      onNavigate('dashboard');
    } catch (err) {
      console.error(err);
      setErrors({ api: 'Det gick inte att spara fakturan. Kontrollera dina uppgifter.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-iceWhite px-5 pt-4 pb-6 min-h-full">
      {/* Top Header */}
      <div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-deepNavy/70 font-semibold text-xs active:scale-95 transition-transform py-2"
        >
          <ArrowLeft size={16} /> Tillbaka
        </button>

        <h1 className="text-xl font-extrabold text-deepNavy mt-3">
          {isEditMode ? 'Redigera faktura' : 'Ny faktura'}
        </h1>
        <p className="text-xs text-deepNavy/50 mt-1">
          Fyll i detaljerna för att börja spåra din utgift.
        </p>

        {/* Tab Toggle for Fast/Rörlig */}
        {!isEditMode && (
          <div className="bg-deepNavy/5 p-1 rounded-xl flex gap-1 mt-5">
            <button
              onClick={() => setIsRecurring(true)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${isRecurring
                  ? 'bg-white text-deepNavy shadow-sm'
                  : 'text-deepNavy/50 hover:text-deepNavy'
                }`}
            >
              Fast faktura
            </button>
            <button
              onClick={() => setIsRecurring(false)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${!isRecurring
                  ? 'bg-white text-deepNavy shadow-sm'
                  : 'text-deepNavy/50 hover:text-deepNavy'
                }`}
            >
              Rörlig faktura
            </button>
          </div>
        )}
      </div>

      {/* Form Area */}
      <div className="flex-1 bg-white/70 backdrop-blur-md border border-white/60 shadow-lg rounded-[28px] p-5 mt-5 space-y-4 max-w-[360px] mx-auto w-full">
        {errors.api && (
          <div className="p-3 bg-overdueRed/10 border border-overdueRed/25 rounded-xl text-xs text-overdueRed font-medium">
            {errors.api}
          </div>
        )}

        {/* Fakturanamn */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">Fakturanamn</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="t.ex. Hyra, Spotify, El"
            className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 transition-all ${errors.name ? 'border-overdueRed focus:ring-overdueRed/20' : 'border-deepNavy/5 focus:border-electricTeal'
              }`}
          />
          {errors.name && <p className="text-[10px] text-overdueRed font-bold">{errors.name}</p>}
        </div>

        {/* Belopp (kr) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">Belopp (kr)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full pl-4 pr-12 py-3 bg-white border rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 transition-all ${errors.amount ? 'border-overdueRed focus:ring-overdueRed/20' : 'border-deepNavy/5 focus:border-electricTeal'
                }`}
            />
            <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-deepNavy/40 pointer-events-none">
              SEK
            </span>
          </div>
          {errors.amount && <p className="text-[10px] text-overdueRed font-bold">{errors.amount}</p>}
        </div>

        {/* Due Day / Due Date & Category Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Due Day or Date Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">
              {isRecurring ? 'Förfallodag' : 'Förfallodatum'}
            </label>
            {isRecurring ? (
              <div className="relative">
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className={`w-full pl-3 pr-8 py-3 bg-white border rounded-xl text-sm text-deepNavy focus:outline-none focus:ring-2 focus:ring-electricTeal/20 transition-all ${errors.dueDay ? 'border-overdueRed focus:ring-overdueRed/20' : 'border-deepNavy/5 focus:border-electricTeal'
                    } appearance-none`}
                >
                  {Array.from({ length: 31 }, (_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Varje den {idx + 1}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-deepNavy/40">
                  <span className="text-[9px]">▼</span>
                </div>
              </div>
            ) : (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs text-deepNavy focus:outline-none focus:ring-2 focus:ring-electricTeal/20 transition-all ${errors.dueDate ? 'border-overdueRed focus:ring-overdueRed/20' : 'border-deepNavy/5 focus:border-electricTeal'
                  }`}
              />
            )}
            {isRecurring && errors.dueDay && (
              <p className="text-[10px] text-overdueRed font-bold">{errors.dueDay}</p>
            )}
            {!isRecurring && errors.dueDate && (
              <p className="text-[10px] text-overdueRed font-bold">{errors.dueDate}</p>
            )}
          </div>

          {/* Category Click Box */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">Kategori</label>
            <button
              type="button"
              onClick={() => setShowCategoryGrid(true)}
              className="w-full flex items-center justify-between px-3.5 py-3 bg-white border border-deepNavy/5 rounded-xl text-sm text-deepNavy hover:bg-deepNavy/5 focus:ring-2 focus:ring-electricTeal/20 transition-all"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <span className="p-0.5 rounded text-white flex items-center justify-center scale-90" style={{ backgroundColor: activeCategory.color }}>
                  <CategoryIcon size={12} />
                </span>
                <span className="truncate text-xs">{selectedCategoryName}</span>
              </span>
              <ChevronRight size={14} className="text-deepNavy/35" />
            </button>
          </div>
        </div>

        {/* Anteckning (Valfritt) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">Anteckning (Valfritt)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lägg till en kommentar..."
            rows={2}
            className="w-full px-4 py-2.5 bg-white border border-deepNavy/5 rounded-xl text-xs text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 focus:border-electricTeal transition-all resize-none"
          />
        </div>

        {/* Betalningsstatus Toggle */}
        <div className="pt-2 flex justify-between items-center border-t border-deepNavy/5">
          <div>
            <span className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">Betalningsstatus</span>
            <span className="block text-[10px] text-deepNavy/30 font-semibold">Markera betald direkt</span>
          </div>
          <div className="flex gap-1 bg-deepNavy/5 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${!isPaid
                  ? 'bg-white text-deepNavy shadow-sm'
                  : 'text-deepNavy/50 hover:text-deepNavy'
                }`}
            >
              Kommande
            </button>
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${isPaid
                  ? 'bg-electricTeal text-white shadow-sm'
                  : 'text-deepNavy/50 hover:text-deepNavy'
                }`}
            >
              Betald
            </button>
          </div>
        </div>

        {/* Spara faktura Button */}
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full bg-deepNavy hover:bg-deepNavy/95 text-white font-bold text-sm py-3.5 px-4 rounded-full shadow-lg shadow-deepNavy/10 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all duration-150 disabled:opacity-75 disabled:pointer-events-none"
        >
          {isSaving ? 'Sparar...' : isEditMode ? 'Uppdatera faktura' : 'Spara faktura'} <Check size={16} />
        </button>
      </div>

      {/* Tooltip hint banner */}
      <div className="bg-white/50 border border-deepNavy/5 rounded-[20px] p-4 flex items-start gap-3 mt-5 max-w-[360px] mx-auto w-full shadow-sm">
        <div className="w-8 h-8 rounded-full bg-electricTeal/10 flex items-center justify-center text-electricTeal shrink-0">
          <Lightbulb size={16} />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-[11px] font-bold text-deepNavy">Visste du?</h4>
          <p className="text-[10px] text-deepNavy/50 leading-relaxed font-medium">
            Genom att lägga till fasta fakturor kan Payvo automatiskt förutsäga din ekonomi 30 dagar framåt.
          </p>
        </div>
      </div>

      {/* CATEGORY GRID OVERLAY MODAL */}
      {showCategoryGrid && (
        <div className="absolute inset-0 bg-deepNavy/65 backdrop-blur-xs flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[32px] p-5 w-full max-w-[320px] space-y-4 shadow-2xl border border-deepNavy/5 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-deepNavy/5">
              <h3 className="font-extrabold text-deepNavy text-sm">Välj kategori</h3>
              <button
                onClick={() => setShowCategoryGrid(false)}
                className="w-6 h-6 rounded-full bg-iceWhite flex items-center justify-center text-deepNavy/50 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategoryName === cat.name;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryName(cat.name);
                      setShowCategoryGrid(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${isSelected
                        ? 'border-electricTeal bg-electricTeal/5'
                        : 'border-deepNavy/5 hover:bg-iceWhite'
                      }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white scale-95"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CatIcon size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-deepNavy/70 truncate w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
