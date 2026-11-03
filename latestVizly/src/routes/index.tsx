import { createFileRoute } from "@tanstack/react-router";
import { AuroraBackground } from "@/components/site/AuroraBackground";
import { ThreeBackground } from "@/components/site/ThreeBackground";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { RecentProjects } from "@/components/site/RecentProjects";
import { CtaSection } from "@/components/site/CtaSection";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "nutriX Restro — Turn Data into Intelligent Visual Stories" },
      {
        name: "description",
        content:
          "AI-powered platform to generate and visualize data instantly. From raw data to insightful dashboards in seconds.",
      },
      {
        property: "og:title",
        content: "nutriX Restro — Turn Data into Intelligent Visual Stories",
      },
      {
        property: "og:description",
        content:
          "AI-powered platform to generate and visualize data instantly. From raw data to insightful dashboards in seconds.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen text-foreground">
      <ThreeBackground />
      <AuroraBackground />
      <Navbar />
      <main>
        <Hero />
        <Reveal variant="up">
          <RecentProjects />
        </Reveal>
        <Reveal variant="zoom" delay={80}>
          <CtaSection />
        </Reveal>
      </main>
      <Reveal variant="fade">
        <Footer />
      </Reveal>
    </div>
  );
}
