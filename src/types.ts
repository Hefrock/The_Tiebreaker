export type AnalysisType = 'pros-cons' | 'comparison' | 'swot';
export type AIProvider = 'gemini' | 'openai' | 'claude';

export interface APIKeys {
  openai?: string;
  claude?: string;
}

export interface AnalysisResult {
  type: AnalysisType;
  provider: AIProvider;
  content: string;
  title: string;
}
