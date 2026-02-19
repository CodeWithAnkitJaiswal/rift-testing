// Sample VCF files for testing different pharmacogenomic scenarios
// Each file contains properly annotated variants with GENE, STAR, RS INFO tags

export interface SampleVcfFile {
  name: string;
  description: string;
  filename: string;
  content: string;
  expectedResults: string; // brief description of expected outcomes
}

const VCF_HEADER = `##fileformat=VCFv4.2
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene symbol">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele designation">
##INFO=<ID=RS,Number=1,Type=String,Description="dbSNP rsID">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE`;

// Case 1: Normal Metabolizer — all genes *1/*1 → Safe for all drugs
export const SAMPLE_NORMAL: SampleVcfFile = {
  name: "Normal Metabolizer",
  description: "All genes show normal function (*1/*1). All drugs should be Safe.",
  filename: "sample_normal_metabolizer.vcf",
  expectedResults: "All drugs: Safe (Green), high confidence",
  content: `${VCF_HEADER}
chr22\t42526694\trs1045642\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*1;RS=rs1045642\tGT\t0/0
chr22\t42526700\trs16947\tG\tA\t100\tPASS\tGENE=CYP2D6;STAR=*1;RS=rs16947\tGT\t0/0
chr10\t96702047\trs1799853\tC\tT\t100\tPASS\tGENE=CYP2C9;STAR=*1;RS=rs1799853\tGT\t0/0
chr10\t96702050\trs1057910\tA\tC\t100\tPASS\tGENE=CYP2C9;STAR=*1;RS=rs1057910\tGT\t0/0
chr10\t96541616\trs4244285\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*1;RS=rs4244285\tGT\t0/0
chr10\t96541620\trs4986893\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*1;RS=rs4986893\tGT\t0/0
chr12\t21331549\trs4149056\tT\tC\t100\tPASS\tGENE=SLCO1B1;STAR=*1;RS=rs4149056\tGT\t0/0
chr12\t21331555\trs2306283\tA\tG\t100\tPASS\tGENE=SLCO1B1;STAR=*1;RS=rs2306283\tGT\t0/0
chr6\t18130918\trs1800462\tC\tG\t100\tPASS\tGENE=TPMT;STAR=*1;RS=rs1800462\tGT\t0/0
chr6\t18130920\trs1800460\tC\tT\t100\tPASS\tGENE=TPMT;STAR=*1;RS=rs1800460\tGT\t0/0
chr1\t97915614\trs3918290\tC\tT\t100\tPASS\tGENE=DPYD;STAR=*1;RS=rs3918290\tGT\t0/0
chr1\t97915620\trs55886062\tA\tC\t100\tPASS\tGENE=DPYD;STAR=*1;RS=rs55886062\tGT\t0/0`,
};

// Case 2: Poor Metabolizer — loss-of-function alleles → Toxic/Ineffective
export const SAMPLE_POOR: SampleVcfFile = {
  name: "Poor Metabolizer (High Risk)",
  description: "All genes show loss-of-function (*4/*4 or *3/*3). Expect Toxic or Ineffective for all drugs.",
  filename: "sample_poor_metabolizer.vcf",
  expectedResults: "Codeine: Toxic, Warfarin: Toxic, Clopidogrel: Ineffective, Simvastatin: Toxic, Azathioprine: Toxic, Fluorouracil: Toxic",
  content: `${VCF_HEADER}
chr22\t42526694\trs3892097\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT\t1/1
chr22\t42526700\trs5030655\tT\tA\t100\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs5030655\tGT\t1/1
chr10\t96702047\trs1799853\tC\tT\t100\tPASS\tGENE=CYP2C9;STAR=*3;RS=rs1799853\tGT\t1/1
chr10\t96702050\trs1057910\tA\tC\t100\tPASS\tGENE=CYP2C9;STAR=*3;RS=rs1057910\tGT\t1/1
chr10\t96541616\trs4244285\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*4;RS=rs4244285\tGT\t1/1
chr10\t96541620\trs4986893\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*4;RS=rs4986893\tGT\t1/1
chr12\t21331549\trs4149056\tT\tC\t100\tPASS\tGENE=SLCO1B1;STAR=*5;RS=rs4149056\tGT\t1/1
chr12\t21331555\trs2306283\tA\tG\t100\tPASS\tGENE=SLCO1B1;STAR=*5;RS=rs2306283\tGT\t1/1
chr6\t18130918\trs1800462\tC\tG\t100\tPASS\tGENE=TPMT;STAR=*3;RS=rs1800462\tGT\t1/1
chr6\t18130920\trs1800460\tC\tT\t100\tPASS\tGENE=TPMT;STAR=*3;RS=rs1800460\tGT\t1/1
chr1\t97915614\trs3918290\tC\tT\t100\tPASS\tGENE=DPYD;STAR=*4;RS=rs3918290\tGT\t1/1
chr1\t97915620\trs55886062\tA\tC\t100\tPASS\tGENE=DPYD;STAR=*4;RS=rs55886062\tGT\t1/1`,
};

