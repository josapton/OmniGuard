import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, AlertTriangle, Cpu, Clock, ArrowRight, Search, Shield, Download } from "lucide-react";
import { ScanForm } from "@/components/ScanForm";
import { StatusBadge, RiskScoreGauge, SeverityBadge } from "@/components/SeverityBadge";
import { getScans, type Scan } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/PageTransition";
import omniguardLogo from "@/assets/omniguard-logo.png";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    try {
      const data = await getScans();
      setScans(data);
    } catch (err) {
      console.error("Failed to fetch scans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, []);

  const totalScans = scans.length;
  const totalVulns = scans.reduce((sum, s) => sum + (s.vulnerabilities_found || 0), 0);
  const completedScans = scans.filter(s => s.status === 'completed' && s.risk_score != null);
  const avgRisk = completedScans.length ? Math.round(completedScans.reduce((sum, s) => sum + (s.risk_score || 0), 0) / completedScans.length) : 0;
  const uniqueDomains = new Set(scans.map(s => s.domain)).size;

  const techCounts: Record<string, number> = {};
  for (const s of scans) {
    if (Array.isArray(s.technologies)) {
      for (const t of s.technologies) {
        if (typeof t === 'string' && t.trim()) {
          techCounts[t] = (techCounts[t] || 0) + 1;
        } else if (typeof t === 'object' && t !== null && t.name) {
          techCounts[t.name] = (techCounts[t.name] || 0) + 1;
        }
      }
    } else if (typeof s.technologies === 'string' && s.technologies.trim()) {
      techCounts[s.technologies] = (techCounts[s.technologies] || 0) + 1;
    }
  }
  const topTechs = Object.entries(techCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const s of scans) {
    if (s.risk_score >= 75) severityCounts.critical++;
    else if (s.risk_score >= 50) severityCounts.high++;
    else if (s.risk_score >= 25) severityCounts.medium++;
    else if (s.risk_score > 0) severityCounts.low++;
    else severityCounts.info++;
  }

  const recentScans = scans.slice(0, 5);

  const handleExportCsv = () => {
    const headers = ["Scan ID", "Domain", "Status", "Risk Score", "Vulnerabilities", "Date"];
    const rows = scans.map(s => [
      s.id,
      s.domain,
      s.status,
      s.risk_score || 0,
      s.vulnerabilities_found || 0,
      new Date(s.created_at).toISOString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `OmniGuard_Global_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trendData = [...completedScans]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(s => ({
      name: new Date(s.created_at).toLocaleDateString(),
      score: s.risk_score,
      domain: s.domain
    }));

  const pieData = [
    { name: 'Critical', value: severityCounts.critical, color: '#ef4444' },
    { name: 'High', value: severityCounts.high, color: '#f97316' },
    { name: 'Medium', value: severityCounts.medium, color: '#eab308' },
    { name: 'Low', value: severityCounts.low, color: '#3b82f6' },
    { name: 'Info', value: severityCounts.info, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  return (
    <motion.div className="space-y-8" variants={staggerContainer} initial="initial" animate="animate">
      <motion.div variants={fadeInUp} className="relative flex flex-col items-center text-center gap-5 py-16 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Cyber Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          
          {/* Scanning Line */}
          <motion.div 
            className="absolute left-0 right-0 h-[1px] bg-primary/40 shadow-[0_0_20px_hsl(var(--primary))]"
            animate={{ top: ["-10%", "110%"] }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />
          
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-5">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <img src={omniguardLogo} alt="OmniGuard" className="h-16 w-16 object-contain" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gradient-primary">Omni</span>Guard
            </h1>
            <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-relaxed">
              Automated threat intelligence & attack surface mapping. Enter a domain to begin reconnaissance.
            </p>
          </div>
          <ScanForm onScanStarted={fetchScans} />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Scans", value: totalScans, icon: Search, color: "text-primary" },
          { label: "Domains", value: uniqueDomains, icon: Globe, color: "text-primary" },
          { label: "Vulnerabilities", value: totalVulns, icon: AlertTriangle, color: "text-accent" },
          { label: "Avg Risk", value: avgRisk, icon: Shield, color: avgRisk >= 50 ? "text-severity-high" : "text-severity-low" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card border-border card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold tracking-tight">{value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Analytics Charts */}
      {completedScans.length > 0 && (
        <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-accent" /> Risk Score Trends
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" /> Vulnerability Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full mt-2 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-muted-foreground flex flex-col items-center">
                    <Shield className="h-8 w-8 mb-2 opacity-20" />
                    No vulnerabilities found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : recentScans.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No scans yet. Start your first scan above.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentScans.map((scan, i) => (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <Link to={`/scan/${scan.id}`} className="flex items-center justify-between p-4 hover:bg-secondary/40 transition-all duration-200 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-secondary">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-sm truncate">{scan.domain}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={scan.status} />
                        {scan.status === 'completed' && (
                          <span className={`font-mono text-sm font-bold ${
                            scan.risk_score >= 75 ? "text-severity-critical" :
                            scan.risk_score >= 50 ? "text-severity-high" :
                            scan.risk_score >= 25 ? "text-severity-medium" : "text-severity-low"
                          }`}>{scan.risk_score}</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                Technologies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topTechs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data yet</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {topTechs.map(([tech, count]) => (
                    <span key={tech} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-[11px] font-mono text-secondary-foreground">
                      {tech}
                      <span className="text-muted-foreground">({count})</span>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
