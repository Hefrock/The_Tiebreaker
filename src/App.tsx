/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Table, 
  Zap, 
  Send, 
  Loader2, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  BrainCircuit,
  Settings,
  Key,
  X
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { generateAnalysis } from './services/aiService';
import { AnalysisType, AnalysisResult, AIProvider, APIKeys } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [decision, setDecision] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('pros-cons');
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<APIKeys>(() => {
    const saved = localStorage.getItem('tiebreaker_keys');
    return saved ? JSON.parse(saved) : { openai: '', claude: '' };
  });

  const saveKeys = (newKeys: APIKeys) => {
    setApiKeys(newKeys);
    localStorage.setItem('tiebreaker_keys', JSON.stringify(newKeys));
  };

  const handleAnalyze = useCallback(async () => {
    if (!decision.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const content = await generateAnalysis(decision, analysisType, provider, apiKeys);
      setResult({
        type: analysisType,
        provider: provider,
        content: content || 'No analysis generated.',
        title: decision
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate analysis. Please check your API keys.');
    } finally {
      setIsLoading(false);
    }
  }, [decision, analysisType, provider, apiKeys]);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const reset = () => {
    setDecision('');
    setResult(null);
    setError(null);
    setIsCopied(false);
  };

  const analysisOptions: { id: AnalysisType; label: string; icon: any; description: string }[] = [
    { 
      id: 'pros-cons', 
      label: 'Pros & Cons', 
      icon: Scale, 
      description: 'A balanced look at the advantages and disadvantages.' 
    },
    { 
      id: 'comparison', 
      label: 'Comparison', 
      icon: Table, 
      description: 'Compare different options side-by-side in a table.' 
    },
    { 
      id: 'swot', 
      label: 'SWOT Analysis', 
      icon: Zap, 
      description: 'Strengths, Weaknesses, Opportunities, and Threats.' 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative w-full max-w-3xl"
      >
        <div className="absolute right-0 top-0">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-full transition-all"
            title="API Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
        <div className="inline-flex items-center justify-center p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-200 mb-4">
          <Scale className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight mb-2">
          The <span className="text-brand-600">Tiebreaker</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-md mx-auto">
          AI-powered decision support to help you cut through the noise and make the right choice.
        </p>
      </motion.header>

      <main className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8"
            >
              <div className="space-y-6">
                {/* Decision Input */}
                <div>
                  <label htmlFor="decision" className="block text-sm font-semibold text-slate-700 mb-2">
                    What decision are you weighing?
                  </label>
                  <textarea
                    id="decision"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none text-slate-800 placeholder:text-slate-400"
                    placeholder="e.g., Should I move to a new city for a job offer, or stay where I am?"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                  />
                </div>

                {/* AI Provider Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="provider" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <BrainCircuit className="w-4 h-4 text-brand-500" />
                      Select AI Brain
                    </label>
                    {provider !== 'gemini' && apiKeys[provider as keyof APIKeys] && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Key className="w-2.5 h-2.5" />
                        Key Active
                      </span>
                    )}
                  </div>
                  <select
                    id="provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as AIProvider)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-slate-800 font-medium"
                  >
                    <option value="gemini">Google Gemini (Built-in)</option>
                    <option value="openai">OpenAI GPT-4o {apiKeys.openai ? '🔑' : ''}</option>
                    <option value="claude">Anthropic Claude 3.5 Sonnet {apiKeys.claude ? '🔑' : ''}</option>
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500 italic">
                    OpenAI and Claude require your own API keys. Click the gear icon to configure.
                  </p>
                </div>

                {/* Analysis Type Selection */}
                <div>
                  <span className="block text-sm font-semibold text-slate-700 mb-3">
                    Choose your analysis style
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {analysisOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setAnalysisType(option.id)}
                        className={cn(
                          "flex flex-col items-center p-4 rounded-2xl border-2 transition-all text-center group",
                          analysisType === option.id
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <option.icon className={cn(
                          "w-6 h-6 mb-2 transition-colors",
                          analysisType === option.id ? "text-brand-600" : "text-slate-400 group-hover:text-slate-500"
                        )} />
                        <span className="font-bold text-sm">{option.label}</span>
                        <span className="text-[10px] mt-1 leading-tight opacity-70">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !decision.trim()}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg",
                    isLoading || !decision.trim()
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-brand-200 active:scale-[0.98]"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Break the Tie
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Result Card */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                      {analysisOptions.find(o => o.id === result.type)?.icon && 
                        (() => {
                          const Icon = analysisOptions.find(o => o.id === result.type)!.icon;
                          return <Icon className="w-5 h-5" />;
                        })()
                      }
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {analysisOptions.find(o => o.id === result.type)?.label} Analysis
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopy}
                      className={cn(
                        "p-2 rounded-full transition-all flex items-center gap-2 text-sm font-medium",
                        isCopied 
                          ? "bg-green-100 text-green-700" 
                          : "hover:bg-slate-200 text-slate-500"
                      )}
                      title="Copy to Clipboard"
                    >
                      {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {isCopied && <span className="pr-1">Copied!</span>}
                    </button>
                    <button 
                      onClick={reset}
                      className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                      title="Start Over"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8">
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Decision</span>
                    <p className="text-slate-700 font-medium italic">"{result.title}"</p>
                  </div>

                  <div className="markdown-body">
                    <Markdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-8 -mx-6 px-6 sm:mx-0 sm:px-0 scrollbar-hide">
                            <table className="w-full border-collapse" {...props} />
                          </div>
                        ),
                        td: ({node, children, ...props}) => {
                          // Helper to wrap bullet points in a styled span
                          const renderChildren = (child: any): any => {
                            if (typeof child === 'string') {
                              return child.split('\n').map((line, i) => {
                                if (line.trim().startsWith('•')) {
                                  return (
                                    <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0 group/item">
                                      <span className="text-brand-500 font-bold shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">•</span>
                                      <span className="text-slate-600 group-hover/item:text-slate-900 transition-colors">{line.replace('•', '').trim()}</span>
                                    </div>
                                  );
                                }
                                return <div key={i}>{line}</div>;
                              });
                            }
                            if (Array.isArray(child)) {
                              return child.map((c, i) => <div key={i}>{renderChildren(c)}</div>);
                            }
                            return child;
                          };

                          return (
                            <td {...props}>
                              <div className="flex flex-col">
                                {renderChildren(children)}
                              </div>
                            </td>
                          );
                        }
                      }}
                    >
                      {result.content}
                    </Markdown>
                  </div>
                </div>

                <div className="bg-brand-50 px-6 py-4 border-t border-brand-100 flex items-center justify-between text-brand-700 text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-500" />
                    Analysis generated by {result.provider === 'gemini' ? 'Google Gemini' : result.provider === 'openai' ? 'OpenAI GPT-4o' : 'Claude 3.5 Sonnet'}.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start a New Analysis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-bold text-slate-900">API Settings</h2>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <p className="text-sm text-slate-600">
                  Enter your API keys below. They are stored locally in your browser and never sent to our servers except to proxy your AI requests.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password"
                        value={apiKeys.openai}
                        onChange={(e) => saveKeys({ ...apiKeys, openai: e.target.value })}
                        placeholder="sk-..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Anthropic API Key
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password"
                        value={apiKeys.claude}
                        onChange={(e) => saveKeys({ ...apiKeys, claude: e.target.value })}
                        placeholder="sk-ant-..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        <strong>Gemini Note:</strong> The built-in Gemini key is currently active for testing. In some public environments, it may require a manual key override if the default quota is reached.
                      </p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-slate-400 text-sm text-center">
        <p>© {new Date().getFullYear()} The Tiebreaker • Built with Gemini AI</p>
      </footer>
    </div>
  );
}
