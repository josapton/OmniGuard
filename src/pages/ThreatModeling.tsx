import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Target, AlertTriangle, TrendingUp, GitBranch, ShieldAlert, Download } from "lucide-react";
import { fetchWithAuth, saveThreatModel } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF } from "@/lib/exportToPDF";
import { Skeleton } from "@/components/ui/skeleton";

export default function ThreatModeling() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [modelResult, setModelResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [assetName, setAssetName] = useState("Apache Web Server");
  const [cpeName, setCpeName] = useState("cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*");

  const handlePredict = async () => {
    setLoading(true);
    setModelResult(null); // Clear previous
    try {
      const data = await fetchWithAuth("/modeling/predict", {
        method: "POST",
        body: JSON.stringify({
          asset_name: assetName,
          cpe_name: cpeName,
          environment: "production"
        })
      });
      setModelResult(data);
      await saveThreatModel(data);
    } catch (error: any) {
      console.error("Prediction failed:", error);
      toast({ title: "Prediction Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!modelResult) return;
    setIsExporting(true);
    try {
      await exportToPDF("threat-model-report", `ThreatModel_${assetName.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Export Successful", description: "Your PDF report has been downloaded." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div className="space-y-6 max-w-5xl mx-auto" variants={staggerContainer} initial="initial" animate="animate">
      <div className="flex justify-between items-end">
        <motion.div variants={fadeInUp}>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Predictive Threat Modeling</h1>
          <p className="text-muted-foreground">AI-driven attack path simulation and risk scoring based on global CVE intelligence.</p>
        </motion.div>
        {modelResult && (
          <motion.div variants={fadeInUp}>
            <Button onClick={handleExport} disabled={isExporting} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
          </motion.div>
        )}
      </div>

      <motion.div variants={fadeInUp}>
        <Card className="bg-card border-border border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="text-primary h-5 w-5" />
              Simulate Attack Path
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Run an autonomous AI simulation to predict how an attacker might chain vulnerabilities together based on real CVE data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Asset Name</label>
                <input 
                  type="text" 
                  value={assetName} 
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">CPE Identifier (NIST format)</label>
                <input 
                  type="text" 
                  value={cpeName} 
                  onChange={(e) => setCpeName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                />
              </div>
            </div>
            <Button onClick={handlePredict} disabled={loading} className="w-full sm:w-auto glow-primary mt-4">
              {loading ? "Simulating Attack Paths..." : "Run AI Threat Prediction"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading Skeletons */}
      {loading && (
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border col-span-1">
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="flex justify-center p-6"><Skeleton className="h-32 w-32 rounded-full" /></CardContent>
          </Card>
          <Card className="bg-card border-border col-span-2">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card className="bg-card border-border col-span-3">
            <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      {modelResult && !loading && (
        <motion.div id="threat-model-report" variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1 rounded-xl bg-background">
          <Card className="bg-card border-border col-span-1">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="text-destructive h-4 w-4" />
                Predicted Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="60" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-secondary" />
                  <circle 
                    cx="64" cy="64" r="60" fill="transparent" 
                    stroke="currentColor" strokeWidth="8" 
                    strokeDasharray={377} strokeDashoffset={377 - (377 * modelResult.risk_score) / 100}
                    className="text-severity-critical transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-severity-critical">
                  {modelResult.risk_score}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border col-span-2">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <GitBranch className="text-primary h-4 w-4" />
                Likely Attack Paths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modelResult.likely_attack_paths.map((path: any, index: number) => (
                <div key={index} className="flex flex-col gap-2 p-3 bg-secondary rounded-lg border border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-foreground">{path.vector}</span>
                    <span className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-1 rounded">Prob: {path.probability}</span>
                  </div>
                  <div className="text-xs text-muted-foreground border-l-2 border-primary/50 pl-3 ml-2 mt-1 py-1">
                    {path.escalation}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border col-span-3">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="text-accent h-4 w-4" />
                AI Rationale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{modelResult.rationale}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
