import React, { useState, useRef } from 'react';
import type { AppSettings } from '../db/mockData';

interface DonationFormProps {
  settings: AppSettings;
  mode: 'masjid' | 'madrasa';
  onSubmit: (data: { name: string; mobile: string; amount: number; screenshotUrl: string }) => Promise<void>;
  recentDonationsNode: React.ReactNode;
}

export const DonationForm: React.FC<DonationFormProps> = ({ settings, mode, onSubmit, recentDonationsNode }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !amount || !screenshot) {
      alert('कृपया सभी फ़ील्ड भरें और स्क्रीनशॉट अपलोड करें।');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name,
        mobile,
        amount: parseFloat(amount),
        screenshotUrl: screenshot
      });
      // Clear form
      setName('');
      setMobile('');
      setAmount('');
      setScreenshot('');
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      alert('कुछ तकनीकी गड़बड़ी हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine QR Code URL depending on mode settings
  const currentQrUrl = mode === 'masjid' 
    ? (settings.masjidQrUrl || settings.qrCodeUrl)
    : (settings.madrasaQrUrl || settings.qrCodeUrl);

  return (
    <section className="px-4 py-8 max-w-7xl mx-auto" id="donation-section">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-islamic-green dark:text-emerald-400 flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-5-5-8-8.5-8-12A5.5 5.5 0 019.5 3.5c1.7 0 3.3.8 4.5 2a6 6 0 014.5-2A5.5 5.5 0 0120 9c0 3.5-3 7-8 12z" />
          </svg>
          चंदा जमा करें
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          {mode === 'masjid' ? 'मस्जिद' : 'मदरसा'} के विकास व अन्य ज़रूरतों के लिए सहयोग करें
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Instructions / Payment Methods - 4 Cols */}
        <div className="lg:col-span-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 mb-4 pb-2 border-b border-gray-100 dark:border-dark-border">
            भुगतान के निर्देश
          </h3>

          <div className="flex flex-col items-center justify-center py-4 bg-emerald-50/50 dark:bg-emerald-950/15 rounded-2xl border border-emerald-500/10 mb-6">
            {/* Display QR Code */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-950/5 relative">
              <img
                src={currentQrUrl}
                alt="UPI QR Code"
                className="w-44 h-44 object-contain"
                onError={(e) => {
                  // Fallback if URL is broken or empty
                  e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${settings.upiId}&pn=${mode === 'masjid' ? 'Masjid' : 'Madrasa'}%20Fund`;
                }}
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
              QR कोड स्कैन कर सीधे भुगतान करें
            </p>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            {/* UPI ID */}
            <div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block mb-1">
                UPI आईडी
              </span>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg/60 border border-gray-100 dark:border-dark-border p-3 rounded-xl">
                <span className="text-sm font-numbers font-semibold text-islamic-green dark:text-emerald-400 select-all">
                  {settings.upiId}
                </span>
                <button
                  onClick={handleCopyUpi}
                  className="p-1.5 rounded-lg bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 hover:text-islamic-green dark:hover:text-emerald-400 shadow-sm border border-gray-200/50 dark:border-white/5 active:scale-90 transition-all"
                  title="कॉपी करें"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* WhatsApp Contact */}
            <div className="pt-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block mb-1.5">
                मदद या अन्य जानकारी हेतु WhatsApp
              </span>
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `अस्सलाम वालेकुम, मुझे ${mode === 'masjid' ? 'मस्जिद' : 'मदरसा'} चंदा रसीद के बारे में पूछना है।`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                </svg>
                <span>व्हाट्सएप पर संपर्क करें ({settings.whatsappNumber})</span>
              </a>
            </div>
          </div>
        </div>

        {/* Form - 5 Cols */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-6 shadow-sm relative"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 mb-6 pb-2 border-b border-gray-100 dark:border-dark-border">
            दान की जानकारी भेजें
          </h3>

          <div className="space-y-5">
            {/* Input Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100 mb-1.5">
                दाता का नाम <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="उदा. अहमद ख़ान"
                className="w-full px-4 py-3 rounded-xl text-sm glass-input"
                required
              />
            </div>

            {/* Input Mobile */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100 mb-1.5">
                मोबाइल नंबर <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="उदा. 9876543210"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl text-sm font-numbers glass-input"
                required
              />
            </div>

            {/* Input Amount */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100 mb-1.5">
                सहयोग रकम <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="उदा. 1000"
                  min={1}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-numbers glass-input"
                  required
                />
              </div>
            </div>

            {/* Upload Screenshot */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-emerald-100 mb-1.5">
                भुगतान स्क्रीनशॉट अपलोड <span className="text-rose-500">*</span>
              </label>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-emerald-400 border border-dashed border-gray-300 dark:border-emerald-800 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-mint transition-all text-xs font-bold shrink-0"
                >
                  <svg className="w-4 h-4 animate-bounce-short" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>फाइल चुनें</span>
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs font-semibold">
                  {fileName || 'कोई फाइल नहीं चुनी गई'}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  required
                />
              </div>

              {/* Live Preview of image */}
              {screenshot && (
                <div className="mt-3.5 relative w-28 h-28 rounded-xl border border-gray-200 p-1.5 bg-gray-50 dark:bg-dark-bg/50">
                  <img
                    src={screenshot}
                    alt="Receipt preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-md">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-islamic-green hover:bg-islamic-green-hover text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{submitting ? 'जानकारी भेजी जा रही है...' : 'जानकारी भेजें'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Recent Donations - 3 Cols */}
        <div className="lg:col-span-3 lg:pt-0">
          {recentDonationsNode}
        </div>
      </div>
    </section>
  );
};
