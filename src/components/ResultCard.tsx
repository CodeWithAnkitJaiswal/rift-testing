import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Shield } from "lucide-react";
import type { DrugAssessmentResult, RiskLabel } from "@/lib/types";

function riskBadgeClass(label: RiskLabel): string {
  switch (label) {
    case "Safe": return "risk-badge risk-badge-safe";
    case "Adjust Dosage": return "risk-badge risk-badge-adjust";
    case "Toxic":
    case "Ineffective": return "risk-badge risk-badge-danger";
    default: return "risk-badge risk-badge-unknown";
  }
}

function riskIcon(label: RiskLabel) {
  const cls = "w-3.5 h-3.5";
  switch (label) {
    case "Safe": return <CheckCircle2 className={`${cls} text-risk-safe`} />;
    case "Adjust Dosage": return <AlertTriangle className={`${cls} text-risk-adjust`} />;
    case "Toxic":
    case "Ineffective": return <XCircle className={`${cls} text-risk-danger`} />;
    default: return <HelpCircle className={`${cls} text-risk-unknown`} />;
  }
}

/** Colored left-border accent per risk level */
function riskBorderClass(label: RiskLabel): string {
  switch (label) {
    case "Safe": return "border-l-4 border-l-risk-safe";
    case "Adjust Dosage": return "border-l-4 border-l-risk-adjust";
    case "Toxic":
    case "Ineffective": return "border-l-4 border-l-risk-danger";
    default: return "border-l-4 border-l-risk-unknown";
  }
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 px-4 text-left hover:bg-muted/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-in">{children}</div>
      )}
    </div>
  );
}

export default function ResultCard({ result }: { result: DrugAssessmentResult }) {
  const { risk_assessment, pharmacogenomic_profile, clinical_recommendation, llm_generated_explanation, quality_metrics } = result;

  return (
    <div className={`clinical-card overflow-hidden animate-fade-in ${riskBorderClass(risk_assessment.risk_label)}`}>
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{result.drug}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {pharmacogenomic_profile.primary_gene} · {pharmacogenomic_profile.diplotype} · {pharmacogenomic_profile.phenotype}
          </p>
        </div>
        <span className={riskBadgeClass(risk_assessment.risk_label)}>
          {riskIcon(risk_assessment.risk_label)}
          {risk_assessment.risk_label}
        </span>
      </div>

      {/* Summary stats */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted-foreground">
        <span>Severity: <span className="font-medium text-foreground">{risk_assessment.severity}</span></span>
        <span>Confidence: <span className="font-medium text-foreground">{(risk_assessment.confidence_score * 100).toFixed(0)}%</span></span>
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {quality_metrics.annotation_confidence}
        </span>
      </div>

      {/* Genetic Findings */}
      <Section title="Genetic Findings">
        <div className="space-y-0">
          <div className="kv-row">
            <span className="kv-label">Gene</span>
            <span className="kv-value font-mono">{pharmacogenomic_profile.primary_gene}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">Diplotype</span>
            <span className="kv-value font-mono">{pharmacogenomic_profile.diplotype}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">Phenotype</span>
            <span className="kv-value">{pharmacogenomic_profile.phenotype}</span>
          </div>
          {pharmacogenomic_profile.detected_variants.length > 0 && (
            <div className="pt-3">
              <p className="kv-label mb-2">Detected Variants</p>
              <div className="space-y-1">
                {pharmacogenomic_profile.detected_variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs bg-muted/50 rounded-md px-3 py-1.5">
                    <span className="font-mono font-medium text-foreground">{v.rsid}</span>
                    <span className="font-mono text-primary">{v.star_allele}</span>
                    <span className="text-muted-foreground">{v.zygosity}</span>
                    <span className="text-muted-foreground ml-auto">{v.effect.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Clinical Recommendation */}
      <Section title="Clinical Recommendation">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium border border-primary/15">
              {clinical_recommendation.recommendation_type.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-muted-foreground">
              Evidence: {clinical_recommendation.evidence_level} · {clinical_recommendation.guideline_source}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{clinical_recommendation.recommended_action}</p>
        </div>
      </Section>

      {/* Explanation */}
      <Section title="Explanation">
        {llm_generated_explanation.summary ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="kv-label mb-1">Summary</p>
              <p className="text-foreground leading-relaxed">{llm_generated_explanation.summary}</p>
            </div>
            <div>
              <p className="kv-label mb-1">Mechanism</p>
              <p className="text-foreground leading-relaxed">{llm_generated_explanation.mechanism}</p>
            </div>
            <div>
              <p className="kv-label mb-1">Clinical Impact</p>
              <p className="text-foreground leading-relaxed">{llm_generated_explanation.clinical_impact}</p>
            </div>
            {llm_generated_explanation.variant_citations.length > 0 && (
              <div>
                <p className="kv-label mb-1">Referenced Variants</p>
                <div className="flex flex-wrap gap-1">
                  {llm_generated_explanation.variant_citations.map((c) => (
                    <span key={c} className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="h-3 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-muted rounded animate-pulse mb-1" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-muted rounded animate-pulse mb-1" />
              <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        )}
      </Section>

      {/* Technical Details */}
      <Section title="Technical Details">
        <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto max-h-48 text-foreground/80 leading-relaxed">
          {JSON.stringify(result, null, 2)}
        </pre>
      </Section>
    </div>
  );
}
