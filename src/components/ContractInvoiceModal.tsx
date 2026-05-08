import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Send, FileText, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Exhibitor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registerId?: string;
  address?: string;
  ceoName?: string;
  products?: string;
  hasStand?: boolean;
  hasBanner?: boolean;
  bannerText?: string;
  boothSize?: number;
  pricePerSqm?: number;
  additionalPrice?: number;
  totalPrice?: number;
  discountPct?: number;
  finalPrice?: number;
  status?: string;
  contractDate?: string;
  invoiceNo?: string;
  booth: string;
}

interface Props {
  exhibitor: Exhibitor;
  onClose: () => void;
  onUpdate: (data: Partial<Exhibitor>) => void;
}

export const ContractInvoiceModal: React.FC<Props> = ({ exhibitor, onClose, onUpdate }) => {
  const contractRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'contract' | 'invoice'>('contract');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async (type: 'contract' | 'invoice') => {
    const element = type === 'contract' ? contractRef.current : invoiceRef.current;
    if (!element) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${type}_${exhibitor.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF үүсгэхэд алдаа гарлаа.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    // In a real app, this would call a cloud function or backend API
    // that uses a library like nodemailer or an email service (SendGrid/Mailgun)
    // with the PDF attached.
    
    // For now, we'll simulate it.
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onUpdate({ status: 'contract_sent' });
    alert(`${exhibitor.email} хаяг руу гэрээг амжилттай илгээлээ.`);
    setIsGenerating(false);
  };

  const today = new Date().toLocaleDateString('mn-MN');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-6">
            <h3 className="text-xl font-bold text-slate-800">Гэрээ ба Нэхэмжлэх</h3>
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('contract')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'contract' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <FileText size={18} /> Гэрээ
              </button>
              <button
                onClick={() => setActiveTab('invoice')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'invoice' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Receipt size={18} /> Нэхэмжлэх
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownloadPDF(activeTab)}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <Download size={18} /> {isGenerating ? 'Боловсруулж байна...' : 'Татаж авах (PDF)'}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isGenerating}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <Send size={18} /> {isGenerating ? 'Илгээж байна...' : 'Имэйлээр илгээх'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          <div className="flex flex-col gap-8 w-full max-w-[800px]">
            {activeTab === 'contract' ? (
              <div ref={contractRef} className="bg-white p-[20mm] shadow-xl w-full min-h-[297mm] text-slate-900 font-serif leading-normal" style={{ fontSize: '12pt' }}>
                {/* Contract Body */}
                <div className="flex justify-between font-bold mb-8">
                  <div className="text-center w-5/12">
                    <p>БАТЛАВ:</p>
                    <p>“БАРИЛГА МН” ХХК</p>
                    <p>ГҮЙЦЭТГЭХ ЗАХИРАЛ</p>
                    <p className="mt-4">……………………………</p>
                    <p>Д. ЦОЛМОНГЭРЭЛ</p>
                  </div>
                  <div className="text-center w-5/12">
                    <p>БАТЛАВ:</p>
                    <p>“{exhibitor.name}” ХХК</p>
                    <p>ГҮЙЦЭТГЭХ ЗАХИРАЛ</p>
                    <p className="mt-4">……………………………</p>
                    <p>{exhibitor.ceoName || '………………………'}</p>
                  </div>
                </div>

                <h1 className="text-center font-bold text-lg mb-8 uppercase px-12">
                  АМИНЫ ОРОН СУУЦ ЭКСПО БАРИЛГЫН ҮЗЭСГЭЛЭНГИЙН ТАЛБАЙН ТҮРЭЭСИЙН ГЭРЭЭ
                </h1>

                <div className="flex justify-between mb-8">
                  <p>2026 оны ....... сарын .......-ны өдөр</p>
                  <p>№........</p>
                  <p>Улаанбаатар хот</p>
                </div>

                <p className="mb-4 text-justify">
                  Энэхүү гэрээг нэг талаас 6030548 тоот регистрийн дугаар, 9011582029 тоот улсын бүртгэлийн гэрчилгээтэй <b>“БАРИЛГА МН” ХХК</b> /цаашид “түрээслүүлэгч буюу зохион байгуулагч” гэх/ төлөөлж Үзэсгэлэн хариуцсан менежер С.Оргилцэцэг,
                </p>
                <p className="mb-4 text-justify">
                  Нөгөө талаас {exhibitor.registerId || '…………'} тоот регистрийн дугаартай <b>“{exhibitor.name}” ХХК</b> /цаашид “түрээслэгч буюу оролцогч” гэх/ түүнийг төлөөлж {exhibitor.ceoName || '…………'} албан тушаалтай ……………………… нар /хамтад нь <b>“Талууд”</b> гэх/ харилцан тохиролцож дараах нөхцлөөр байгуулав.
                </p>

                <div className="border-2 border-slate-900 p-4 mb-8">
                  <ol className="list-decimal ml-6 space-y-4">
                    <li>
                      Үзэсгэлэнд танилцуулах бүтээгдэхүүн үйлчилгээний нэрийг бичнэ үү.
                      <p className="mt-2 border-b border-dotted border-slate-900">{exhibitor.products || '………………………………………………………………'}</p>
                    </li>
                    <li>
                      Сонгосон талбайд стэнд (хана) засуулах эсэх?
                      <div className="flex gap-8 mt-2">
                        <label className="flex items-center gap-2">Тийм <span className={`w-4 h-4 border border-slate-900 flex items-center justify-center font-bold`}>{exhibitor.hasStand ? 'X' : ''}</span></label>
                        <label className="flex items-center gap-2">Үгүй <span className={`w-4 h-4 border border-slate-900 flex items-center justify-center font-bold`}>{!exhibitor.hasStand ? 'X' : ''}</span></label>
                      </div>
                    </li>
                    <li>
                      Стэндэнд байгууллагын нэртэй хаяг хийлгэх эсэх?
                      <div className="flex gap-8 mt-2">
                        <label className="flex items-center gap-2">Тийм <span className={`w-4 h-4 border border-slate-900 flex items-center justify-center font-bold`}>{exhibitor.hasBanner ? 'X' : ''}</span></label>
                        <label className="flex items-center gap-2">Үгүй <span className={`w-4 h-4 border border-slate-900 flex items-center justify-center font-bold`}>{!exhibitor.hasBanner ? 'X' : ''}</span></label>
                      </div>
                    </li>
                    <li>
                      Стэндний хаяг хийлгэх нэрийг үнэн зөв доор бичнэ үү.
                      <p className="mt-2 border-b border-dotted border-slate-900">{exhibitor.bannerText || '………………………………………………………………'}</p>
                    </li>
                  </ol>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-slate-300">
                    <div>
                      <p className="font-bold">Талбайн дугаар: {exhibitor.booth}</p>
                      <p>1м²-ын төлбөр: {exhibitor.pricePerSqm?.toLocaleString()} ₮</p>
                      <p className="font-bold">Нийт төлбөр: {exhibitor.finalPrice?.toLocaleString()} ₮</p>
                    </div>
                    <div>
                      <p className="font-bold">Талбайн хэмжээ: {exhibitor.boothSize} m²</p>
                      <p>Нэмэлт төлбөр: {exhibitor.additionalPrice?.toLocaleString()} ₮</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-center underline">Нэг. Үндсэн нөхцөл</h3>
                  <p className="text-justify">1.1 Энэхүү гэрээ нь оролцогчийн бараа бүтээгдэхүүнийг олон нийтэд танилцуулах зорилгоор үзэсгэлэн яармагийн зохион байгуулагч, оролцогч талуудын хамтын ажиллагааг зохицуулна.</p>
                  <p className="text-justify">1.2 Түрээслэгч нь 2026 оны 05 дүгээр сарын 15-наас 05 дүгээр сарын 17-ний хооронд зохион байгуулагдах “АМИНЫ ОРОН СУУЦ ЭКСПО” барилгын үзэсгэлэнд {exhibitor.booth} дугаартай {exhibitor.boothSize} м² талбай өнгө үзэмжтэй тохижуулж оролцоно.</p>
                </div>
                
                <p className="mt-12 text-sm text-slate-400 italic text-right">Хуудас 1 / 7</p>
              </div>
            ) : (
              <div ref={invoiceRef} className="bg-white p-[15mm] shadow-xl w-full min-h-[150mm] text-slate-900 font-sans" style={{ fontSize: '11pt' }}>
                <h1 className="text-center font-bold text-xl mb-8">НЭХЭМЖЛЭХ № {exhibitor.invoiceNo || '26/05'}</h1>
                
                <div className="grid grid-cols-2 border-t border-l border-slate-900">
                  <div className="p-3 border-r border-b border-slate-900 font-bold">"БАРИЛГА МН" ХХК</div>
                  <div className="p-3 border-r border-b border-slate-900 font-bold">"{exhibitor.name}" ХХК</div>
                  
                  <div className="p-3 border-r border-b border-slate-900 italic text-sm">/нэхэмжлэгч байгууллага/</div>
                  <div className="p-3 border-r border-b border-slate-900 italic text-sm">/төлөгч байгууллага/</div>
                  
                  <div className="p-3 border-r border-b border-slate-900">Байгууллагын РД: <b>6030548</b></div>
                  <div className="p-3 border-r border-b border-slate-900">Байгууллагын РД: <b>{exhibitor.registerId || '…………'}</b></div>
                  
                  <div className="p-3 border-r border-b border-slate-900 text-sm">
                    Байгууллагын хаяг: БЗД, 6-р хороо, BARILGAMN оффис
                  </div>
                  <div className="p-3 border-r border-b border-slate-900 text-sm">
                    Байгууллагын хаяг: {exhibitor.address || '…………'}
                  </div>
                  
                  <div className="p-3 border-r border-b border-slate-900">Харилцах утас: <b>99907816</b></div>
                  <div className="p-3 border-r border-b border-slate-900">Харилцах утас: <b>{exhibitor.phone || '…………'}</b></div>
                  
                  <div className="p-3 border-r border-b border-slate-900">
                    Байгууллагын данс: <br/>
                    <b>IBAN: 67000500</b><br/>
                    <b>Хаан банк: 5175011074</b>
                  </div>
                  <div className="p-3 border-r border-b border-slate-900">
                    Гэрээний дугаар: <br/>
                    <b>№ {exhibitor.invoiceNo || '26/05'}</b>
                  </div>
                </div>

                <div className="flex justify-between py-3 font-bold">
                  <p>Нэхэмжлэлийн огноо: 5/8/2026</p>
                  <p>Төлбөр хийх огноо: 5/15/2026</p>
                </div>

                <table className="w-full border-t border-l border-slate-900 mb-8 text-center text-sm">
                  <thead>
                    <tr className="font-bold bg-slate-50">
                      <th className="p-2 border-r border-b border-slate-900 w-12">№</th>
                      <th className="p-2 border-r border-b border-slate-900">Гүйлгээний утга</th>
                      <th className="p-2 border-r border-b border-slate-900 w-16">Тоо</th>
                      <th className="p-2 border-r border-b border-slate-900 w-32">Нэгж үнэ</th>
                      <th className="p-2 border-r border-b border-slate-900 w-32">Нийт үнэ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-r border-b border-slate-900">1</td>
                      <td className="p-3 border-r border-b border-slate-900 text-left">
                        "Амины Орон Сууц ЭКСПО" үзэсгэлэнгийн {exhibitor.booth} талбайн түрээс
                      </td>
                      <td className="p-3 border-r border-b border-slate-900">{exhibitor.boothSize}</td>
                      <td className="p-3 border-r border-b border-slate-900">{exhibitor.pricePerSqm?.toLocaleString()}</td>
                      <td className="p-3 border-r border-b border-slate-900">{exhibitor.totalPrice?.toLocaleString()}</td>
                    </tr>
                    {exhibitor.discountPct && exhibitor.discountPct > 0 ? (
                      <tr>
                        <td className="p-3 border-r border-b border-slate-900">2</td>
                        <td className="p-3 border-r border-b border-slate-900 text-left">ХЯМДРАЛ</td>
                        <td className="p-3 border-r border-b border-slate-900">1</td>
                        <td className="p-3 border-r border-b border-slate-900">{exhibitor.discountPct}%</td>
                        <td className="p-3 border-r border-b border-slate-900">{(exhibitor.totalPrice! - exhibitor.finalPrice!).toLocaleString()}</td>
                      </tr>
                    ) : null}
                    <tr className="font-bold">
                      <td colSpan={4} className="p-3 border-r border-b border-slate-900 text-right uppercase">Төлөх дүн</td>
                      <td className="p-3 border-r border-b border-slate-900">{exhibitor.finalPrice?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-red-600 font-bold text-sm mb-12 italic">
                  Гүйлгээний утга нь дээр байгууллагын нэр, регистер, болон утасны дугаараа бичнэ үү !!!
                </p>

                <div className="flex justify-between items-center text-sm font-bold">
                  <div className="space-y-1">
                    <p>Нэхэмжлэгч байгууллага:</p>
                    <p>"БАРИЛГА МН" ХХК</p>
                    <p className="pt-4 flex items-center gap-2">Нягтлан бодогч: <span className="p-2 border-2 border-red-500 text-red-500 rounded text-xs rotate-[-5deg]">САНХҮҮ 6030548</span></p>
                  </div>
                  <div>
                    <p>/ Б.Адьяасүрэн /</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
