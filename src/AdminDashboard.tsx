import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { LogOut, Trash2, Home, Users, Building, Activity, ShieldAlert, UserPlus, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminUser {
  id: string;
  email: string;
  addedAt: any;
  addedBy: string;
}

interface BoothBooking {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  boothId: string;
  createdAt: string | Date;
}

interface VisitorRegistration {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createdAt: string | Date;
}

interface PageView {
  id: string;
  path: string;
  userAgent: string;
  createdAt: string | Date;
}

interface Exhibitor {
  id: string;
  name: string;
  activity: string;
  booth: string;
  createdAt: string | Date;
}

interface Schedule {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  createdAt: string | Date;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [boothBookings, setBoothBookings] = useState<BoothBooking[]>([]);
  const [visitorRegistrations, setVisitorRegistrations] = useState<VisitorRegistration[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeTab, setActiveTab] = useState<'booths' | 'exhibitors' | 'visitors' | 'admins' | 'schedules' | 'analytics'>('booths');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newExhibitor, setNewExhibitor] = useState({ name: '', activity: '', booth: '' });
  const [newSchedule, setNewSchedule] = useState({ date: '', time: '', title: '', description: '' });
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthError('');

    const boothsQuery = query(collection(db, 'booth_bookings'), orderBy('createdAt', 'desc'));
    const unsubscribeBooths = onSnapshot(boothsQuery, (snapshot) => {
      const data: BoothBooking[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as BoothBooking);
      });
      setBoothBookings(data);
    }, (error) => {
      if (error.message.includes('permission-denied')) {
        setAuthError('Хандах эрхгүй байна. Та эрх бүхий админ хаягаар нэвтрэх шаардлагатай.');
      } else {
        handleFirestoreError(error, OperationType.LIST, 'booth_bookings');
      }
    });

    const visitorsQuery = query(collection(db, 'visitor_registrations'), orderBy('createdAt', 'desc'));
    const unsubscribeVisitors = onSnapshot(visitorsQuery, (snapshot) => {
      const data: VisitorRegistration[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as VisitorRegistration);
      });
      setVisitorRegistrations(data);
    }, (error) => {
      if (!error.message.includes('permission-denied')) {
         handleFirestoreError(error, OperationType.LIST, 'visitor_registrations');
      }
    });

    const adminsQuery = query(collection(db, 'admins'), orderBy('addedAt', 'desc'));
    const unsubscribeAdmins = onSnapshot(adminsQuery, (snapshot) => {
      const data: AdminUser[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as AdminUser);
      });
      setAdmins(data);
    }, (error) => {
      if (!error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.LIST, 'admins');
      }
    });

    const pageViewsQuery = query(collection(db, 'page_views'), orderBy('createdAt', 'desc'));
    const unsubscribePageViews = onSnapshot(pageViewsQuery, (snapshot) => {
      const data: PageView[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PageView);
      });
      setPageViews(data);
    }, (error) => {
      if (!error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.LIST, 'page_views');
      }
    });

    const exhibitorsQuery = query(collection(db, 'exhibitors'), orderBy('createdAt', 'desc'));
    const unsubscribeExhibitors = onSnapshot(exhibitorsQuery, (snapshot) => {
      const data: Exhibitor[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Exhibitor);
      });
      setExhibitors(data);
    }, (error) => {
      if (!error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.LIST, 'exhibitors');
      }
    });

    const schedulesQuery = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'));
    const unsubscribeSchedules = onSnapshot(schedulesQuery, (snapshot) => {
      const data: Schedule[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Schedule);
      });
      setSchedules(data);
    }, (error) => {
      if (!error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.LIST, 'schedules');
      }
    });

    setLoading(false);

    return () => {
      unsubscribeBooths();
      unsubscribeVisitors();
      unsubscribeAdmins();
      unsubscribePageViews();
      unsubscribeExhibitors();
      unsubscribeSchedules();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Нэвтрэх цонх хаагдлаа. Та дахин оролдоно уу.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError('Энэ домайн дээр нэвтрэх эрхгүй байна. Firebase консол дээр Authorized domains хэсэгт сайтаа нэмнэ үү.');
      } else {
        setAuthError('Нэвтрэх үед алдаа гарлаа. Та хөтчийнхөө (Open in new tab) товчийг дарж шинэ цонхонд нээгээд үзээрэй. Алдаа: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteBooth = async (id: string) => {
    if (window.confirm("Энэ захиалгыг устгах уу?")) {
      try {
        await deleteDoc(doc(db, 'booth_bookings', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `booth_bookings/${id}`);
      }
    }
  };

  const handleDeleteVisitor = async (id: string) => {
    if (window.confirm("Энэ бүртгэлийг устгах уу?")) {
      try {
        await deleteDoc(doc(db, 'visitor_registrations', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `visitor_registrations/${id}`);
      }
    }
  };

  const handleAddExhibitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExhibitor.name || !newExhibitor.activity || !newExhibitor.booth) {
      alert("Бүх талбарыг бөглөнө үү.");
      return;
    }
    try {
      const dbRef = collection(db, 'exhibitors');
      await setDoc(doc(dbRef), {
         name: newExhibitor.name,
         activity: newExhibitor.activity,
         booth: newExhibitor.booth,
         createdAt: serverTimestamp()
      });
      setNewExhibitor({ name: '', activity: '', booth: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'exhibitors');
    }
  };

  const handleDeleteExhibitor = async (id: string) => {
    if (window.confirm("Энэ байгууллагын мэдээллийг устгах уу?")) {
      try {
        await deleteDoc(doc(db, 'exhibitors', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `exhibitors/${id}`);
      }
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.date || !newSchedule.time || !newSchedule.title) {
      alert("Огноо, цаг болон гарчгийг оруулна уу.");
      return;
    }
    try {
      if (editingSchedule) {
        await updateDoc(doc(db, 'schedules', editingSchedule.id), {
          date: newSchedule.date,
          time: newSchedule.time,
          title: newSchedule.title,
          description: newSchedule.description
        });
        setEditingSchedule(null);
      } else {
        const dbRef = collection(db, 'schedules');
        await setDoc(doc(dbRef), {
          date: newSchedule.date,
          time: newSchedule.time,
          title: newSchedule.title,
          description: newSchedule.description,
          createdAt: serverTimestamp()
        });
      }
      setNewSchedule({ date: '', time: '', title: '', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'schedules');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm("Энэ хөтөлбөрийг устгах уу?")) {
      try {
        await deleteDoc(doc(db, 'schedules', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `schedules/${id}`);
      }
    }
  };

  const editSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      date: schedule.date,
      time: schedule.time,
      title: schedule.title,
      description: schedule.description || ''
    });
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      alert("Зөв имэйл хаяг оруулна уу.");
      return;
    }

    try {
      await setDoc(doc(db, 'admins', newAdminEmail.trim()), {
        email: newAdminEmail.trim(),
        addedAt: serverTimestamp(),
        addedBy: user?.email
      });
      setNewAdminEmail('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${newAdminEmail}`);
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    if (email === 'info@barilga.mn') {
      alert("Үндсэн админыг устгах боломжгүй.");
      return;
    }
    if (window.confirm(`${email} хаягийн админ эрхийг цуцлах уу?`)) {
      try {
        await deleteDoc(doc(db, 'admins', email));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `admins/${email}`);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString('mn-MN');
    }
    return new Date(timestamp).toLocaleString('mn-MN');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Админ Панел</h1>
          <p className="text-slate-500 mb-8">Энэ хэсэг рүү зөвхөн админ нэвтрэх боломжтой.</p>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
              {authError}
            </div>
          )}

          <button 
            onClick={handleLogin}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors"
          >
            Google-ээр нэвтрэх
          </button>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg shadow-black/5">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
             <img src="https://www.barilga.mn/files/aa08e06d18a7412eb59bb69e4ef6fe29.png?d=0" alt="ХАУС & БАРИЛГА ЭКСПО" className="h-10 sm:h-12 w-auto" />
          </Link>
          <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-full uppercase tracking-widest hidden sm:block">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-300">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            {user.email}
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Гарах"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {authError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-start gap-4 mb-8">
            <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg mb-1">Хандалтын алдаа</h3>
              <p>{authError}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Талбай захиалга</p>
                  <p className="text-3xl font-bold text-slate-900">{boothBookings.length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Үзэгчийн бүртгэл</p>
                  <p className="text-3xl font-bold text-slate-900">{visitorRegistrations.length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Нийт бүртгэл</p>
                  <p className="text-3xl font-bold text-slate-900">{boothBookings.length + visitorRegistrations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
              <div className="flex border-b border-slate-200 bg-slate-50/50 flex-wrap">
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'booths' 
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('booths')}
                >
                  <Building className="w-4 h-4 inline-block mr-2" />
                  Талбай захиалгын хүсэлт
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'exhibitors' 
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('exhibitors')}
                >
                  <Building className="w-4 h-4 inline-block mr-2" />
                  Оролцогч байгууллагууд
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'visitors' 
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('visitors')}
                >
                  <Users className="w-4 h-4 inline-block mr-2" />
                  Үзэгчийн бүртгэлүүд
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors ${
                    activeTab === 'admins' 
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('admins')}
                >
                  <ShieldCheck className="w-4 h-4 inline-block mr-2" />
                  Админ удирдлага
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors ${
                    activeTab === 'analytics' 
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('analytics')}
                >
                  <Activity className="w-4 h-4 inline-block mr-2" />
                  Хандалт
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'schedules' 
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('schedules')}
                >
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Хөтөлбөр
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                {activeTab === 'admins' && (
                  <div className="p-6">
                    <form onSubmit={handleAddAdmin} className="mb-8 flex gap-4 max-w-lg">
                      <div className="flex-1 relative">
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="Шинэ админы имэйл..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pl-10"
                          required
                        />
                        <UserPlus className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                      <button 
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
                      >
                        Нэмэх
                      </button>
                    </form>

                    <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-slate-100">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">Админ Имэйл</th>
                          <th className="p-4 font-semibold">Нэмсэн огноо</th>
                          <th className="p-4 font-semibold">Нэмсэн хүн</th>
                          <th className="p-4 font-semibold w-16 text-center">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Always show the super admin conceptually if not in collection */}
                        <tr className="bg-emerald-50/30">
                          <td className="p-4 font-bold text-emerald-700 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> info@barilga.mn
                          </td>
                          <td className="p-4 text-sm text-slate-500 italic">Системын хаяг</td>
                          <td className="p-4 text-sm text-slate-500">-</td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Super Admin</span>
                          </td>
                        </tr>
                        {admins.filter(a => a.email !== 'info@barilga.mn').map((admin) => (
                          <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-medium text-slate-800">{admin.email}</td>
                            <td className="p-4 text-sm text-slate-500">{formatDate(admin.addedAt)}</td>
                            <td className="p-4 text-sm text-slate-600">{admin.addedBy || 'Систем'}</td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg Transition-colors border border-transparent hover:border-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === 'booths' && (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">Огноо</th>
                        <th className="p-4 font-semibold">Компани</th>
                        <th className="p-4 font-semibold">Холбогдох хүн</th>
                        <th className="p-4 font-semibold">Утас</th>
                        <th className="p-4 font-semibold border-x border-slate-200 bg-emerald-50/30 text-center">Талбай</th>
                        <th className="p-4 font-semibold w-16">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {boothBookings.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">Мэдээлэл олдсонгүй</td></tr>
                      ) : (
                        boothBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(booking.createdAt)}</td>
                            <td className="p-4 font-medium text-slate-900">{booking.companyName}</td>
                            <td className="p-4 text-slate-600">{booking.contactName}</td>
                            <td className="p-4 text-slate-600 font-mono text-sm">{booking.phone}</td>
                            <td className="p-4 font-bold text-emerald-600 border-x border-slate-100 text-center whitespace-nowrap bg-emerald-50/10">
                              {booking.boothId}
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleDeleteBooth(booking.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded bg-white border border-slate-200 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'exhibitors' && (
                  <div className="p-6">
                    <form onSubmit={handleAddExhibitor} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Байгууллагын нэр</label>
                        <input
                          type="text"
                          value={newExhibitor.name}
                          onChange={(e) => setNewExhibitor({...newExhibitor, name: e.target.value})}
                          placeholder="Монкабель ХХК"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Үйл ажиллагааны чиглэл</label>
                        <input
                          type="text"
                          value={newExhibitor.activity}
                          onChange={(e) => setNewExhibitor({...newExhibitor, activity: e.target.value})}
                          placeholder="Цахилгаан, холбоо"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Талбай (таслалаар зааж болно)</label>
                        <input
                          type="text"
                          value={newExhibitor.booth}
                          onChange={(e) => setNewExhibitor({...newExhibitor, booth: e.target.value})}
                          placeholder="A12, A13"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors whitespace-nowrap h-[46px]"
                        >
                          Нэмэх
                        </button>
                      </div>
                    </form>

                    <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-slate-100">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">Огноо</th>
                          <th className="p-4 font-semibold">Компани</th>
                          <th className="p-4 font-semibold">Үйл ажиллагаа</th>
                          <th className="p-4 font-semibold text-center bg-emerald-50/30">Талбай</th>
                          <th className="p-4 font-semibold w-16 text-center">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exhibitors.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400">Мэдээлэл олдсонгүй</td></tr>
                        ) : (
                          exhibitors.map((exhibitor) => (
                            <tr key={exhibitor.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(exhibitor.createdAt)}</td>
                              <td className="p-4 font-medium text-slate-800">{exhibitor.name}</td>
                              <td className="p-4 text-sm text-slate-600">{exhibitor.activity}</td>
                              <td className="p-4 font-bold text-center text-emerald-700 bg-emerald-50/10 border-x border-slate-100">{exhibitor.booth}</td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => handleDeleteExhibitor(exhibitor.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === 'visitors' && (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">Огноо</th>
                        <th className="p-4 font-semibold">Овог</th>
                        <th className="p-4 font-semibold">Нэр</th>
                        <th className="p-4 font-semibold">Утас</th>
                        <th className="p-4 font-semibold">И-мэйл</th>
                        <th className="p-4 font-semibold w-16">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visitorRegistrations.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">Мэдээлэл олдсонгүй</td></tr>
                      ) : (
                        visitorRegistrations.map((visitor) => (
                          <tr key={visitor.id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(visitor.createdAt)}</td>
                            <td className="p-4 font-medium text-slate-900">{visitor.lastName}</td>
                            <td className="p-4 font-medium text-slate-900">{visitor.firstName}</td>
                            <td className="p-4 text-slate-600 font-mono text-sm">{visitor.phone}</td>
                            <td className="p-4 text-slate-600 text-sm max-w-[200px] truncate" title={visitor.email}>{visitor.email}</td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleDeleteVisitor(visitor.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded bg-white border border-slate-200 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
                {activeTab === 'schedules' && (
                  <div className="p-6">
                    <form onSubmit={handleSaveSchedule} className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-4">{editingSchedule ? 'Хөтөлбөр засах' : 'Шинэ хөтөлбөр нэмэх'}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Огноо</label>
                          <input
                            type="text"
                            value={newSchedule.date}
                            onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                            placeholder="5 сарын 25"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Цаг</label>
                          <input
                            type="text"
                            value={newSchedule.time}
                            onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                            placeholder="14:00 - 15:00"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            required
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Гарчиг</label>
                          <input
                            type="text"
                            value={newSchedule.title}
                            onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                            placeholder="Нээлтийн үйл ажиллагаа"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            required
                          />
                        </div>
                        <div className="lg:col-span-4">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Дэлгэрэнгүй (заавал биш)</label>
                          <textarea
                            value={newSchedule.description}
                            onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})}
                            placeholder="Илтгэгч болон бусад мэдээлэл"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-y min-h-[60px]"
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        {editingSchedule && (
                          <button 
                            type="button"
                            onClick={() => { setEditingSchedule(null); setNewSchedule({ date: '', time: '', title: '', description: '' }); }}
                            className="px-4 py-2 font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Цуцлах
                          </button>
                        )}
                        <button 
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                          {editingSchedule ? 'Хадгалах' : 'Нэмэх'}
                        </button>
                      </div>
                    </form>

                    <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-slate-100">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">Огноо</th>
                          <th className="p-4 font-semibold">Цаг</th>
                          <th className="p-4 font-semibold">Гарчиг</th>
                          <th className="p-4 font-semibold w-24 text-center">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schedules.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400">Хөтөлбөр байхгүй байна</td></tr>
                        ) : (
                          schedules.map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 text-sm font-medium text-slate-700">{schedule.date}</td>
                              <td className="p-4 text-sm font-bold text-emerald-600 space-nowrap">{schedule.time}</td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-800">{schedule.title}</div>
                                {schedule.description && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{schedule.description}</div>}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => editSchedule(schedule)}
                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === 'analytics' && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Нийт хуудас үзэлт</p>
                        <p className="text-4xl font-black text-slate-900">{pageViews.length}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Өнөөдрийн хандалт</p>
                        <p className="text-4xl font-black text-slate-900">
                          {pageViews.filter(v => {
                             if (!v.createdAt) return false;
                             const date = (v.createdAt as any).toDate ? (v.createdAt as any).toDate() : new Date(v.createdAt as string);
                             const today = new Date();
                             return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                          }).length}
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Сүүлийн үеийн хандалтууд</h3>
                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Огноо</th>
                            <th className="p-4 font-semibold">Зам</th>
                            <th className="p-4 font-semibold hidden md:table-cell">Төхөөрөмж / Хөтөч</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pageViews.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400">Хандалтын мэдээлэл байхгүй байна</td></tr>
                          ) : (
                            pageViews.slice(0, 100).map((view) => (
                              <tr key={view.id} className="hover:bg-slate-50/50">
                                <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(view.createdAt)}</td>
                                <td className="p-4 text-sm font-medium text-emerald-600">{view.path}</td>
                                <td className="p-4 text-xs text-slate-500 hidden md:table-cell max-w-sm truncate" title={view.userAgent}>{view.userAgent}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
