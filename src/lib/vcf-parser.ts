import type { ParsedVcf, VcfVariant, GeneVariantData, DetectedVariant, SupportedGene, Zygosity, VariantEffect } from "./types";
import { SUPPORTED_GENES } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateVcfFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.toLowerCase().endsWith(".vcf")) {
    return { valid: false, error: "File must have a .vcf extension." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File exceeds maximum size of 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).` };
  }
  return { valid: true };
}

export function parseVcf(content: string): ParsedVcf {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  const header: string[] = [];
  const variants: VcfVariant[] = [];

  let hasFileFormat = false;
  let headerLineSeen = false;

  for (const line of lines) {
    if (line.startsWith("##")) {
      header.push(line);
      if (line.startsWith("##fileformat=VCF")) {
        hasFileFormat = true;
      }
      continue;
    }

    if (line.startsWith("#CHROM")) {
      headerLineSeen = true;
      continue;
    }

    if (!headerLineSeen) {
      continue;
    }

    const fields = line.split("\t");
    if (fields.length < 8) {
      errors.push(`Malformed line (fewer than 8 fields): ${line.substring(0, 60)}...`);
      continue;
    }

    const info = parseInfoField(fields[7]);

    // Extract genotype from sample column if present
    let genotype: string | undefined;
    if (fields.length >= 10) {
      const formatFields = fields[8].split(":");
      const sampleFields = fields[9].split(":");
      const gtIdx = formatFields.indexOf("GT");
      if (gtIdx >= 0 && gtIdx < sampleFields.length) {
        genotype = sampleFields[gtIdx];
      }
    }

    variants.push({
      chrom: fields[0],
      pos: parseInt(fields[1], 10),
      id: fields[2],
      ref: fields[3],
      alt: fields[4],
      qual: fields[5],
      filter: fields[6],
      info,
      genotype,
    });
  }

  if (!hasFileFormat) {
    errors.push("Missing ##fileformat header. Expected VCF v4.2 format.");
  }

  if (!headerLineSeen) {
    errors.push("Missing #CHROM header line.");
  }

  return {
    header,
    variants,
    isValid: errors.length === 0 && variants.length > 0,
    errors,
  };
}

function parseInfoField(info: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!info || info === ".") return result;

  for (const pair of info.split(";")) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx > 0) {
      result[pair.substring(0, eqIdx)] = pair.substring(eqIdx + 1);
    } else {
      result[pair] = "true";
    }
  }
  return result;
}

function inferZygosity(genotype?: string): Zygosity {
  if (!genotype) return "heterozygous";
  const alleles = genotype.replace(/\|/g, "/").split("/");
  if (alleles.length === 2 && alleles[0] === alleles[1] && alleles[0] !== "0") {
    return "homozygous";
  }
  return "heterozygous";
}

// Star allele to functional effect mapping (CPIC-aligned)
const STAR_EFFECT_MAP: Record<string, VariantEffect> = {
  "*1": "unknown", // reference/normal — no effect annotation needed
  "*2": "reduced_function",
  "*3": "loss_of_function",
  "*4": "loss_of_function",
  "*5": "loss_of_function",
  "*6": "loss_of_function",
  "*7": "loss_of_function",
  "*8": "reduced_function",
  "*9": "reduced_function",
  "*10": "reduced_function",
  "*17": "gain_of_function",
  "*41": "reduced_function",
  "*1B": "reduced_function",
  "*2A": "reduced_function",
  "*xN": "gain_of_function",
};

function inferEffect(starAllele: string): VariantEffect {
  return STAR_EFFECT_MAP[starAllele] ?? "unknown";
}

export function extractGeneVariants(parsed: ParsedVcf): Map<SupportedGene, GeneVariantData> {
  const geneMap = new Map<SupportedGene, GeneVariantData>();

  for (const variant of parsed.variants) {
    const gene = variant.info["GENE"]?.toUpperCase();
    if (!gene || !SUPPORTED_GENES.includes(gene as SupportedGene)) continue;

    const geneKey = gene as SupportedGene;
    if (!geneMap.has(geneKey)) {
      geneMap.set(geneKey, { gene: geneKey, starAlleles: [], rsids: [], variants: [] });
    }

    const data = geneMap.get(geneKey)!;
    const star = variant.info["STAR"] || "";
    const rsid = variant.info["RS"] || variant.id || "";

    if (star && !data.starAlleles.includes(star)) {
      data.starAlleles.push(star);
    }
    if (rsid && rsid !== "." && !data.rsids.includes(rsid)) {
      data.rsids.push(rsid);
    }

    const detected: DetectedVariant = {
      rsid: rsid.startsWith("rs") ? rsid : `rs${rsid}`,
      star_allele: star || "*?",
      zygosity: inferZygosity(variant.genotype),
      effect: inferEffect(star),
    };
    data.variants.push(detected);
  }

  return geneMap;
}
