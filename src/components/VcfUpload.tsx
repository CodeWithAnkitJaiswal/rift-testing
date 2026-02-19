import { useCallback, useState } from "react";
import { Upload, FileCheck, AlertCircle, X, FlaskConical } from "lucide-react";
import { validateVcfFile } from "@/lib/vcf-parser";
import { ALL_SAMPLES, type SampleVcfFile } from "@/lib/sample-vcf-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VcfUploadProps {
  onFileAccepted: (file: File) => void;
  currentFile: File | null;
  onClear: () => void;
}

export default function VcfUpload({ onFileAccepted, currentFile, onClear }: VcfUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleOpen, setSampleOpen] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const result = validateVcfFile(file);
      if (!result.valid) {
        setError(result.error!);
        return;
      }
      setError(null);
      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const loadSample = useCallback(
    (sample: SampleVcfFile) => {
      const blob = new Blob([sample.content], { type: "text/plain" });
      const file = new File([blob], sample.filename, { type: "text/plain" });
      setError(null);
      setSampleOpen(false);
      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (currentFile) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-risk-safe-bg border border-risk-safe/20 animate-scale-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-risk-safe/10 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-4 h-4 text-risk-safe" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">{currentFile.name}</p>
            <p className="text-[11px] text-muted-foreground">{(currentFile.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-md hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground flex-shrink-0 hover-scale"
          aria-label="Remove file"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-5 text-center transition-all duration-300 cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-accent/30"
        }`}
        onClick={() => document.getElementById("vcf-input")?.click()}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-2.5">
          <Upload className="w-4.5 h-4.5 text-primary" />
        </div>
        <p className="text-[13px] text-foreground mb-0.5">
          Drag & drop a VCF file, or <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-[11px] text-muted-foreground">.vcf format · Max 5 MB</p>
        <input id="vcf-input" type="file" accept=".vcf" className="hidden" onChange={onInputChange} />
      </div>

      {/* Sample file dialog */}
      <Dialog open={sampleOpen} onOpenChange={setSampleOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-left hover:border-primary/30 hover:bg-accent/30 transition-all duration-200"
          >
            <FlaskConical className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-medium text-muted-foreground">Load sample file</span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Select Sample VCF File
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 mt-2">
            {ALL_SAMPLES.map((sample) => (
              <button
                key={sample.filename}
                type="button"
                onClick={() => loadSample(sample)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent/50 border border-transparent hover:border-border transition-all duration-150 group"
              >
                <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
                  {sample.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{sample.description}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-risk-danger-bg border border-risk-danger/15 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-risk-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-risk-danger-foreground font-medium text-[12px]">Invalid file</p>
            <p className="text-risk-danger-foreground/80 text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
