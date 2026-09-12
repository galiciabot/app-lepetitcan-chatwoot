import React, { createContext, useContext, useState } from "react";

export type MetaChannelsConfig = {
  whatsapp?: { phoneNumberId: string; wabaId: string; accessToken: string };
  facebook?: { pageId: string; pageAccessToken: string };
  instagram?: { igBusinessId: string; pageAccessToken: string };
};

interface MetaChannelsContextType {
  metaChannelsConfig: MetaChannelsConfig;
  saveMetaChannelsConfig: (config: MetaChannelsConfig) => Promise<void>;
  loading: boolean;
}

const MetaChannelsContext = createContext<MetaChannelsContextType | undefined>(undefined);

export function MetaChannelsProvider({ children }: { children: React.ReactNode }) {
  const [metaChannelsConfig, setMetaChannelsConfig] = useState<MetaChannelsConfig>(() => {
    try {
      const saved = localStorage.getItem("meta_channels_config");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loading] = useState(false);

  const saveMetaChannelsConfig = async (newConfig: MetaChannelsConfig) => {
    setMetaChannelsConfig(newConfig);
    localStorage.setItem("meta_channels_config", JSON.stringify(newConfig));
  };

  return (
    <MetaChannelsContext.Provider value={{ metaChannelsConfig, saveMetaChannelsConfig, loading }}>
      {children}
    </MetaChannelsContext.Provider>
  );
}

export function useMetaChannels() {
  const context = useContext(MetaChannelsContext);
  if (context === undefined) {
    throw new Error("useMetaChannels must be used within a MetaChannelsProvider");
  }
  return context;
}
