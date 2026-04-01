import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Shield, Bell, Lock, User, Moon, Sun, Smartphone,
  Key, Eye, EyeOff, ChevronRight, Check, Edit2, Save,
  Fingerprint, Clock, Wifi, Database, Trash2, Download,
  Info, ExternalLink, Copy, RefreshCw
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateKeyPair, generateSigningKeyPair } from '../../crypto/encryption';

interface SettingsPanelProps {
  onClose: () => void;
}

type SettingsSection = 'main' | 'profile' | 'security' | 'privacy' | 'notifications' | 'about';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { currentUser, updateProfile, theme, toggleTheme, toggleNotifications, toggleSound, notificationsEnabled, soundEnabled } = useStore();
  const [section, setSection] = useState<SettingsSection>('main');
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [screenLock, setScreenLock] = useState(false);

  const inputClass = `
    w-full bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-white 
    placeholder-white/30 outline-none focus:border-[#2AABEE] transition-all text-sm text-right
  `;

  const SettingRow: React.FC<{
    icon: React.ElementType;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: () => void;
    danger?: boolean;
    badge?: string;
  }> = ({ icon: Icon, iconColor = 'text-[#2AABEE]', title, subtitle, onClick, toggle, toggleValue, onToggle, danger, badge }) => (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      onClick={onClick || onToggle}
      className="flex items-center gap-4 px-4 py-3 cursor-pointer rounded-xl transition-colors"
    >
      <div className={`w-9 h-9 rounded-xl ${iconColor === 'text-[#2AABEE]' ? 'bg-[#2AABEE]/15' : iconColor.includes('red') ? 'bg-red-500/15' : iconColor.includes('green') ? 'bg-green-500/15' : iconColor.includes('purple') ? 'bg-purple-500/15' : iconColor.includes('orange') ? 'bg-orange-500/15' : 'bg-white/10'} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${danger ? 'text-red-400' : iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'} truncate`}>{title}</p>
        {subtitle && <p className="text-white/40 text-xs mt-0.5 truncate">{subtitle}</p>}
      </div>
      {badge && (
        <span className="bg-[#2AABEE] text-white text-xs px-2 py-0.5 rounded-full">{badge}</span>
      )}
      {toggle ? (
        <div
          className={`w-12 h-6 rounded-full transition-colors relative ${toggleValue ? 'bg-[#2AABEE]' : 'bg-white/20'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${toggleValue ? 'right-1' : 'left-1'}`} />
        </div>
      ) : onClick && (
        <ChevronRight className="w-4 h-4 text-white/30" />
      )}
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#17212B] rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {section !== 'main' && (
              <button onClick={() => setSection('main')} className="text-white/50 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <h2 className="text-white font-bold text-lg">
              {section === 'main' ? 'الإعدادات' :
               section === 'profile' ? 'الملف الشخصي' :
               section === 'security' ? 'الأمان' :
               section === 'privacy' ? 'الخصوصية' :
               section === 'notifications' ? 'الإشعارات' :
               'حول K'}
            </h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Main Settings */}
          {section === 'main' && (
            <div className="py-4">
              {/* User Card */}
              <div className="mx-4 mb-4 bg-gradient-to-br from-[#2AABEE]/20 to-[#0088CC]/10 border border-[#2AABEE]/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2AABEE] to-[#0088CC] flex items-center justify-center text-white font-black text-2xl">
                  {currentUser?.displayName?.[0] || 'K'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base truncate">{currentUser?.displayName}</h3>
                  <p className="text-[#2AABEE] text-sm">@{currentUser?.username}</p>
                  <p className="text-white/40 text-xs mt-1">{currentUser?.phone || 'لا يوجد هاتف'}</p>
                </div>
                <button onClick={() => setSection('profile')} className="p-2 bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 px-2">
                <SettingRow icon={User} title="الملف الشخصي" subtitle="الاسم، الصورة، الوصف" onClick={() => setSection('profile')} />
                <SettingRow icon={Shield} iconColor="text-green-400" title="الأمان" subtitle="التشفير، كلمة المرور" onClick={() => setSection('security')} badge="E2E" />
                <SettingRow icon={Eye} iconColor="text-purple-400" title="الخصوصية" subtitle="من يمكنه رؤيتك" onClick={() => setSection('privacy')} />
                <SettingRow icon={Bell} iconColor="text-orange-400" title="الإشعارات" subtitle="الأصوات والتنبيهات" onClick={() => setSection('notifications')} />
                <SettingRow icon={theme === 'dark' ? Sun : Moon} iconColor="text-yellow-400" title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'} toggle toggleValue={theme === 'dark'} onToggle={toggleTheme} />
                <SettingRow icon={Info} iconColor="text-[#2AABEE]" title="حول K" subtitle="الإصدار والمعلومات" onClick={() => setSection('about')} />
              </div>
            </div>
          )}

          {/* Profile Section */}
          {section === 'profile' && (
            <div className="py-4 px-4 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#2AABEE] to-[#0088CC] flex items-center justify-center text-white font-black text-4xl">
                    {currentUser?.displayName?.[0] || 'K'}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#2AABEE] rounded-full flex items-center justify-center">
                    <Edit2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-white/60 text-xs mb-2 block">الاسم الكامل</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder="اسمك الكامل"
                />
              </div>

              <div>
                <label className="text-white/60 text-xs mb-2 block">النبذة الشخصية</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="اكتب شيئاً عنك..."
                />
              </div>

              <div>
                <label className="text-white/60 text-xs mb-2 block">اسم المستخدم</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2AABEE] font-bold">@</span>
                  <input
                    type="text"
                    value={currentUser?.username || ''}
                    readOnly
                    className={`${inputClass} pr-10 opacity-60`}
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updateProfile({ displayName, bio });
                  setSection('main');
                }}
                className="w-full bg-gradient-to-r from-[#2AABEE] to-[#0088CC] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </motion.button>
            </div>
          )}

          {/* Security Section */}
          {section === 'security' && (
            <div className="py-4 space-y-2">
              {/* Encryption Info */}
              <div className="mx-4 mb-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h3 className="text-green-400 font-semibold text-sm">التشفير نشط</h3>
                </div>
                <div className="space-y-1">
                  {[
                    'X25519 - تبادل المفاتيح',
                    'XSalsa20-Poly1305 - تشفير الرسائل',
                    'Ed25519 - التوقيع الرقمي',
                    'Double Ratchet - السرية التقدمية',
                    'HMAC-SHA256 - تكامل البيانات',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-white/60 text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public Key */}
              <div className="mx-4">
                <label className="text-white/50 text-xs mb-2 block">مفتاحك العام</label>
                <div className="bg-white/5 rounded-xl p-3 relative">
                  <p className="text-[#2AABEE] text-xs font-mono break-all leading-relaxed" dir="ltr">
                    {currentUser?.publicKey?.slice(0, 64)}...
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser?.publicKey || '');
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="absolute top-2 left-2 p-1.5 bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="px-2 space-y-1">
                <SettingRow icon={Fingerprint} iconColor="text-blue-400" title="قفل الشاشة" subtitle="اقفل التطبيق بالبصمة" toggle toggleValue={screenLock} onToggle={() => setScreenLock(!screenLock)} />
                <SettingRow icon={Key} iconColor="text-yellow-400" title="التحقق بخطوتين" subtitle="أمان إضافي للحساب" toggle toggleValue={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
                <SettingRow icon={RefreshCw} iconColor="text-purple-400" title="تجديد مفاتيح التشفير" subtitle="توليد مفاتيح جديدة" onClick={() => {}} />
                <SettingRow icon={Eye} iconColor="text-[#2AABEE]" title="عرض المفتاح الخاص" subtitle="تأكد من حفظه في مكان آمن" onClick={() => setShowPrivateKey(!showPrivateKey)} />
              </div>

              {showPrivateKey && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mx-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                >
                  <p className="text-red-400 text-xs mb-2 font-semibold">⚠️ لا تشارك هذا المفتاح مع أحد!</p>
                  <p className="text-white/50 text-xs font-mono break-all" dir="ltr">
                    {showPrivateKey ? currentUser?.privateKey : '••••••••••••••••'}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Privacy Section */}
          {section === 'privacy' && (
            <div className="py-4 space-y-1 px-2">
              {[
                { icon: Eye, title: 'آخر ظهور', subtitle: 'الجميع', iconColor: 'text-blue-400' },
                { icon: User, title: 'صورة الملف الشخصي', subtitle: 'جهات الاتصال فقط', iconColor: 'text-green-400' },
                { icon: Info, title: 'النبذة الشخصية', subtitle: 'الجميع', iconColor: 'text-yellow-400' },
                { icon: Wifi, title: 'حالة الاتصال', subtitle: 'جهات الاتصال فقط', iconColor: 'text-purple-400' },
                { icon: Clock, title: 'الرسائل المحذوفة تلقائياً', subtitle: 'غير مفعل', iconColor: 'text-orange-400' },
              ].map((item, i) => (
                <SettingRow key={i} {...item} onClick={() => {}} />
              ))}
              <div className="mx-2 mt-4">
                <SettingRow icon={Trash2} iconColor="text-red-400" title="حذف جميع الرسائل" subtitle="لا يمكن التراجع" onClick={() => {}} danger />
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {section === 'notifications' && (
            <div className="py-4 space-y-1 px-2">
              <SettingRow icon={Bell} iconColor="text-orange-400" title="الإشعارات" toggle toggleValue={notificationsEnabled} onToggle={toggleNotifications} />
              <SettingRow icon={Smartphone} iconColor="text-blue-400" title="الأصوات" toggle toggleValue={soundEnabled} onToggle={toggleSound} />
              <SettingRow icon={Smartphone} iconColor="text-green-400" title="اهتزاز الجهاز" toggle toggleValue={true} onToggle={() => {}} />
            </div>
          )}

          {/* About Section */}
          {section === 'about' && (
            <div className="py-6 px-4 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#2AABEE] to-[#0088CC] rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-[#2AABEE]/30">
                <span className="text-white font-black text-4xl">K</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">تطبيق K</h3>
              <p className="text-[#2AABEE] text-sm mb-1">الإصدار 1.0.0</p>
              <p className="text-white/40 text-xs mb-6">المراسلة الآمنة والمشفرة</p>

              <div className="bg-white/5 rounded-2xl p-4 text-right space-y-3 mb-4">
                {[
                  { label: 'بروتوكول التشفير', value: 'Double Ratchet + X25519' },
                  { label: 'خوارزمية التشفير', value: 'XSalsa20-Poly1305' },
                  { label: 'التوقيع الرقمي', value: 'Ed25519' },
                  { label: 'تبادل المفاتيح', value: 'X25519 (Curve25519)' },
                  { label: 'مستوى الأمان', value: '256-bit' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[#2AABEE] text-xs">{item.value}</span>
                    <span className="text-white/50 text-xs">{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-white/30 text-xs">
                جميع البيانات مشفرة محلياً ولا يمكن الوصول إليها من الخوادم
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPanel;
