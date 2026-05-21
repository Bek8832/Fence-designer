/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Construction, 
  Eraser, 
  RotateCcw, 
  Save, 
  Download, 
  Trash2, 
  Info, 
  MousePointer2, 
  Redo2, 
  History,
  HardHat,
  ChevronRight,
  Plus,
  Minus,
  Hammer,
  Fence,
  CheckCircle2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { useFenceBuilder } from './hooks/useFenceBuilder';
import { SHAPES, BUILDER_COLORS, COLS, ROWS } from './constants';

export default function App() {
  const {
    board,
    selectedPieceType,
    setSelectedPieceType,
    placePiece,
    removePiece,
    resetBoard,
  } = useFenceBuilder();

  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<'build' | 'erase'>('build');
  const [selectedColor, setSelectedColor] = useState(BUILDER_COLORS[0].classes);
  const [cellSize, setCellSize] = useState(30);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [savedDesigns, setSavedDesigns] = useState<{ id: string; image: string; date: string }[]>(() => {
    const saved = localStorage.getItem('fence-designs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isExporting, setIsExporting] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const tutorialContent = [
    {
      title: "Кош келиңиз!",
      description: "Бул оюнда сиз өзүңүздүн дубал (забор) дизайныңызды түзө аласыз. Эч кандай упай же чектөө жок, болгону чыгармачылык!",
      icon: <Fence className="w-12 h-12 text-orange-500" />
    },
    {
      title: "Блокторду тандоо",
      description: "Төмөндөгү тизмеден блоктун түрүн тандаңыз: Тумба (2x2), Пескоблок (2x1) же Жарым пескоблок (1x1).",
      icon: <Construction className="w-12 h-12 text-orange-500" />
    },
    {
      title: "Түс тандоо",
      description: "Блокторуңуз үчүн каалаган түстү тандаңыз. Бизде ар түрдүү табигый таш түстөрү бар.",
      icon: <Palette className="w-12 h-12 text-orange-500" />
    },
    {
      title: "Куруу жана Өчүрүү",
      description: "Тандалган блокту дубалдын каалаган жерине коюңуз. Эгер ката кетирсеңиз, Өчүргүчтү колдонуп алып салсаңыз болот.",
      icon: <Hammer className="w-12 h-12 text-orange-500" />
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialContent.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  // Auto-fit calculation with Zoom
  useEffect(() => {
    const updateSize = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      
      const maxW = vw * 0.95; 
      const maxH = vh * 0.4;

      const sizeByWidth = maxW / COLS;
      const sizeByHeight = maxH / ROWS;
      
      const minCellSize = vw < 640 ? 20 : 15; 
      const baseSize = Math.max(minCellSize, Math.min(sizeByWidth, sizeByHeight, 40));
      setCellSize(Math.floor(baseSize * zoomLevel));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [zoomLevel]);

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(2, Math.max(0.5, prev + delta)));
  };

  const handleFinishDesign = async () => {
    if (!boardRef.current) return;
    
    setIsExporting(true);
    // Give UI time to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Use a more robust check for mobile/complex grids
      const dataUrl = await toPng(boardRef.current, {
        cacheBust: true,
        backgroundColor: '#F5F5DC',
        pixelRatio: 2, // Better quality
        skipAutoScale: true,
      });
      
      if (!dataUrl) throw new Error('Failed to generate image');

      const newDesign = {
        id: Date.now().toString(),
        image: dataUrl,
        date: new Date().toLocaleString('ky-KG'),
      };
      
      const updatedDesigns = [newDesign, ...savedDesigns];
      setSavedDesigns(updatedDesigns);
      localStorage.setItem('fence-designs', JSON.stringify(updatedDesigns));
      
      // Automatic download
      const link = document.createElement('a');
      link.download = `my-fence-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      alert('Сүрөттү сактоодо ката кетти. Сураныч, кайра аракет кылыңыз.');
    } finally {
      setIsExporting(false);
    }
  };

  const deleteDesign = (id: string) => {
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem('fence-designs', JSON.stringify(updated));
  };

  const handleCellClick = (x: number, y: number) => {
    if (tool === 'erase') {
      removePiece(x, y);
    } else if (selectedPieceType) {
      const placed = placePiece(x, y, selectedColor);
      if (placed) {
        setSelectedPieceType(null); // Clear selection after placement as requested
        setHoverPos(null);
      }
    }
  };

  const PIECE_TYPES = ['HALF', 'FULL', 'TUMBA'];
  const PIECE_NAMES: Record<string, string> = {
    HALF: 'Жарым пескоблок',
    FULL: 'Пескоблок',
    TUMBA: 'Тумба'
  };

  return (
    <div id="game-container" className="min-h-screen bg-[#F5F5DC] font-sans selection:bg-orange-500 selection:text-white flex flex-col items-center p-2 sm:p-4 pb-20">
      
      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-2 border-stone-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-stone-100">
                <motion.div 
                  className="h-full bg-orange-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((tutorialStep + 1) / tutorialContent.length) * 100}%` }}
                />
              </div>

              <div className="flex flex-col items-center text-center gap-6 py-4">
                <div className="p-4 bg-stone-50 rounded-2xl ring-1 ring-black/5 shadow-inner">
                  {tutorialContent[tutorialStep].icon}
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-stone-800 italic uppercase tracking-tight mb-2">
                    {tutorialContent[tutorialStep].title}
                  </h2>
                  <p className="text-stone-600 leading-relaxed">
                    {tutorialContent[tutorialStep].description}
                  </p>
                </div>

                <div className="flex gap-4 w-full">
                  {tutorialStep > 0 && (
                    <button 
                      onClick={() => setTutorialStep(tutorialStep - 1)}
                      className="flex-1 py-4 bg-stone-100 text-stone-500 font-bold rounded-2xl hover:bg-stone-200 transition-all"
                    >
                      АРКАГА
                    </button>
                  )}
                  <button 
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-900/20 hover:bg-orange-500 active:scale-95 transition-all"
                  >
                    {tutorialStep === tutorialContent.length - 1 ? "БАШТОО" : "КИЙИНКИ"}
                  </button>
                </div>
                
                <button 
                  onClick={() => setShowTutorial(false)}
                  className="text-stone-400 text-[10px] uppercase font-mono hover:text-stone-600 transition-colors"
                >
                  Өткөрүп жиберүү (Skip)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl w-full flex flex-col lg:grid lg:grid-cols-[300px_1fr_300px] gap-4 sm:gap-8 items-start">
        
        {/* Header - Visible at top on mobile */}
        <div className="w-full lg:hidden mb-2">
          <div className="relative">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2 flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-600">
                ДУБАЛ ДИЗАЙН
              </span>
              <Fence className="text-orange-500 w-8 h-8" />
            </h1>
            <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-transparent w-1/3"></div>
            </div>
          </div>
        </div>

        {/* Left Sidebar: Blocks & Colors Selection */}
        <div className="flex flex-col gap-4 sm:gap-6 w-full order-2 lg:order-1">
          <div className="bg-white p-4 sm:p-6 border border-stone-200 rounded-2xl shadow-lg ring-1 ring-black/5">
            <h2 className="text-[10px] font-mono text-stone-400 uppercase mb-4 sm:mb-6 flex items-center gap-2">
              <Construction className="w-3 h-3 text-orange-500" /> Блоктун түрлөрү
            </h2>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-4">
              {PIECE_TYPES.map((type) => (
                <motion.button
                  key={`type-${type}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedPieceType(type); setTool('build'); }}
                  className={`p-2 sm:p-4 bg-stone-50 border-2 rounded-xl flex items-center justify-center min-h-[80px] sm:min-h-[100px] transition-all relative overflow-hidden group ${
                    selectedPieceType === type ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-stone-100 hover:border-stone-200'
                  }`}
                >
                  <div className="grid gap-0 relative z-10" style={{ gridTemplateColumns: `repeat(${SHAPES[type][0].length}, minmax(16px, 1fr))` }}>
                    {SHAPES[type].map((row, ry) =>
                      row.map((val, rx) => {
                        const hasRight = rx < row.length - 1 && row[rx+1] === val && val;
                        const hasDown = ry < SHAPES[type].length - 1 && SHAPES[type][ry+1][rx] === val && val;
                        return (
                          <div
                            key={`piece-${type}-${ry}-${rx}`}
                            className={`w-4 h-4 sm:w-6 sm:h-6 ${val ? 'bg-stone-300 border border-stone-400' : 'bg-transparent'} ${val === 2 ? 'ring-1 ring-inset ring-black/5' : ''} shadow-sm`}
                            style={{
                              borderRightWidth: hasRight ? 0 : 1,
                              borderBottomWidth: hasDown ? 0 : 1,
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 text-[7px] sm:text-[9px] font-mono text-stone-400 font-bold uppercase tracking-widest">{PIECE_NAMES[type]}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 border border-stone-200 rounded-2xl shadow-lg ring-1 ring-black/5">
            <h2 className="text-[10px] font-mono text-stone-400 uppercase mb-4 sm:mb-6 flex items-center gap-2">
              <Palette className="w-3 h-3 text-orange-500" /> Түс тандоо
            </h2>
            <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-3 gap-2 sm:gap-3">
              {BUILDER_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.classes)}
                  title={color.name}
                  className={`group relative w-full aspect-square rounded-xl border-2 transition-all ${
                    selectedColor === color.classes ? 'border-orange-500 scale-110 z-10 shadow-lg' : 'border-stone-200 hover:border-stone-300'
                  } ${color.classes}`}
                >
                  <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 text-[6px] text-white overflow-hidden opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap px-1">
                    {color.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 border border-stone-200 rounded-2xl shadow-lg ring-1 ring-black/5 hidden lg:block">
            <h3 className="text-[10px] font-mono text-stone-400 uppercase mb-4 flex items-center gap-2">
              <Info className="w-3 h-3 text-orange-500" /> Кантип ойноо керек
            </h3>
            <ul className="space-y-3 text-sm text-stone-600">
              <li className="flex gap-3">
                <MousePointer2 className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Блокту тандап, дубалга коюңуз.</span>
              </li>
              <li className="flex gap-3">
                <Eraser className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Жакпаса өчүргүч менен алып салыңыз.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-4 sm:p-6 border border-stone-200 rounded-2xl shadow-lg ring-1 ring-black/5 font-mono">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] text-stone-400 uppercase">Масштаб</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleZoom(-0.1)}
                      className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-stone-600" />
                    </button>
                    <span className="text-xs font-bold text-stone-700 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button 
                      onClick={() => handleZoom(0.1)}
                      className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-stone-600" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 lg:flex-col">
                  <button
                    onClick={() => { setTool('erase'); setSelectedPieceType(null); }}
                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      tool === 'erase' ? 'bg-red-600 text-white shadow-lg' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    <Eraser className="w-5 h-5" /> Өчүргүч
                  </button>
                  <button
                    onClick={resetBoard}
                    className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl border border-stone-200 hover:bg-stone-200 transition-all flex items-center justify-center gap-2 shadow-sm lg:hidden"
                  >
                    <RotateCcw className="w-4 h-4 text-orange-500" /> ТАЗАЛОО
                  </button>
                </div>
             </div>
          </div>

          <button
            onClick={handleFinishDesign}
            disabled={isExporting}
            className="w-full py-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black rounded-3xl shadow-xl shadow-orange-900/40 hover:shadow-orange-900/60 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isExporting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                СҮРӨТКӨ АЙЛАНУУДА...
              </div>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                ДИЗАЙНЫМ БҮТТҮ
              </>
            )}
          </button>
        </div>

        {/* Center: Main Board */}
        <div className="relative group order-1 lg:order-2 w-full flex flex-col items-center">
          <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-stone-600 rounded-2xl blur-xl opacity-10"></div>
          <div 
            ref={boardRef}
            className="relative w-full bg-stone-100 border-4 border-stone-300 rounded-3xl p-1 sm:p-2 overflow-x-auto flex justify-start sm:justify-center shadow-xl custom-scrollbar"
          >
            <div 
              className={`grid gap-px bg-stone-300 border-2 border-stone-300 flex-shrink-0 ${tool === 'erase' ? 'cursor-pointer' : 'cursor-crosshair'}`}
              onMouseLeave={() => setHoverPos(null)}
              style={{
                gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${cellSize}px)`,
                touchAction: 'pan-y'
              }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const hasSamePieceRight = cell && x < COLS - 1 && board[y][x + 1]?.pieceId === cell.pieceId;
                  const hasSamePieceDown = cell && y < ROWS - 1 && board[y + 1][x]?.pieceId === cell.pieceId;
                  const hasSamePieceLeft = cell && x > 0 && board[y][x - 1]?.pieceId === cell.pieceId;
                  const hasSamePieceUp = cell && y > 0 && board[y - 1][x]?.pieceId === cell.pieceId;

                  return (
                    <div
                      key={`${y}-${x}`}
                      onMouseEnter={() => setHoverPos({ x, y })}
                      onClick={() => handleCellClick(x, y)}
                      className={`transition-all relative group/cell ${
                        cell ? `${cell.color} shadow-[inset_0_0_10px_rgba(255,255,255,0.1),_2px_2px_4px_rgba(0,0,0,0.1)]` : 'bg-white'
                      } ${cell?.type === 2 ? 'ring-2 ring-inset ring-black/20' : ''}`}
                      style={{ 
                        width: cellSize + (hasSamePieceRight ? 1 : 0), 
                        height: cellSize + (hasSamePieceDown ? 1 : 0),
                        marginRight: hasSamePieceRight ? -1 : 0,
                        marginBottom: hasSamePieceDown ? -1 : 0,
                        borderTopWidth: hasSamePieceUp ? '0px' : (cell ? '2px' : '0px'),
                        borderRightWidth: hasSamePieceRight ? '0px' : (cell ? '2px' : '0px'),
                        borderBottomWidth: hasSamePieceDown ? '0px' : (cell ? '2px' : '0px'),
                        borderLeftWidth: hasSamePieceLeft ? '0px' : (cell ? '2px' : '0px'),
                        borderStyle: 'solid',
                        zIndex: hoverPos?.x === x && hoverPos?.y === y ? 20 : (cell ? 5 : 0),
                        overflow: 'visible'
                      }}
                    >
                      {cell && (
                        <div className={`absolute inset-0 opacity-20 ${cell.type === 2 ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.1)_5px,rgba(0,0,0,0.1)_10px)]' : 'bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[size:4px_4px]'}`} />
                      )}
                      
                      {/* Ghost Preview */}
                      {hoverPos?.x === x && hoverPos?.y === y && tool === 'build' && selectedPieceType && !cell && (
                        <div className="absolute top-0 left-0 z-[100] pointer-events-none overflow-visible">
                           {SHAPES[selectedPieceType].map((srow, sy) => 
                             srow.map((sval, sx) => {
                               if (sval) {
                                 const gHasRight = sx < srow.length - 1 && srow[sx + 1] === sval;
                                 const gHasDown = sy < SHAPES[selectedPieceType].length - 1 && SHAPES[selectedPieceType][sy + 1][sx] === sval;
                                 return (
                                   <div 
                                     key={`ghost-${sy}-${sx}`}
                                     className={`absolute ${selectedColor} opacity-60 shadow-lg`}
                                     style={{ 
                                       left: sx * (cellSize + 1), 
                                       top: sy * (cellSize + 1),
                                       width: cellSize + (gHasRight ? 1 : 0),
                                       height: cellSize + (gHasDown ? 1 : 0),
                                       borderStyle: 'solid',
                                       borderTopWidth: 2,
                                       borderLeftWidth: 2,
                                       borderRightWidth: gHasRight ? 0 : 2,
                                       borderBottomWidth: gHasDown ? 0 : 2,
                                     }}
                                   >
                                      <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                   </div>
                                 );
                               }
                               return null;
                             })
                           )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-2 text-center text-[10px] text-stone-600 font-mono italic uppercase block lg:hidden">
            Башкы такта (борд)
          </div>
        </div>

        {/* Right Sidebar: Info & Actions */}
        <div className="flex flex-col gap-6 order-3 hidden lg:flex">
          <div className="relative">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2 flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-600">
                ДУБАЛ ДИЗАЙН
              </span>
              <Fence className="text-orange-500 w-8 h-8" />
            </h1>
            <div className="h-1.5 w-full bg-stone-800 relative overflow-hidden rounded-full">
               <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-transparent w-1/3"></div>
            </div>
          </div>

          <div className="bg-white p-6 border border-stone-200 rounded-2xl shadow-lg ring-1 ring-black/5">
            <h3 className="text-[10px] font-mono text-stone-400 uppercase mb-4 flex items-center gap-2">
              <History className="w-3 h-3 text-orange-500" /> Менин дизайндарым
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {savedDesigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone-400 text-xs italic">Сиз азырынча эч кандай дизайн сактай элексиз.</p>
                </div>
              ) : (
                savedDesigns.map((design) => (
                  <div key={design.id} className="group relative bg-stone-50 rounded-xl p-2 border border-stone-200 overflow-hidden">
                    <img src={design.image} alt="Fence Design" className="w-full h-20 object-cover rounded-lg mb-2 bg-stone-200" />
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] text-stone-400 font-mono">{design.date}</span>
                      <div className="flex gap-2 text-stone-500">
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `my-fence-design-${design.id}.png`;
                            link.href = design.image;
                            link.click();
                          }}
                          className="p-1 hover:text-orange-500 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteDesign(design.id)}
                          className="p-1 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={resetBoard}
            className="w-full py-4 bg-white text-stone-700 font-bold rounded-2xl border border-stone-200 hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
          >
            <RotateCcw className="w-5 h-5 text-orange-500" /> ТАЗАЛОО
          </button>

          <div className="mt-auto flex justify-center">
             <div className="flex items-center gap-2 text-stone-300 font-mono text-[10px] uppercase tracking-widest">
               <HardHat className="w-3 h-3" /> AI Builder
             </div>
          </div>
        </div>
      </div>

      {/* Mobile "My Designs" Section */}
      <div className="w-full max-w-7xl mt-8 lg:hidden">
         <div className="bg-white p-6 border border-stone-200 rounded-3xl shadow-lg ring-1 ring-black/5">
            <h3 className="text-[10px] font-mono text-stone-400 uppercase mb-6 flex items-center gap-2">
              <History className="w-3 h-3 text-orange-500" /> Менин дизайндарым
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {savedDesigns.length === 0 ? (
                 <div className="col-span-full py-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                   <p className="text-stone-400 text-sm italic">Бул жерде сиздин сакталган дизайндарыңыз көрүнөт.</p>
                 </div>
              ) : (
                savedDesigns.map((design) => (
                  <div key={design.id} className="relative bg-stone-50 rounded-2xl p-2 border border-stone-200">
                    <img src={design.image} alt="Fence Design" className="w-full aspect-video object-cover rounded-xl mb-2 bg-stone-200" />
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[8px] text-stone-400 font-mono">{design.date}</span>
                      <div className="flex gap-3 text-stone-500">
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `my-fence-design-${design.id}.png`;
                            link.href = design.image;
                            link.click();
                          }}
                          className="text-stone-400 active:text-orange-500"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteDesign(design.id)}
                          className="text-stone-400 active:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
         </div>
      </div>
    </div>
  );
}
