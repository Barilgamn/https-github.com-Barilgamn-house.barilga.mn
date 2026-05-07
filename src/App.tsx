/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Info, Phone, Calendar, MapPin, Menu, X, Construction, BrickWall, Sofa, Trees, Cog, Smartphone, CreditCard, Tractor, ArrowUp, Zap, Home, Fan, Sun, Facebook, Twitter } from 'lucide-react';
import { translations, Lang } from './i18n';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, serverTimestamp, doc, getDocFromServer, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Exhibitor {
  id: string;
  name: string;
  activity: string;
  booth: string;
}

interface Schedule {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
}

export default function App() {
  const [lang, setLang] = useState<Lang>('mn');
  const d = translations[lang];

  const [selectedBooth, setSelectedBooth] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const lastScrollY = useRef(0);
  const bookingRef = useRef<HTMLElement>(null);
  const companiesRef = useRef<HTMLDivElement>(null);

  const [companiesPage, setCompaniesPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch exhibitors & schedules
  React.useEffect(() => {
    const qExh = query(collection(db, 'exhibitors'), orderBy('createdAt', 'desc'));
    const unsubscribeExh = onSnapshot(qExh, (snapshot) => {
      const data: Exhibitor[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Exhibitor);
      });
      setExhibitors(data);
    }, (error) => {
      console.error("Failed to load exhibitors:", error);
    });

    const qSch = query(collection(db, 'schedules'), orderBy('createdAt', 'asc'));
    const unsubscribeSch = onSnapshot(qSch, (snapshot) => {
      const data: Schedule[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Schedule);
      });
      setSchedules(data);
    }, (error) => {
      console.error("Failed to load schedules:", error);
    });

    return () => { unsubscribeExh(); unsubscribeSch(); };
  }, []);

  // Connection Test & Page View Tracking
  React.useEffect(() => {
    async function trackPageView() {
      try {
        await addDoc(collection(db, 'page_views'), {
          path: window.location.pathname,
          userAgent: window.navigator.userAgent.substring(0, 500),
          createdAt: serverTimestamp()
        });
      } catch (error) {
        // Silently fail page tracking
      }
    }
    trackPageView();

    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);


  // Countdown State
  const targetDate = new Date('2026-05-15T00:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }
      
      if (currentScrollY > 400) {
        setIsScrollTopVisible(true);
      } else {
        setIsScrollTopVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hardcodedExhibitors = [
    { name: "Mecc solar Mongolia", activity: "Сэргээгдэх эрчим хүч", booth: "A15" },
    { name: "Монкабель системс ХХК", activity: "Цахилгаан, холбооны кабель", booth: "A16" },
    { name: "Нартын Голомт ХХК", activity: "Барилга угсралт", booth: "A17" },
    { name: "Централ Рич Монголиа ХХК", activity: "Барилгын материал", booth: "A20" },
    { name: "Хот байгуулалт, хотын стандартын газар", activity: "Төрийн байгууллага", booth: "A29" },
    { name: "Нийслэлийн агаар, орчны бохирдолтой тэмцэх газар", activity: "Төрийн байгууллага", booth: "A30" },
    { name: "КЛАЙМАКС ИНТЕРНЭЙШНЛ ХХК", activity: "Барилгын тоног төхөөрөмж", booth: "A31, A71" },
    { name: "ГЭРЭЛТ ӨРГӨӨ ХАУС ХХК", activity: "Амины орон сууц, хаус барилга", booth: "A33" },
    { name: "ЭЙ АР ТИ ЮУ ХХК", activity: "Архитектур, интерьер", booth: "A34" },
    { name: "БУЯНТ СУТАЙН ХИШИГ ХХК", activity: "Барилга угсралт", booth: "A35" },
    { name: "АГЛУТ ХХК", activity: "Инжинер, төсөл", booth: "A36" },
    { name: "ХАНГАЛ КОНСТРАКШН ХХК", activity: "Барилга угсралт", booth: "A37" },
    { name: "ЭНЕРЖИ КОНСТРАКШН ТРЕЙД ХХК", activity: "Эрчим хүч, барилга угсралт", booth: "A41" },
    { name: "ЭС ТИ КРЕАТИВ ХХК", activity: "Интерьер дизайн", booth: "A59" },
    { name: "ЕВРОЗИГИ ИНЖЕНЕРИНГ ХХК", activity: "Барилгын материал", booth: "A69, A81" },
    { name: "ЭС ЭН ДИ ХХК", activity: "Барилга угсралт", booth: "A73" },
    { name: "БОЛД ЧИН ГЭГЭЭ ХХК", activity: "Цахилгаан, гэрэлтүүлэг", booth: "A75" },
    { name: "ЭН СИ ДИ ПРЕКОН ХХК", activity: "Угсармал барилга", booth: "ЗАДГАЙ 1" },
    { name: "Өөрийн Байшин Үндэсний Хөтөлбөр ГҮТББ", activity: "Зөвлөх үйлчилгээ", booth: "ЗАДГАЙ 2" },
    { name: "ТӨГС ХУРЦ СИСТЕМС ХХК", activity: "Инженерийн шугам сүлжээ", booth: "ЗАДГАЙ 3" }
  ];

  const allExhibitors = [...hardcodedExhibitors, ...exhibitors];
  const bookedBooths = allExhibitors.map(e => e.booth.split(',').map(b => b.trim())).flat();
  
  const sponsorBooths = ['A4', 'A5', 'A6', 'A7', 'A19', 'A20', 'A29', 'A30', 'A31', 'A32', 'A41', 'A42'];

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: d.nav[0], href: '#' },
    { name: d.nav[1], href: '#companies' },
    { name: d.nav[2], href: '#visitor', isVisitor: true },
    { name: d.nav[3], href: '#agenda' },
    { name: d.nav[4], href: '#contact' },
  ];

  const handleBoothClick = (booth: string) => {
    if (!bookedBooths.includes(booth)) {
      setSelectedBooth(booth);
      setIsModalOpen(true);
    }
  };

  const renderBooth = (booth: string) => {
    const isBooked = bookedBooths.includes(booth);
    const isSponsor = sponsorBooths.includes(booth);
    const isSelected = selectedBooth === booth;

    let btnClass = "relative flex flex-col items-center justify-center border transition-all cursor-pointer hover:shadow-md shrink-0 ";
    btnClass += "h-12 w-12 sm:h-14 sm:w-14 text-xs sm:text-sm font-bold ";

    if (isBooked && isSponsor) {
      btnClass += "bg-[#a8deb6] border-[#8bc39b] text-slate-800 cursor-not-allowed opacity-80";
    } else if (isBooked) {
      btnClass += "bg-white border-slate-300 text-slate-800 cursor-not-allowed opacity-80 text-opacity-50";
    } else if (isSponsor) {
      if (isSelected) {
        btnClass += "bg-emerald-500 border-emerald-600 text-white shadow-md scale-105 z-10";
      } else {
        btnClass += "bg-[#a8deb6] border-[#8bc39b] text-slate-800 hover:border-emerald-500 hover:bg-[#8ccb9c]";
      }
    } else if (isSelected) {
      btnClass += "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/30 shadow-md scale-105 z-10";
    } else {
      btnClass += "bg-white border-slate-300 text-slate-700 hover:border-emerald-400 hover:text-emerald-700";
    }

    return (
      <button
        key={booth}
        type="button"
        disabled={isBooked}
        onClick={() => handleBoothClick(booth)}
        className={btnClass}
        title={isBooked ? "Захиалагдсан" : isSponsor ? "Спонсорын талбай" : "Боломжтой талбай"}
      >
        <span>{booth}</span>
        <span className="text-[9px] sm:text-[10px] font-normal leading-none mt-0.5 opacity-80 z-0">3X3</span>
        {isSelected && (
          <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-white z-10" strokeWidth={3} />
        )}
        {isBooked && (
          <Check className="absolute z-10 text-amber-500 w-8 h-8 sm:w-10 sm:h-10" strokeWidth={3} />
        )}
      </button>
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      companyName: formData.get('companyName') as string,
      contactName: formData.get('contactName') as string,
      phone: formData.get('phone') as string,
      boothId: selectedBooth,
      createdAt: serverTimestamp(),
    };

    const path = 'booth_bookings';
    try {
      await addDoc(collection(db, path), data);
      alert('Таны талбай захиалах хүсэлтийг амжилттай хүлээж авлаа. Бид удахгүй холбогдох болно.');
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen selection:bg-emerald-200">
      {/* NavBar */}
      <nav className={`border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/5 transition-all duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="https://www.barilga.mn/files/aa08e06d18a7412eb59bb69e4ef6fe29.png?d=0" alt="АМИНЫ ОРОН СУУЦ ЭКСПО 2026" className="h-14 sm:h-16 lg:h-20 w-auto" />
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-6 text-center">
             {navLinks.map((link, idx) => {
               if (link.isVisitor) {
                 return (
                   <button key={idx} onClick={() => setIsVisitorModalOpen(true)} className="text-white/90 hover:text-white font-medium text-sm transition-colors uppercase tracking-wide cursor-pointer whitespace-nowrap">
                     {link.name}
                   </button>
                 );
               }
               return (
                 <a key={idx} href={link.href} className="text-white/90 hover:text-white font-medium text-sm transition-colors uppercase tracking-wide whitespace-nowrap">
                   {link.name}
                 </a>
               );
             })}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="bg-slate-800 text-white border border-slate-700 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="mn">MN</option>
              <option value="en">EN</option>
              <option value="cn">CN</option>
              <option value="ru">RU</option>
            </select>
            <button onClick={scrollToBooking} className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 py-2.5 flex items-center justify-center rounded-lg font-bold transition-colors text-sm shadow-sm active:scale-95 whitespace-nowrap">
              {d.bookBtn}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 focus:outline-none">
               {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 border-t border-slate-800 shadow-inner">
            <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
              <div className="flex justify-end px-3 pb-2 mt-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-md px-2 py-1 outline-none text-sm"
                >
                  <option value="mn">Mongolian</option>
                  <option value="en">English</option>
                  <option value="cn">Chinese</option>
                  <option value="ru">Russian</option>
                </select>
              </div>
              {navLinks.map((link, idx) => {
                if (link.isVisitor) {
                  return (
                    <button key={idx} onClick={() => { setIsMobileMenuOpen(false); setIsVisitorModalOpen(true); }} className="text-white block w-full px-3 py-3 rounded-md text-base font-medium hover:bg-white/10 transition-colors uppercase tracking-wide text-center">
                      {link.name}
                    </button>
                  );
                }
                return (
                  <a key={idx} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-white block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10 transition-colors uppercase tracking-wide text-center">
                    {link.name}
                  </a>
                );
              })}
              <div className="pt-4 px-3">
                <button onClick={scrollToBooking} className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 px-5 py-3 flex items-center justify-center rounded-lg font-bold transition-colors text-base shadow-sm">
                  {d.bookBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative w-full bg-[#f8fafc] py-28 sm:py-36 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          <motion.span 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-8 tracking-wide shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {d.heroBadge}
          </motion.span>
          <h1 className="font-space text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1] text-center flex flex-row justify-center items-center flex-wrap gap-x-3 sm:gap-x-4">
            <span>{d.heroTitle1}</span> <span className="text-amber-500 relative inline-block">
              {d.heroTitle2}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-amber-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" opacity="0.5"></path></svg>
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl leading-relaxed">
            {d.heroDesc}
          </p>

          {/* Floating Badges */}
          <motion.div 
            initial={{ opacity: 0, x: -30, rotate: -5 }} 
            animate={{ opacity: 1, x: 0, rotate: 0 }} 
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute top-[35%] -left-4 lg:-left-20 xl:-left-32 hidden md:flex flex-col items-center bg-white/40 backdrop-blur-md p-4 lg:p-5 rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_rgb(0,0,0,0.08)] z-20 group transition-all hover:bg-white/50"
          >
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-emerald-100/50 rounded-full flex items-center justify-center mb-2 lg:mb-3 text-emerald-600 relative overflow-hidden group-hover:bg-emerald-200/50 transition-colors">
              <Fan className="w-8 h-8 lg:w-10 lg:h-10 animate-[spin_3s_linear_infinite]" strokeWidth={1.5} />
            </div>
            <span className="font-space text-[10px] lg:text-[11px] font-bold text-slate-800 uppercase tracking-widest text-center max-w-[80px] lg:max-w-[100px] leading-snug">
              {d.renewableBadge}
            </span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30, rotate: 5 }} 
            animate={{ opacity: 1, x: 0, rotate: 0 }} 
            transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute top-[50%] -right-4 lg:-right-20 xl:-right-32 hidden md:flex flex-col items-center bg-white/40 backdrop-blur-md p-4 lg:p-5 rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_rgb(0,0,0,0.08)] z-20 group transition-all hover:bg-white/50"
          >
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-amber-100/50 rounded-full flex items-center justify-center mb-2 lg:mb-3 text-amber-600 relative group-hover:bg-amber-200/50 transition-colors">
              <div className="absolute inset-0 bg-amber-300 rounded-full animate-ping opacity-20"></div>
              <Sun className="w-8 h-8 lg:w-10 lg:h-10 animate-[spin_8s_linear_infinite]" strokeWidth={1.5} />
            </div>
            <span className="font-space text-[10px] lg:text-[11px] font-bold text-slate-800 uppercase tracking-widest text-center max-w-[80px] lg:max-w-[100px] leading-snug">
              {d.energyBadge}
            </span>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mb-12 text-slate-700 font-medium bg-white p-4 sm:px-6 rounded-2xl shadow-sm border border-emerald-100/50">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>2026.05.15 &ndash; 05.17</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300" />
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>&quot;Барилгачин&quot; худалдааны төв</span>
            </div>
          </div>

          <button onClick={scrollToBooking} className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-amber-400/20 active:scale-95 flex items-center justify-center">
            {d.bookBtn}
          </button>

          {/* Countdown Timer */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 w-full max-w-4xl"
          >
            <h3 className="font-space text-slate-500 font-bold uppercase tracking-widest mb-6 text-sm sm:text-base">{d.countdownTitle}</h3>
            <div className="flex justify-center gap-3 sm:gap-6 text-slate-800">
              {[
                { value: timeLeft.days, label: d.time[0] },
                { value: timeLeft.hours, label: d.time[1] },
                { value: timeLeft.minutes, label: d.time[2] },
                { value: timeLeft.seconds, label: d.time[3] }
              ].map((timeData, index) => (
                <div key={index} className="flex flex-col items-center bg-white p-4 sm:p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-w-[5rem] sm:min-w-[6rem] md:min-w-[7rem] relative overflow-hidden group">
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  <span className="font-space text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 mb-1">{timeData.value}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">{timeData.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Context / Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { stat: "465,059", subtitle: undefined, label: d.statsTitle1, color: "bg-blue-50 text-blue-950 border-blue-100" },
            { stat: "50.1%", subtitle: "(216,989)", label: d.statsTitle2, color: "bg-emerald-50 text-emerald-950 border-emerald-100" },
            { stat: "90%", subtitle: "(195,000+)", label: d.statsTitle3, color: "bg-amber-50 text-amber-950 border-amber-100" },
          ].map((item, idx) => (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: idx * 0.1 }} key={idx} className={`p-8 rounded-3xl border ${item.color} flex flex-col items-center text-center relative overflow-hidden`}>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              <span className="text-4xl md:text-5xl font-black mb-2 tracking-tight z-10">{item.stat}</span>
              {item.subtitle && <span className="text-lg font-bold opacity-80 mb-2 z-10">{item.subtitle}</span>}
              <span className="text-base font-semibold opacity-90 mt-2 z-10">{item.label}</span>
            </motion.div>
          ))}
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex w-16 h-1.5 bg-emerald-500 rounded-full mb-8" />
          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-medium">
            {d.statsDesc}
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-[#0ba048] py-24 px-4 sm:px-6 lg:px-8 border-y border-emerald-700">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-space text-3xl md:text-4xl font-bold text-center mb-16 text-white tracking-tight">{d.categoriesTitle}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { image: "https://plus.unsplash.com/premium_photo-1681823643449-3c3d99541b0b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aG91c2UlMjBjb25zdHJ1Y3Rpb258ZW58MHx8MHx8fDA%3D", title: d.categories[0] },
              { image: "https://acropolis-wp-content-uploads.s3.us-west-1.amazonaws.com/best-materials-to-build-a-house-hero-1.webp", title: d.categories[1] },
              { image: "https://www.clarkson.edu/sites/default/files/2023-06/Electrical-Engineering-Hero-1600x900.jpg", title: d.categories[2] },
              { image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: d.categories[3] },
              { image: "https://cdn.prod.website-files.com/5be0e638fd286f0a1f9b479d/61e892534cb5921beb88451a_YeeqvGIfS0b4f5f4pP-jp_EHRhvIlf4iADaDOylrRRypXRKmQOfnpRAetgtMEUgosFd9pvccaXiUb-GjAnnBLthU7kXIFTALV72bkJKv2xq3PCuG0L2f8naBEQxx8xsrCPTm5fmz.png", title: d.categories[4] },
              { image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", title: d.categories[5] }
            ].map((cat, idx) => (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: idx * 0.05 }} key={idx} className="relative overflow-hidden rounded-3xl shadow-sm hover:shadow-lg transition-[transform,shadow] hover:-translate-y-1 group min-h-[220px] flex items-end">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                  style={{ backgroundImage: `url(${cat.image})` }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                <div className="relative z-10 p-6 md:p-8 w-full border-t border-white/10 mt-auto backdrop-blur-[2px]">
                  <h3 className="font-bold text-white leading-snug drop-shadow-md text-lg">{cat.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floor Plan & Booking */}
      <section id="booking" ref={bookingRef} className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="mb-16 text-center">
          <h2 className="font-space text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">{d.bookingTitle}</h2>
          <p className="text-slate-600 text-lg">{d.bookingDesc}</p>
        </div>

        <div className="flex flex-col gap-12 items-center w-full">
          {/* Prices and Legend */}
          <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center gap-8 mb-4">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 sm:gap-8 text-slate-700 bg-slate-50 px-8 py-5 rounded-3xl border border-slate-200 shadow-sm w-full md:w-auto">
               <div className="flex flex-col text-center md:text-left">
                 <span className="font-medium text-sm text-slate-500">{d.boothA}</span>
                 <span className="text-2xl font-bold text-slate-900 tracking-tight">80,000₮</span>
               </div>
               <div className="hidden md:block w-px h-12 bg-slate-200"></div>
               <div className="block md:hidden h-px w-full bg-slate-200 my-2"></div>
               <div className="flex flex-col text-center md:text-left">
                 <span className="font-medium text-sm text-slate-500">{d.boothEmpty}</span>
                 <span className="text-2xl font-bold text-slate-900 tracking-tight">40,000₮</span>
               </div>
            </div>
            
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex-shrink-0 bg-[#a8deb6] border border-[#8bc39b]"></div>
                <span className="text-sm font-semibold text-slate-700">{d.boothSponsor}</span>
              </div>
              <div className="flex items-center gap-3 relative">
                <div className="w-6 h-6 rounded flex-shrink-0 bg-white border border-slate-300 flex items-center justify-center">
                  <Check className="w-5 h-5 text-amber-500" strokeWidth={3} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{d.boothBooked}</span>
              </div>
            </div>
          </div>

          {/* Interactive Floor Plan */}
          <div className="bg-slate-50 p-4 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm w-full overflow-x-auto relative min-h-[500px]">
            <div className="min-w-[900px] lg:w-max lg:mx-auto flex flex-col items-center py-8">
              
              {/* STAGE & Top Row */}
              <div className="flex gap-12 justify-center items-end mb-12 relative w-full px-12">
              
                <div className="flex flex-col items-center">
                  <div className="flex bg-white">
                    {['A1', 'A2', 'A3', 'A4', 'A5'].map(renderBooth)}
                  </div>
                  <span className="text-xs text-slate-500 mt-2">Санхүүгийн үйлчилгээ</span>
                </div>
                
                <div className="flex items-center justify-center bg-[#0ba14a] text-white font-bold text-xl w-48 h-20 mb-6 shadow-md border-2 border-emerald-600 rounded-sm leading-tight text-center">
                  STAGE <br /> 8X5
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex bg-white">
                    {['A6', 'A7', 'A8', 'A9', 'A10'].map(renderBooth)}
                  </div>
                  <span className="text-xs text-slate-500 mt-2">Санхүүгийн үйлчилгээ</span>
                </div>
              </div>

              {/* Middle Row */}
              <div className="flex gap-16 justify-center w-full mb-12">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-1">Сэргээгдэх эрчим хүч</span>
                  <div className="flex flex-col bg-white">
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+11}`).map(renderBooth)}
                    </div>
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+21}`).map(renderBooth)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">Гадна тохижилт</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-1">Амины орон сууц / хаус барилга</span>
                  <div className="flex flex-col bg-white">
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+31}`).map(renderBooth)}
                    </div>
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+41}`).map(renderBooth)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">Ухаалаг гэр (Smart home)</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex gap-16 justify-center w-full">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-1">Дотоод засал, интерьер</span>
                  <div className="flex flex-col bg-white">
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+51}`).map(renderBooth)}
                    </div>
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+61}`).map(renderBooth)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">Инженерийн шийдэл</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500 mb-1">Барилгын материал</span>
                  <div className="flex flex-col bg-white">
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+71}`).map(renderBooth)}
                    </div>
                    <div className="flex">
                      {Array.from({length: 10}, (_, i) => `A${i+81}`).map(renderBooth)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">Барилгын тоног төхөөрөмж</span>
                </div>
              </div>

            </div>
          </div>

          {/* Booking Form */}
        </div>

        {/* Participating Companies Section */}
        <div id="companies" ref={companiesRef} className="w-full mt-24 scroll-mt-24">
          <div className="text-center mb-12">
            <h3 className="font-space text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">{d.companiesTitle}</h3>
            <p className="text-slate-600">{d.companiesDesc}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allExhibitors.map((company, idx) => (
              <div key={idx} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col items-center justify-center text-center gap-2 group h-full">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{company.name}</h4>
                  <p className="text-emerald-600 text-sm font-medium">{company.activity}</p>
                  <p className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold inline-block mt-3 border border-slate-200 shadow-sm">Талбай: {company.booth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-slate-900 p-8 md:p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden w-full max-w-xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors z-20">
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
            <h3 className="text-2xl font-bold mb-8 relative z-10 w-11/12">Талбай захиалах хүсэлт</h3>
            <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-300">Компанийн нэр</label>
                 <input required name="companyName" type="text" placeholder="Таны компани ХХК" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-300">Холбогдох хүний нэр</label>
                 <input required name="contactName" type="text" placeholder="Бат, Болд..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-300">Утасны дугаар</label>
                 <input required name="phone" type="tel" placeholder="9911..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all" />
               </div>

               <div className="space-y-2 pb-4">
                 <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                   <span>Сонгосон талбай</span>
                 </label>
                 <div className="w-full rounded-xl px-4 py-4 font-bold text-lg flex items-center transition-colors border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                   Талбай: {selectedBooth}
                 </div>
               </div>

               <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center transition-all bg-amber-400 hover:bg-amber-500 text-slate-900 focus:ring-4 focus:ring-amber-400/30 active:scale-[0.98] shadow-lg shadow-amber-400/20 disabled:opacity-50">
                 {isSubmitting ? 'Илгээж байна...' : 'Талбай захиалах хүсэлт илгээх'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Visitor Form Modal */}
      {isVisitorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsVisitorModalOpen(false)}></div>
          <div className="bg-slate-900 p-8 md:p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden w-full max-w-xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button type="button" onClick={() => setIsVisitorModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors z-20">
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
            <h3 className="text-2xl font-bold mb-8 relative z-10 w-11/12">Үзэгчийн бүртгэл</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              const formData = new FormData(e.target as HTMLFormElement);
              const data = {
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                phone: formData.get('phone') as string,
                email: formData.get('email') as string,
                createdAt: serverTimestamp(),
              };

              const path = 'visitor_registrations';
              try {
                await addDoc(collection(db, path), data);
                alert('Таны үзэгчийн бүртгэлийг амжилттай хүлээж авлаа. Үзэсгэлэнд тавтай морилно уу!');
                setIsVisitorModalOpen(false);
              } catch (error) {
                handleFirestoreError(error, OperationType.CREATE, path);
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-6 relative z-10">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-300">Овог</label>
                   <input required name="lastName" type="text" placeholder="Овог" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-300">Нэр</label>
                   <input required name="firstName" type="text" placeholder="Нэр" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-300">Утасны дугаар</label>
                 <input required name="phone" type="tel" placeholder="9911..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
               </div>
               <div className="space-y-2 pb-4">
                 <label className="text-sm font-medium text-slate-300">И-мэйл хаяг</label>
                 <input required name="email" type="email" placeholder="example@gmail.com" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
               </div>

               <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center transition-all bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-4 focus:ring-emerald-500/30 active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                 {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Organizers Section */}
      <section className="py-24 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 text-center mb-8">{d.organizersMain}</h3>
            <a href="https://www.barilga.mn/" target="_blank" rel="noopener noreferrer" className="w-72 h-28 bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] flex items-center justify-center mx-auto border border-slate-100 transition-transform hover:-translate-y-1">
               <img src="https://i0.wp.com/barilgaexpo.mn/wp-content/uploads/2024/06/Barilga.mn-shuud-ashiglah-logo-Copy-Copy-2-1.png?resize=2048%2C568&ssl=1" alt="АМИНЫ ОРОН СУУЦ ЭКСПО 2026 ерөнхий зохион байгуулагч" className="w-56 h-auto" />
            </a>
          </div>

          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 text-center mb-8">{d.organizersCo}</h3>
            <div className="flex flex-wrap justify-center gap-6 lg:gap-8 max-w-6xl mx-auto">
               {[
                 { name: "ХОТ БАЙГУУЛАЛТ, БАРИЛГА, ОРОН СУУЦЖУУЛАЛЫН ЯАМ", logo: "https://mongolia.gov.mn/uploads/201909/news/files/84ea40d97d5e807c0bc54a3b4a633e0d.jpeg", url: "https://mcud.gov.mn/" },
                 { name: "МОНГОЛЫН БАРИЛГЫН ИНЖЕНЕРҮҮДИЙН ХОЛБОО", logo: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://mace.org.mn&size=128", url: "https://mace.org.mn/" },
                 { name: "БАРИЛГЫН ХӨГЖЛИЙН ТӨВ", logo: "https://i0.wp.com/barilgaexpo.mn/wp-content/uploads/2025/10/Untitled-1.png?w=800&ssl=1", url: "https://barilga.gov.mn/" },
                 { name: "АМИНЫ ОРОН СУУЦНЫ ИННОВАЦ ХӨГЖЛИЙН ТӨВ", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTqki7mgt-BefzkfYKG_QEVLpvEkh8pPO89A&s", url: "https://www.facebook.com/miniiaminioronsuuts/" },
                 { name: "MONGOLIAN GREEN BUILDING COUNCIL", logo: "https://mgbc.mn/wp-content/uploads/2025/02/cropped-favicon-1.png", url: "https://mgbc.mn/" },
                 { name: "БАРИЛГАЧИН ХУДАЛДААНЫ ТӨВ", logo: "https://i0.wp.com/barilgaexpo.mn/wp-content/uploads/2024/06/barilgachinnnnn.png?w=600&ssl=1", url: "https://barilgachin.mn/" }
               ].map((org, i) => (
                 <a key={i} href={org.url} target="_blank" rel="noopener noreferrer" className="w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.08)] flex flex-col items-center justify-center p-4 sm:p-6 text-center border border-slate-100 transition-transform hover:-translate-y-1 overflow-hidden gap-3 cursor-pointer">
                   {org.logo ? (
                     <>
                       <div className="flex-1 flex items-center justify-center w-full min-h-[60%]">
                         <img src={org.logo} alt={org.name} className="max-w-[120px] sm:max-w-[140px] max-h-20 sm:max-h-24 object-contain" />
                       </div>
                       <p className="font-bold text-[10px] sm:text-[11px] text-slate-800 uppercase leading-snug line-clamp-3">{org.name}</p>
                     </>
                   ) : (
                     <p className="font-bold text-sm sm:text-base text-slate-800 uppercase leading-relaxed">{org.name}</p>
                   )}
                 </a>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Agenda Section */}
      <section id="agenda" className="py-24 bg-slate-50 scroll-mt-20 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-space text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              {d.agendaTitle}
            </h2>
            <p className="text-lg text-slate-600">
              {d.agendaDesc}
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[5.5rem] sm:before:ml-[8.5rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {(schedules.length > 0 ? schedules : [
                { time: "09:00 - 10:00", title: "Бүртгэл болон хүлээн авалт", desc: "Үзэсгэлэнд оролцогчдын бүртгэл болон мандат олгох", id: "1" },
                { time: "10:00 - 11:30", title: "Нээлтийн үйл ажиллагаа", desc: "Зохион байгуулагч болон албаны хүмүүсийн нээлтийн үг", id: "2" },
                { time: "11:30 - 12:30", title: "Үзэсгэлэнтэй танилцах", desc: "Асар болон бүтээгдэхүүн, үйлчилгээтэй танилцах", id: "3" },
                { time: "12:30 - 13:30", title: "Цайны цаг", desc: "Оролцогчид болон зочдод зориулсан хөнгөн зууш, нетворгинг", id: "4" },
                { time: "13:30 - 15:30", title: "Салбар хуралдаан", desc: "Амины орон сууц, ногоон барилгын чиг хандлага сэдэвт хэлэлцүүлэг", id: "5" },
                { time: "15:30 - 17:30", title: "B2B уулзалтууд", desc: "Худалдан авагч болон ханган нийлүүлэгчдийн ганцаарчилсан уулзалтууд", id: "6" },
                { time: "18:00", title: "Тухайн өдрийн хаалт", desc: "", id: "7" },
              ]).map((item: any, idx) => (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 group-hover:bg-emerald-500 group-hover:scale-110 text-slate-500 group-hover:text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm transition-all duration-300 z-10 font-bold ml-[4.3rem] sm:ml-[7.3rem] md:ml-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                  </div>
                  
                  <div className="w-[calc(100%-8rem)] sm:w-[calc(100%-11rem)] md:w-[calc(50%-2.5rem)] pb-4 md:pb-0">
                    <div className={`p-6 rounded-[2rem] bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all ${idx % 2 === 0 ? 'md:text-right md:mr-4' : 'md:text-left md:ml-4'}`}>
                      <div className="flex flex-col gap-1 mb-2">
                        <span className={`font-space font-bold text-sm tracking-widest uppercase text-emerald-500 mb-1`}>{item.time} {item.date ? `(${item.date})` : ''}</span>
                        <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                      </div>
                      {(item.description || item.desc) && <p className="text-slate-600 leading-relaxed">{item.description || item.desc}</p>}
                    </div>
                  </div>
                  
                  {/* Empty spacer for the other side on desktop */}
                  <div className="hidden md:block w-[calc(50%-2.5rem)]"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Map Section */}
      <section id="contact" className="bg-slate-950 border-t border-slate-800 scroll-mt-20 overflow-hidden relative">
        <div className="flex flex-col lg:flex-row">
          
          {/* Left Side: Contact Info */}
          <div className="w-full lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center bg-slate-950 relative"
               style={{
                 backgroundImage: 'url("https://www.barilga.mn/files/9350f25743c84db482c07815432405f7.png?d=0")',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center bottom',
                 backgroundBlendMode: 'overlay',
               }}
          >
            <div className="absolute inset-0 bg-slate-950/80"></div>
            
            <div className="relative z-10 max-w-md mx-auto lg:mx-0 w-full lg:pr-10">
              <div className="inline-block bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full mb-8 border border-slate-800">
                <span className="text-slate-300 text-xs tracking-wider uppercase font-bold">{d.contactBadge}</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Холбоо барих</h2>
              
              <div className="space-y-6 mb-12">
                <a href="tel:99907816" className="flex items-center gap-5 text-slate-300 hover:text-emerald-400 transition-colors group">
                  <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all shadow-lg">
                    <Phone className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
                  </div>
                  <span className="font-mono text-3xl md:text-4xl font-bold">99907816</span>
                </a>
              </div>

              <div>
                <h3 className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-4">Биднийг дагах</h3>
                <div className="flex items-center gap-4">
                  <a href="https://www.facebook.com/barilgamn" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-slate-800 transition-colors border border-slate-800 hover:border-blue-500/50 shadow-md">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="https://x.com/Barilga_MN" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 hover:border-slate-500/50 shadow-md">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Map */}
          <div className="w-full lg:w-1/2 h-[450px] lg:h-auto min-h-[500px]">
            <iframe 
              src="https://maps.google.com/maps?q=47.8823337,106.7865548&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Үзэсгэлэн болох байршил"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 pt-8 pb-10 px-4 sm:px-6 lg:px-8 text-slate-400 border-t border-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-slate-500 text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} {d.footer}</p>
          </div>
          
          <p className="font-medium text-xs bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            Powered by AI Studio
          </p>
        </div>
      </footer>

      {/* Scroll To Top Button */}
      {isScrollTopVisible && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all z-50 hover:-translate-y-1"
          aria-label="Дээш гарах"
        >
          <ArrowUp className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
