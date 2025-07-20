
import React, { useState, useEffect, useCallback, useMemo, SetStateAction, Dispatch, useRef } from 'react';
import { 
  FileText, Download, Eye, AlertCircle, Check, Shield, 
  Clock, DollarSign, Lock, Zap, Award, AlertTriangle, 
  CheckCircle, XCircle, Brain, RefreshCw, Star, Users, X, ClipboardCheck, Loader, ArrowRight, BookOpen, Info, LayoutDashboard, ArrowLeft, Link as LinkIcon, Mail, PlayCircle, Building, Hammer, Handshake, Globe
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import { TEMPLATES, FIELD_LABELS, LEGAL_INTELLIGENCE, PRODUCTS, QUIZ_QUESTIONS, TESTIMONIALS } from './constants';
import { Template, Product, QuizQuestion, FieldLabels, LegalIntelligence, QuizResult, CustomFormData, Errors, GeneratedDoc, AIRiskAnalysis, SavedDocument, AssistantResponse, OptionalClause, GroundingSource, Testimonial, UserProfile } from './types';
import { generateDocumentAndAnalysis, askLegalAssistant } from './services/geminiService';
import { subscribeToNurtureSequence } from './services/emailService';
import { TERMS_CONTENT, PRIVACY_POLICY_CONTENT } from './legalContent';
import { SpeedInsights } from '@vercel/speed-insights/react';

// HELPER & UI COMPONENTS

const LoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-lg h-full">
        <Loader className="w-12 h-12 text-brand-blue-500 animate-spin mb-4" />
        <p className="text-lg font-semibold text-gray-700">{text}</p>
        <p className="text-sm text-gray-500 mt-1">This may take a few moments...</p>
    </div>
);


const WarningNotification: React.FC<{ show: boolean; message: string }> = React.memo(({ show, message }) => (
  <div className={`fixed top-20 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all z-[100] ${
    show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
  }`}>
    <AlertTriangle className="w-5 h-5" />
    <span>{message}</span>
  </div>
));

const SuccessNotification: React.FC<{ show: boolean; message: string }> = React.memo(({ show, message }) => (
  <div className={`fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all z-[100] ${
    show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
  }`}>
    <CheckCircle className="w-5 h-5" />
    <span>{message}</span>
  </div>
));

