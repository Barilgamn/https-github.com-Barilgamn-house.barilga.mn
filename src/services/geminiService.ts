import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface HouseStructure {
  foundationType: string;
  wallMaterial: string;
  roofType: string;
  estimatedAreaSqm: number;
  storyCount: number;
  complexity: "Simple" | "Moderate" | "Complex";
  specialFeatures: string[];
  estimatedMaterialBreakdown: {
    concreteVolumeM3: number;
    rebarWeightTon: number;
    wallUnitsCount: number;
    roofAreaSqm: number;
  };
}

export async function analyzeHouseImage(imageBuffer: string, mimeType: string): Promise<HouseStructure | null> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined in the frontend environment.");
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBuffer,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this house design/image. Estimate its structural volumes for budgeting in Mongolia. Provide foundation type, wall material (Brick, Concrete Block, SIP panel, etc), roof type, total area (sqm), story count, and complexity level. ALSO, provide rough ESTIMATES for: concrete volume (m3), rebar weight (tons), wall units count, and roof area (sqm). Return ONLY a JSON object with these keys: foundationType, wallMaterial, roofType, estimatedAreaSqm, storyCount, complexity (Simple/Moderate/Complex), and estimatedMaterialBreakdown (object with concreteVolumeM3, rebarWeightTon, wallUnitsCount, roofAreaSqm).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foundationType: { type: Type.STRING },
            wallMaterial: { type: Type.STRING },
            roofType: { type: Type.STRING },
            estimatedAreaSqm: { type: Type.NUMBER },
            storyCount: { type: Type.NUMBER },
            complexity: { type: Type.STRING },
            estimatedMaterialBreakdown: {
              type: Type.OBJECT,
              properties: {
                concreteVolumeM3: { type: Type.NUMBER },
                rebarWeightTon: { type: Type.NUMBER },
                wallUnitsCount: { type: Type.NUMBER },
                roofAreaSqm: { type: Type.NUMBER },
              },
              required: ["concreteVolumeM3", "rebarWeightTon", "wallUnitsCount", "roofAreaSqm"],
            }
          },
          required: ["foundationType", "wallMaterial", "roofType", "estimatedAreaSqm", "storyCount", "complexity", "estimatedMaterialBreakdown"],
        },
      },
    });

    if (!response.text) {
      console.warn("AI Analysis: No text in response");
      return null;
    }
    
    return JSON.parse(response.text) as HouseStructure;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
}

export async function generateHousePreview(structure: HouseStructure): Promise<string | null> {
  try {
    const prompt = `A professional architectural 4-view composite render of a ${structure.storyCount}-story ${structure.complexity} custom house in Mongolia. 
    Layout: Split into 4 quadrants showing: 1. Main Front perspective (finished facade), 2. Left side view, 3. Right side view, 4. Isometric aerial view.
    Details: Wall is ${structure.wallMaterial} with high-quality exterior finish (facade), Roof: ${structure.roofType}. 
    Environment: Modern landscaping, finished exterior, large windows, sunset lighting, architectural photography style, 8k resolution.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}
