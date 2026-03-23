import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const extractPrescriptionData = async (base64Image: string) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Extract medical info from this prescription: 
    - Patient Name (Search for "Name", "Patient", "Mr/Ms/Mrs", "Name of Patient")
    - Phone, Age, Blood Group, BP, Symptoms, Doctor, Date
    - Medicines (Name, Dosage, Frequency, Duration).
    Return JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(",")[1] || base64Image
          }
        }
      ]
    },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          phone: { type: Type.STRING, description: "Patient phone number if mentioned" },
          age: { type: Type.NUMBER },
          bloodGroup: { type: Type.STRING, description: "Blood group if mentioned, e.g. O+, A-" },
          bp: { type: Type.STRING, description: "Blood pressure if mentioned, e.g. 120/80" },
          symptoms: { type: Type.STRING },
          doctorName: { type: Type.STRING },
          date: { type: Type.STRING },
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dosage: { type: Type.STRING },
                frequency: { type: Type.STRING },
                duration: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const extractMedicalDocumentData = async (base64Image: string) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Extract info from this medical doc (lab report, prescription, or ID). Identify type and extract: 
    - Patient Name (Search for "Name", "Patient", "Mr/Ms/Mrs", "Name of Patient")
    - Lab results (Test names, values, units, reference ranges)
    - Medicines (Name, Dosage, Frequency)
    - BP, Age, Phone.
    Return JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(",")[1] || base64Image
          }
        }
      ]
    },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          documentType: { type: Type.STRING, description: "Lab Report, Prescription, ID Card, or Other" },
          patientInfo: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              age: { type: Type.NUMBER },
              bloodGroup: { type: Type.STRING, description: "Blood group if mentioned" },
              phone: { type: Type.STRING },
              bp: { type: Type.STRING, description: "Blood pressure if mentioned" }
            }
          },
          extractedData: {
            type: Type.OBJECT,
            description: "Flexible object containing the specific data found in the document"
          },
          summary: { type: Type.STRING, description: "A brief summary of the document's content" }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const analyzeDrugSafety = async (medicines: any[], patientHistory: any) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following medicines for a patient with the given medical history.
    Check for:
    1. Drug-Drug Interactions
    2. Duplicate medicines (same class or active ingredient)
    3. Overdose risks
    4. Allergy conflicts (based on patient history)
    
    Medicines: ${JSON.stringify(medicines)}
    Patient History: ${JSON.stringify(patientHistory)}
    
    Return a list of safety alerts if any risks are found.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Interaction, Duplicate, Allergy, or Overdose" },
            severity: { type: Type.STRING, description: "High, Medium, Low" },
            message: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const predictHealthRisks = async (vitals: any[], history: any[]) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze patient vitals and history to predict early health risks like Diabetes, Hypertension, or Anemia.
    Vitals: ${JSON.stringify(vitals)}
    History: ${JSON.stringify(history)}
    
    Return predicted risks and confidence levels.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            risk: { type: Type.STRING },
            confidence: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            prevention: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const speechToRecord = async (audioBase64: string) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Convert this spoken medical prescription into a structured digital record.
    Extract: Patient Name, Phone, BP (Blood Pressure), Medicines (Name, Dosage, Frequency).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "audio/wav",
            data: audioBase64
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          phone: { type: Type.STRING },
          bp: { type: Type.STRING },
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dosage: { type: Type.STRING },
                frequency: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const explainPrescriptionSimple = async (medicines: any[], language: string) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Explain the following prescription in very simple, easy-to-understand language for a patient.
    The explanation must be in ${language}.
    Focus on:
    1. What each medicine is for.
    2. How and when to take it.
    3. Any important precautions.
    
    Medicines: ${JSON.stringify(medicines)}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
};

export const chatWithAssistant = async (message: string, history: any[], language: string) => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a helpful and empathetic AI Health Assistant for ClinIQ AI.
    Your goal is to help patients understand their health, medications, and dosages.
    Always respond in ${language}.
    Keep your answers simple, accurate, and supportive.
    If asked for medical advice beyond general information, advise the patient to consult their doctor.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction,
    }
  });

  return response.text;
};

export const analyzeClinicalRisk = async (prescription: any, history: any[]) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following new prescription against the patient's medical history.
    Check for:
    1. Overdose risk (e.g. too much Paracetamol in 24h)
    2. Drug interactions with current medications
    3. Repeat antibiotic usage (e.g. same antibiotic multiple times recently)
    4. Chronic disease pattern conflicts
    
    New Prescription: ${JSON.stringify(prescription)}
    Patient History: ${JSON.stringify(history)}
    
    Return a list of specific clinical alerts.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            severity: { type: Type.STRING },
            message: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const detectDiseasePatterns = async (history: any[]) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this patient's visit history for recurring symptoms or disease patterns.
    Look for:
    - Repeat fevers
    - Symptom recurrence
    - Pattern suggesting specific conditions (e.g. Typhoid, Diabetes, Malaria)
    
    History: ${JSON.stringify(history)}
    
    Return a list of pattern detections and suggested risks.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pattern: { type: Type.STRING },
            suggestedRisk: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            nextSteps: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const voicePrescriptionToDigital = async (transcript: string) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are an expert medical transcriptionist. Convert the following doctor's spoken prescription into a structured digital record.
    The transcript may be messy or contain filler words. Focus on extracting the medical intent.
    
    Extract:
    - Patient Name: If mentioned (e.g., "For Mr. Sharma...").
    - Phone: Patient phone number if mentioned.
    - BP: Blood pressure if mentioned (e.g., "120 over 80").
    - Medicines: An array of objects, each containing:
      - name: The medication name (e.g., "Paracetamol").
      - dosage: The strength or amount (e.g., "650mg", "5ml").
      - frequency: How often to take it (e.g., "twice a day", "every 8 hours", "SOS").
      - instructions: Any specific notes (e.g., "after food", "before bed").
    
    Transcript: "${transcript}"
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          phone: { type: Type.STRING },
          bp: { type: Type.STRING },
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dosage: { type: Type.STRING },
                frequency: { type: Type.STRING },
                instructions: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateSpeech = async (text: string) => {
  const model = "gemini-2.5-flash-preview-tts";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
