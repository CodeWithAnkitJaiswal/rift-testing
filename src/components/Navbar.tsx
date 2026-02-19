import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container max-w-4xl flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-foreground tracking-tight">PharmaGuard</span>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
