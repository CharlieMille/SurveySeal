import { Navbar } from "@/components/Navbar";
import { StatisticsContent } from "./StatisticsContent";

export async function generateStaticParams() {
  return [{ surveyId: "0" }];
}

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Statistics - Survey #{surveyId}</h1>
          <StatisticsContent surveyId={surveyId} />
        </div>
      </main>
    </div>
  );
}


