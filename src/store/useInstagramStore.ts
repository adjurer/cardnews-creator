import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InstagramAccount {
  id: string;
  user_id: string;
  ig_user_id: string;
  username: string;
  profile_picture_url: string | null;
  access_token: string;
  is_default: boolean;
  created_at: string;
}

interface InstagramState {
  accounts: InstagramAccount[];
  activeAccountId: string | null;
  loading: boolean;
  fetchAccounts: () => Promise<void>;
  addAccount: (igUserId: string, username: string, accessToken: string, profilePictureUrl?: string) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  setDefaultAccount: (id: string) => Promise<void>;
  setActiveAccount: (id: string | null) => void;
  getActiveAccount: () => InstagramAccount | null;
}

export const useInstagramStore = create<InstagramState>((set, get) => ({
  accounts: [],
  activeAccountId: null,
  loading: false,

  fetchAccounts: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("instagram_accounts" as any)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch instagram accounts:", error);
      set({ loading: false });
      return;
    }

    const accounts = (data || []) as unknown as InstagramAccount[];
    const defaultAccount = accounts.find(a => a.is_default) || accounts[0];
    set({
      accounts,
      activeAccountId: get().activeAccountId || defaultAccount?.id || null,
      loading: false,
    });
  },

  addAccount: async (igUserId, username, accessToken, profilePictureUrl) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    // Verify token by fetching profile from Instagram API
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${igUserId}?fields=id,username,profile_picture_url&access_token=${accessToken}`);
      const profile = await res.json();
      if (profile.error) {
        toast.error(`Instagram API 오류: ${profile.error.message}`);
        return;
      }
      // Use API data if available
      username = profile.username || username;
      profilePictureUrl = profile.profile_picture_url || profilePictureUrl;
    } catch {
      // Continue with provided data if API call fails
    }

    const isFirst = get().accounts.length === 0;

    const { data, error } = await supabase
      .from("instagram_accounts" as any)
      .insert({
        user_id: userData.user.id,
        ig_user_id: igUserId,
        username,
        access_token: accessToken,
        profile_picture_url: profilePictureUrl || null,
        is_default: isFirst,
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("이미 추가된 계정입니다");
      } else {
        toast.error(`계정 추가 실패: ${error.message}`);
      }
      return;
    }

    const newAccount = data as unknown as InstagramAccount;
    set(s => ({
      accounts: [...s.accounts, newAccount],
      activeAccountId: s.activeAccountId || newAccount.id,
    }));
    toast.success(`@${username} 계정이 추가되었습니다`);
  },

  removeAccount: async (id) => {
    const { error } = await supabase
      .from("instagram_accounts" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("계정 삭제 실패");
      return;
    }

    set(s => {
      const accounts = s.accounts.filter(a => a.id !== id);
      const activeAccountId = s.activeAccountId === id
        ? (accounts.find(a => a.is_default)?.id || accounts[0]?.id || null)
        : s.activeAccountId;
      return { accounts, activeAccountId };
    });
    toast.success("계정이 삭제되었습니다");
  },

  setDefaultAccount: async (id) => {
    const { accounts } = get();
    // Unset all defaults first
    for (const acc of accounts) {
      if (acc.is_default) {
        await supabase
          .from("instagram_accounts" as any)
          .update({ is_default: false } as any)
          .eq("id", acc.id);
      }
    }
    // Set new default
    await supabase
      .from("instagram_accounts" as any)
      .update({ is_default: true } as any)
      .eq("id", id);

    set(s => ({
      accounts: s.accounts.map(a => ({ ...a, is_default: a.id === id })),
      activeAccountId: id,
    }));
    toast.success("기본 계정이 변경되었습니다");
  },

  setActiveAccount: (id) => set({ activeAccountId: id }),

  getActiveAccount: () => {
    const { accounts, activeAccountId } = get();
    return accounts.find(a => a.id === activeAccountId) || accounts.find(a => a.is_default) || accounts[0] || null;
  },
}));
