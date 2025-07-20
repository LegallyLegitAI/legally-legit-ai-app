
import React from 'react';
import { Template, Product, FieldLabels, LegalIntelligence, QuizQuestion, Testimonial } from './types';
import { FileText, Hammer, Handshake, Siren, Lock, Globe, Banknote, ShieldBan } from 'lucide-react';

export const TEMPLATES: Template[] = [
    {
      id: 'employment',
      title: 'Employment Contract',
      icon: React.createElement(FileText, { className: "w-8 h-8 text-brand-blue-600" }),
      description: 'Avoid Fair Work fines with compliant contracts for full-time, part-time, or casual staff.',
      urgency: 'Avoid $66,600 Fair Work fines',
      riskLevel: 'high',
      complianceRequirements: ['Fair Work Act 2009', 'Modern Awards', 'NES'],
      fields: ['businessName', 'abn', 'employeeName', 'position', 'startDate', 'salary', 'workLocation', 'employmentType', 'awardClassification'],
      highlight: true,
    },
    {
      id: 'contractor',
      title: 'Independent Contractor Agreement',
      icon: React.createElement(Hammer, { className: "w-8 h-8 text-brand-blue-600" }),
      description: 'Clearly define your relationship with contractors to avoid sham contracting risks.',
      urgency: 'Critical for ATO/FWO compliance',
      riskLevel: 'high',
      complianceRequirements: ['ATO Guidelines', 'Independent Contractors Act 2006'],
      fields: ['businessName', 'abn', 'contractorName', 'contractorAbn', 'services', 'term', 'fees', 'intellectualProperty'],
      highlight: true,
    },
    {
      id: 'service',
      title: 'Client Service Agreement',
      icon: React.createElement(Handshake, { className: "w-8 h-8 text-brand-blue-600" }),
      description: 'Set clear expectations for service delivery, payment terms, and liability.',
      urgency: 'Essential for service-based businesses',
      riskLevel: 'medium',
      complianceRequirements: ['Australian Consumer Law (ACL)'],
      fields: ['businessName', 'abn', 'clientName', 'services', 'fees', 'paymentTerms', 'term', 'limitationOfLiability'],
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: React.createElement(Lock, { className: "w-8 h-8 text-brand-blue-600" }),
      description: 'Comply with the Privacy Act 1988 by informing users how you handle their data.',
      urgency: 'Required for most online businesses',
      riskLevel: 'high',
      complianceRequirements: ['Privacy Act 1988', 'APPs'],
      fields: ['businessName', 'websiteUrl', 'dataCollected', 'dataUsage', 'contactEmail'],
      highlight: true,
    },
    {
      id: 'website-terms',
      title: 'Website Terms of Use',
      icon: React.createElement(Globe, { className: "w-8 h-8 text-brand-blue-600" }),
      description: 'Protect your intellectual property and limit your liability for your website content.',
      urgency: 'Protects your online assets',
      riskLevel: 'medium',
      complianceRequirements: ['Copyright Act 1968', 'ACL'],
      fields: ['businessName', 'websiteUrl', 'jurisdiction', 'limitationOfLiability', 'intellectualProperty'],
    },
    {
      id: 'nda',
      title: 'Non-Disclosure Agreement',
      icon: React.createElement(ShieldBan, { className: "w-8 h-8 text-brand-blue-600" }),
      description: 'Protect your confidential business information when sharing it with others.',
      urgency: 'Critical when sharing secrets',
      riskLevel: 'medium',
      complianceRequirements: ['Contract Law'],
      fields: ['disclosingParty', 'receivingParty', 'effectiveDate', 'confidentialInformation', 'term'],
    },
];

export const FIELD_LABELS: FieldLabels = {
    businessName: "Business Legal Name",
    abn: "ABN/ACN",
    employeeName: "Employee Full Name",
    position: "Position Title",
    startDate: "Start Date",
    salary: "Salary/Wage (per annum or hour)",
    workLocation: "Primary Work Location",
    employmentType: "Employment Type (Full-time, Part-time, Casual)",
    awardClassification: "Modern Award & Classification (if any)",
    contractorName: "Contractor Name/Company",
    contractorAbn: "Contractor ABN",
    services: "Description of Services",
    term: "Agreement Term or End Date",
    fees: "Fees & Payment Schedule",
    intellectualProperty: "Intellectual Property Ownership",
    clientName: "Client Name",
    paymentTerms: "Payment Terms (e.g., 14 days)",
    limitationOfLiability: "Limitation of Liability Amount",
    websiteUrl: "Website URL",
    dataCollected: "Types of Data Collected",
    dataUsage: "How Data is Used",
    contactEmail: "Privacy Officer Contact Email",
    jurisdiction: "Governing Law (e.g., New South Wales)",
    disclosingParty: "Disclosing Party Name",
    receivingParty: "Receiving Party Name",
    effectiveDate: "Effective Date",
    confidentialInformation: "Definition of Confidential Information"
};

