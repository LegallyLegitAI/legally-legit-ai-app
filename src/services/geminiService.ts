import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Template, CustomFormData, GeneratedDoc, AssistantResponse, GroundingSource, OptionalClause } from '../types';

// For Vite, environment variables exposed to the client MUST start with VITE_
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.warn("VITE_API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

const riskAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A risk score from 0 (low risk) to 100 (critical risk)."
    },
    level: {
      type: Type.STRING,
      description: "A one-word risk level: Low, Medium, High, or Critical."
    },
    summary: {
      type: Type.STRING,
      description: "A one-sentence summary of the primary legal risk."
    },
    breakdown: {
      type: Type.ARRAY,
      description: "An array of specific risks identified.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "The title of the risk area (e.g., 'Sham Contracting')."
          },
          reasoning: {
            type: Type.STRING,
            description: "A brief explanation of why this is a risk based on the provided data."
          },
        },
        required: ["title", "reasoning"],
      },
    },
  },
  required: ["score", "level", "summary", "breakdown"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    documentText: {
      type: Type.STRING,
      description: "The full legal document text, formatted in clean, well-structured Markdown. Use ## for headings, * for list items, and ** for bold. Ensure the document is comprehensive and legally sound for Australia.",
    },
    riskAnalysis: riskAnalysisSchema,
  },
  required: ["documentText", "riskAnalysis"],
};


export const generateDocumentAndAnalysis = async (
  template: Template,
  formData: CustomFormData,
  userState: string,
  optionalClauses: OptionalClause[]
): Promise<GeneratedDoc> => {
  const systemInstruction = `You are an expert AI legal assistant, simulating an Australian-admitted commercial lawyer with 15+ years of experience. Your primary function is to draft highly accurate, compliant, and professional legal documents tailored to Australian businesses.

**Core Directives:**
1.  **Strict Legal Compliance:** All documents MUST be fully compliant with current Commonwealth, state, and territory legislation relevant to the document type and the user's specified jurisdiction (e.g., Fair Work Act 2009, NES, ACL, Corporations Act 2001, Privacy Act 1988) **as of early 2025**. You are an expert in these.
2.  **Clarity and Plain English:** Draft documents in clear, plain English where possible. While legally robust, the text should be understandable to a business owner, not just a lawyer. This reflects modern Australian legal drafting standards.
3.  **Data Integration:** Accurately incorporate all user-provided data. For missing data, use standard, protective clauses and insert a clear, actionable placeholder like '**[ACTION: Insert specific details here]**'.
4.  **Clause Integration:** If user-selected optional clauses are provided, you MUST seamlessly integrate them into the document in the most logical and appropriate positions.
5.  **Practical Risk Analysis:** Your risk analysis must be sharp, practical, and directly tied to the user's input and Australian legal principles. Identify concrete risks (e.g., sham contracting, non-compliance with the Privacy Act) and provide concise, actionable reasoning.
6.  **Markdown Formatting:** The 'documentText' field must be valid, well-structured Markdown that renders cleanly on both mobile and desktop. Use standard conventions: '##' for H2 headings, '*' for unordered list items, and '**text**' for bold.
7.  **Output Format:** You MUST strictly adhere to the provided JSON schema. The entire response must be a single, valid JSON object with no extraneous text.`;
  
  const userContent = `
**Document to Generate:** ${template.title}
**Jurisdiction:** ${userState}, Australia

**User-provided Data:**
${JSON.stringify(formData, null, 2)}

**Optional Clauses to Include:**
${optionalClauses.length > 0
    ? optionalClauses.map(c => `\n### ${c.title}\n${c.content}`).join('')
    : 'None.'
}

**Task:**
Generate the legal document and perform the risk analysis based on the data provided, following all core directives.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    // The response.text is a string containing the JSON object.
    const jsonString = response.text;
    const parsedResponse = JSON.parse(jsonString);
    
    return parsedResponse as GeneratedDoc;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // In a real app, you'd want to throw a more user-friendly error
    throw new Error("Failed to generate document. The AI service may be temporarily unavailable.");
  }
};

export const askLegalAssistant = async (
    question: string,
    onStream: (chunk: string) => void
): Promise<AssistantResponse> => {
  const systemInstruction = `You are an expert AI legal assistant designed specifically for Australian business-related queries. Your role is to provide informative, accurate summaries based *strictly* on the provided Google Search results.
**Core Directives:**
1.  **Australian Context:** All answers MUST be tailored to the Australian legal and business environment.
2.  **Source-Based Answers:** Base your response *exclusively* on the information found in the search results. Do not add information from your general knowledge. If the search results don't contain the answer, state that clearly.
3.  **No Legal Advice:** CRITICALLY IMPORTANT: You are an informational tool, not a lawyer. Do NOT provide legal advice, opinions, or recommendations. Frame your answers as summaries of publicly available information. Avoid definitive statements like "you must" or "you are required to". Instead use phrases like "Information suggests..." or "According to sources...".
4.  **Formatting:** Use simple, clear Markdown for readability. Use bullet points and bold text to structure the information effectively.`;

  const userContent = `
Question: "${question}"

Based on the latest information from Google Search, please answer the question for an Australian context.
  `;

  try {
    const streamResult = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}],
        temperature: 0.1,
      },
    });

    let fullAnswer = "";
    let groundingChunks: any[] = [];
    for await (const chunk of streamResult) {
        const chunkText = chunk.text;
        if(chunkText) {
            fullAnswer += chunkText;
            onStream(chunkText);
        }
        // Grounding metadata is often sent in chunks. We aggregate it.
        const chunkMetadata = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunkMetadata) {
            groundingChunks.push(...chunkMetadata);
        }
    }
    
    const sources: GroundingSource[] = groundingChunks
      .map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || '',
      }))
      .filter((source: GroundingSource) => source.uri && source.title);

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { answer: fullAnswer, sources: uniqueSources };

  } catch (error) {
    console.error("Error calling Gemini API for assistant:", error);
    throw new Error("Failed to get an answer. The AI service may be temporarily unavailable.");
  }
};