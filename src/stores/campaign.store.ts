import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CampaignState {
  activeCampaignId: string | null
  setActiveCampaignId: (id: string | null) => void
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set) => ({
      activeCampaignId: null,
      setActiveCampaignId: (id) => set({ activeCampaignId: id }),
    }),
    { name: 'campaign' },
  ),
)
