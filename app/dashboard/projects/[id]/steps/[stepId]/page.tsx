"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSteps, type Step, updateStepDescription } from "@/lib/steps";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";



export default function StepDetailPage({
  params,
}: {
  params: { id: string; stepId: string };
}) {
  const [step, setStep] = useState<Step | null>(null);
  const [description, setDescription] = useState("");


  useEffect(() => {
    const steps = getSteps(params.id);
    const found = steps.find(
      (s) => String(s.id) === String(params.stepId)
    );
    setStep(found ?? null);
    if (found?.description !== undefined) {
      setDescription(found.description);
    }
  }, [params.id, params.stepId]);

  const isStuck = (step: Step): boolean => {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const timeSinceUpdate = now - step.lastUpdatedAt;
    return (
      (step.status === "pending" || step.status === "blocked") &&
      timeSinceUpdate > TWENTY_FOUR_HOURS
    );
  };
  useEffect(() => {
    if (!step) return;
  
    const timeout = setTimeout(() => {
      updateStepDescription(params.id, params.stepId, description);
    }, 500);
  
    return () => clearTimeout(timeout);
  }, [description, step, params.id, params.stepId]);
  

  if (!step) {
    return (
      <main className="min-h-screen code-pattern relative">
        <Navbar />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-white">
          <p className="mb-4">Step not found</p>
          <Link
            href={`/dashboard/projects/${params.id}`}
            className="text-cyan-400 hover:underline"
          >
            ← Back to Project
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        <Link
          href={`/dashboard/projects/${params.id}`}
          className="text-cyan-400 hover:underline mb-4 inline-block"
        >
          ← Back to Project
        </Link>

        <h1 className="text-3xl font-bold text-white mb-4">
          {step.title}
        </h1>
        
        {isStuck(step) && (
          <div className="mb-4 glass rounded-lg p-3 border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-sm text-yellow-400">
              ⚠️ This step hasn't been updated in over 24 hours
            </p>
          </div>
        )}

        <div className="glass rounded-xl p-6 border border-gray-700">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this step..."
            rows={6}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-0 focus:ring-offset-0"
          />
        </div>
      

        
      </div>

      <Footer />
    </main>
  );
}
