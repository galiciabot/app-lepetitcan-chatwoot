import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const docRef = doc(db, "configs", "meta_channels");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudConfig = docSnap.data() as MetaChannelsConfig;
          setMetaChannelsConfig(cloudConfig);
          localStorage.setItem("meta_channels_config", JSON.stringify(cloudConfig));
        }
      } catch (err) {
        console.warn("Error loading meta channels config from Firestore, using offline cached copy:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const saveMetaChannelsConfig = async (newConfig: MetaChannelsConfig) => {
    setMetaChannelsConfig(newConfig);
    localStorage.setItem("meta_channels_config", JSON.stringify(newConfig));
    try {
      const docRef = doc(db, "configs", "meta_channels");
      await setDoc(docRef, newConfig);
    } catch (err) {
      console.error("Error saving meta channels config to Firestore:", err);
    }
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
