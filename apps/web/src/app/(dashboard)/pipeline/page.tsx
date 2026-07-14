import { Topbar } from "@/components/layout/Topbar";
import { PipelineBoard } from "@/features/pipeline/components/PipelineBoard";

export default function PipelinePage() {
  return (
    <>
      <Topbar title="Pipeline" />
      <main className="space-y-6 p-6 sm:p-8">
        <PipelineBoard />
      </main>
    </>
  );
}
