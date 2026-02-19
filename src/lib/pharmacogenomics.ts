import type {
  SupportedDrug,
  SupportedGene,
  Phenotype,
  RiskLabel,
  Severity,
  RecommendationType,
  EvidenceLevel,
  GeneVariantData,
  DrugAssessmentResult,
  ClinicalRecommendation,
  RiskAssessment,
  PharmacogenomicProfile,
  QualityMetrics,
  AnnotationConfidence,
} from "./types";
import { DRUG_GENE_MAP, SUPPORTED_DRUGS } from "./types";

// ── Phenotype inference from diplotype (CPIC-aligned rules) ──

const LOSS_ALLELES = new Set(["*3", "*4", "*5", "*6", "*7"]);
const REDUCED_ALLELES = new Set(["*2", "*8", "*9", "*10", "*41", "*1B", "*2A"]);
const GAIN_ALLELES = new Set(["*17", "*xN"]);

function alleleScore(star: string): number {
  if (LOSS_ALLELES.has(star)) return 0;
  if (REDUCED_ALLELES.has(star)) return 0.5;
  if (GAIN_ALLELES.has(star)) return 2;
  if (star === "*1") return 1;
  return -1; // unknown
}

export function inferPhenotype(diplotype: string): Phenotype {
  const parts = diplotype.split("/").map((s) => s.trim());
  if (parts.length !== 2) return "Unknown";

  const s1 = alleleScore(parts[0]);
  const s2 = alleleScore(parts[1]);

  if (s1 < 0 || s2 < 0) return "Unknown";

  const total = s1 + s2;
  if (total === 0) return "PM";
  if (total <= 1) return "IM";
  if (total <= 2) return "NM";
  if (total <= 3) return "RM";
  return "URM";
}

export function resolveDiplotype(geneData: GeneVariantData | undefined): string {
  if (!geneData || geneData.starAlleles.length === 0) return "*?/*?";
  if (geneData.starAlleles.length === 1) return `${geneData.starAlleles[0]}/${geneData.starAlleles[0]}`;
  return `${geneData.starAlleles[0]}/${geneData.starAlleles[1]}`;
}

// ── Risk mapping: drug + phenotype → risk (CPIC-aligned) ──

type RiskMapping = { risk: RiskLabel; severity: Severity; confidence: number; recType: RecommendationType; action: string; evidence: EvidenceLevel };

