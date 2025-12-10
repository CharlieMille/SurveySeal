import { Navbar } from "@/components/Navbar";
import { SurveyContent } from "./SurveyContent";

export async function generateStaticParams() {
  return [{ surveyId: "0" }];
}

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Survey #{surveyId}</h1>
          <SurveyContent surveyId={surveyId} />
        </div>
      </main>
    </div>
  );
}

