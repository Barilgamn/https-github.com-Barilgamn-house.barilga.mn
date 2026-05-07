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

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [boothBookings, setBoothBookings] = useState<BoothBooking[]>([]);
  const [visitorRegistrations, setVisitorRegistrations] = useState<VisitorRegistration[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<'booths' | 'visitors' | 'admins'>('booths');
  const [newAdminEmail, setNewAdminEmail] = useState('');
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

    setLoading(false);

    return () => {
      unsubscribeBooths();
      unsubscribeVisitors();
      unsubscribeAdmins();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
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
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
               <span className="text-white text-sm">Х</span>
             </div>
             ХАУС &amp; БАРИЛГА ЭКСПО
          </Link>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-widest hidden sm:block">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            {user.email}
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors ${
                    activeTab === 'booths' 
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab('booths')}
                >
                  <Building className="w-4 h-4 inline-block mr-2" />
                  Талбай захиалсан байгууллагууд
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm sm:text-base border-b-2 transition-colors ${
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
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
