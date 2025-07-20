
import React from 'react';

export interface Template {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  urgency: string;
  riskLevel: 'high' | 'critical' | 'medium' | 'low';
  complianceRequirements: string[];
  fields: string[];
  highlight?: boolean;
  optionalClauses?: OptionalClause[];
}

export interface OptionalClause {
  id: string;
  title: string;
  description: string;
  content: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  priceId: string;
  features: string[];
  popular: boolean;
  recurring?: boolean;
}

export interface FieldLabels {
  [key:string]: string;
}

export interface LegalIntelligenceTip {
  icon: string;
  title: string;
  content: string;
  warning?: string;
  calculation?: string;
  risk?: string;
  bestPractice?: string;
  formula?: string;
  stat?: string;
  tip?: string;
  deadline?: string;
  complianceNote?: {
    text: string;
    source: string;
    isNew?: boolean;
  };
}

export interface LegalIntelligence {
  [key: string]: LegalIntelligenceTip;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  scores: number[];
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  details: string;
  level: 'info' | 'success' | 'warning' | 'error';
  user: string;
  documentVersion: string;
}

export interface QuizResult {
  score: number;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
}

export interface SavedDocument {
  id: number;
  template: string;
  templateTitle: string;
  formData: CustomFormData;
  documentText: string;
  aiRiskAnalysis: AIRiskAnalysis;
  version: string;
  state: string;
  createdAt: string;
  documentId?: string;
  downloaded: boolean;
}

export interface CustomFormData {
  [key: string]: any;
}

export interface Errors {
  [key: string]: string;
}

export interface AIRiskAnalysis {
  score: number;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  breakdown: { title: string; reasoning: string }[];
}

export interface GeneratedDoc {
  documentText: string;
  riskAnalysis: AIRiskAnalysis;
  formData?: CustomFormData;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
}

export interface AssistantResponse {
    answer: string;
    sources: GroundingSource[];
}

export interface UserProfile {
  email: string;
  subscriptionPlan: 'free' | 'pro';
  availableAiQueries: number;
  purchasedDocSlots: number;
}
