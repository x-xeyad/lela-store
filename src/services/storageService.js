import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const storageService = {
  upload: async (file, folder = "products") => {
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from("lela-media")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
          });
        
        if (error) {
          console.error("Supabase Storage error, using base64 fallback:", error);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("lela-media")
            .getPublicUrl(fileName);
          return publicUrlData.publicUrl;
        }
      } catch (err) {
        console.error("Supabase Storage exception, using base64 fallback:", err);
      }
    }

    // Local Fallback: Convert file to Base64 data URL for instant previews
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
