export interface CampaignMember {
  id: string
  campaign_id: string
  user_id: string
  joined_at: string
}

export interface CampaignMemberWithProfile extends CampaignMember {
  profiles: {
    display_name: string | null
    email: string
  } | null
}
