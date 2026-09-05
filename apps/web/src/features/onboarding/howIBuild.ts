import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export const HOW_I_BUILD_STORAGE_KEY = "revival.how-i-build.v1";

export type BuildInstinct = "repair" | "simplify" | "experiment";

export type HowIBuildProfile = {
  displayName: string;
  projectTypes: string;
  frameworks: string;
  mvpSize: string;
  planningStyle: string;
  testingStyle: string;
  productPriorities: string;
  buildInstinct: BuildInstinct | "";
  extraContext: string;
  memoryIds: Record<string, string>;
  completedAt?: string;
};

const memoryKeys = [
  "projectTypes",
  "frameworks",
  "mvpSize",
  "planningStyle",
  "testingStyle",
  "productPriorities",
  "buildInstinct",
  "extraContext",
] as const;

export function createEmptyProfile(): HowIBuildProfile {
  return {
    displayName: "",
    projectTypes: "",
    frameworks: "",
    mvpSize: "focused-mvp",
    planningStyle: "shape-then-build",
    testingStyle: "critical-paths",
    productPriorities: "",
    buildInstinct: "",
    extraContext: "",
    memoryIds: Object.fromEntries(memoryKeys.map((key) => [key, crypto.randomUUID()])),
  };
}

export function loadHowIBuildProfile(): HowIBuildProfile | null {
  try {
    const saved = window.localStorage.getItem(HOW_I_BUILD_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<HowIBuildProfile>;
    const empty = createEmptyProfile();
    return {
      ...empty,
      ...parsed,
      memoryIds: { ...empty.memoryIds, ...parsed.memoryIds },
    };
  } catch {
    return null;
  }
}

export function saveHowIBuildProfile(profile: HowIBuildProfile) {
  window.localStorage.setItem(HOW_I_BUILD_STORAGE_KEY, JSON.stringify(profile));
}

export async function syncHowIBuildProfile(profile: HowIBuildProfile, user: User) {
  const client = getSupabaseBrowserClient();
  const displayName =
    profile.displayName.trim() ||
    user.user_metadata.full_name ||
    user.user_metadata.user_name ||
    "Creator";

  const { error: profileError } = await client.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    onboarding_complete: true,
  });
  if (profileError) throw profileError;

  const memories = [
    memoryRow(profile, user.id, "projectTypes", "taste", "Usually builds"),
    memoryRow(profile, user.id, "frameworks", "technology", "Preferred tools"),
    memoryRow(profile, user.id, "mvpSize", "scope", "Preferred first version"),
    memoryRow(profile, user.id, "planningStyle", "workflow", "Planning style"),
    memoryRow(profile, user.id, "testingStyle", "workflow", "Testing preference"),
    memoryRow(profile, user.id, "productPriorities", "motivation", "Product priorities"),
    memoryRow(profile, user.id, "buildInstinct", "workflow", "When stuck"),
    memoryRow(profile, user.id, "extraContext", "motivation", "Creator note"),
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (memories.length === 0) return;

  const { error: memoryError } = await client.from("creator_memories").upsert(memories);
  if (memoryError) throw memoryError;
}

function memoryRow(
  profile: HowIBuildProfile,
  userId: string,
  key: (typeof memoryKeys)[number],
  category: "workflow" | "taste" | "technology" | "scope" | "motivation",
  label: string,
) {
  const value = profile[key].trim();
  if (!value) return null;

  return {
    id: profile.memoryIds[key],
    user_id: userId,
    category,
    content: `${label}: ${humanize(value)}`,
    provenance: "user_provided",
    active: true,
    source_reference: { source: "how_i_build_v1", field: key },
  };
}

export function humanize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
