import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const expertCategories = {
  "leaf_disease": {
    name: "Leaf Disease Expert",
    description: "Specialists in diagnosing and treating leaf-related diseases including spots, discoloration, and fungal infections"
  },
  "pest_control": {
    name: "Pest Control Specialist",
    description: "Experts in identifying and managing insect pests, larvae, and other crop-damaging organisms"
  },
  "soil": {
    name: "Soil Expert",
    description: "Specialists in soil health, pH balance, nutrient deficiency, and soil-borne diseases"
  },
  "plant_pathologist": {
    name: "Plant Pathologist",
    description: "Medical experts for plants covering bacterial, viral, and fungal infections"
  },
  "nutrition": {
    name: "Crop Nutrition Expert",
    description: "Specialists in plant nutrition, fertilizer recommendations, and growth optimization"
  },
  "water_management": {
    name: "Water Management Expert",
    description: "Experts in irrigation, drainage, and water-related crop issues"
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { problem, imageDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const inputText = imageDescription ? `${problem}\n\nImage observation: ${imageDescription}` : problem;

    const systemPrompt = `You are an agricultural expert AI assistant. Analyze the farmer's crop problem and provide a structured response.

Available expert categories:
- leaf_disease: For leaf spots, discoloration, fungal infections on leaves
- pest_control: For insects, pests, larvae, worms attacking crops
- soil: For soil-related issues, nutrient deficiency from soil, root problems
- plant_pathologist: For bacterial, viral infections, plant diseases
- nutrition: For yellowing due to nutrient lack, stunted growth, fertilizer needs
- water_management: For wilting, overwatering, drought stress, irrigation issues

Analyze the problem and respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "expertCategory": "one of the categories above",
  "diagnosis": "Brief diagnosis of the problem (1-2 sentences)",
  "severity": "low, moderate, or high",
  "symptoms": ["list", "of", "identified", "symptoms"],
  "recommendations": ["immediate", "action", "recommendations"],
  "additionalNotes": "Any extra advice for the farmer"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this crop problem: ${inputText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    console.log("AI Response:", aiResponse);

    let analysis;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
      }
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback analysis based on keywords
      analysis = {
        expertCategory: problem.toLowerCase().includes("insect") || problem.toLowerCase().includes("pest") ? "pest_control" :
                       problem.toLowerCase().includes("yellow") || problem.toLowerCase().includes("leaf") ? "leaf_disease" :
                       problem.toLowerCase().includes("wilt") ? "water_management" :
                       problem.toLowerCase().includes("soil") ? "soil" : "plant_pathologist",
        diagnosis: "Based on your description, we've identified a potential issue that requires expert attention.",
        severity: "moderate",
        symptoms: [problem],
        recommendations: ["Consult with an expert for detailed diagnosis", "Take clear photos of affected areas", "Monitor the spread of symptoms"],
        additionalNotes: "Our AI detected some issues but recommends expert verification for accurate treatment."
      };
    }

    // Add expert category details
    const categoryInfo = expertCategories[analysis.expertCategory as keyof typeof expertCategories] || expertCategories.plant_pathologist;
    
    return new Response(JSON.stringify({
      success: true,
      analysis: {
        ...analysis,
        expertCategoryName: categoryInfo.name,
        expertCategoryDescription: categoryInfo.description,
        originalInput: problem
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-crop function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