// Case 3: Intermediate Metabolizer — one normal + one loss-of-function allele → IM (score=1)
export const SAMPLE_INTERMEDIATE: SampleVcfFile = {
  name: "Intermediate Metabolizer",
  description: "Heterozygous loss-of-function (*1/*4). Expect Ineffective or Adjust Dosage.",
  filename: "sample_intermediate_metabolizer.vcf",
  expectedResults: "Codeine: Ineffective, Warfarin: Adjust Dosage, Clopidogrel: Ineffective, others vary",
  content: `${VCF_HEADER}
chr22\t42526694\trs16947\tG\tA\t100\tPASS\tGENE=CYP2D6;STAR=*1;RS=rs16947\tGT\t0/1
chr22\t42526700\trs3892097\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT\t0/1
chr10\t96702047\trs1799853\tC\tT\t100\tPASS\tGENE=CYP2C9;STAR=*1;RS=rs1799853\tGT\t0/1
chr10\t96702050\trs1057910\tA\tC\t100\tPASS\tGENE=CYP2C9;STAR=*4;RS=rs1057910\tGT\t0/1
chr10\t96541616\trs4244285\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*1;RS=rs4244285\tGT\t0/1
chr10\t96541620\trs4986893\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*4;RS=rs4986893\tGT\t0/1
chr12\t21331549\trs4149056\tT\tC\t100\tPASS\tGENE=SLCO1B1;STAR=*1;RS=rs4149056\tGT\t0/1
chr12\t21331555\trs2306283\tA\tG\t100\tPASS\tGENE=SLCO1B1;STAR=*5;RS=rs2306283\tGT\t0/1
chr6\t18130918\trs1800462\tC\tG\t100\tPASS\tGENE=TPMT;STAR=*1;RS=rs1800462\tGT\t0/1
chr6\t18130920\trs1800460\tC\tT\t100\tPASS\tGENE=TPMT;STAR=*4;RS=rs1800460\tGT\t0/1
chr1\t97915614\trs3918290\tC\tT\t100\tPASS\tGENE=DPYD;STAR=*1;RS=rs3918290\tGT\t0/1
chr1\t97915620\trs55886062\tA\tC\t100\tPASS\tGENE=DPYD;STAR=*4;RS=rs55886062\tGT\t0/1`,
};

