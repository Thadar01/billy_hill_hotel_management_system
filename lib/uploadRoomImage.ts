// lib/uploadRoomImage.ts
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

export interface UploadResult {
  files: string[];
  fields: Record<string, string>;
}

export const uploadRoomImage = async (req: NextRequest): Promise<UploadResult> => {
  const uploadDir = path.join(process.cwd(), "public/uploads/rooms");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const formData = await req.formData();
    
    const files: string[] = [];
    const fields: Record<string, string> = {};

    // Process all entries
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Handle file upload
        if (key === 'images') {
          const fileName = `${Date.now()}_${value.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const filePath = path.join(uploadDir, fileName);
          
          // Convert File to Buffer and save
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);
          fs.writeFileSync(filePath, buffer);
          
          // Store relative path for database
          files.push(`/uploads/rooms/${fileName}`);
        }
      } else {
        // Handle text fields - ensure we're getting strings
        fields[key] = String(value);
      }
    }

    return { files, fields };
  } catch (error) {
    console.error("Error in uploadRoomImage:", error);
    throw new Error(`Failed to process form data: ${error instanceof Error ? error.message : String(error)}`);
  }
};