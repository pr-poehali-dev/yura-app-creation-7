import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Phone, User, Key, ArrowRight, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

type AuthStep = 'welcome' | 'phone' | 'code' | 'register' | 'complete';

const AuthScreen: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useStore();

  const handlePhoneSubmit = () => {
    if (!phone || phone.length < 8) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('code');
    }, 1500);
  };

  const handleCodeSubmit = () => {
    if (code.length !== 5) {
      setError('كود التحقق مكون من 5 أرقام');
      return;
    }
    setError('');
    setStep('register');
  };

  const handleRegister = async () => {
    if (!username || username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    if (!displayName) {
      setError('يرجى إدخال اسمك');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      register(username, displayName, password, phone);
      setStep('complete');
    } catch {
      setError('حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `
    w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white 
    placeholder-white/40 outline-none focus:border-[#2AABEE] focus:bg-white/15 
    transition-all duration-200 text-right text-base
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#0D2137] to-[#0D1117] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#2AABEE] rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">

          {/* Welcome Screen */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center"
            >
              {/* Logo */}
              <motion.div
                className="w-32 h-32 bg-gradient-to-br from-[#2AABEE] to-[#0088CC] rounded-[36px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#2AABEE]/30"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-white font-black text-6xl tracking-tight">K</span>
              </motion.div>

              <h1 className="text-white text-4xl font-bold mb-3">مرحباً في K</h1>
              <p className="text-white/60 text-base mb-2">المراسلة الآمنة والمشفرة</p>

              {/* Security Features */}
              <div className="grid grid-cols-3 gap-3 my-8">
                {[
                  { icon: Shield, label: 'تشفير E2E', desc: 'X25519' },
                  { icon: Lock, label: 'بروتوكول', desc: 'Double Ratchet' },
                  { icon: Key, label: 'توقيع', desc: 'Ed25519' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center"
                  >
                    <feature.icon className="w-6 h-6 text-[#2AABEE] mx-auto mb-2" />
                    <p className="text-white text-xs font-medium">{feature.label}</p>
                    <p className="text-white/40 text-[10px]">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('phone')}
                className="w-full bg-gradient-to-r from-[#2AABEE] to-[#0088CC] text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-[#2AABEE]/30 flex items-center justify-center gap-3"
              >
                ابدأ الآن
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              <p className="text-white/30 text-xs mt-6">
                بتسجيلك، توافق على سياسة الخصوصية والأمان
              </p>
            </motion.div>
          )}

          {/* Phone Step */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#2AABEE]/20 rounded-2xl flex items-center justify-center">
                  <Phone className="w-8 h-8 text-[#2AABEE]" />
                </div>
              </div>
              <h2 className="text-white text-2xl font-bold text-center mb-2">رقم هاتفك</h2>
              <p className="text-white/50 text-sm text-center mb-8">سنرسل لك كود تحقق</p>

              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+966 5xx xxx xxxx"
                className={inputClass}
                dir="ltr"
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm mt-2 text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePhoneSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#2AABEE] to-[#0088CC] text-white font-bold py-4 rounded-2xl mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>التالي <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Code Verification */}
          {step === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#2AABEE]/20 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#2AABEE]" />
                </div>
              </div>
              <h2 className="text-white text-2xl font-bold text-center mb-2">كود التحقق</h2>
              <p className="text-white/50 text-sm text-center mb-2">
                أرسلنا كوداً إلى <span className="text-[#2AABEE]">{phone}</span>
              </p>
              <p className="text-white/30 text-xs text-center mb-8">(استخدم: 12345 للتجربة)</p>

              <div className="flex gap-3 justify-center mb-6" dir="ltr">
                {[0, 1, 2, 3, 4].map(i => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={code[i] || ''}
                    onChange={e => {
                      const newCode = code.split('');
                      newCode[i] = e.target.value;
                      setCode(newCode.join(''));
                      if (e.target.value && i < 4) {
                        const next = document.getElementById(`code-${i + 1}`);
                        next?.focus();
                      }
                    }}
                    id={`code-${i}`}
                    className="w-12 h-14 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-bold outline-none focus:border-[#2AABEE] transition-all"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center mb-4">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCodeSubmit}
                className="w-full bg-gradient-to-r from-[#2AABEE] to-[#0088CC] text-white font-bold py-4 rounded-2xl"
              >
                تحقق
              </motion.button>
            </motion.div>
          )}

          {/* Register */}
          {step === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#2AABEE]/20 rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-[#2AABEE]" />
                </div>
              </div>
              <h2 className="text-white text-2xl font-bold text-center mb-2">إنشاء حسابك</h2>
              <p className="text-white/50 text-sm text-center mb-6">سيتم إنشاء مفاتيح التشفير تلقائياً</p>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block text-right">اسمك الكامل</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="محمد أحمد"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block text-right">اسم المستخدم</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2AABEE] font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className={`${inputClass} pl-10 text-left`}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block text-right">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pl-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block text-right">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm mt-3 text-center"
                >
                  {error}
                </motion.p>
              )}

              <div className="bg-[#2AABEE]/10 border border-[#2AABEE]/20 rounded-xl p-3 mt-4 flex items-center gap-3">
                <Lock className="w-4 h-4 text-[#2AABEE] shrink-0" />
                <p className="text-white/60 text-xs text-right">
                  سيتم توليد مفاتيح تشفير X25519 وEd25519 تلقائياً وتخزينها محلياً فقط
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#2AABEE] to-[#0088CC] text-white font-bold py-4 rounded-2xl mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ توليد المفاتيح...</span>
                  </div>
                ) : (
                  'إنشاء الحساب'
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
              </motion.div>
              <h2 className="text-white text-3xl font-bold mb-3">تم بنجاح! 🎉</h2>
              <p className="text-white/60 mb-2">تم إنشاء حسابك ومفاتيح التشفير</p>
              <p className="text-[#2AABEE] text-sm">حسابك محمي بتشفير عسكري المستوى</p>
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 1, delay: 1.5 }}
                className="mt-8"
              >
                <div className="w-8 h-8 border-2 border-[#2AABEE]/30 border-t-[#2AABEE] rounded-full animate-spin mx-auto" />
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthScreen;
