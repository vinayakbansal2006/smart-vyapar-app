/**
 * =========================================================================
 * Gemini AI Integration Service (geminiService.ts)
 * -------------------------------------------------------------------------
 * Bridges the app to Google's Gen AI services. Analyzes inventory health,
 * interprets product imagery through multimodal features, calculates SKU
 * velocity insights, predicting product info from barcodes. 
 * Requires `process.env.API_KEY` mapping to a valid Gemini API key.
 * =========================================================================
 */

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
      model: 'gemini-1.5-flash',
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

const KEYWORD_CATEGORY_MAP: Record<string, string[]> = {
  Dairy: ['milk', 'curd', 'yogurt', 'paneer', 'cheese', 'butter', 'ghee'],
  Grains: ['rice', 'wheat', 'atta', 'flour', 'dal', 'lentil', 'pulse', 'oats'],
  Snacks: ['chips', 'biscuit', 'cookie', 'namkeen', 'snack', 'kurkure'],
  Beverages: ['tea', 'coffee', 'juice', 'drink', 'cola', 'water', 'soda'],
  'Personal Care': ['soap', 'shampoo', 'toothpaste', 'lotion', 'cream', 'facewash'],
  Cleaning: ['detergent', 'cleaner', 'phenyl', 'bleach', 'dishwash'],
  Spices: ['masala', 'spice', 'turmeric', 'chilli', 'cumin', 'jeera', 'pepper'],
  Oils: ['oil', 'mustard', 'sunflower', 'groundnut', 'olive'],
  Mobile: ['mobile', 'phone', 'smartphone', 'iphone', 'android'],
  Laptop: ['laptop', 'notebook', 'macbook'],
  Accessories: ['charger', 'cable', 'cover', 'case', 'adapter', 'keyboard', 'mouse'],
  Appliances: ['mixer', 'fridge', 'refrigerator', 'oven', 'fan', 'ac', 'cooler'],
  Audio: ['speaker', 'earphone', 'earbud', 'headphone', 'soundbar', 'mic'],
  Wearables: ['watch', 'smartwatch', 'band', 'fitness'],
  Components: ['ram', 'ssd', 'hdd', 'processor', 'gpu', 'motherboard'],
};

function inferCategoryFromName(productName: string, categories: string[]): string {
  const text = productName.toLowerCase();
  for (const category of categories) {
    const keywords = KEYWORD_CATEGORY_MAP[category] || [];
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return categories.includes('Snacks') ? 'Snacks' : (categories[0] || 'General');
}

function normalizeUnit(candidate: string | undefined): string {
  if (!candidate) return 'Units';
  const normalized = candidate.trim().toLowerCase();
  if (normalized === 'piece' || normalized === 'pieces' || normalized === 'pcs') return 'Units';
  const exact = UNITS.find((u) => u.toLowerCase() === normalized);
  return exact || 'Units';
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
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || 'null') as Partial<SKUPrediction> | null;
    if (!parsed) return null;
    const category = parsed.category && cats.includes(parsed.category)
      ? parsed.category
      : inferCategoryFromName(productName, cats);
    return {
      name: productName,
      category,
      unit: normalizeUnit(parsed.unit),
      confidence: parsed.confidence || 'MEDIUM',
      reasoning: parsed.reasoning || 'AI prediction generated.',
    };
  } catch (error) {
    console.error("Vyaparika Metadata Prediction Error:", error);
    // Smart fallback prediction based on the typed product name.
    return {
      name: productName,
      category: inferCategoryFromName(productName, cats),
      unit: 'Units',
      confidence: 'MEDIUM',
      reasoning: "Fallback prediction applied because the AI service is currently unavailable."
    };
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
      model: 'gemini-1.5-flash',
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
    console.error("Vyaparika Image Identification Error:", error);
    return {
      name: "Scanned Item",
      category: "General",
      unit: "Pieces",
      confidence: 'LOW',
      reasoning: "Fallback identification due to API error."
    };
  }
};
