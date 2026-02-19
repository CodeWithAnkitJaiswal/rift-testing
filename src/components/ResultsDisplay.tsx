import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { DrugAssessmentResult } from "@/lib/types";
import ResultCard from "./ResultCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ResultsDisplayProps {
  results: DrugAssessmentResult[];
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const jsonOutput = results.length === 1 ? results[0] : results;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pgx-assessment-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(jsonOutput, null, 2));
    setCopied(true);
    toast({ title: "Copied", description: "JSON copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-base font-semibold text-foreground">Results</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{results.length} drug{results.length !== 1 ? "s" : ""} assessed</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-[11px] h-8 hover-scale">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy JSON"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-[11px] h-8 hover-scale">
            <Download className="w-3 h-3" />
            Download JSON
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((r, i) => (
          <div key={`${r.drug}-${i}`} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}>
            <ResultCard result={r} />
          </div>
        ))}
      </div>
    </section>
  );
}
