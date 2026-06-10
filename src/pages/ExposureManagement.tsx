import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Network, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ExposureManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const [ip, setIp] = useState("192.168.1.100");
  const [ports, setPorts] = useState("80, 443, 22");
  const [services, setServices] = useState("Apache, SSH, MySQL");
  const [vulns, setVulns] = useState("CVE-2021-41773");

  const handleSimulate = async () => {
    setLoading(true);
    setSimulationResult(null);
    try {
      const data = await fetchWithAuth("/exposure/simulate", {
        method: "POST",
        body: JSON.stringify({
          target_ip: ip,
          open_ports: ports.split(",").map(p => p.trim()),
          running_services: services.split(",").map(s => s.trim()),
          known_vulnerabilities: vulns.split(",").map(v => v.trim())
        })
      });
      setSimulationResult(data);
    } catch (error: any) {
      console.error("Simulation failed:", error);
      toast({ title: "Simulation Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    if (!field) return "Unknown";
    if (typeof field === "string") return field;
    if (field.description) return field.description;
    return JSON.stringify(field);
  };

  return (
    <motion.div className="space-y-6 max-w-5xl mx-auto" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Attack Surface & Exposure Management</h1>
        <p className="text-muted-foreground">Simulate theoretical attack paths based on network topology to prioritize mitigation efforts proactively.</p>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Configuration Card */}
        <Card className="bg-card border-border col-span-1 border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="text-primary h-5 w-5" />
              Target Topology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Target IP Address</label>
              <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Open Ports (comma separated)</label>
              <input type="text" value={ports} onChange={(e) => setPorts(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Running Services</label>
              <input type="text" value={services} onChange={(e) => setServices(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Known Vulnerabilities (CVE)</label>
              <input type="text" value={vulns} onChange={(e) => setVulns(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-severity-high" />
            </div>
            <Button onClick={handleSimulate} disabled={loading} className="w-full glow-primary mt-2">
              <Network className="h-4 w-4 mr-2" />
              {loading ? "Simulating Topology..." : "Simulate Attack Path"}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="bg-card border-border col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="text-accent h-5 w-5" />
              Theoretical Attack Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-mono animate-pulse">Mapping theoretical intrusion routes...</p>
              </div>
            ) : simulationResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-sm">
                      <Network className="h-4 w-4" /> Entry Point
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{renderField(simulationResult.entry_point)}</div>
                  </div>
                  
                  <div className="p-4 bg-secondary rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2 text-accent font-semibold text-sm">
                      <Lock className="h-4 w-4" /> Privilege Escalation
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{renderField(simulationResult.privilege_escalation)}</div>
                  </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-sm">
                    <Activity className="h-4 w-4" /> Lateral Movement
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{renderField(simulationResult.lateral_movement)}</div>
                </div>

                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                      <ShieldAlert className="h-4 w-4" /> Final Impact
                    </div>
                    <span className="text-xs font-mono bg-destructive text-destructive-foreground px-2 py-1 rounded">
                      Priority: {renderField(simulationResult.mitigation_priority)}
                    </span>
                  </div>
                  <div className="text-sm text-destructive/80 whitespace-pre-wrap">{renderField(simulationResult.impact)}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 border border-dashed border-border rounded-lg">
                <Network className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm text-center max-w-md">Input target infrastructure details and click simulate to view theoretical attack paths across your network.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
