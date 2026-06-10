import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, ShieldAlert, Users, Target, Activity, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth, saveOsintAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF } from "@/lib/exportToPDF";
import { Skeleton } from "@/components/ui/skeleton";

export default function OsintAnalysis() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [rawText, setRawText] = useState("Kami berhasil membobol server database rumah sakit X semalam. Menggunakan celah RCE di web admin. Ada 50.000 data pasien beserta nomor kartu kredit. Jika tidak bayar 50 Bitcoin, besok data ini kami sebar. Hubungi kami di Telegram @HackerOps. IP Server mereka: 192.168.10.5");

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const data = await fetchWithAuth("/osint/analyze", {
        method: "POST",
        body: JSON.stringify({ raw_text: rawText })
      });
      setAnalysisResult(data);
      await saveOsintAnalysis(data);
    } catch (error: any) {
      console.error("OSINT analysis failed:", error);
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!analysisResult) return;
    setIsExporting(true);
    try {
      await exportToPDF("osint-report", `OSINT_Intel_${new Date().getTime()}.pdf`);
      toast({ title: "Export Successful", description: "Your PDF report has been downloaded." });
    } catch (error: any) {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-success text-success-foreground";
      default: return "bg-secondary text-foreground";
    }
  };

  return (
    <motion.div className="space-y-6 max-w-6xl mx-auto" variants={staggerContainer} initial="initial" animate="animate">
      <div className="flex justify-between items-end">
        <motion.div variants={fadeInUp}>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Deep OSINT & NLP Analysis</h1>
          <p className="text-muted-foreground">Process raw text from Dark Web leaks or OSINT sources to extract Threat Intel using Gemini NLP.</p>
        </motion.div>
        {analysisResult && (
          <motion.div variants={fadeInUp}>
            <Button onClick={handleExport} disabled={isExporting} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card className="bg-card border-border h-full flex flex-col border-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="text-primary h-5 w-5" />
                Raw Data Input
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <textarea
                className="w-full flex-1 bg-secondary border border-border rounded-md p-4 text-sm font-mono text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[250px] resize-none"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste suspicious text, pastebin link, or dark web forum snippet here..."
              />
              <Button onClick={handleAnalyze} disabled={loading || !rawText} className="w-full glow-primary">
                {loading ? "Processing NLP..." : "Run NLP Analysis"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="text-success h-5 w-5" />
                Intelligence Extraction
              </CardTitle>
              <CardDescription>Structured IoCs and entities extracted via AI</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {loading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg border border-border">
                    <span className="font-semibold text-sm">Threat Level</span>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      <Users className="h-3 w-3" /> Threat Actors
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      <Target className="h-3 w-3" /> Targeted Entities
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      <Activity className="h-3 w-3" /> Extracted IOCs
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              ) : !analysisResult ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm">Enter raw text and run analysis to extract intelligence.</p>
                </div>
              ) : (
                <div id="osint-report" className="space-y-6 bg-background p-1 rounded-lg">
                  <div className="flex justify-between items-center p-4 bg-secondary rounded-lg border border-border">
                    <span className="font-semibold text-sm">Threat Level</span>
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getThreatColor(analysisResult.threat_level)}`}>
                      {analysisResult.threat_level}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      <Users className="h-3 w-3" /> Threat Actors
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.threat_actors && analysisResult.threat_actors.length > 0 ? (
                        analysisResult.threat_actors.map((actor: string, i: number) => (
                          <span key={i} className="bg-destructive/20 text-destructive border border-destructive/30 px-2 py-1 rounded text-xs font-mono">
                            {actor}
                          </span>
                        ))
                      ) : <span className="text-xs text-muted-foreground">None identified</span>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      <Target className="h-3 w-3" /> Targeted Entities
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.targeted_entities && analysisResult.targeted_entities.length > 0 ? (
                        analysisResult.targeted_entities.map((entity: string, i: number) => (
                          <span key={i} className="bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded text-xs font-medium">
                            {entity}
                          </span>
                        ))
                      ) : <span className="text-xs text-muted-foreground">None identified</span>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      <Activity className="h-3 w-3" /> Extracted IOCs
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.extracted_iocs && analysisResult.extracted_iocs.length > 0 ? (
                        analysisResult.extracted_iocs.map((ioc: string, i: number) => (
                          <span key={i} className="bg-secondary text-foreground border border-border px-2 py-1 rounded text-xs font-mono">
                            {ioc}
                          </span>
                        ))
                      ) : <span className="text-xs text-muted-foreground">No IoCs found</span>}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-foreground mb-2">Executive Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysisResult.summary}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
