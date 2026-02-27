
// Fix: Use strictly GoogleGenAI with named parameter and process.env.API_KEY
import { GoogleGenAI, Type } from "@google/genai";
import { SKU, AIInsight, UserRole, StockLog, ShopType } from "../types";
import { CATEGORIES, UNITS } from "../constants";

export const getInventoryInsights = async (inventory: SKU[], role: UserRole, logs: StockLog[]): Promise<AIInsight[]> => {
  // Correctly initialize with process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inventoryContext = inventory.map(item => 
    `${item.name} (${item.category}): Current=${item.currentStock} ${item.unit}, Opening=${item.openingStock}, TotalIn=${item.totalIn}, TotalOut=${item.totalOut}`
  ).join('\n');

  const recentMovements = logs.slice(-20).map(l => 
    `${l.timestamp}: ${l.type} ${l.quantity} for item SKU_ID_${l.skuId}`
  ).join('\n');

  const prompt = `
    Act as an Indian Supply Chain Expert (Vyaparika AI) for a ${role}. 
    Analyze this real-world inventory data:
    
    INVENTORY STATUS:
    ${inventoryContext}
    
    RECENT MOVEMENTS:
    ${recentMovements}
    
    Current Season: Summer (approaching Monsoon).
    Location: Urban India.
    
    Return a JSON list of insights. Each insight MUST include:
    - skuId: mapping back to the name
    - action: What to buy/sell/reorder
    - quantity: recommended change
    - reason: Simple explanation in plain English (No jargon)
    - impact: What happens if they follow this.
    
    Rules:
    - Focus on inventory velocity (TotalOut vs CurrentStock).
    - Identify overstock (Excess items with low Out frequency).
    - Identify critical low stock (High Out frequency, low CurrentStock).
    - Use simple, reassuring language for Indian shopkeepers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skuId: { type: Type.STRING },
              action: { type: Type.STRING },
              quantity: { type: Type.STRING },
              reason: { type: Type.STRING },
              impact: { type: Type.STRING }
            },
            required: ["skuId", "action", "quantity", "reason", "impact"]
          }
        }
      }
    });

    // Fix: Access .text property directly as per guidelines
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Vyaparika AI Insight Error:", error);
    return inventory.filter(i => i.currentStock < i.minThreshold).map(i => ({
      skuId: i.name,
      action: `Order ${i.name}`,
      quantity: `${i.minThreshold * 3} ${i.unit}`,
      reason: `Your stock is critically low based on current inventory levels.`,
      impact: `Ensures you don't turn away customers looking for this item.`
    }));
  }
};

export interface SKUPrediction {
  name?: string;
  category: string;
  unit: string;
  expiry?: string;
  price?: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
}

export const predictSKUMetadata = async (productName: string, shopType: ShopType): Promise<SKUPrediction | null> => {
  if (!productName || productName.length < 3) return null;
  
  // Correctly initialize with process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cats = shopType === ShopType.GROCERY ? CATEGORIES.GROCERY : CATEGORIES.ELECTRONICS;
  
  const prompt = `
    You are Vyaparika AI, an expert in Indian retail patterns. 
    A user is adding a product named "${productName}" in a ${shopType} store.
    
    Pick the most likely Category from this list: ${cats.join(', ')}.
    Pick the most likely Unit from this list: ${UNITS.join(', ')}.
    
    Assess your confidence level. Provide reasoning.
    Return ONLY JSON:
    {
      "category": "string",
      "unit": "string",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "reasoning": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Vyaparika Metadata Prediction Error:", error);
    return null;
  }
};

export const identifyProductFromImage = async (base64Image: string, shopType: ShopType): Promise<SKUPrediction | null> => {
  // Correctly initialize with process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cats = shopType === ShopType.GROCERY ? CATEGORIES.GROCERY : CATEGORIES.ELECTRONICS;

  const prompt = `
    Identify the product in this image. Look for a barcode or the label text.
    Store type: ${shopType}.
    Categories to pick from: ${cats.join(', ')}.
    Units: ${UNITS.join(', ')}.

    Extract the product name, expiry date (if visible, format YYYY-MM-DD), and MRP/price (if visible).
    Return JSON:
    {
      "name": "string",
      "category": "string",
      "unit": "string",
      "expiry": "string | null",
      "price": number | null,
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "reasoning": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Use the standard part-based structure for multimodal inputs
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Vyaparika Vision Error:", error);
    return null;
  }
};
