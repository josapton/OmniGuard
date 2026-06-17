import { useState, useEffect } from "react";
import { getScans, Scan, Finding, getFindings } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ScanSelectorProps {
  onScanSelected: (scan: Scan, findings: Finding[]) => void;
  className?: string;
}

export function ScanSelector({ onScanSelected, className = "" }: ScanSelectorProps) {
  const { toast } = useToast();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScanId, setSelectedScanId] = useState<string>("");

  useEffect(() => {
    async function loadScans() {
      try {
        const data = await getScans();
        setScans(data);
      } catch (err: any) {
        toast({ title: "Failed to load scans", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadScans();
  }, [toast]);

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedScanId(id);
    if (!id) return;

    const scan = scans.find(s => s.id === id);
    if (!scan) return;

    try {
      // Fetch findings for the scan to populate related vulnerabilities
      const findings = await getFindings(id);
      onScanSelected(scan, findings);
      toast({ title: "Data Loaded", description: `Loaded scan data for ${scan.domain}` });
    } catch (err: any) {
      toast({ title: "Failed to load findings", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading previous scans...
      </div>
    );
  }

  if (scans.length === 0) {
    return null; // Don't show anything if no scans exist
  }

  return (
    <div className={`flex flex-col space-y-2 mb-6 ${className}`}>
      <label className="text-sm font-medium text-primary flex items-center gap-2">
        <span>⚡ Quick Fill from Past Scan</span>
      </label>
      <select 
        value={selectedScanId}
        onChange={handleSelect}
        className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-secondary transition-colors"
      >
        <option value="">-- Select a recent scan to populate inputs --</option>
        {scans.map(scan => (
          <option key={scan.id} value={scan.id}>
            {scan.domain} ({new Date(scan.created_at).toLocaleString()})
          </option>
        ))}
      </select>
    </div>
  );
}
