import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SoilMoistureData {
  device_id: string;
  moisture_percentage: number;
  farmer_id?: string;
}

const analyzeMoisture = (percentage: number): { status: string; analysis: string; recommendations: string[] } => {
  if (percentage < 20) {
    return {
      status: "Dry",
      analysis: "Soil moisture is critically low. Your crops are at risk of water stress and wilting.",
      recommendations: [
        "Immediate irrigation is required",
        "Consider drip irrigation for water efficiency",
        "Apply mulching to retain moisture",
        "Water during early morning or late evening to minimize evaporation"
      ]
    };
  } else if (percentage >= 20 && percentage < 40) {
    return {
      status: "Low",
      analysis: "Soil moisture is below optimal levels. Plants may show early signs of stress.",
      recommendations: [
        "Schedule irrigation within 24-48 hours",
        "Monitor plants for wilting signs",
        "Consider increasing watering frequency",
        "Check for soil compaction that may affect water absorption"
      ]
    };
  } else if (percentage >= 40 && percentage <= 70) {
    return {
      status: "Optimal",
      analysis: "Soil moisture is at ideal levels for most crops. Continue current irrigation practices.",
      recommendations: [
        "Maintain current watering schedule",
        "Monitor weather forecasts for adjustments",
        "Continue regular soil health practices",
        "Good conditions for fertilizer application if needed"
      ]
    };
  } else if (percentage > 70 && percentage <= 85) {
    return {
      status: "High",
      analysis: "Soil moisture is above optimal. Risk of root diseases if prolonged.",
      recommendations: [
        "Reduce irrigation frequency",
        "Ensure proper drainage",
        "Monitor for signs of root rot or fungal issues",
        "Avoid fertilizer application until levels normalize"
      ]
    };
  } else {
    return {
      status: "Excess",
      analysis: "Soil is waterlogged. High risk of root rot and fungal diseases.",
      recommendations: [
        "Stop irrigation immediately",
        "Improve drainage systems",
        "Create channels to drain excess water",
        "Apply fungicides preventively",
        "Consider raised bed planting for future crops"
      ]
    };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data: SoilMoistureData = await req.json();
    console.log("Received soil moisture data:", data);

    if (typeof data.moisture_percentage !== 'number' || !data.device_id) {
      return new Response(
        JSON.stringify({ error: "Invalid data. Required: device_id (string), moisture_percentage (number)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = analyzeMoisture(data.moisture_percentage);
    console.log("Analysis result:", analysis);

    // Save reading to database
    const { data: reading, error: insertError } = await supabase
      .from('soil_moisture_readings')
      .insert({
        device_id: data.device_id,
        moisture_percentage: data.moisture_percentage,
        moisture_status: analysis.status,
        farmer_id: data.farmer_id || null,
        analyzed: true
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving reading:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save reading" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if expert consultation is needed
    const needsExpert = analysis.status === "Dry" || analysis.status === "Low" || analysis.status === "Excess";

    return new Response(
      JSON.stringify({
        success: true,
        reading_id: reading.id,
        device_id: data.device_id,
        moisture_percentage: data.moisture_percentage,
        status: analysis.status,
        analysis: analysis.analysis,
        recommendations: analysis.recommendations,
        needs_expert_consultation: needsExpert,
        expert_category: needsExpert ? "soil" : null,
        expert_specialty: needsExpert ? "Soil Expert" : null,
        message: needsExpert 
          ? "Based on your soil moisture reading, we recommend consulting with a Soil Expert for personalized advice."
          : "Your soil moisture is at acceptable levels. Continue monitoring."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error in soil-moisture function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
