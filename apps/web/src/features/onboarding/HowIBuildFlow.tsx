import { useState } from "react";

import { humanize, type HowIBuildProfile } from "./howIBuild";
import { DictationTextarea } from "./VoiceTextarea";

type HowIBuildFlowProps = {
  initialProfile: HowIBuildProfile;
  initialReview?: boolean;
  onSave: (profile: HowIBuildProfile) => void;
};

const totalSteps = 4;

export function HowIBuildFlow({ initialProfile, initialReview = false, onSave }: HowIBuildFlowProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [step, setStep] = useState(initialReview ? totalSteps + 1 : 1);

  function update<K extends keyof HowIBuildProfile>(key: K, value: HowIBuildProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  const progress = Math.min(step, totalSteps);
  const canContinue = Boolean(
    (step === 1 && profile.displayName.trim() && profile.projectTypes.trim()) ||
      (step === 2 && profile.frameworks.trim()) ||
      step === 3 ||
      (step === 4 && profile.productPriorities.trim() && profile.buildInstinct),
  );

  return (
    <main className="shell onboarding-shell">
      <section className="onboarding-panel" aria-labelledby="onboarding-title">
        <header className="onboarding-header">
          <div>
            <p className="eyebrow">Creator Memory · Intake {String(progress).padStart(2, "0")}</p>
            <h1 id="onboarding-title" className="section-title">How I Build</h1>
          </div>
          {step <= totalSteps ? <p className="step-count">{step} / {totalSteps}</p> : null}
        </header>

        {step <= totalSteps ? (
          <div className="progress-track" aria-label={`Step ${step} of ${totalSteps}`}>
            <span style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="question-card">
            <p className="question-number">01 · THE CREATOR</p>
            <h2>First, what should Revival call you?</h2>
            <label>
              Your name
              <input
                autoFocus
                value={profile.displayName}
                onChange={(event) => update("displayName", event.target.value)}
                placeholder="Jasmine"
              />
            </label>
            <DictationTextarea
              label="What kinds of projects do you usually build?"
              hint="Apps, agents, creative tools, hackathon experiments…"
              value={profile.projectTypes}
              onChange={(value) => update("projectTypes", value)}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="question-card">
            <p className="question-number">02 · THE TOOLKIT</p>
            <h2>What do you naturally reach for?</h2>
            <DictationTextarea
              label="Frameworks, languages, and tools"
              hint="React, Vite, TypeScript, Supabase, Python…"
              value={profile.frameworks}
              onChange={(value) => update("frameworks", value)}
            />
            <ChoiceGroup
              legend="How big should a first version feel?"
              name="mvp-size"
              value={profile.mvpSize}
              onChange={(value) => update("mvpSize", value)}
              options={[
                ["tiny-proof", "Tiny proof", "Prove one risky thing."],
                ["focused-mvp", "Focused MVP", "Ship one complete loop."],
                ["polished-slice", "Polished slice", "Make the core moment memorable."],
              ]}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="question-card">
            <p className="question-number">03 · THE METHOD</p>
            <h2>How do you find your way through a build?</h2>
            <ChoiceGroup
              legend="Planning style"
              name="planning-style"
              value={profile.planningStyle}
              onChange={(value) => update("planningStyle", value)}
              options={[
                ["shape-then-build", "Shape, then build", "Think through the experience first."],
                ["build-to-think", "Build to think", "Learn by making something visible."],
                ["plan-in-detail", "Plan in detail", "Reduce ambiguity before coding."],
              ]}
            />
            <ChoiceGroup
              legend="Testing preference"
              name="testing-style"
              value={profile.testingStyle}
              onChange={(value) => update("testingStyle", value)}
              options={[
                ["critical-paths", "Critical paths", "Test what would hurt most if it broke."],
                ["test-as-i-go", "As I go", "Pair each feature with checks."],
                ["harden-after", "Harden after", "Find the experience, then reinforce it."],
              ]}
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="question-card">
            <p className="question-number">04 · THE COMPASS</p>
            <h2>What matters when a project comes back?</h2>
            <DictationTextarea
              label="Your product priorities"
              hint="Usefulness, beauty, accessibility, emotional resonance, speed…"
              value={profile.productPriorities}
              onChange={(value) => update("productPriorities", value)}
            />
            <ChoiceGroup
              legend="When something is stuck, your first instinct is to…"
              name="build-instinct"
              value={profile.buildInstinct}
              onChange={(value) => update("buildInstinct", value as HowIBuildProfile["buildInstinct"])}
              options={[
                ["repair", "Repair it", "Restore the original promise."],
                ["simplify", "Simplify it", "Protect the strongest useful core."],
                ["experiment", "Experiment", "Find a more interesting direction."],
              ]}
            />
            <DictationTextarea
              label="Anything Revival should remember? (optional)"
              hint="I work in bursts. I care most about the user experience…"
              value={profile.extraContext}
              onChange={(value) => update("extraContext", value)}
            />
          </div>
        ) : null}

        {step === totalSteps + 1 ? (
          <div className="review-card">
            <p className="question-number">RECONSTRUCTION PREVIEW</p>
            <h2>This is how Revival understands you.</h2>
            <p className="review-intro">
              Nothing here is permanent. You can edit your Creator Memory whenever it changes.
            </p>
            <dl className="memory-grid">
              <Memory label="Creator" value={profile.displayName} />
              <Memory label="Usually builds" value={profile.projectTypes} />
              <Memory label="Preferred tools" value={profile.frameworks} />
              <Memory label="First-version size" value={humanize(profile.mvpSize)} />
              <Memory label="Planning" value={humanize(profile.planningStyle)} />
              <Memory label="Testing" value={humanize(profile.testingStyle)} />
              <Memory label="Product priorities" value={profile.productPriorities} />
              <Memory label="When stuck" value={humanize(profile.buildInstinct)} />
              {profile.extraContext ? <Memory label="Creator note" value={profile.extraContext} /> : null}
            </dl>
          </div>
        ) : null}

        <footer className="onboarding-actions">
          {step > 1 ? (
            <button
              className="text-button"
              type="button"
              onClick={() => setStep(step === totalSteps + 1 ? 1 : step - 1)}
            >
              {step === totalSteps + 1 ? "Edit answers" : "Back"}
            </button>
          ) : <span />}
          {step <= totalSteps ? (
            <button
              className="primary-button"
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((current) => Math.min(current + 1, totalSteps + 1))}
            >
              {step === totalSteps ? "Review my profile" : "Continue"}
            </button>
          ) : (
            <button
              className="primary-button"
              type="button"
              onClick={() => onSave({ ...profile, completedAt: new Date().toISOString() })}
            >
              Enter the Lab <span aria-hidden="true">→</span>
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}

function ChoiceGroup({ legend, name, value, options, onChange }: {
  legend: string;
  name: string;
  value: string;
  options: Array<[string, string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="choice-group">
      <legend>{legend}</legend>
      <div className="choice-grid">
        {options.map(([optionValue, title, description]) => (
          <label className="choice-card" key={optionValue} data-selected={value === optionValue}>
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
            />
            <strong>{title}</strong>
            <span>{description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Memory({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value || "Not recorded"}</dd></div>;
}
