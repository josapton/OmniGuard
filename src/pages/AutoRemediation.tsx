import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, CheckCircle, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScanSelector } from "@/components/ScanSelector";
import { Scan, Finding } from "@/lib/api";

export default function AutoRemediation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vulnDetails, setVulnDetails] = useState("CVE-2023-38408 (OpenSSH forwarded ssh-agent RCE)");
  const [targetOs, setTargetOs] = useState("linux");
  const [scriptResult, setScriptResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleScanSelected = (scan: Scan, findings: Finding[]) => {
    if (findings && findings.length > 0) {
      // Find the most critical finding
      const sorted = [...findings].sort((a, b) => {
        const severityScores: Record<string, number> = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
        return (severityScores[b.severity] || 0) - (severityScores[a.severity] || 0);
      });
      const topVuln = sorted[0];
      setVulnDetails(`${topVuln.title}\n\n${topVuln.description}`);
    } else {
      setVulnDetails(`No vulnerabilities found for ${scan.domain}. Try another scan.`);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setScriptResult(null);
    try {
      const data = await fetchWithAuth("/remediation/generate", {
        method: "POST",
        body: JSON.stringify({ vulnerability_details: vulnDetails, target_os: targetOs })
      });
      setScriptResult(data);
    } catch (error: any) {
      console.error("Failed to generate script:", error);
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (scriptResult?.script) {
      navigator.clipboard.writeText(scriptResult.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div className="space-y-6 max-w-5xl mx-auto" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Auto-Remediation Copilot</h1>
        <p className="text-muted-foreground">AI-generated mitigation scripts and ansible playbooks to instantly patch and secure exposed surfaces.</p>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border col-span-1 border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="text-accent h-5 w-5" />
              Target Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScanSelector onScanSelected={handleScanSelected} />
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Vulnerability Details</label>
              <textarea 
                value={vulnDetails}
                onChange={(e) => setVulnDetails(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-severity-high min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
               <label className="text-xs font-medium text-foreground">Target OS / Environment</label>
               <input 
                 type="text" 
                 value={targetOs}
                 onChange={(e) => setTargetOs(e.target.value)}
                 className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono"
               />
            </div>
            
            <Button onClick={handleGenerate} disabled={loading} className="w-full glow-accent mt-2">
              <Wrench className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Generate Mitigation"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TerminalSquare className="text-primary h-5 w-5" />
                Remediation Script
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                <TerminalSquare className="h-8 w-8 opacity-20" />
                <p className="text-sm">Click generate to build automated defenses.</p>
              </div>
            ) : null}
            
            {scriptResult && !loading && (
              <div className="relative h-full font-mono text-sm text-green-400 bg-black/80 rounded-md p-4 overflow-auto border border-border/50">
                <Button 
                  onClick={handleCopy} 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>}
                </Button>
                <pre className="whitespace-pre-wrap">{scriptResult.script || scriptResult.raw_text || "No script generated."}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
