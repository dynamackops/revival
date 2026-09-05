import { useCallback, useEffect, useRef, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import {
  addRepository as apiAddRepository,
  completeInstallation,
  createInstallUrl,
  GitHubAppError,
  listAuthorizedRepositories,
  type AuthorizedRepository,
} from "./githubAppClient";
import { useCataloguedRepositories } from "./useCataloguedRepositories";

export type ConnectionBanner =
  | { kind: "completing" }
  | { kind: "installation_canceled" }
  | { kind: "installed"; accountLogin: string }
  | { kind: "pending_approval" }
  | { kind: "error"; message: string };

export function friendlyMessage(error: unknown): string {
  if (error instanceof GitHubAppError) {
    switch (error.code) {
      case "expired_session":
      case "unauthenticated":
        return "Your session expired. Sign in again to reconnect GitHub.";
      case "installation_revoked":
      case "installation_forbidden":
        return "GitHub access for this installation was revoked. Choose Repository Access to reconnect.";
      case "github_unavailable":
        return "GitHub is temporarily unavailable. Please try again in a moment.";
      case "repository_not_authorized":
        return "That repository is no longer authorized for this installation.";
      case "server_misconfigured":
        return "Repository connection is not configured yet. Please try again later.";
      default:
        return error.message;
    }
  }
  return "Something went wrong talking to GitHub. Please try again.";
}

export function useGitHubAppConnection(session: Session | null) {
  const userId = session?.user.id;
  const catalogued = useCataloguedRepositories(userId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [authorizedRepositories, setAuthorizedRepositories] = useState<AuthorizedRepository[]>([]);
  const [hasInstallation, setHasInstallation] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string>();
  const [addingRepositoryId, setAddingRepositoryId] = useState<number | null>(null);
  const [addFeedback, setAddFeedback] = useState<string>();
  const [banner, setBanner] = useState<ConnectionBanner | null>(null);
  const [connecting, setConnecting] = useState(false);
  const processedCallback = useRef(false);

  const refreshAuthorized = useCallback(async () => {
    setPickerLoading(true);
    setPickerError(undefined);
    try {
      const result = await listAuthorizedRepositories();
      setAuthorizedRepositories(result.repositories);
      setHasInstallation(result.hasInstallation);
      return result;
    } catch (error) {
      setPickerError(friendlyMessage(error));
      throw error;
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const openPicker = useCallback(() => {
    setPickerOpen(true);
    setAddFeedback(undefined);
    void refreshAuthorized();
  }, [refreshAuthorized]);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setAddFeedback(undefined);
  }, []);

  const startInstall = useCallback(async () => {
    setConnecting(true);
    setBanner(null);
    try {
      const { installUrl } = await createInstallUrl();
      window.location.assign(installUrl);
    } catch (error) {
      setBanner({ kind: "error", message: friendlyMessage(error) });
      setConnecting(false);
    }
  }, []);

  const chooseRepositoryAccess = useCallback(async () => {
    setConnecting(true);
    setBanner(null);
    try {
      const result = await refreshAuthorized();
      if (result.hasInstallation) {
        setPickerOpen(true);
      } else {
        const { installUrl } = await createInstallUrl();
        window.location.assign(installUrl);
        return;
      }
    } catch (error) {
      setBanner({ kind: "error", message: friendlyMessage(error) });
    } finally {
      setConnecting(false);
    }
  }, [refreshAuthorized]);

  const addRepository = useCallback(
    async (repository: AuthorizedRepository) => {
      setAddingRepositoryId(repository.githubRepositoryId);
      setAddFeedback(undefined);
      try {
        const result = await apiAddRepository({
          githubRepositoryId: repository.githubRepositoryId,
          installationId: repository.installationId,
        });
        setAddFeedback(
          result.alreadyCatalogued
            ? `${repository.fullName} is already catalogued.`
            : `${repository.fullName} was added as an Unexamined Artifact.`,
        );
        await catalogued.refresh();
      } catch (error) {
        setAddFeedback(friendlyMessage(error));
      } finally {
        setAddingRepositoryId(null);
      }
    },
    [catalogued],
  );

  useEffect(() => {
    if (!session || processedCallback.current) return;
    if (window.location.pathname !== "/github/callback") return;
    processedCallback.current = true;

    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");
    const setupAction = params.get("setup_action");
    const state = params.get("state");

    window.history.replaceState({}, "", "/");

    if (!installationId || !state) {
      setBanner({ kind: "installation_canceled" });
      return;
    }

    setBanner({ kind: "completing" });
    completeInstallation({
      installationId: Number(installationId),
      setupAction: setupAction ?? "",
      state,
    })
      .then((result) => {
        if (result.status === "pending_approval") {
          setBanner({ kind: "pending_approval" });
          return;
        }
        setBanner({ kind: "installed", accountLogin: result.accountLogin ?? "" });
        openPicker();
      })
      .catch((error: unknown) => {
        setBanner({ kind: "error", message: friendlyMessage(error) });
      });
    // openPicker is stable across renders (useCallback with a stable dependency chain).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return {
    cataloguedRepositories: catalogued.repositories,
    cataloguedLoading: catalogued.loading,
    cataloguedError: catalogued.error,
    pickerOpen,
    authorizedRepositories,
    hasInstallation,
    pickerLoading,
    pickerError,
    addingRepositoryId,
    addFeedback,
    banner,
    connecting,
    openPicker,
    closePicker,
    startInstall,
    chooseRepositoryAccess,
    addRepository,
    dismissBanner: () => setBanner(null),
  };
}