// Case 4: Ultra-rapid Metabolizer — gain-of-function alleles
export const SAMPLE_ULTRARAPID: SampleVcfFile = {
  name: "Ultra-Rapid Metabolizer",
  description: "Gain-of-function alleles (*17/*17 or *xN). Codeine: Toxic (morphine overdose risk).",
  filename: "sample_ultrarapid_metabolizer.vcf",
  expectedResults: "Codeine: Toxic (critical), Warfarin: Ineffective, Clopidogrel: Safe, others vary",
  content: `${VCF_HEADER}
chr22\t42526694\trs28371725\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*17;RS=rs28371725\tGT\t1/1
chr22\t42526700\trs28371726\tG\tA\t100\tPASS\tGENE=CYP2D6;STAR=*17;RS=rs28371726\tGT\t1/1
chr10\t96702047\trs1799853\tC\tT\t100\tPASS\tGENE=CYP2C9;STAR=*17;RS=rs1799853\tGT\t1/1
chr10\t96702050\trs1057910\tA\tC\t100\tPASS\tGENE=CYP2C9;STAR=*17;RS=rs1057910\tGT\t1/1
chr10\t96541616\trs12248560\tC\tT\t100\tPASS\tGENE=CYP2C19;STAR=*17;RS=rs12248560\tGT\t1/1
chr10\t96541620\trs12248561\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*17;RS=rs12248561\tGT\t1/1
chr12\t21331549\trs4149056\tT\tC\t100\tPASS\tGENE=SLCO1B1;STAR=*1;RS=rs4149056\tGT\t0/0
chr12\t21331555\trs2306283\tA\tG\t100\tPASS\tGENE=SLCO1B1;STAR=*1;RS=rs2306283\tGT\t0/0
chr6\t18130918\trs1800462\tC\tG\t100\tPASS\tGENE=TPMT;STAR=*1;RS=rs1800462\tGT\t0/0
chr6\t18130920\trs1800460\tC\tT\t100\tPASS\tGENE=TPMT;STAR=*1;RS=rs1800460\tGT\t0/0
chr1\t97915614\trs3918290\tC\tT\t100\tPASS\tGENE=DPYD;STAR=*1;RS=rs3918290\tGT\t0/0
chr1\t97915620\trs55886062\tA\tC\t100\tPASS\tGENE=DPYD;STAR=*1;RS=rs55886062\tGT\t0/0`,
};

// Case 5: Mixed — different phenotypes per gene (most realistic)
export const SAMPLE_MIXED: SampleVcfFile = {
  name: "Mixed Profile (Realistic)",
  description: "Different metabolizer statuses per gene. Realistic patient scenario.",
  filename: "sample_mixed_profile.vcf",
  expectedResults: "Codeine: Safe, Warfarin: Toxic (PM), Clopidogrel: Adjust, Simvastatin: Safe, Azathioprine: Adjust, Fluorouracil: Safe",
  content: `${VCF_HEADER}
chr22\t42526694\trs1045642\tC\tT\t100\tPASS\tGENE=CYP2D6;STAR=*1;RS=rs1045642\tGT\t0/0
chr22\t42526700\trs16947\tG\tA\t100\tPASS\tGENE=CYP2D6;STAR=*1;RS=rs16947\tGT\t0/0
chr10\t96702047\trs1799853\tC\tT\t100\tPASS\tGENE=CYP2C9;STAR=*3;RS=rs1799853\tGT\t1/1
chr10\t96702050\trs1057910\tA\tC\t100\tPASS\tGENE=CYP2C9;STAR=*3;RS=rs1057910\tGT\t1/1
chr10\t96541616\trs4244285\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*1;RS=rs4244285\tGT\t0/1
chr10\t96541620\trs4986893\tG\tA\t100\tPASS\tGENE=CYP2C19;STAR=*2;RS=rs4986893\tGT\t0/1
chr12\t21331549\trs4149056\tT\tC\t100\tPASS\tGENE=SLCO1B1;STAR=*1;RS=rs4149056\tGT\t0/0
chr12\t21331555\trs2306283\tA\tG\t100\tPASS\tGENE=SLCO1B1;STAR=*1;RS=rs2306283\tGT\t0/0
chr6\t18130918\trs1800462\tC\tG\t100\tPASS\tGENE=TPMT;STAR=*1;RS=rs1800462\tGT\t0/1
chr6\t18130920\trs1800460\tC\tT\t100\tPASS\tGENE=TPMT;STAR=*2;RS=rs1800460\tGT\t0/1
chr1\t97915614\trs3918290\tC\tT\t100\tPASS\tGENE=DPYD;STAR=*1;RS=rs3918290\tGT\t0/0
chr1\t97915620\trs55886062\tA\tC\t100\tPASS\tGENE=DPYD;STAR=*1;RS=rs55886062\tGT\t0/0`,
};

export const ALL_SAMPLES: SampleVcfFile[] = [
  SAMPLE_NORMAL,
  SAMPLE_POOR,
  SAMPLE_INTERMEDIATE,
  SAMPLE_ULTRARAPID,
  SAMPLE_MIXED,
];
