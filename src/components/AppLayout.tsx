import { BarChart3, Clock, GitCompareArrows, Shield, LogOut, Settings, Target, Wrench, Network, Eye, Menu, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/GlobalSearch";
import omniguardLogo from "@/assets/omniguard-logo.png";
import { GlobalSocCopilot } from "@/components/GlobalSocCopilot";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { to: "/", icon: BarChart3, label: "Dashboard" },
  { to: "/modeling", icon: Target, label: "Threat Modeling" },
  { to: "/exposure", icon: Network, label: "Exposure" },
  { to: "/remediation", icon: Wrench, label: "Auto-Remediation" },
  { to: "/osint", icon: Eye, label: "Deep OSINT" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/compare", icon: GitCompareArrows, label: "Compare" },
  { to: "/policies", icon: Shield, label: "Policies" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut, session } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderNavLinks = (collapsed: boolean = false) => (
    <div className="space-y-1 py-4">
      <TooltipProvider delayDuration={0}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const buttonContent = (
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full ${collapsed ? "justify-center px-0" : "justify-start px-4"} gap-3 transition-all duration-300 ${
                isActive 
                  ? "bg-primary/15 text-primary font-medium border-l-2 border-primary rounded-l-none hover:bg-primary/25 shadow-[inset_2px_0_10px_rgba(var(--primary),0.1)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:translate-x-1"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary shadow-glow" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );

          return (
            <div key={item.to}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={item.to} onClick={() => setMobileMenuOpen(false)}>
                      {buttonContent}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-card border-border text-foreground">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link to={item.to} onClick={() => setMobileMenuOpen(false)}>
                  {buttonContent}
                </Link>
              )}
            </div>
          );
        })}
      </TooltipProvider>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background selection:bg-primary/30">
      
      {/* Desktop Sidebar (Floating Glassmorphism) */}
      <nav className={`hidden md:flex flex-col h-screen fixed top-0 left-0 border-r border-border/40 bg-card/40 backdrop-blur-2xl z-40 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          
          <div className={`p-4 mt-2 flex items-center ${isCollapsed ? "justify-center" : "px-6"} transition-all duration-300`}>
            <div className="flex items-center gap-3 w-full group">
              {/* Icon Area: Logo turns into Menu on hover */}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="relative shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/80 transition-colors focus:outline-none hidden md:flex"
              >
                <img 
                  src={omniguardLogo} 
                  alt="OmniGuard" 
                  className="w-8 h-8 absolute transition-all duration-300 group-hover:opacity-0 group-hover:scale-75" 
                />
                <Menu className="h-5 w-5 absolute opacity-0 scale-75 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 text-foreground" />
              </button>

              {/* Mobile Logo (unchanged behavior) */}
              <Link to="/" className="md:hidden relative shrink-0 w-10 h-10 flex items-center justify-center">
                <img src={omniguardLogo} alt="OmniGuard" className="w-8 h-8" />
              </Link>

              {/* Text Area */}
              {!isCollapsed && (
                <Link to="/" className="flex items-center shrink-0">
                  <span className="font-bold text-xl tracking-tight text-glow whitespace-nowrap overflow-hidden">
                    <span className="text-gradient-primary">Omni</span>Guard
                  </span>
                </Link>
              )}
            </div>
          </div>
          <div className="px-3 mt-2">
            {renderNavLinks(isCollapsed)}
          </div>
        </div>

        <div className="p-4 border-t border-border/40 bg-card/20 backdrop-blur-md">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start px-2"} gap-3 hover:bg-secondary/60 transition-colors`}>
                <Avatar className="h-8 w-8 ring-1 ring-border shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full text-foreground">{session?.user?.email}</span>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-card/90 backdrop-blur-xl border-border border-glow" align="start" side={isCollapsed ? "right" : "top"} sideOffset={10}>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/15 hover:text-destructive transition-colors" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 min-h-screen relative overflow-hidden bg-background transition-all duration-300 ease-in-out ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}>
        
        {/* Dynamic Background Effect */}
        <div className="absolute top-0 inset-x-0 h-96 bg-primary/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2"></div>
        <div className="absolute inset-0 bg-grid-white/[0.01] bg-[length:32px_32px] pointer-events-none" />

        <header className="h-16 border-b border-border/40 bg-background/40 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-card/95 backdrop-blur-2xl border-r-border/50">
                 <SheetHeader className="p-6 text-left border-b border-border/40">
                    <SheetTitle className="flex items-center gap-3">
                      <img src={omniguardLogo} alt="OmniGuard" className="w-6 h-6" />
                      <span className="font-bold text-lg tracking-tight">OmniGuard</span>
                    </SheetTitle>
                 </SheetHeader>
                 <div className="px-3 overflow-y-auto h-[calc(100vh-160px)]">
                    {renderNavLinks(false)}
                 </div>
                 <div className="absolute bottom-0 w-full p-4 border-t border-border/40 bg-background/50">
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                 </div>
              </SheetContent>
            </Sheet>

            <h2 className="text-lg font-semibold tracking-tight hidden sm:block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {navItems.find(item => item.to === location.pathname)?.label || "Platform"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch />
          </div>
        </header>
        
        <div className="flex-1 overflow-auto relative z-10 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
      
      {/* Global SOC Copilot Widget */}
      <GlobalSocCopilot />
    </div>
  );
}
