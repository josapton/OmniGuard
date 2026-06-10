import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, CheckCircle, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AutoRemediation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vulnDetails, setVulnDetails] = useState("CVE-2023-38408 (OpenSSH forwarded ssh-agent RCE)");
  const [targetOs, setTargetOs] = useState("linux");
  const [remediationScript, setRemediationScript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setRemediationScript(null);
    try {
      const data = await fetchWithAuth("/remediation/generate", {
        method: "POST",
        body: JSON.stringify({ vulnerability_details: vulnDetails, target_os: targetOs })
      });
      setRemediationScript(data.script);
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
              {remediationScript && (
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 border-border">
                  {copied ? <CheckCircle className="h-4 w-4 text-success mr-2" /> : null}
                  {copied ? "Copied" : "Copy Code"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                 <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-sm font-mono animate-pulse">AI is synthesizing defense scripts...</p>
              </div>
            ) : remediationScript ? (
              <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-green-400 border border-border/50 shadow-inner">
                {remediationScript}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border border-dashed border-border rounded-lg">
                <TerminalSquare className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Click generate to build automated defenses.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
