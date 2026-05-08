import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Calculator, Building2, Ruler, Layers, Home, Info, Loader2, CheckCircle2, TrendingUp, DollarSign, BrickWall, Construction, Cog } from 'lucide-react';
import { analyzeHouseImage, generateHousePreview, HouseStructure } from '../services/geminiService';

// Prices based on barilga.mn 2025/2026 market analysis (in MNT)
const MARKET_PRICES = {
  concrete: 285000, // per m3 (M300-M350)
  rebar: 2950000,  // per ton
  brick: 850,      // per piece
  gasBlock: 245000, // per m3 equivalent
  roof: 65000,     // per sqm
  laborPerSqm: 750000,
  engineeringPerSqm: 450000,
  finishingPerSqm: 650000,
};

interface BudgetResult {
  total: number;
  breakdown: {
    label: string;
    value: number;
    description: string;
    icon: React.ReactNode;
  }[];
}

export const BudgetEstimator: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<HouseStructure | null>(null);
  const [budget, setBudget] = useState<BudgetResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isManual, setIsManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualData, setManualData] = useState({
    area: 100,
    stories: 1,
    complexity: "Moderate" as const,
    wallMaterial: "Тоосго"
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setBudget(null);
        setPreviewImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateBudget = (structure: HouseStructure) => {
    try {
      const { concreteVolumeM3, rebarWeightTon, roofAreaSqm } = structure.estimatedMaterialBreakdown;
      const area = structure.estimatedAreaSqm;
      
      const concreteCost = concreteVolumeM3 * MARKET_PRICES.concrete;
      const rebarCost = rebarWeightTon * MARKET_PRICES.rebar;
      const roofCost = roofAreaSqm * MARKET_PRICES.roof;
      
      // Estimating bricks/blocks based on units count if available, otherwise defaulting to area based
      const wallCost = area * 350000; // estimated wall material cost per sqm of floor
      
      const laborCost = area * MARKET_PRICES.laborPerSqm;
      const engineeringCost = area * MARKET_PRICES.engineeringPerSqm;
      const finishingCost = area * MARKET_PRICES.finishingPerSqm;

      // Apply complexity multiplier
      const complexityFactor = structure.complexity === "Complex" ? 1.5 : structure.complexity === "Moderate" ? 1.2 : 1;
      
      const breakdown = [
        { label: "Суурь & Бүтээц (Бетон, Арматур)", value: (concreteCost + rebarCost) * complexityFactor, description: `${concreteVolumeM3}м3 бетон, ${rebarWeightTon}т арматур`, icon: <Building2 className="text-blue-500" /> },
        { label: "Хана & Хамар хана", value: wallCost * complexityFactor, description: `${structure.wallMaterial} хийцлэлээр`, icon: <BrickWall className="text-orange-500" /> },
        { label: "Дээвэр", value: roofCost * complexityFactor, description: `${roofAreaSqm}м2 талбайтай ${structure.roofType}`, icon: <Layers className="text-emerald-500" /> },
        { label: "Дотор засал", value: finishingCost * complexityFactor, description: "Засал чимэглэлийн материалууд", icon: <CheckCircle2 className="text-pink-500" /> },
        { label: "Инженерчлэл", value: engineeringCost * complexityFactor, description: "Цахилгаан, Сантехник, Халаалт", icon: <Cog className="text-slate-500" /> },
        { label: "Ажиллах хүч", value: laborCost * complexityFactor, description: "Барилга угсралтын ажил гүйцэтгэл", icon: <Construction className="text-yellow-600" /> },
      ];

      const total = breakdown.reduce((acc, item) => acc + item.value, 0);
      setBudget({ total, breakdown });
    } catch (err) {
      console.error("Calculation error:", err);
      setError("Төсөв бодоход алдаа гарлаа. Та мэдээллээ шалгаад дахин оролдоно уу.");
    }
  };

  const handleManualCalculate = () => {
    setError(null);
    const mockStructure: HouseStructure = {
      foundationType: "Concrete",
      wallMaterial: manualData.wallMaterial,
      roofType: "Metal Tile",
      estimatedAreaSqm: manualData.area,
      storyCount: manualData.stories,
      complexity: manualData.complexity,
      specialFeatures: [],
      estimatedMaterialBreakdown: {
        concreteVolumeM3: manualData.area * 0.4,
        rebarWeightTon: manualData.area * 0.05,
        wallUnitsCount: manualData.area * 40,
        roofAreaSqm: manualData.area * 1.3
      }
    };
    setResult(mockStructure);
    calculateBudget(mockStructure);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setError(null);
    
    try {
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(',')[0].split(':')[1].split(';')[0];
      
      const analysis = await analyzeHouseImage(base64Data, mimeType);
      if (analysis) {
        setResult(analysis);
        calculateBudget(analysis);
        
        // Generate a 3D render preview
        setIsGeneratingImage(true);
        const generated = await generateHousePreview(analysis);
        if (generated) setPreviewImage(generated);
        setIsGeneratingImage(false);
      } else {
        throw new Error("Analysis failed to return result");
      }
    } catch (err) {
      console.error(err);
      setError("AI дүн шижилгээ хийхэд алдаа гарлаа. Та зургаа сольж үзэх эсвэл механик аргаар оруулаарай.");
    } finally {
      setAnalyzing(false);
      setIsGeneratingImage(false);
    }
  };

  return (
    <section id="estimator" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 -skew-x-12 transform origin-top-right -z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mb-4"
          >
            <TrendingUp size={16} />
            <span>AI-Д СУУРИЛСАН ТООЦООЛОЛ (2026 ОНЫ ҮНЭ)</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold font-space text-slate-900 mb-6">Ухаалаг Төсөв Бодогч</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Өөрийн байшингийн зургаа оруулаад barilga.mn-ий зах зээлийн үнэ ханшаар барилгын зардлын задаргааг хараарай.
          </p>

          <div className="flex justify-center mt-8">
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 inline-flex">
              <button 
                onClick={() => setIsManual(false)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!isManual ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Зургаар шинжлэх
              </button>
              <button 
                onClick={() => setIsManual(true)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isManual ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Механик оруулах
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Input */}
          <div className="space-y-6">
            {!isManual ? (
              <>
                <div 
                  className={`relative aspect-video rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center bg-white shadow-xl ${selectedImage ? 'border-emerald-500' : 'border-slate-300 hover:border-emerald-400 cursor-pointer'}`}
                  onClick={() => !selectedImage && fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <>
                      <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setResult(null); setBudget(null); setPreviewImage(null); setError(null); }}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <Upload size={32} />
                      </div>
                      <p className="text-slate-900 font-bold mb-2">Зураг оруулах</p>
                      <p className="text-sm text-slate-500">Drag & drop эсвэл энд дарж зургаа сонгоно уу</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-sm"
                  >
                    <Info className="shrink-0 mt-0.5" size={16} />
                    <p>{error}</p>
                  </motion.div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!selectedImage || analyzing}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${!selectedImage || analyzing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      AI Дүн шижилгээ хийж байна...
                    </>
                  ) : (
                    <>
                      <Calculator size={20} />
                      Төсөвийг зургаар тооцох
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Талбай (м2)</label>
                    <input 
                      type="number" 
                      value={manualData.area}
                      onChange={(e) => setManualData({...manualData, area: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Давхар</label>
                    <input 
                      type="number" 
                      value={manualData.stories}
                      onChange={(e) => setManualData({...manualData, stories: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Төвөгшил</label>
                  <select 
                    value={manualData.complexity}
                    onChange={(e) => setManualData({...manualData, complexity: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="Simple">Энгийн</option>
                    <option value="Moderate">Дундаж</option>
                    <option value="Complex">Нарийн хийцлэлтэй</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Үндсэн хийцлэл</label>
                  <input 
                    type="text" 
                    value={manualData.wallMaterial}
                    onChange={(e) => setManualData({...manualData, wallMaterial: e.target.value})}
                    placeholder="Тоосго, Блок, СИП хавтан..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleManualCalculate}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all mt-4"
                >
                  <Calculator size={20} />
                  Төсвийг тооцох
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {budget && result ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">Төсвийн зардлын задаргаа</h3>
                        <p className="text-sm text-slate-500">{result.estimatedAreaSqm}м2 талбайтай {result.storyCount} давхар сууц</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Нийт Төсөв</p>
                      <p className="text-2xl font-space font-bold text-emerald-600">
                        {budget.total.toLocaleString()} ₮
                      </p>
                    </div>
                  </div>

                  {/* Generated Preview Image */}
                  {(previewImage || isGeneratingImage) && (
                    <div className="mb-8 relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 shadow-inner group">
                      {isGeneratingImage ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm z-10 text-center px-6">
                          <Loader2 className="animate-spin text-emerald-600" size={32} />
                          <div>
                            <p className="text-sm font-bold text-slate-900">Байшингийн 3D дүрсийг бүтээж байна...</p>
                            <p className="text-[10px] text-slate-500">Зааварчилгаа болон бүтцэд үндэслэн AI дүрсэлж байна</p>
                          </div>
                        </div>
                      ) : previewImage && (
                        <>
                          <img src={previewImage} alt="AI Generated Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                            <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest">AI Generated Render</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 mb-8">
                    {budget.breakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-slate-800 text-sm">{item.label}</span>
                            <span className="font-space font-bold text-slate-900 text-sm">{item.value.toLocaleString()} ₮</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.value / budget.total) * 100}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                        <TrendingUp size={12} />
                        Санхүүгийн Зөвлөмж
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "Таны сонгосон {result.wallMaterial} хийцлэл нь {result.complexity === 'Complex' ? 'архитектурын хувьд өндөр зэрэглэлийн' : 'эдийн засгийн хувьд хэмнэлттэй'} сонголт юм. Зах зээлийн ханшийн хэлбэлзлийг тооцож нийт төсвөөс 10-15%-ийн нэмэлт санхүүгийн эх үүсвэртэй байхыг зөвлөж байна."
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dotted border-slate-200 rounded-3xl bg-white/50">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 text-slate-400 shadow-sm">
                    <Calculator size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Үр дүн энд харагдана</h4>
                  <p className="text-slate-500 mb-8 max-w-xs">
                    Зургаа оруулаад тооцоолох товчийг дарна уу. AI таны байшингийн бүтцийг шинжлэн төсвийг гаргана.
                  </p>
                  <div className="flex gap-2 opacity-30 select-none">
                    <Building2 size={24} />
                    <BrickWall size={24} />
                    <Layers size={24} />
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
