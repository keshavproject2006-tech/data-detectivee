export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: number;
  lastLogin: number;
  totalUploads?: number;
  totalReports?: number;
}

export interface ColumnMetric {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'unknown';
  missingCount: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  mode?: string | number;
  stdDev?: number;
  variance?: number;
  uniqueValues?: string[];
  missingPercentage: number;
}

export interface DatasetAnalysis {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  uploadTime: number;
  rowCount: number;
  columnCount: number;
  columns: ColumnMetric[];
  primaryKey: string;
  missingPercentage: number;
  duplicateCount: number;
  dataQualityScore: number;
  rawSample: Record<string, any>[]; // Top rows for preview
  cleanedSample?: Record<string, any>[];
  hasBeenCleaned: boolean;
  
  // AI Generated Insights (Stored after generation)
  aiSummary?: {
    plainEnglishExplanation: string;
    executiveSummary: string;
    keyFindings: string[];
    correlations: string[];
    trends: string[];
    businessInsights: string[];
    riskAnalysis: string[];
    recommendations: string[];
    suggestedKPIs: string[];
    mlModels: string[];
    featureImportance: string[];
    storytelling: string;
    confidenceScore: number;
    dashboardTitle: string;
    datasetDescription: string;
  };

  // Anomalies
  anomalies?: AnomalyItem[];

  // Predictions
  predictions?: PredictionItem[];

  // History / social features
  isFavorite?: boolean;
  isShared?: boolean;
}

export interface AnomalyItem {
  rowIndex: number;
  columnName: string;
  value: any;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export interface PredictionItem {
  targetColumn: string;
  forecast: { label: string | number; value: number; confidenceMin: number; confidenceMax: number }[];
  explanation: string;
  confidenceScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  datasetId: string;
  datasetName: string;
  messages: ChatMessage[];
  updatedAt: number;
}
