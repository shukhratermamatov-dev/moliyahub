import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OFFERS, type FinancingOffer } from "./data/banks";
import { SEED_PROJECTS, type Project } from "./data/projects";
import { uid } from "./utils";

export type Application = {
  id: string;
  projectId: string;
  name: string;
  message: string;
  createdAt: string;
};

type HubState = {
  extraProjects: Project[];
  applications: Application[];
  customOffers: FinancingOffer[];
  hiddenOfferIds: string[];
  addProject: (item: Omit<Project, "id">) => string;
  removeProject: (id: string) => void;
  addApplication: (item: Omit<Application, "id" | "createdAt">) => void;
  addCustomOffer: (item: Omit<FinancingOffer, "id">) => string;
  removeCustomOffer: (id: string) => void;
  toggleOfferVisibility: (id: string) => void;
};

export const useHubStore = create<HubState>()(
  persist(
    (set) => ({
      extraProjects: [],
      applications: [],
      customOffers: [],
      hiddenOfferIds: [],
      addProject: (item) => {
        const id = uid();
        set((s) => ({ extraProjects: [{ ...item, id }, ...s.extraProjects] }));
        return id;
      },
      removeProject: (id) => {
        set((s) => ({ extraProjects: s.extraProjects.filter((p) => p.id !== id) }));
      },
      addApplication: (item) => {
        set((s) => ({
          applications: [
            { ...item, id: uid(), createdAt: new Date().toISOString() },
            ...s.applications,
          ],
        }));
      },
      addCustomOffer: (item) => {
        const id = uid();
        set((s) => ({ customOffers: [{ ...item, id }, ...s.customOffers] }));
        return id;
      },
      removeCustomOffer: (id) => {
        set((s) => ({ customOffers: s.customOffers.filter((o) => o.id !== id) }));
      },
      toggleOfferVisibility: (id) => {
        set((s) => ({
          hiddenOfferIds: s.hiddenOfferIds.includes(id)
            ? s.hiddenOfferIds.filter((x) => x !== id)
            : [...s.hiddenOfferIds, id],
        }));
      },
    }),
    { name: "moliyahub-v1" },
  ),
);

export function useAllProjects(): Project[] {
  const extra = useHubStore((s) => s.extraProjects);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? [...extra, ...SEED_PROJECTS] : SEED_PROJECTS;
}

export function useVisibleOffers(): FinancingOffer[] {
  const custom = useHubStore((s) => s.customOffers);
  const hidden = useHubStore((s) => s.hiddenOfferIds);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return OFFERS;
  return [...OFFERS.filter((o) => !hidden.includes(o.id)), ...custom];
}
