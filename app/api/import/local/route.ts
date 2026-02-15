import { NextRequest, NextResponse } from "next/server";
import { detectProjectLanguage } from "@/lib/languageDetection";

/**
 * Local Folder Import API Route
 * 
 * Imports a local folder (uploaded as files) as a project.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Limits
    const maxFileSize = 5 * 1024 * 1024; // 5MB per file
    const maxFiles = 500;
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total

    const ignoredDirs = [".git", "node_modules", "dist", "build", ".next", ".vscode", ".idea"];
    const processedFiles: Array<{ name: string; content: string }> = [];
    let totalSize = 0;
    let folderName = "";

    for (const file of files) {
      // Check file count limit
      if (processedFiles.length >= maxFiles) {
        return NextResponse.json(
          { error: `Too many files. Maximum ${maxFiles} files allowed.` },
          { status: 400 }
        );
      }

      // Get file path from webkitRelativePath or name
      const filePath = (file as any).webkitRelativePath || file.name;
      
      // Extract folder name from first file
      if (!folderName && filePath.includes("/")) {
        folderName = filePath.split("/")[0];
      }

      // Check if file should be ignored
      const pathParts = filePath.split("/");
      const shouldIgnore = pathParts.some(part => 
        ignoredDirs.some(ignored => part === ignored || part.startsWith(ignored))
      );
      if (shouldIgnore) continue;

      // Check file size
      if (file.size > maxFileSize) {
        continue; // Skip large files
      }
      totalSize += file.size;

      // Check total size limit
      if (totalSize > maxTotalSize) {
        return NextResponse.json(
          { error: `Total size exceeds limit. Maximum ${(maxTotalSize / 1024 / 1024).toFixed(0)}MB allowed.` },
          { status: 400 }
        );
      }

      // Read file content as text
      try {
        const content = await file.text();
        // Remove folder name prefix from path
        const fileName = folderName 
          ? filePath.replace(new RegExp(`^${folderName}/`), "")
          : filePath;
        
        processedFiles.push({
          name: fileName,
          content,
        });
      } catch (error) {
        // Skip binary files or files that can't be read as text
        console.warn(`Skipping file ${filePath}:`, error);
        continue;
      }
    }

    if (processedFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid files found. Make sure the folder contains code files." },
        { status: 400 }
      );
    }

    // Use folder name or default
    const projectName = folderName || "Imported Project";

    // Detect project language from file extensions
    const detectedLanguage = detectProjectLanguage(processedFiles);

    // Return project data (client will create the project)
    return NextResponse.json({
      success: true,
      project: {
        name: projectName,
        description: "Imported from local folder",
        language: detectedLanguage,
        files: processedFiles,
      },
    });
  } catch (error) {
    console.error("Local import error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during import. Please try again." },
      { status: 500 }
    );
  }
}