export const LEGAL_INTELLIGENCE: LegalIntelligence = {
    abn: {
        icon: 'info',
        title: 'ABN/ACN',
        content: 'An Australian Business Number (ABN) is a unique 11-digit number that identifies your business. An Australian Company Number (ACN) is a 9-digit number for companies.',
        bestPractice: 'Always include your ABN on invoices and other business documents.'
    },
    employmentType: {
        icon: 'warning',
        title: 'Employment Type',
        content: 'Correctly classifying an employee as full-time, part-time, or casual is crucial. Misclassification can lead to significant back-pay claims and Fair Work penalties.',
        risk: 'Misclassifying a long-term, regular casual as permanent can lead to claims for unpaid leave entitlements.',
        complianceNote: {
          text: 'Recent changes to the Fair Work Act provide a clearer definition of a "casual employee".',
          source: 'Fair Work Act 2009',
          isNew: true
        }
    },
    contractor: {
        icon: 'critical',
        title: 'Sham Contracting',
        content: 'A "sham" contract is when an employer deliberately misrepresents an employment relationship as an independent contracting arrangement. This is illegal and carries heavy penalties.',
        warning: 'The ATO and Fair Work Ombudsman actively pursue businesses engaging in sham contracting.',
        risk: 'Penalties can exceed $82,500 per contravention for corporations.'
    },
};

export const PRODUCTS: Product[] = [
    {
      id: 'launchpad',
      name: 'Launchpad Bundle',
      subtitle: 'One-time payment',
      price: 297,
      priceId: 'price_launchpad_297', 
      features: [
        '5 Document Credits',
        '100 AI Assistant Queries',
        'AI Risk Analysis on all docs',
        'Lifetime access to generated documents'
      ],
      popular: false,
      recurring: false
    },
    {
      id: 'pro',
      name: 'Business Pro',
      subtitle: 'Best value for ongoing protection',
      price: 47,
      priceId: 'price_pro_monthly_47',
      features: [
        'Unlimited Document Generation',
        'Unlimited AI Assistant Queries',
        'Unlimited AI Risk Analyses',
        'Secure Document Storage',
        'Priority Email Support'
      ],
      popular: true,
      recurring: true
    },
    {
      id: 'ultimate',
      name: 'Ultimate Bundle',
      subtitle: 'Comprehensive one-time package',
      price: 497,
      priceId: 'price_ultimate_497',
      features: [
        '15 Document Credits',
        '300 AI Assistant Queries',
        'Includes all current & future templates',
        'AI Risk Analysis on all docs',
        'Lifetime access to generated documents'
      ],
      popular: false,
      recurring: false
    },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 1,
        question: "How do you engage people to perform work for your business?",
        options: ["Only permanent employees on payroll", "A mix of employees and independent contractors", "Mainly independent contractors or freelancers", "I'm a sole trader working alone"],
        scores: [5, 20, 30, 0]
    },
    {
        id: 2,
        question: "Do you have formal, written contracts for all your employees and contractors?",
        options: ["Yes, everyone has a signed, up-to-date agreement", "Some people do, but not all", "Only for employees, not contractors", "No, we mainly use verbal agreements"],
        scores: [0, 15, 20, 35]
    },
    {
        id: 3,
        question: "Does your website or app collect personal information from users (e.g., names, emails)?",
        options: ["Yes, and we have a Privacy Policy that explains how we use it", "Yes, but we don't have a formal Privacy Policy", "No, we don't collect any user data", "I'm not sure what information we collect"],
        scores: [0, 30, 0, 25]
    },
    {
        id: 4,
        question: "How do you handle client work or service provisions?",
        options: ["We use a detailed Client Service Agreement for every project", "We send a quote or proposal that outlines the basics", "We usually just agree on the scope and price over email", "We rely on verbal agreements and trust"],
        scores: [0, 15, 25, 30]
    }
];

export const TESTIMONIALS: Testimonial[] = [
    {
        quote: "As a small consultancy, getting lawyer-drafted contracts was too expensive. Legally Legit AI gave us a compliant Contractor Agreement in minutes. The AI risk analysis was a game-changer.",
        name: "Sarah Chen",
        role: "Director",
        company: "Innovate & Co.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
        quote: "Finally, a tool that understands Australian business needs. We generated our Privacy Policy and Website T&Cs, saving us thousands in legal fees. Highly recommend for any startup.",
        name: "Mike Rodriguez",
        role: "Founder",
        company: "TechSprint",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
        quote: "The Employment Contract template was so easy to use and covered everything we needed to be Fair Work compliant. It gave us peace of mind when hiring our first employee.",
        name: "Jessica Wallace",
        role: "Owner",
        company: "The Bloom Cafe",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    }
];
