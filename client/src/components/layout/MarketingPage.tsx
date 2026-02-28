import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface MarketingPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function MarketingPage({ title, subtitle, actions, children }: MarketingPageProps) {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <section className="page-hero">
          <div className="container">
            <div className="page-hero-inner">
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
              {actions && <div className="page-hero-actions">{actions}</div>}
            </div>
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}