const RISK_RULES: Record<SupportedDrug, Partial<Record<Phenotype, RiskMapping>>> = {
  CODEINE: {
    PM: { risk: "Toxic", severity: "critical", confidence: 0.95, recType: "avoid_drug", action: "Avoid codeine. Use a non-opioid analgesic or a non-CYP2D6-metabolized opioid (e.g., morphine, oxycodone with caution). CYP2D6 PM cannot convert codeine to morphine effectively, but risk of toxicity from altered metabolic pathways.", evidence: "strong" },
    IM: { risk: "Ineffective", severity: "moderate", confidence: 0.85, recType: "use_alternative", action: "Codeine may have reduced efficacy. Consider alternative analgesics.", evidence: "strong" },
    NM: { risk: "Safe", severity: "none", confidence: 0.95, recType: "use_as_directed", action: "Use codeine as directed per standard prescribing guidelines.", evidence: "strong" },
    RM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.8, recType: "adjust_dose", action: "Use codeine with caution at lower doses. Monitor for adverse effects.", evidence: "moderate" },
    URM: { risk: "Toxic", severity: "critical", confidence: 0.95, recType: "avoid_drug", action: "Avoid codeine. Ultra-rapid metabolism leads to dangerously high morphine levels. Use non-CYP2D6-metabolized analgesic.", evidence: "strong" },
  },
  WARFARIN: {
    PM: { risk: "Toxic", severity: "high", confidence: 0.9, recType: "adjust_dose", action: "Reduce warfarin dose significantly (consider 50-70% reduction). CYP2C9 PM leads to decreased warfarin metabolism and elevated bleeding risk.", evidence: "strong" },
    IM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.85, recType: "adjust_dose", action: "Reduce warfarin dose by approximately 20-40%. Monitor INR closely.", evidence: "strong" },
    NM: { risk: "Safe", severity: "none", confidence: 0.9, recType: "use_as_directed", action: "Use standard warfarin dosing with routine INR monitoring.", evidence: "strong" },
    RM: { risk: "Ineffective", severity: "moderate", confidence: 0.7, recType: "adjust_dose", action: "May require higher warfarin doses. Monitor INR and adjust accordingly.", evidence: "moderate" },
    URM: { risk: "Ineffective", severity: "moderate", confidence: 0.7, recType: "adjust_dose", action: "May require higher warfarin doses. Monitor INR closely.", evidence: "moderate" },
  },
  CLOPIDOGREL: {
    PM: { risk: "Ineffective", severity: "high", confidence: 0.95, recType: "use_alternative", action: "Avoid clopidogrel. Use prasugrel or ticagrelor instead. CYP2C19 PM cannot activate clopidogrel prodrug.", evidence: "strong" },
    IM: { risk: "Ineffective", severity: "moderate", confidence: 0.85, recType: "use_alternative", action: "Consider alternative antiplatelet therapy (prasugrel or ticagrelor). Reduced CYP2C19 activity decreases clopidogrel activation.", evidence: "strong" },
    NM: { risk: "Safe", severity: "none", confidence: 0.9, recType: "use_as_directed", action: "Use clopidogrel as directed per standard guidelines.", evidence: "strong" },
    RM: { risk: "Safe", severity: "none", confidence: 0.8, recType: "use_as_directed", action: "Use clopidogrel as directed. Enhanced metabolism is not clinically concerning.", evidence: "moderate" },
    URM: { risk: "Safe", severity: "low", confidence: 0.75, recType: "use_as_directed", action: "Use clopidogrel as directed. Monitor for increased bleeding risk.", evidence: "moderate" },
  },
  SIMVASTATIN: {
    PM: { risk: "Toxic", severity: "high", confidence: 0.9, recType: "adjust_dose", action: "Use lower dose simvastatin (max 20 mg/day) or switch to an alternative statin (e.g., rosuvastatin, pravastatin). SLCO1B1 PM increases simvastatin exposure and myopathy risk.", evidence: "strong" },
    IM: { risk: "Adjust Dosage", severity: "moderate", confidence: 0.85, recType: "adjust_dose", action: "Consider lower simvastatin dose or prescribe an alternative statin. Monitor for muscle-related symptoms.", evidence: "strong" },
    NM: { risk: "Safe", severity: "none", confidence: 0.9, recType: "use_as_directed", action: "Use simvastatin as directed per standard prescribing guidelines.", evidence: "strong" },
    RM: { risk: "Safe", severity: "none", confidence: 0.7, recType: "use_as_directed", action: "Use simvastatin as directed.", evidence: "weak" },
    URM: { risk: "Safe", severity: "none", confidence: 0.7, recType: "use_as_directed", action: "Use simvastatin as directed.", evidence: "weak" },
  },
  AZATHIOPRINE: {
    PM: { risk: "Toxic", severity: "critical", confidence: 0.95, recType: "avoid_drug", action: "Avoid azathioprine or reduce dose by 90%. TPMT PM leads to accumulation of cytotoxic thioguanine nucleotides causing severe myelosuppression.", evidence: "strong" },
    IM: { risk: "Adjust Dosage", severity: "high", confidence: 0.9, recType: "adjust_dose", action: "Reduce azathioprine dose by 30-70%. Monitor CBC weekly for first 8 weeks.", evidence: "strong" },
    NM: { risk: "Safe", severity: "none", confidence: 0.9, recType: "use_as_directed", action: "Use azathioprine as directed with standard monitoring.", evidence: "strong" },
    RM: { risk: "Safe", severity: "none", confidence: 0.7, recType: "use_as_directed", action: "Use azathioprine as directed.", evidence: "weak" },
    URM: { risk: "Ineffective", severity: "moderate", confidence: 0.7, recType: "adjust_dose", action: "May require higher doses. Monitor therapeutic response.", evidence: "weak" },
  },
  FLUOROURACIL: {
    PM: { risk: "Toxic", severity: "critical", confidence: 0.95, recType: "avoid_drug", action: "Avoid fluorouracil. DPYD PM leads to severely impaired drug clearance and life-threatening toxicity (mucositis, myelosuppression, neurotoxicity).", evidence: "strong" },
    IM: { risk: "Toxic", severity: "high", confidence: 0.9, recType: "adjust_dose", action: "Reduce fluorouracil dose by at least 50%. Monitor closely for toxicity signs.", evidence: "strong" },
    NM: { risk: "Safe", severity: "none", confidence: 0.9, recType: "use_as_directed", action: "Use fluorouracil as directed per oncology guidelines.", evidence: "strong" },
    RM: { risk: "Safe", severity: "none", confidence: 0.7, recType: "use_as_directed", action: "Use fluorouracil as directed.", evidence: "weak" },
    URM: { risk: "Safe", severity: "none", confidence: 0.65, recType: "use_as_directed", action: "Use fluorouracil as directed. Monitor for reduced efficacy.", evidence: "weak" },
  },
};

