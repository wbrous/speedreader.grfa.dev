import React, { useState, useEffect } from "react";
import { Settings, Play, Pause, RotateCcw, Upload, X } from "lucide-react";

const DEFAULT_TEXT = `Welcome to your minimalist speed reader. This tool uses Rapid Serial Visual Presentation (RSVP) to help you read faster. By aligning the Optimal Recognition Point (ORP) of each word to a fixed red focal point, your eyes don't have to scan across the page. This eliminates saccades and allows you to absorb information at incredibly high speeds. To start or pause, simply click anywhere on the reading area or press the Spacebar. You can use the left and right arrow keys to step backwards and forwards. Open the settings menu to paste your own text, adjust the reading speed, or upload a custom font file.`;

export default function SpeedReaderApp() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(350);
  const [showSettings, setShowSettings] = useState(false);

  // Font Customization State
  const [selectedFont, setSelectedFont] = useState("Georgia, serif");
  const [customFonts, setCustomFonts] = useState([]);

  // Parse text into words array
  useEffect(() => {
    const parsedWords = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setWords(parsedWords);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [text]);

  // ORP Calculation (Optimal Recognition Point)
  const getORPIndex = (word) => {
    const len = word.length;
    // Map word length to optimal focus index
    const orpMap = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4];
    return len < orpMap.length ? orpMap[len] : 4;
  };

  // Playback Logic
  useEffect(() => {
    let timeoutId;

    if (isPlaying && currentIndex < words.length) {
      const currentWord = words[currentIndex];

      // Calculate delay based on WPM and punctuation
      const baseDelay = 60000 / wpm;
      let multiplier = 1;

      if (
        currentWord.endsWith(".") ||
        currentWord.endsWith("!") ||
        currentWord.endsWith("?")
      ) {
        multiplier = 2.0; // Longer pause for sentence end
      } else if (
        currentWord.endsWith(",") ||
        currentWord.endsWith(";") ||
        currentWord.endsWith(":")
      ) {
        multiplier = 1.5; // Slight pause for comma
      } else if (currentWord.length > 10) {
        multiplier = 1.2; // Slight pause for very long words
      }

      timeoutId = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev + 1 >= words.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, baseDelay * multiplier);
    }

    return () => clearTimeout(timeoutId);
  }, [isPlaying, currentIndex, words, wpm]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT")
        return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentIndex((prev) => Math.min(words.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [words.length]);

  // Handle Font Upload
  const handleFontUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fontName = `Custom_${file.name.split(".")[0]}_${Date.now()}`;
    const fontUrl = URL.createObjectURL(file);
    const fontFace = new FontFace(fontName, `url(${fontUrl})`);

    try {
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      setCustomFonts((prev) => [...prev, { name: file.name, value: fontName }]);
      setSelectedFont(fontName);
    } catch (error) {
      console.error("Failed to load font", error);
    }
  };

  // Rendering the current word
  const renderWord = () => {
    if (words.length === 0) return null;
    const word = words[currentIndex] || "";
    const orpIndex = getORPIndex(word);

    const leftPart = word.substring(0, orpIndex);
    const orpChar = word.charAt(orpIndex);
    const rightPart = word.substring(orpIndex + 1);

    return (
      <div
        className="w-full flex items-center text-5xl md:text-7xl font-medium tracking-wide antialiased"
        style={{ fontFamily: selectedFont }}
      >
        <div className="w-[40%] text-right whitespace-pre">{leftPart}</div>
        <div className="text-[#ff5a50] relative">
          {orpChar}
          {/* Vertical Alignment Notches */}
          <div className="absolute left-1/2 -top-[calc(4rem)] w-[2px] h-4 bg-[#333] -translate-x-1/2"></div>
          <div className="absolute left-1/2 -bottom-[calc(4rem)] w-[2px] h-4 bg-[#333] -translate-x-1/2"></div>
        </div>
        <div className="w-[60%] text-left whitespace-pre">{rightPart}</div>
      </div>
    );
  };

  const togglePlay = () => {
    if (currentIndex >= words.length - 1 && !isPlaying) {
      setCurrentIndex(0); // Restart if at the end
    }
    setIsPlaying(!isPlaying);
  };

  // Progress percentage
  const progress =
    words.length > 0 ? (currentIndex / (words.length - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden select-none">
      {/* Top subtle progress bar */}
      <div className="h-1 bg-gray-900 w-full fixed top-0 left-0 z-10">
        <div
          className="h-full bg-[#ff5a50] transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Reading Area */}
      <div
        className="flex-1 flex flex-col items-center justify-center cursor-pointer relative z-0"
        onClick={togglePlay}
      >
        <div className="relative w-full max-w-5xl h-32 flex items-center justify-center my-12">
          {/* Horizontal Alignment Lines */}
          <div className="absolute top-0 left-0 w-full border-t border-[#1a1a1a]"></div>
          <div className="absolute bottom-0 left-0 w-full border-b border-[#1a1a1a]"></div>

          {renderWord()}
        </div>
      </div>

      {/* Persistent WPM Display */}
      <div className="absolute bottom-6 right-8 text-[#4a4a4a] italic text-sm pointer-events-none">
        {wpm} wpm
      </div>

      {/* Floating Header Controls (Fades out when playing) */}
      <div
        className={`absolute top-6 right-8 flex gap-4 transition-opacity duration-300 ${isPlaying ? "opacity-0" : "opacity-100"}`}
      >
        <button
          onClick={() => {
            setCurrentIndex(0);
            setIsPlaying(false);
          }}
          className="p-2 text-gray-500 hover:text-white transition-colors"
          title="Restart"
        >
          <RotateCcw size={24} />
        </button>
        <button
          onClick={togglePlay}
          className="p-2 text-gray-500 hover:text-white transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(true);
            setIsPlaying(false);
          }}
          className="p-2 text-gray-500 hover:text-white transition-colors"
          title="Settings"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#222]">
              <h2 className="text-xl font-semibold text-gray-200">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Text Input Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Content to Read
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-40 bg-black border border-[#333] rounded-lg p-4 text-gray-300 focus:outline-none focus:border-[#ff5a50] resize-none"
                  placeholder="Paste your text here..."
                />
                <div className="text-xs text-gray-600 flex justify-end">
                  {words.length} words total
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WPM Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-400">
                      Reading Speed
                    </label>
                    <span className="text-[#ff5a50] font-bold">{wpm} WPM</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="10"
                    value={wpm}
                    onChange={(e) => setWpm(Number(e.target.value))}
                    className="w-full accent-[#ff5a50]"
                  />
                </div>

                {/* Font Selector */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-400">
                    Typography
                  </label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full bg-black border border-[#333] rounded-lg p-3 text-gray-300 focus:outline-none focus:border-[#ff5a50]"
                  >
                    <optgroup label="Default Fonts">
                      <option value="Georgia, serif">Georgia (Serif)</option>
                      <option value="'Times New Roman', serif">
                        Times New Roman
                      </option>
                      <option value="Arial, sans-serif">Arial (Sans)</option>
                      <option value="system-ui, sans-serif">System UI</option>
                      <option value="monospace">Monospace</option>
                    </optgroup>
                    {customFonts.length > 0 && (
                      <optgroup label="Custom Fonts">
                        {customFonts.map((font, idx) => (
                          <option key={idx} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      onChange={handleFontUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg p-3 text-gray-300 transition-colors">
                      <Upload size={18} />
                      <span className="text-sm">Upload Font File</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
