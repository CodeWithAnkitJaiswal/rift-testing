import { useState, useMemo } from "react";
import { X, Pill, Search } from "lucide-react";
import { SUPPORTED_DRUGS, type SupportedDrug } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DrugSelectorProps {
  selectedDrugs: string[];
  onChange: (drugs: string[]) => void;
}

export default function DrugSelector({ selectedDrugs, onChange }: DrugSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDrugs = useMemo(() => {
    if (!searchQuery.trim()) return [...SUPPORTED_DRUGS];
    return [...SUPPORTED_DRUGS].filter((drug) =>
      drug.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [searchQuery]);

  const addDrug = (drug: string) => {
    const upper = drug.toUpperCase().trim();
    if (upper && !selectedDrugs.includes(upper)) {
      onChange([...selectedDrugs, upper]);
    }
    setInputValue("");
  };

  const removeDrug = (drug: string) => {
    onChange(selectedDrugs.filter((d) => d !== drug));
  };

  const toggleDrug = (drug: string) => {
    if (selectedDrugs.includes(drug)) {
      removeDrug(drug);
    } else {
      addDrug(drug);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addDrug(inputValue);
    }
    if (e.key === "," && inputValue.trim()) {
      e.preventDefault();
      const parts = inputValue.split(",").map((p) => p.trim()).filter(Boolean);
      const newDrugs = [...selectedDrugs];
      for (const part of parts) {
        const upper = part.toUpperCase();
        if (!newDrugs.includes(upper)) newDrugs.push(upper);
      }
      onChange(newDrugs);
      setInputValue("");
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Selected drugs */}
      {selectedDrugs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedDrugs.map((drug) => {
            const isSupported = SUPPORTED_DRUGS.includes(drug as SupportedDrug);
            return (
              <span
                key={drug}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 animate-scale-in ${
                  isSupported
                    ? "bg-primary/8 text-primary border border-primary/15"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {drug}
                {!isSupported && <span className="text-[10px] opacity-60">(unsupported)</span>}
                <button onClick={() => removeDrug(drug)} className="ml-0.5 hover:opacity-60 transition-opacity" aria-label={`Remove ${drug}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Custom drug input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a custom drug name + Enter"
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all duration-200"
      />

      {/* Dialog trigger for supported drugs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/30 transition-all duration-200"
          >
            <Pill className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-medium text-muted-foreground">
              Browse supported drugs ({selectedDrugs.filter(d => SUPPORTED_DRUGS.includes(d as SupportedDrug)).length}/{SUPPORTED_DRUGS.length})
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              Select Medications
            </DialogTitle>
          </DialogHeader>
          <p className="text-[11px] text-muted-foreground -mt-1">Tap to toggle. Selected drugs are highlighted.</p>

          {/* Search input */}
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medications..."
              className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/50 transition-all duration-200"
            />
          </div>

          {/* Selected drugs inside dialog */}
          {selectedDrugs.length > 0 && (
            <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-border">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Selected ({selectedDrugs.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedDrugs.map((drug) => {
                  const isSupported = SUPPORTED_DRUGS.includes(drug as SupportedDrug);
                  return (
                    <span
                      key={drug}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium animate-scale-in ${
                        isSupported
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-background text-muted-foreground border border-border"
                      }`}
                    >
                      {drug}
                      {!isSupported && <span className="text-[10px] opacity-60">(custom)</span>}
                      <button onClick={() => removeDrug(drug)} className="ml-0.5 hover:opacity-60 transition-opacity" aria-label={`Remove ${drug}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {filteredDrugs.length > 0 ? (
              filteredDrugs.map((drug) => {
                const isSelected = selectedDrugs.includes(drug);
                return (
                  <button
                    key={drug}
                    type="button"
                    onClick={() => toggleDrug(drug)}
                    className={`px-3 py-2 rounded-lg text-[12px] font-medium border transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    {drug}
                  </button>
                );
              })
            ) : (
              <p className="text-[12px] text-muted-foreground py-2 w-full text-center">No matching medications found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