const LegalTip: React.FC<{ tip: LegalIntelligence[string] }> = React.memo(({ tip }) => {
    return (
        <div className="group relative flex items-center ml-2">
            <Info className="w-4 h-4 text-brand-blue-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                <h5 className="font-bold mb-1">{tip.title}</h5>
                <p>{tip.content}</p>
                {tip.warning && <p className="mt-2 text-amber-300"><span className="font-bold">Warning:</span> {tip.warning}</p>}
                {tip.calculation && <p className="mt-2 text-cyan-300"><span className="font-bold">Info:</span> {tip.calculation}</p>}
                {tip.risk && <p className="mt-2 text-red-400"><span className="font-bold">Risk:</span> {tip.risk}</p>}
                {tip.bestPractice && <p className="mt-2 text-green-300"><span className="font-bold">Best Practice:</span> {tip.bestPractice}</p>}
                {tip.formula && <p className="mt-2 text-purple-300"><span className="font-bold">Formula:</span> {tip.formula}</p>}
                {tip.stat && <p className="mt-2 text-indigo-300"><span className="font-bold">Stat:</span> {tip.stat}</p>}
                {tip.tip && <p className="mt-2 text-blue-300"><span className="font-bold">Tip:</span> {tip.tip}</p>}
                {tip.deadline && <p className="mt-2 text-yellow-300"><span className="font-bold">Deadline:</span> {tip.deadline}</p>}
                {tip.complianceNote && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className={`text-sm ${tip.complianceNote.isNew ? 'text-green-300' : 'text-gray-400'}`}>
                            {tip.complianceNote.isNew && <span className="font-bold">New Update: </span>}
                            {tip.complianceNote.text}
                            <span className="text-xs italic text-gray-500 ml-1"> (Source: {tip.complianceNote.source})</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
});


const useLocalStorage = <T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const EmailGateView: React.FC<{ onLogin: (email: string, consent: boolean) => Promise<void>, title: string, subtitle: string }> = ({ onLogin, title, subtitle }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onLogin(email, consent);
    } catch (err) {
      console.error("Login/Subscription failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-brand-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-brand-blue-500 focus:border-brand-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your business email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          
          <div className="mt-6 flex items-start">
            <div className="flex items-center h-5">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="focus:ring-brand-blue-500 h-4 w-4 text-brand-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="text-gray-600">
                Yes, send me the free 5-day Legal Risk email course.
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-brand-blue-600 hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
               {isLoading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">
            By continuing, you agree to our <a href="#" onClick={(e) => { e.preventDefault(); alert(TERMS_CONTENT.replace(/<[^>]+>/g, ''))}} className="font-medium text-brand-blue-600 hover:text-brand-blue-500">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
};

type View =
  | { name: 'hero'; props?: { scrollTo?: string } }
  | { name: 'quiz' }
  | { name: 'quizResult'; props: { result: QuizResult } }
  | { name: 'pricing' }
  | { name: 'documentGenerator'; props: { templateId: string; savedDocumentId?: number } }
  | { name: 'documentViewer'; props: { doc: SavedDocument } }
  | { name: 'dashboard' }
  | { name: 'assistant' }
  | { name: 'emailGate'; props: { title: string; subtitle: string } }
  | { name: 'legal'; props: { content: 'terms' | 'privacy' } };

const Header: React.FC<{ 
  userProfile: UserProfile | null; 
  onLogout: () => void;
  onNavigate: (viewName: View['name'], props?: any) => void;
}> = React.memo(({ userProfile, onLogout, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userEmail = userProfile?.email;

  const scrollHandler = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('hero', { scrollTo: id });
    setIsMobileMenuOpen(false);
  };
  
  const navItems = userEmail ? [
    { name: 'Dashboard', action: () => onNavigate('dashboard') },
    { name: 'AI Assistant', action: () => onNavigate('assistant') },
    { name: 'Log Out', action: onLogout }
  ] : [
    { name: 'Templates', action: scrollHandler('templates') },
    { name: 'Features', action: scrollHandler('features') },
    { name: 'Pricing', action: () => onNavigate('pricing') }
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => onNavigate(userEmail ? 'dashboard' : 'hero')} className="flex-shrink-0 text-xl font-bold text-brand-blue-800 flex items-center gap-2">
              <Shield className="w-6 h-6"/>
              Legally Legit AI
            </button>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={item.action}
                  className="text-gray-700 hover:bg-brand-blue-500 hover:text-white px-3 py-2 rounded-md text-lg font-medium"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            {userEmail ? null : (
              <button
                onClick={() => onNavigate('emailGate', { title: 'Get Started', subtitle: 'Enter your email to create your account and save your progress.'})}
                className="bg-brand-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-blue-700"
              >
                Get Started
              </button>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-gray-200 inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-white hover:bg-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <BookOpen className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={item.action}
                className="text-gray-700 hover:bg-brand-blue-500 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
              >
                {item.name}
              </button>
            ))}
            {userEmail ? null : (
               <button
                onClick={() => {
                  onNavigate('emailGate', { title: 'Get Started', subtitle: 'Enter your email to create your account and save your progress.'});
                  setIsMobileMenuOpen(false);
                }}
                className="bg-brand-blue-600 text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-brand-blue-700 mt-2"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});

const Footer: React.FC<{ onNavigate: (viewName: View['name'], props?: any) => void; }> = React.memo(({ onNavigate }) => (
    <footer className="bg-gray-800 text-white">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                <div className="space-y-8 xl:col-span-1">
                    <h3 className="text-2xl font-bold flex items-center gap-2"><Shield /> Legally Legit AI</h3>
                    <p className="text-gray-400 text-base">AI-powered legal documents for savvy Australian businesses.</p>
                </div>
                <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
                    <div className="md:grid md:grid-cols-2 md:gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Solutions</h3>
                            <ul className="mt-4 space-y-4">
                                {TEMPLATES.slice(0, 4).map(template => (
                                    <li key={template.id}>
                                        <button onClick={() => onNavigate('documentGenerator', { templateId: template.id })} className="text-base text-gray-400 hover:text-white">{template.title}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-12 md:mt-0">
                            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Support</h3>
                            <ul className="mt-4 space-y-4">
                                <li>
                                    <button onClick={() => onNavigate('pricing')} className="text-base text-gray-400 hover:text-white">Pricing</button>
                                </li>
                                <li>
                                    <button onClick={() => onNavigate('dashboard')} className="text-base text-gray-400 hover:text-white">Dashboard</button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="md:grid md:grid-cols-2 md:gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Company</h3>
                            <ul className="mt-4 space-y-4">
                                <li>
                                    <button onClick={() => onNavigate('hero', { scrollTo: 'features' })} className="text-base text-gray-400 hover:text-white">Features</button>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-12 md:mt-0">
                            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
                            <ul className="mt-4 space-y-4">
                                <li>
                                  <button onClick={() => onNavigate('legal', { content: 'terms' })} className="text-base text-gray-400 hover:text-white">Terms</button>
                                </li>
                                <li>
                                  <button onClick={() => onNavigate('legal', { content: 'privacy' })} className="text-base text-gray-400 hover:text-white">Privacy</button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-12 border-t border-gray-700 pt-8 text-center">
                 <p className="text-sm text-gray-400">Have questions? Email us at <a href="mailto:admin@legallylegitai.com.au" className="font-medium text-brand-blue-300 hover:text-white">admin@legallylegitai.com.au</a></p>
                <p className="text-base text-gray-400 mt-4">&copy; {new Date().getFullYear()} Legally Legit AI Pty Ltd. All rights reserved.</p>
                <p className="text-xs text-gray-500 mt-2">Disclaimer: We are not a law firm and do not provide legal advice. The information and documents provided are for informational purposes only and do not constitute legal advice or create a solicitor-client relationship.</p>
            </div>
        </div>
    </footer>
));

const PricingView: React.FC<{ 
    onNavigate: (viewName: View['name'], props?: any) => void, 
    onPurchase: (productId: string) => void,
    userProfile: UserProfile | null,
    isEmbedded?: boolean 
}> = React.memo(({ onNavigate, onPurchase, userProfile, isEmbedded = false }) => {
    return (
        <div className={`py-12 ${!isEmbedded ? 'bg-white' : ''}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Simple, Transparent Pricing</h2>
                    <p className="mt-4 text-xl text-gray-600">Choose the plan that's right for your business.</p>
                </div>

                <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-x-10">
                    {PRODUCTS.map((product) => (
                        <div key={product.id} className={`rounded-2xl shadow-xl p-8 flex flex-col ${product.popular ? 'border-4 border-brand-blue-500' : 'border border-gray-200'}`}>
                            {product.popular && (
                                <div className="text-center">
                                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-brand-blue-100 text-brand-blue-800">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <h3 className="mt-4 text-2xl font-bold text-gray-900">{product.name}</h3>
                            <p className="mt-1 text-gray-500">{product.subtitle}</p>
                            <div className="mt-6">
                                <span className="text-5xl font-extrabold text-gray-900">${product.price}</span>
                                {product.recurring ? <span className="text-lg font-medium text-gray-500">/month</span> : <span className="text-lg font-medium text-gray-500"> one-time</span>}
                            </div>
                            <ul className="mt-8 space-y-4 flex-grow">
                                {product.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                        </div>
                                        <p className="ml-3 text-base text-gray-700">{feature}</p>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => {
                                    if (userProfile) {
                                        onPurchase(product.id);
                                    } else {
                                        onNavigate('emailGate', { title: `Get ${product.name}`, subtitle: 'First, create a free account to continue.' });
                                    }
                                }}
                                className={`mt-8 w-full py-3 px-6 rounded-lg text-lg font-semibold ${product.popular ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700' : 'bg-brand-blue-100 text-brand-blue-800 hover:bg-brand-blue-200'}`}
                            >
                                {userProfile ? 'Get Plan' : 'Get Started'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

// START: Fixed and Added Components

const TemplateCard: React.FC<{ template: Template; onNavigate: (viewName: View['name'], props?: any) => void; }> = ({ template, onNavigate }) => (
    <div className={`bg-white rounded-2xl shadow-lg p-6 flex flex-col text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${template.highlight ? 'border-2 border-brand-blue-500' : 'border border-gray-100'}`}>
      <div className="bg-brand-blue-100 p-4 rounded-full self-center ring-8 ring-brand-blue-50">{template.icon}</div>
      <h3 className="mt-5 text-xl font-bold text-gray-900">{template.title}</h3>
      <p className="mt-2 text-base text-gray-600 flex-grow">{template.description}</p>
      {template.highlight && (
          <div className="mt-3 bg-red-100 text-red-700 rounded-md px-3 py-1 text-sm font-semibold">
              <AlertTriangle className="inline w-4 h-4 mr-1"/>
              {template.urgency}
          </div>
      )}
      <button
        onClick={() => onNavigate('documentGenerator', { templateId: template.id })}
        className="mt-6 w-full bg-brand-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 transition-colors flex items-center justify-center gap-2">
        Create Document <ArrowRight className="w-5 h-5"/>
      </button>
    </div>
);

const RiskAnalysisDisplay: React.FC<{ analysis: AIRiskAnalysis }> = ({ analysis }) => {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'Critical': return 'text-red-600 border-red-500 bg-red-50';
            case 'High': return 'text-orange-600 border-orange-500 bg-orange-50';
            case 'Medium': return 'text-yellow-600 border-yellow-500 bg-yellow-50';
            case 'Low': return 'text-green-600 border-green-500 bg-green-50';
            default: return 'text-gray-600 border-gray-500 bg-gray-50';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center"><Brain className="mr-2 text-brand-blue-500"/> AI Risk Analysis</h3>
            <div className={`mt-4 p-4 rounded-lg border-l-4 ${getRiskColor(analysis.level)}`}>
                <p className="font-bold text-lg">Overall Risk: {analysis.level} ({analysis.score}/100)</p>
                <p className="mt-1">{analysis.summary}</p>
            </div>
            <div className="mt-4">
                <h4 className="font-semibold text-lg text-gray-800">Key Risk Factors:</h4>
                <ul className="mt-2 space-y-3">
                    {analysis.breakdown.map((item, index) => (
                        <li key={index} className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-gray-500 mr-3 mt-1 flex-shrink-0"/>
                            <div>
                                <p className="font-semibold text-gray-800">{item.title}</p>
                                <p className="text-gray-600">{item.reasoning}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const DocumentGeneratorView: React.FC<{
    templateId: string;
    onNavigate: (view: View['name'], props?: any) => void;
    onSave: (doc: SavedDocument) => void;
    userProfile: UserProfile | null;
    savedDocument?: SavedDocument | null;
}> = ({ templateId, onNavigate, onSave, userProfile, savedDocument }) => {
    const template = useMemo(() => TEMPLATES.find(t => t.id === templateId), [templateId]);
    const [formData, setFormData] = useState<CustomFormData>(savedDocument?.formData || {});
    const [errors, setErrors] = useState<Errors>({});
    const [userState, setUserState] = useState('New South Wales');
    const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [optionalClauses, setOptionalClauses] = useState<OptionalClause[]>([]);

    useEffect(() => {
        if(savedDocument?.formData) {
            setFormData(savedDocument.formData);
        }
    }, [savedDocument]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const toggleOptionalClause = (clause: OptionalClause) => {
        setOptionalClauses(prev => 
            prev.some(c => c.id === clause.id)
                ? prev.filter(c => c.id !== clause.id)
                : [...prev, clause]
        );
    };

    const validateForm = () => {
        if (!template) return false;
        const newErrors: Errors = {};
        template.fields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = `${FIELD_LABELS[field]} is required.`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenerate = async () => {
        if (!validateForm() || !template) return;
        setIsLoading(true);
        setGeneratedDoc(null);
        try {
            const doc = await generateDocumentAndAnalysis(template, formData, userState, optionalClauses);
            setGeneratedDoc({ ...doc, formData });
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (!generatedDoc || !template || !userProfile) return;
        if(userProfile.subscriptionPlan === 'free' && userProfile.purchasedDocSlots <= 0) {
            alert('Please upgrade to save documents.');
            onNavigate('pricing');
            return;
        }

        const newDoc: SavedDocument = {
            id: savedDocument?.id || Date.now(),
            template: template.id,
            templateTitle: template.title,
            formData: generatedDoc.formData || formData,
            documentText: generatedDoc.documentText,
            aiRiskAnalysis: generatedDoc.riskAnalysis,
            version: '1.0',
            state: 'Draft',
            createdAt: new Date().toISOString(),
            downloaded: savedDocument?.downloaded || false,
        };
        onSave(newDoc);
    };

    if (!template) return <div>Template not found</div>;

    const canSave = userProfile && (userProfile.subscriptionPlan === 'pro' || userProfile.purchasedDocSlots > 0);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center text-brand-blue-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5 mr-2"/> Back to Dashboard
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Form Column */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-3xl font-bold text-gray-900">{template.title}</h2>
                    <p className="mt-2 text-gray-600">{template.description}</p>
                    <div className="mt-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Governing State/Territory</label>
                            <select
                                value={userState}
                                onChange={e => setUserState(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue-500 focus:border-brand-blue-500 sm:text-sm rounded-md bg-white text-gray-900"
                            >
                                {['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory'].map(state => <option key={state}>{state}</option>)}
                            </select>
                        </div>
                        {template.fields.map(field => (
                            <div key={field}>
                                <label className="flex items-center text-sm font-medium text-gray-700">
                                    {FIELD_LABELS[field]}
                                    {LEGAL_INTELLIGENCE[field] && <LegalTip tip={LEGAL_INTELLIGENCE[field]}/>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[field] || ''}
                                    onChange={e => handleInputChange(field, e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-500 focus:border-brand-blue-500 sm:text-sm bg-white text-gray-900"
                                />
                                {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                            </div>
                        ))}

                        {template.optionalClauses && template.optionalClauses.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800">Optional Clauses</h4>
                                <div className="mt-2 space-y-2">
                                    {template.optionalClauses.map(clause => (
                                        <div key={clause.id} className="flex items-start">
                                            <input
                                                type="checkbox"
                                                id={clause.id}
                                                checked={optionalClauses.some(c => c.id === clause.id)}
                                                onChange={() => toggleOptionalClause(clause)}
                                                className="h-4 w-4 mt-1 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
                                            />
                                            <div className="ml-3">
                                                <label htmlFor={clause.id} className="font-medium text-gray-800">{clause.title}</label>
                                                <p className="text-sm text-gray-600">{clause.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-blue-600 hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 disabled:bg-gray-400"
                        >
                            {isLoading ? <><Loader className="animate-spin mr-2"/> Generating...</> : <><Zap className="mr-2"/> Generate Document & Analysis</>}
                        </button>
                    </div>
                </div>

                {/* Result Column */}
                <div className="relative">
                     {isLoading ? (
                        <LoadingSpinner text="Generating your document..."/>
                    ) : generatedDoc ? (
                         <div className="space-y-8">
                             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Generated Document Preview</h3>
                                 <div className="prose max-w-none h-64 overflow-y-auto p-4 border rounded-md bg-gray-50" dangerouslySetInnerHTML={{ __html: marked(generatedDoc.documentText) as string }}></div>
                                 <button onClick={handleSave} disabled={!canSave} className="mt-4 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    <ClipboardCheck className="w-5 h-5 mr-2"/> Save to Dashboard
                                 </button>
                                 {!canSave && <p className="text-xs text-center mt-2 text-red-600">You need a Pro plan or document credits to save.</p>}
                             </div>
                             <RiskAnalysisDisplay analysis={generatedDoc.riskAnalysis} />
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-lg h-full border-2 border-dashed">
                             <FileText className="w-16 h-16 text-gray-300" />
                             <h3 className="mt-4 text-xl font-semibold text-gray-700">Your Document Preview Will Appear Here</h3>
                             <p className="mt-1 text-gray-500">Fill out the form on the left and click "Generate" to see the AI-powered results.</p>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};


const HeroView: React.FC<{ onNavigate: (viewName: View['name'], props?: any) => void, scrollTo?: string }> = ({ onNavigate, scrollTo }) => {
    const templatesRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollTo) {
            const ref = scrollTo === 'templates' ? templatesRef : featuresRef;
            ref.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [scrollTo]);

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
                </div>
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">AI-Powered Legal Protection for Your Australian Business</h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">Generate compliant legal documents, analyze risks, and get peace of mind in minutes. Stop worrying about expensive fines and complex laws.</p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <button onClick={() => onNavigate('quiz')} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-gray-900 bg-yellow-400 hover:bg-yellow-500 md:py-4 md:text-lg md:px-10 transform transition-all hover:scale-105 shadow-lg">
                                <PlayCircle className="w-6 h-6 mr-2" />
                                Free Risk Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>

             {/* Templates Section */}
            <div ref={templatesRef} id="templates" className="bg-gray-50 py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Full Suite of Legal Documents</h2>
                        <p className="mt-4 text-xl text-gray-600">From hiring to protecting your IP, we've got you covered.</p>
                    </div>
                    <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {TEMPLATES.map((template) => (
                            <TemplateCard key={template.id} template={template} onNavigate={onNavigate} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div ref={featuresRef} id="features" className="py-24 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Smarter, Faster Legal Protection</h2>
                        <p className="mt-4 text-xl text-gray-600">Go beyond templates with intelligent tools built for your business.</p>
                    </div>
                    <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="p-5 bg-brand-blue-100 rounded-full">
                                <Zap className="w-8 h-8 text-brand-blue-600"/>
                            </div>
                            <h3 className="mt-5 text-xl font-bold">AI Document Generation</h3>
                            <p className="mt-2 text-gray-600">Create legally sound documents in minutes, tailored to your specific needs and Australian law.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="p-5 bg-brand-blue-100 rounded-full">
                                <Brain className="w-8 h-8 text-brand-blue-600"/>
                            </div>
                            <h3 className="mt-5 text-xl font-bold">Real-Time Risk Analysis</h3>
                            <p className="mt-2 text-gray-600">Our AI analyzes your inputs to flag potential legal risks before they become problems.</p>
                        </div>
                        <div className="flex flex-col items-center">
                             <div className="p-5 bg-brand-blue-100 rounded-full">
                                <BookOpen className="w-8 h-8 text-brand-blue-600"/>
                            </div>
                            <h3 className="mt-5 text-xl font-bold">Expert AI Assistant</h3>
                            <p className="mt-2 text-gray-600">Ask questions about Australian business law and get answers backed by Google Search.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="p-5 bg-brand-blue-100 rounded-full">
                                <Lock className="w-8 h-8 text-brand-blue-600"/>
                            </div>
                            <h3 className="mt-5 text-xl font-bold">Secure Document Storage</h3>
                            <p className="mt-2 text-gray-600">Keep all your important legal documents organized and accessible in one secure dashboard.</p>
                        </div>
                    </div>
                </div>
            </div>
            
             {/* Testimonials Section */}
            <div className="bg-gray-50 py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Trusted by Australian Businesses</h2>
                     </div>
                    <div className="mt-16 grid gap-16 lg:grid-cols-3">
                         {TESTIMONIALS.map((testimonial) => (
                            <div key={testimonial.name} className="flex flex-col">
                                <div className="bg-white p-8 rounded-2xl shadow-lg flex-grow">
                                    <p className="text-lg text-gray-700">"{testimonial.quote}"</p>
                                </div>
                                <div className="mt-4 flex items-center">
                                    <img className="h-12 w-12 rounded-full" src={testimonial.avatar} alt={testimonial.name} />
                                    <div className="ml-4">
                                        <div className="text-base font-bold text-gray-900">{testimonial.name}</div>
                                        <div className="text-base text-gray-600">{testimonial.role}, {testimonial.company}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div id="pricing">
                <PricingView onNavigate={onNavigate} onPurchase={() => alert('Purchase from pricing section')} userProfile={null} isEmbedded={true} />
            </div>
        </div>
    );
};

const QuizView: React.FC<{ onQuizComplete: (result: QuizResult) => void; }> = ({ onQuizComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUIZ_QUESTIONS.length).fill(null));

    const handleAnswer = (optionIndex: number, questionScore: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setAnswers(newAnswers);

        // This scoring logic is simple, for a real app it might be more complex
        const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
        const newScore = score - (answers[currentQuestionIndex] !== null ? currentQuestion.scores[answers[currentQuestionIndex]!] : 0) + questionScore;
        setScore(newScore);

        setTimeout(() => {
            if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                let risk: QuizResult['risk'] = 'Low';
                let message = "You're in great shape! Your foundational legal protections seem to be in a good place.";
                if (newScore > 80) {
                    risk = 'Critical';
                    message = "Urgent action required! Your business has significant legal vulnerabilities that could lead to severe penalties.";
                } else if (newScore > 50) {
                    risk = 'High';
                    message = "High risk detected. You have several key legal gaps that should be addressed as soon as possible.";
                } else if (newScore > 20) {
                    risk = 'Medium';
                    message = "There are some areas for improvement. Proactively strengthening your legal documents now can save you headaches later.";
                }
                onQuizComplete({ score: newScore, risk, message });
            }
        }, 300);
    };

    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">5-Minute Business Risk Quiz</h2>
                <p className="text-center text-gray-600 mb-6">Answer a few questions to uncover hidden legal risks.</p>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                    <div className="bg-brand-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                    {`Question ${currentQuestion.id}: ${currentQuestion.question}`}
                </h3>

                <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(index, currentQuestion.scores[index])}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-colors text-lg
                                ${answers[currentQuestionIndex] === index
                                    ? 'bg-brand-blue-500 border-brand-blue-600 text-white'
                                    : 'bg-white border-gray-300 hover:bg-brand-blue-50 hover:border-brand-blue-300'}`
                            }
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const QuizResultView: React.FC<{ result: QuizResult; onNavigate: (viewName: View['name']) => void; }> = ({ result, onNavigate }) => {
    const getRiskDetails = () => {
        switch (result.risk) {
            case 'Critical': return { color: 'red-600', icon: <XCircle className="h-24 w-24" /> };
            case 'High': return { color: 'orange-500', icon: <AlertTriangle className="h-24 w-24" /> };
            case 'Medium': return { color: 'yellow-500', icon: <AlertCircle className="h-24 w-24" /> };
            case 'Low': return { color: 'green-500', icon: <CheckCircle className="h-24 w-24" /> };
        }
    };
    const details = getRiskDetails();

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className={`mx-auto text-${details.color}`}>
                    {details.icon}
                </div>
                <h2 className={`mt-6 text-4xl font-extrabold text-${details.color}`}>{result.risk} Risk Identified</h2>
                <p className="mt-4 text-xl text-gray-700">Your score is <strong className="font-bold">{result.score}</strong> out of 100.</p>
                <p className="mt-4 text-lg text-gray-600 max-w-lg mx-auto">{result.message}</p>
                <div className="mt-8">
                    <button
                        onClick={() => onNavigate('pricing')}
                        className="w-full max-w-sm mx-auto bg-brand-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500"
                    >
                        Explore Protection Plans
                    </button>
                </div>
                <button onClick={() => onNavigate('hero')} className="mt-4 text-sm text-gray-500 hover:underline">
                    Back to Homepage
                </button>
            </div>
        </div>
    );
};

const DocumentViewerView: React.FC<{ 
  doc: SavedDocument; 
  onNavigate: (view: View['name'], props?: any) => void; 
  updateDocument: (doc: SavedDocument) => void;
  userProfile: UserProfile;
}> = ({ doc, onNavigate, updateDocument, userProfile }) => {
    const documentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPDF = async () => {
        if (!documentRef.current) return;
        if(userProfile.subscriptionPlan === 'free' && doc.downloaded) {
            alert("You have already downloaded this document. Please upgrade to Pro for unlimited downloads.");
            return;
        }

        setIsDownloading(true);
        const canvas = await html2canvas(documentRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${doc.templateTitle.replace(/\s+/g, '-')}-v${doc.version}.pdf`);
        setIsDownloading(false);

        if(userProfile.subscriptionPlan !== 'pro') {
            updateDocument({ ...doc, downloaded: true });
        }
    };
    
    const canDownload = userProfile.subscriptionPlan === 'pro' || !doc.downloaded;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center text-brand-blue-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5 mr-2"/> Back to Dashboard
            </button>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">{doc.templateTitle}</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onNavigate('documentGenerator', { templateId: doc.template, savedDocumentId: doc.id })}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-blue-700 bg-brand-blue-100 rounded-lg hover:bg-brand-blue-200">
                           <RefreshCw className="w-4 h-4"/> Edit
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading || !canDownload}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-400"
                        >
                            <Download className="w-4 h-4"/> {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
                {!canDownload && <p className="text-xs text-center mb-4 text-red-600">You have already downloaded this document once. Upgrade to Pro for unlimited downloads.</p>}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                     <div className="lg:col-span-3 p-6 border rounded-lg bg-gray-50" ref={documentRef}>
                         <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: marked(doc.documentText) as string }}></div>
                     </div>
                     <div className="lg:col-span-2">
                         <RiskAnalysisDisplay analysis={doc.aiRiskAnalysis} />
                     </div>
                </div>
            </div>
        </div>
    );
};


const DashboardView: React.FC<{ 
  userProfile: UserProfile, 
  savedDocuments: SavedDocument[], 
  onNavigate: (view: View['name'], props?: any) => void
}> = ({ userProfile, savedDocuments, onNavigate }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900">Welcome back!</h1>
        <p className="mt-2 text-lg text-gray-600">Here's your legal protection dashboard.</p>
        
        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FileText className="w-6 h-6"/>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Documents Created</p>
                <p className="text-2xl font-bold text-gray-900">{savedDocuments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Award className="w-6 h-6"/>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Subscription</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{userProfile.subscriptionPlan}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Brain className="w-6 h-6"/>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">AI Queries Left</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProfile.subscriptionPlan === 'pro' ? 'Unlimited' : userProfile.availableAiQueries}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Documents */}
        <div className="mt-12">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
            <button 
              onClick={() => onNavigate('hero', { scrollTo: 'templates' })} 
              className="px-4 py-2 text-sm font-medium text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700">
              Create New Document
            </button>
          </div>
          <div className="mt-4 bg-white rounded-xl shadow overflow-hidden">
            {savedDocuments.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {savedDocuments.map(doc => (
                  <li key={doc.id}>
                    <button onClick={() => onNavigate('documentViewer', { doc })} className="block w-full text-left hover:bg-gray-50 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <p className="text-lg font-medium text-brand-blue-700">{doc.templateTitle}</p>
                          <p className="text-sm text-gray-500">Created: {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${doc.aiRiskAnalysis.level === 'Low' ? 'green' : 'red'}-100 text-${doc.aiRiskAnalysis.level === 'Low' ? 'green' : 'red'}-800`}>
                            {doc.aiRiskAnalysis.level} Risk
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 px-6">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first document.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


const AssistantView: React.FC<{
  userProfile: UserProfile,
  updateUserProfile: (profile: Partial<UserProfile>) => void,
  onNavigate: (view: View['name'], props?: any) => void; 
}> = ({ userProfile, updateUserProfile, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentResponse, setCurrentResponse] = useState<AssistantResponse | null>(null);
    const [streamingText, setStreamingText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [streamingText, currentResponse]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        if (userProfile.subscriptionPlan === 'free' && userProfile.availableAiQueries <= 0) {
            alert('You have run out of AI assistant queries. Please upgrade for more.');
            onNavigate('pricing');
            return;
        }

        setIsLoading(true);
        setCurrentResponse(null);
        setStreamingText("");

        try {
            const response = await askLegalAssistant(query, (chunk) => {
                setStreamingText(prev => prev + chunk);
            });
            setCurrentResponse(response);
            if (userProfile.subscriptionPlan !== 'pro') {
                updateUserProfile({ availableAiQueries: userProfile.availableAiQueries - 1 });
            }
        } catch (error) {
            console.error(error);
            setStreamingText("Sorry, I encountered an error. Please try again.");
        } finally {
            setIsLoading(false);
            setQuery('');
        }
    };

    const canQuery = userProfile.subscriptionPlan === 'pro' || userProfile.availableAiQueries > 0;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 h-[calc(100vh-150px)] flex flex-col">
            <button onClick={() => onNavigate('dashboard')} className="flex items-center text-brand-blue-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5 mr-2"/> Back to Dashboard
            </button>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex-grow flex flex-col">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Brain/>AI Legal Assistant</h2>
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        Queries Left: {userProfile.subscriptionPlan === 'pro' ? 'Unlimited' : userProfile.availableAiQueries}
                    </div>
                </div>
                <p className="mt-2 text-gray-600">Ask a question about Australian business law. Powered by Google Search.</p>
                
                <div className="mt-6 flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
                    {/* Assistant Response Area */}
                    {streamingText && (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: marked(streamingText) as string }} />
                    )}
                    {currentResponse?.sources && currentResponse.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-sm text-gray-600">Sources:</h4>
                            <ul className="mt-2 space-y-1 text-xs">
                                {currentResponse.sources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:underline flex items-center gap-1">
                                            <LinkIcon className="w-3 h-3"/> {source.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={canQuery ? "e.g., What are the rules for casual employment?" : "Upgrade to ask questions"}
                        disabled={isLoading || !canQuery}
                        className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white text-gray-900"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim() || !canQuery}
                        className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-brand-blue-600 hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 disabled:bg-gray-400 flex items-center gap-2"
                    >
                        {isLoading ? <><Loader className="animate-spin w-5 h-5"/> Asking...</> : 'Ask'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const LegalView: React.FC<{ 
  content: 'terms' | 'privacy',
  onNavigate: (view: View['name'], props?: any) => void;
}> = ({ content, onNavigate }) => {
    const htmlContent = content === 'terms' ? TERMS_CONTENT : PRIVACY_POLICY_CONTENT;
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button onClick={() => onNavigate('hero')} className="flex items-center text-brand-blue-600 font-semibold mb-6 hover:underline">
                <ArrowLeft className="w-5 h-5 mr-2"/> Back to Home
            </button>
            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-gray-100">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
            </div>
        </div>
    );
};


// Main App Component
const App: React.FC = () => {
  const [view, setView] = useState<View>({ name: 'hero' });
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);
  const [savedDocuments, setSavedDocuments] = useLocalStorage<SavedDocument[]>('savedDocuments', []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const handleShowSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const handleShowWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 4000);
  };

  const handleLogin = async (email: string, consent: boolean) => {
    let subSuccess = true;
    if (consent) {
        const subResult = await subscribeToNurtureSequence(email);
        if(!subResult.success){
            handleShowWarning("Welcome! Could not subscribe to newsletter.");
            subSuccess = false;
        }
    }
    
    // For this example, we'll just create a profile.
    // In a real app, this would involve a backend call for authentication.
    const newProfile: UserProfile = {
      email,
      subscriptionPlan: 'free',
      availableAiQueries: 5, // Free tier queries
      purchasedDocSlots: 0,
    };
    setUserProfile(newProfile);
    setView({ name: 'dashboard' });
    if(subSuccess && consent) {
       handleShowSuccess(`Welcome! Check your inbox for the free course.`);
    }
  };

  const handleLogout = () => {
    setUserProfile(null);
    setView({ name: 'hero' });
    handleShowSuccess("You've been logged out.");
  };

  const handleNavigate = useCallback((viewName: View['name'], props?: any) => {
    setView({ name: viewName, props: props || {} } as View);
    window.scrollTo(0, 0);
  }, []);

  const handleSaveDocument = (doc: SavedDocument) => {
    setSavedDocuments(prev => {
      const existingIndex = prev.findIndex(d => d.id === doc.id);
      if (existingIndex > -1) {
        const newDocs = [...prev];
        newDocs[existingIndex] = doc;
        return newDocs;
      }
      return [...prev, doc];
    });

    if(userProfile && userProfile.subscriptionPlan !== 'pro'){
        const isNewDoc = !savedDocuments.some(d => d.id === doc.id);
        if(isNewDoc){
             setUserProfile(p => p ? ({ ...p, purchasedDocSlots: p.purchasedDocSlots - 1 }) : null);
        }
    }

    handleShowSuccess("Document saved successfully!");
    handleNavigate('documentViewer', { doc });
  };
  
  const handleUpdateDocument = (doc: SavedDocument) => {
     setSavedDocuments(prev => {
      const existingIndex = prev.findIndex(d => d.id === doc.id);
      if (existingIndex > -1) {
        const newDocs = [...prev];
        newDocs[existingIndex] = doc;
        return newDocs;
      }
      return prev; // Should not happen if updating
    });
    handleShowSuccess("Document updated.");
  };
  
  const updateUserProfile = (profileUpdate: Partial<UserProfile>) => {
      setUserProfile(prev => prev ? ({ ...prev, ...profileUpdate}) : null);
  };
  
    const handlePurchase = async (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product || !userProfile) return;
    
    console.log(`Simulating purchase for ${product.name}`);
    alert(`This would redirect to Stripe for payment for the ${product.name}. For now, we'll apply the benefits directly.`);

    // // Real implementation would call a backend
    // try {
    //   const response = await fetch('/api/create-checkout-session', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ priceId: product.priceId, userEmail: userProfile.email })
    //   });
    //   const { sessionId } = await response.json();
    //   // const stripe = await loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');
    //   // await stripe.redirectToCheckout({ sessionId });
    // } catch(error) {
    //   console.error("Stripe checkout error", error);
    //   alert("Could not initiate payment. Please try again.");
    // }
    
    // Demo mode: Apply purchase directly
    if (product.recurring) {
        setUserProfile(p => p ? ({ ...p, subscriptionPlan: 'pro' }) : null);
    } else {
        const newSlots = product.id === 'launchpad' ? 5 : 15;
        const newQueries = product.id === 'launchpad' ? 100 : 300;
        setUserProfile(p => p ? ({ ...p, purchasedDocSlots: p.purchasedDocSlots + newSlots, availableAiQueries: p.availableAiQueries + newQueries }) : null);
    }
    handleShowSuccess(`${product.name} plan activated!`);
    handleNavigate('dashboard');
  };

  const renderView = () => {
    switch (view.name) {
      case 'hero':
        return <HeroView onNavigate={handleNavigate} scrollTo={view.props?.scrollTo} />;
      case 'quiz':
        return <QuizView onQuizComplete={(result) => handleNavigate('quizResult', { result })} />;
      case 'quizResult':
        return <QuizResultView result={view.props.result} onNavigate={handleNavigate} />;
      case 'pricing':
        return <PricingView onNavigate={handleNavigate} onPurchase={handlePurchase} userProfile={userProfile} />;
      case 'documentGenerator': {
        if (!userProfile) return <EmailGateView onLogin={handleLogin} title="Create an Account" subtitle="Save your document progress by creating a free account."/>;
        const savedDoc = view.props?.savedDocumentId ? savedDocuments.find(d => d.id === view.props.savedDocumentId) : null;
        return <DocumentGeneratorView templateId={view.props.templateId} onNavigate={handleNavigate} onSave={handleSaveDocument} userProfile={userProfile} savedDocument={savedDoc} />;
      }
      case 'documentViewer':
         if (!userProfile) return <EmailGateView onLogin={handleLogin} title="Please Log In" subtitle="Log in to view your saved document."/>;
        return <DocumentViewerView doc={view.props.doc} onNavigate={handleNavigate} updateDocument={handleUpdateDocument} userProfile={userProfile} />;
      case 'dashboard':
        if (!userProfile) return <EmailGateView onLogin={handleLogin} title="Welcome Back!" subtitle="Enter your email to access your dashboard."/>;
        return <DashboardView userProfile={userProfile} savedDocuments={savedDocuments} onNavigate={handleNavigate} />;
      case 'assistant':
        if (!userProfile) return <EmailGateView onLogin={handleLogin} title="AI Legal Assistant" subtitle="Log in to ask questions about Australian business law."/>;
        return <AssistantView userProfile={userProfile} updateUserProfile={updateUserProfile} onNavigate={handleNavigate} />;
       case 'emailGate':
        return <EmailGateView onLogin={handleLogin} title={view.props.title} subtitle={view.props.subtitle} />;
       case 'legal':
        return <LegalView content={view.props.content} onNavigate={handleNavigate} />;
      default:
        return <HeroView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SpeedInsights/>
      <SuccessNotification show={showSuccess} message={successMessage} />
      <WarningNotification show={showWarning} message={warningMessage} />
      <Header userProfile={userProfile} onLogout={handleLogout} onNavigate={handleNavigate} />
      <main className="flex-grow">{renderView()}</main>
      <Footer onNavigate={handleNavigate}/>
    </div>
  );
};

export default App;