const UNKNOWN_RISK: RiskMapping = {
  risk: "Unknown",
  severity: "moderate",
  confidence: 0.0,
  recType: "use_as_directed",
  action: "Insufficient pharmacogenomic data to make a recommendation. Use clinical judgment and standard prescribing guidelines.",
  evidence: "weak",
};

export function assessDrug(
  drugName: string,
  geneVariants: Map<string, GeneVariantData>,
  patientId: string
): DrugAssessmentResult {
  const drugUpper = drugName.toUpperCase().trim() as SupportedDrug;
  const isSupported = SUPPORTED_DRUGS.includes(drugUpper);
  const gene = isSupported ? DRUG_GENE_MAP[drugUpper] : undefined;
  const geneData = gene ? geneVariants.get(gene) : undefined;

  const diplotype = resolveDiplotype(geneData);
  const phenotype = inferPhenotype(diplotype);

  const mapping = isSupported && phenotype !== "Unknown"
    ? RISK_RULES[drugUpper]?.[phenotype] ?? UNKNOWN_RISK
    : UNKNOWN_RISK;

  const riskAssessment: RiskAssessment = {
    risk_label: mapping.risk,
    confidence_score: parseFloat(mapping.confidence.toFixed(2)),
    severity: mapping.severity,
  };

  const profile: PharmacogenomicProfile = {
    primary_gene: gene ?? "Unknown",
    diplotype,
    phenotype,
    detected_variants: geneData?.variants ?? [],
  };

  const recommendation: ClinicalRecommendation = {
    recommendation_type: mapping.recType,
    recommended_action: mapping.action,
    guideline_source: "CPIC",
    evidence_level: mapping.evidence,
  };

  const qualityMetrics: QualityMetrics = {
    vcf_parsing_success: true,
    variants_detected: (geneData?.variants.length ?? 0) > 0,
    gene_coverage_complete: !!geneData && geneData.starAlleles.length >= 2,
    annotation_confidence: determineConfidence(geneData),
  };

  return {
    patient_id: patientId,
    drug: drugUpper,
    timestamp: new Date().toISOString(),
    risk_assessment: riskAssessment,
    pharmacogenomic_profile: profile,
    clinical_recommendation: recommendation,
    llm_generated_explanation: {
      summary: "",
      mechanism: "",
      clinical_impact: "",
      variant_citations: geneData?.rsids ?? [],
    },
    quality_metrics: qualityMetrics,
  };
}

function determineConfidence(geneData: GeneVariantData | undefined): AnnotationConfidence {
  if (!geneData) return "low";
  if (geneData.starAlleles.length >= 2 && geneData.rsids.length > 0) return "high";
  if (geneData.starAlleles.length >= 1) return "medium";
  return "low";
}
