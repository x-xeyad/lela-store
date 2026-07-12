import { supabase } from "./supabaseClient";

export const storageService = {
  upload: async (file, folder = "products") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from("lela-media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
      });
    
    if (error) {
      console.error("Supabase Storage error:", error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    
    const { data: publicUrlData } = supabase.storage
      .from("lela-media")
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  }
};
