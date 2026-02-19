// Pharmacogenomic Risk Assessment Types — matches exact output JSON schema

export type RiskLabel = "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";
export type Severity = "none" | "low" | "moderate" | "high" | "critical";
export type Phenotype = "PM" | "IM" | "NM" | "RM" | "URM" | "Unknown";
export type Zygosity = "heterozygous" | "homozygous";
export type VariantEffect = "loss_of_function" | "gain_of_function" | "reduced_function" | "unknown";
export type RecommendationType = "use_as_directed" | "adjust_dose" | "avoid_drug" | "use_alternative";
export type EvidenceLevel = "strong" | "moderate" | "weak";
export type AnnotationConfidence = "high" | "medium" | "low";

export const SUPPORTED_GENES = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"] as const;
export type SupportedGene = (typeof SUPPORTED_GENES)[number];

export const SUPPORTED_DRUGS = ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"] as const;
export type SupportedDrug = (typeof SUPPORTED_DRUGS)[number];

export const DRUG_GENE_MAP: Record<SupportedDrug, SupportedGene> = {
  CODEINE: "CYP2D6",
  WARFARIN: "CYP2C9",
  CLOPIDOGREL: "CYP2C19",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  FLUOROURACIL: "DPYD",
};

export interface DetectedVariant {
  rsid: string;
  star_allele: string;
  zygosity: Zygosity;
  effect: VariantEffect;
}

export interface RiskAssessment {
  risk_label: RiskLabel;
  confidence_score: number;
  severity: Severity;
}

export interface PharmacogenomicProfile {
  primary_gene: string;
  diplotype: string;
  phenotype: Phenotype;
  detected_variants: DetectedVariant[];
}

export interface ClinicalRecommendation {
  recommendation_type: RecommendationType;
  recommended_action: string;
  guideline_source: "CPIC";
  evidence_level: EvidenceLevel;
}

export interface LlmGeneratedExplanation {
  summary: string;
  mechanism: string;
  clinical_impact: string;
  variant_citations: string[];
}

export interface QualityMetrics {
  vcf_parsing_success: boolean;
  variants_detected: boolean;
  gene_coverage_complete: boolean;
  annotation_confidence: AnnotationConfidence;
}

export interface DrugAssessmentResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: RiskAssessment;
  pharmacogenomic_profile: PharmacogenomicProfile;
  clinical_recommendation: ClinicalRecommendation;
  llm_generated_explanation: LlmGeneratedExplanation;
  quality_metrics: QualityMetrics;
}

// VCF parsing types
export interface VcfVariant {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  qual: string;
  filter: string;
  info: Record<string, string>;
  genotype?: string;
}

export interface ParsedVcf {
  header: string[];
  variants: VcfVariant[];
  isValid: boolean;
  errors: string[];
}

export interface GeneVariantData {
  gene: SupportedGene;
  starAlleles: string[];
  rsids: string[];
  variants: DetectedVariant[];
}
