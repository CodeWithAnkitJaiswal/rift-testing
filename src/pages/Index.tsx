import { useState, useCallback } from "react";
import { AlertTriangle, Loader2, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";
import VcfUpload from "@/components/VcfUpload";
import DrugSelector from "@/components/DrugSelector";
import ResultsDisplay from "@/components/ResultsDisplay";
import { Button } from "@/components/ui/button";
import { parseVcf, extractGeneVariants } from "@/lib/vcf-parser";
import { assessDrug } from "@/lib/pharmacogenomics";
import type { DrugAssessmentResult } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [vcfFile, setVcfFile] = useState<File | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [results, setResults] = useState<DrugAssessmentResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAnalyze = useCallback(async () => {
    if (!vcfFile || selectedDrugs.length === 0) return;

    setLoading(true);
    setResults(null);
    setParseErrors([]);

    try {
      const text = await vcfFile.text();
      const parsed = parseVcf(text);

      if (parsed.errors.length > 0) {
        setParseErrors(parsed.errors);
        if (!parsed.isValid && parsed.variants.length === 0) {
          setLoading(false);
          return;
        }
      }

      const geneVariants = extractGeneVariants(parsed);
      const patientId = `PATIENT_${Date.now().toString(36).toUpperCase()}`;

      const assessments = selectedDrugs.map((drug) => assessDrug(drug, geneVariants, patientId));
      setResults(assessments);

      try {
        const { data, error } = await supabase.functions.invoke("explain", {
          body: { assessments },
        });

        if (!error && data?.results) {
          const updated = assessments.map((a) => {
            const match = data.results.find((r: any) => r.drug === a.drug);
            if (match?.explanation) {
              return {
                ...a,
                llm_generated_explanation: {
                  ...match.explanation,
                  variant_citations: match.explanation.variant_citations || a.llm_generated_explanation.variant_citations,
                },
              };
            }
            return a;
          });
          setResults(updated);
        } else if (data?.error) {
          toast({ title: "AI Explanation", description: data.error, variant: "destructive" });
        }
      } catch {
        const fallback = assessments.map((a) => ({
          ...a,
          llm_generated_explanation: {
            summary: `${a.pharmacogenomic_profile.phenotype} metabolizer status detected for ${a.pharmacogenomic_profile.primary_gene}. Risk assessment: ${a.risk_assessment.risk_label}.`,
            mechanism: `The ${a.pharmacogenomic_profile.primary_gene} enzyme metabolizes ${a.drug}. The ${a.pharmacogenomic_profile.diplotype} diplotype results in ${a.pharmacogenomic_profile.phenotype} metabolizer phenotype.`,
            clinical_impact: a.clinical_recommendation.recommended_action,
            variant_citations: a.llm_generated_explanation.variant_citations,
          },
        }));
        setResults(fallback);
      }
    } catch (err: any) {
      toast({ title: "Analysis Error", description: err?.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [vcfFile, selectedDrugs, toast]);

  const canAnalyze = vcfFile && selectedDrugs.length > 0 && !loading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-4xl py-7 px-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Pharmacogenomic Risk Assessment
            </h1>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-xl leading-relaxed pl-12">
            Upload a VCF file and select medications to receive CPIC-aligned safety evaluations based on genetic data.
          </p>
        </div>
      </header>

      <main className="container max-w-4xl py-6 px-6 space-y-5 flex-1">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-risk-adjust-bg border border-risk-adjust/15 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <AlertTriangle className="w-4 h-4 text-risk-adjust mt-0.5 flex-shrink-0" />
          <p className="text-risk-adjust-foreground leading-relaxed text-[11px]">
            <strong>Clinical Decision Support Tool.</strong> Not a diagnostic device. All results must be reviewed by a qualified healthcare professional.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-5 animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
          {/* VCF Upload */}
          <div className="clinical-card p-5 space-y-3 overflow-visible">
            <div>
              <h2 className="text-[13px] font-semibold text-foreground">1. Upload Genetic Data</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Patient VCF file with pharmacogenomic variants</p>
            </div>
      <VcfUpload
              onFileAccepted={(file) => { setVcfFile(file); setResults(null); setParseErrors([]); }}
              currentFile={vcfFile}
              onClear={() => { setVcfFile(null); setResults(null); setParseErrors([]); }}
            />
          </div>

          {/* Drug Selection */}
          <div className="clinical-card p-5 space-y-3 overflow-visible">
            <div>
              <h2 className="text-[13px] font-semibold text-foreground">2. Select Medications</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Choose drugs to assess for interactions</p>
            </div>
            <DrugSelector selectedDrugs={selectedDrugs} onChange={setSelectedDrugs} />
          </div>
        </div>

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <div className="space-y-1.5 animate-fade-in">
            {parseErrors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] p-3 rounded-lg bg-risk-danger-bg border border-risk-danger/15">
                <AlertTriangle className="w-3.5 h-3.5 text-risk-danger flex-shrink-0 mt-0.5" />
                <span className="text-risk-danger-foreground">{e}</span>
              </div>
            ))}
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          size="lg"
          className="w-full h-11 text-[13px] font-medium transition-all duration-300 hover-scale animate-fade-in"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing genetic variants…
            </>
          ) : (
            "Analyze Drug Safety"
          )}
        </Button>

        {/* Results */}
        {results && <ResultsDisplay results={results} />}
      </main>

      {/* Team Section */}
      <section className="border-t border-border bg-card/50">
        <div className="container max-w-4xl py-6 px-6 animate-fade-in">
          <h3 className="text-[13px] font-semibold text-foreground mb-1">Team Ragnarok Coders</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span><strong className="text-foreground/70">Ankit Jaiswal</strong> · Team Leader</span>
            <span>Akshay Kumar</span>
            <span>Anubhav Verma</span>
            <span>Shivani Singh</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container max-w-4xl py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/50">PharmaGuard</span>
          <p>CPIC-aligned · Rule-based engine with AI explanations</p>
        </div>
      </footer>
    </div>
  );
}
