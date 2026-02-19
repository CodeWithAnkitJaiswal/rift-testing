import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessments } = await req.json();

    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      return new Response(JSON.stringify({ error: "Missing assessments array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Return fallback explanations if no API key
      const fallbackResults = assessments.map((a: any) => ({
        drug: a.drug,
        explanation: {
          summary: `Based on the patient's ${a.pharmacogenomic_profile?.primary_gene || "gene"} ${a.pharmacogenomic_profile?.diplotype || ""} genotype (${a.pharmacogenomic_profile?.phenotype || "Unknown"} phenotype), the risk assessment for ${a.drug} is: ${a.risk_assessment?.risk_label || "Unknown"}.`,
          mechanism: `The ${a.pharmacogenomic_profile?.primary_gene || "gene"} enzyme is involved in the metabolism of ${a.drug}. Variants in this gene can alter drug metabolism, affecting efficacy and safety.`,
          clinical_impact: a.clinical_recommendation?.recommended_action || "No specific recommendation available.",
          variant_citations: a.pharmacogenomic_profile?.detected_variants?.map((v: any) => v.rsid) || [],
        },
      }));
      return new Response(JSON.stringify({ results: fallbackResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = assessments
      .map(
        (a: any) =>
          `Drug: ${a.drug}
Gene: ${a.pharmacogenomic_profile?.primary_gene}
Diplotype: ${a.pharmacogenomic_profile?.diplotype}
Phenotype: ${a.pharmacogenomic_profile?.phenotype}
Risk: ${a.risk_assessment?.risk_label}
Severity: ${a.risk_assessment?.severity}
Variants: ${JSON.stringify(a.pharmacogenomic_profile?.detected_variants || [])}
Recommendation: ${a.clinical_recommendation?.recommended_action}`
      )
      .join("\n\n---\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          {
            role: "system",
            content: `You are a clinical pharmacogenomics expert. For each drug assessment provided, generate a structured explanation. You MUST return valid JSON only, no markdown.

Return format:
{
  "results": [
    {
      "drug": "DRUG_NAME",
      "explanation": {
        "summary": "1-2 sentence plain-language summary of the finding",
        "mechanism": "Explain the pharmacogenomic mechanism (enzyme function, drug metabolism pathway, how the variant affects this)",
        "clinical_impact": "Explain the clinical significance and what the patient/clinician should know",
        "variant_citations": ["rsXXXX", ...]
      }
    }
  ]
}

Rules:
- Reference specific genes, variants (rs IDs), and star alleles
- Explain the biological mechanism accurately
- Match the computed risk label — do NOT contradict it
- Do NOT hallucinate variant IDs or make up facts
- Keep language clear and professional
- Each explanation should be 2-4 sentences per field`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_explanations",
              description: "Return structured pharmacogenomic explanations for each drug assessment",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        drug: { type: "string" },
                        explanation: {
                          type: "object",
                          properties: {
                            summary: { type: "string" },
                            mechanism: { type: "string" },
                            clinical_impact: { type: "string" },
                            variant_citations: { type: "array", items: { type: "string" } },
                          },
                          required: ["summary", "mechanism", "clinical_impact", "variant_citations"],
                          additionalProperties: false,
                        },
                      },
                      required: ["drug", "explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_explanations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    
    // Extract from tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try content
    const content = aiResponse.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No valid response from AI");
  } catch (e) {
    console.error("explain error:", e);
    // Return fallback on any error
    return new Response(
      JSON.stringify({
        error: "LLM explanation generation failed. Displaying rule-based results only.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
