import React, { useState, useRef, useEffect } from 'react';
import type { Expense } from '../db';
import { AudioIconPlayer } from './Shared/AudioIconPlayer';

interface ExpenseSectionProps {
  expenses: Expense[];
  loading: boolean;
  isAdmin: boolean;
  mode: 'masjid' | 'madrasa';
  onAddExpense: (amount: number, purpose: string, audio?: string) => Promise<void>;
  onEditExpense?: (id: string, amount: number, purpose: string, audio?: string, date?: string) => Promise<void>;
  onDeleteExpense?: (id: string) => Promise<void>;
  timeFilter?: 'month' | 'year' | 'all';
}

export const ExpenseSection: React.FC<ExpenseSectionProps> = ({
  expenses,
  loading,
  isAdmin,
  mode,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  timeFilter = 'all'
}) => {
  const [expenseForm, setExpenseForm] = useState({ amount: '' });
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAudioBase64, setEditAudioBase64] = useState<string | null>(null);
  const [editAudioUrl, setEditAudioUrl] = useState<string | null>(null);
  const [editRecordingState, setEditRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [editRecordingDuration, setEditRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const editMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const editAudioChunksRef = useRef<Blob[]>([]);
  const editTimerRef = useRef<any>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (editTimerRef.current) {
        clearInterval(editTimerRef.current);
      }
    };
  }, []);

  const startEditRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      editAudioChunksRef.current = [];
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      editMediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          editAudioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(editAudioChunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(audioBlob);
        setEditAudioUrl(url);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setEditRecordingState('recording');
      setEditRecordingDuration(0);
      
      editTimerRef.current = setInterval(() => {
        setEditRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting edit recording:', err);
      alert('माइक्रोफोन एक्सेस की अनुमति नहीं है या माइक्रोफोन नहीं मिला।');
    }
  };

  const stopEditRecording = () => {
    if (editMediaRecorderRef.current && editMediaRecorderRef.current.state !== 'inactive') {
      editMediaRecorderRef.current.stop();
    }
    if (editTimerRef.current) {
      clearInterval(editTimerRef.current);
      editTimerRef.current = null;
    }
    setEditRecordingState('preview');
  };

  const clearEditRecording = () => {
    setEditRecordingState('idle');
    setEditAudioUrl(null);
    setEditAudioBase64(null);
    setEditRecordingDuration(0);
    if (editTimerRef.current) {
      clearInterval(editTimerRef.current);
      editTimerRef.current = null;
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditAmount(expense.amount.toString());
    setEditDate(expense.date);
    setEditAudioBase64(expense.audio || null);
    setEditAudioUrl(null);
    setEditRecordingState('idle');
  };

  const cancelEdit = () => {
    setEditingExpenseId(null);
    clearEditRecording();
  };

  const handleSaveEdit = async (id: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('कृपया सही रकम दर्ज करें।');
      return;
    }
    if (onEditExpense) {
      await onEditExpense(id, amount, 'ऑडियो रिकॉर्डिंग', editAudioBase64 || undefined, editDate);
    }
    setEditingExpenseId(null);
    clearEditRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setRecordingState('recording');
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('माइक्रोफोन एक्सेस की अनुमति नहीं है या माइक्रोफोन नहीं मिला।');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingState('preview');
  };

  const clearRecording = () => {
    setRecordingState('idle');
    setAudioUrl(null);
    setAudioBase64(null);
    setRecordingDuration(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) return;
    if (!audioBase64) {
      alert('कृपया पहले खर्च का विवरण स्पष्ट करने के लिए आवाज रिकॉर्ड करें।');
      return;
    }
    await onAddExpense(amount, 'ऑडियो रिकॉर्डिंग', audioBase64);
    setExpenseForm({ amount: '' });
    clearRecording();
  };

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYear}-${currentMonth}`;

  const filteredExpenses = expenses.filter(expense => {
    if (timeFilter === 'all') return true;
    if (timeFilter === 'month') return expense.date.startsWith(currentMonthKey);
    if (timeFilter === 'year') return expense.date.startsWith(currentYear);
    return true;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Add Expense Form (Admin only) - 4 cols */}
      {isAdmin && (
        <form 
          onSubmit={handleExpenseSubmit} 
          className="lg:col-span-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm space-y-4 h-fit"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <path d="M6 14h.01M10 14h.01" />
            </svg>
            खर्च का हिसाब
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            {mode === 'masjid' ? 'मस्जिद' : 'मदरसा'} के मद में किए गए खर्च का ब्यौरा दर्ज करें
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">खर्च राशि (Amount in ₹) *</label>
            <input
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="उदा. 500"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input font-numbers"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">खर्च का विवरण (ऑडियो रिकॉर्डिंग) *</label>
            
            {recordingState === 'idle' && (
              <button
                type="button"
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-gray-200 dark:border-dark-border hover:border-emerald-500 dark:hover:border-emerald-500 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-50/50 dark:bg-dark-bg/25"
              >
                <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5a6.5 6.5 0 0 0 6.5-6.5V9a6.5 6.5 0 0 0-13 0v3a6.5 6.5 0 0 0 6.5 6.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5v3.5M8 22h8" />
                </svg>
                <span>आवाज़ रिकॉर्ड करें (Record)</span>
              </button>
            )}

            {recordingState === 'recording' && (
              <div className="w-full flex flex-col items-center justify-center p-4 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">रिकॉर्डिंग चालू है...</span>
                  <span className="text-sm font-bold font-numbers text-gray-700 dark:text-emerald-100">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                  <span>रोकें (Stop)</span>
                </button>
              </div>
            )}

            {recordingState === 'preview' && audioUrl && (
              <div className="w-full flex flex-col items-center p-3 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl space-y-3">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>सफलतापूर्वक रिकॉर्ड हो गया!</span>
                </div>
                <AudioIconPlayer src={audioUrl} />
                <button
                  type="button"
                  onClick={clearRecording}
                  className="px-3 py-1 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>हटाएं और नया रिकॉर्ड करें</span>
                </button>
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            खर्च का हिसाब दर्ज करें
          </button>
        </form>
      )}

      {/* Expense List - 8 or 12 cols depending on isAdmin */}
      <div className={`${isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm space-y-4`}>
        <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-gray-100 dark:border-dark-border">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              खर्चों की सूची
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium max-w-xs md:max-w-sm">
              {mode === 'masjid' ? 'मस्जिद' : 'मदरसा'} के विकास व अन्य मदों में {timeFilter === 'month' ? 'इस महीने' : timeFilter === 'year' ? 'इस साल' : 'कुल'} किए गए खर्चों का लेखा-जोखा
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block">
              {timeFilter === 'month' ? 'इस महीने का खर्च' : timeFilter === 'year' ? 'इस साल का खर्च' : 'कुल खर्च'}
            </span>
            <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 font-numbers">
              ₹{totalExpense.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
            <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-semibold">
            कोई खर्च दर्ज नहीं है।
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500">
                  <th className="py-3 px-4">तारीख</th>
                  <th className="py-3 px-4">खर्च विवरण</th>
                  <th className="py-3 px-4 text-right">खर्च राशि</th>
                  {isAdmin && <th className="py-3 px-4 text-right">कार्रवाई</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm">
                {filteredExpenses.map((expense) => {
                  const isEditing = editingExpenseId === expense.id;
                  return (
                    <tr key={expense.id} className="hover:bg-rose-50/5 dark:hover:bg-rose-950/5 transition-colors">
                      {isEditing ? (
                        <>
                          {/* 1. Date Edit */}
                          <td className="py-2 px-4">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg glass-input border border-gray-200 dark:border-dark-border font-numbers"
                              required
                            />
                          </td>
                          {/* 2. Audio Edit */}
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              {editRecordingState === 'idle' && (
                                <div className="flex items-center gap-2">
                                  {editAudioBase64 ? (
                                    <AudioIconPlayer src={editAudioUrl || editAudioBase64} />
                                  ) : (
                                    <span className="text-[10px] text-gray-400">कोई ऑडियो नहीं है</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={startEditRecording}
                                    className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-all cursor-pointer"
                                    title="नया ऑडियो रिकॉर्ड करें"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5a6.5 6.5 0 0 0 6.5-6.5V9a6.5 6.5 0 0 0-13 0v3a6.5 6.5 0 0 0 6.5 6.5z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5v3.5M8 22h8" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                              
                              {editRecordingState === 'recording' && (
                                <div className="flex items-center gap-2 bg-rose-50/40 dark:bg-rose-950/10 p-1.5 rounded-lg border border-rose-200/50 dark:border-rose-900/30">
                                  <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping"></span>
                                  <span className="text-[10px] font-bold font-numbers text-gray-700 dark:text-emerald-100">
                                    {Math.floor(editRecordingDuration / 60)}:{(editRecordingDuration % 60).toString().padStart(2, '0')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={stopEditRecording}
                                    className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    रोकें
                                  </button>
                                </div>
                              )}

                              {editRecordingState === 'preview' && editAudioUrl && (
                                <div className="flex items-center gap-2">
                                  <AudioIconPlayer src={editAudioUrl} />
                                  <button
                                    type="button"
                                    onClick={clearEditRecording}
                                    className="p-1 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/30 rounded-lg cursor-pointer"
                                    title="हटाएं"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* 3. Amount Edit */}
                          <td className="py-2 px-4 text-right font-numbers">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-gray-500 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-24 px-2 py-1 text-xs rounded-lg glass-input text-right border border-gray-200 dark:border-dark-border font-numbers"
                                required
                              />
                            </div>
                          </td>
                          {/* 4. Actions Edit */}
                          <td className="py-2 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(expense.id)}
                                className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-all cursor-pointer"
                                title="सुरक्षित करें"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="p-1 bg-gray-200 hover:bg-gray-300 dark:bg-dark-border dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm transition-all cursor-pointer"
                                title="रद्द करें"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Display Read Only fields */}
                          <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-numbers font-semibold whitespace-nowrap">
                            {formatDate(expense.date)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-gray-700 dark:text-emerald-100">
                            {expense.audio ? (
                              <AudioIconPlayer src={expense.audio} />
                            ) : (
                              <span>{expense.purpose}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-numbers font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            ₹{expense.amount.toLocaleString('en-IN')}
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(expense)}
                                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/20 rounded-lg transition-all cursor-pointer"
                                  title="संपादित करें"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteExpense && onDeleteExpense(expense.id)}
                                  className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                                  title="हटाएं"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
