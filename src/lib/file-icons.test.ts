import { File, FileCode, FileImage, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { describe, expect, it } from "vitest";

import { getFileIcon } from "@/lib/file-icons";
import { getAllowedExtensions } from "@/lib/file-upload";

describe("getFileIcon", () => {
  it("picks the icon for the extension", () => {
    expect(getFileIcon("notes.md").icon).toBe(FileText);
    expect(getFileIcon("package.json").icon).toBe(FileJson);
    expect(getFileIcon("config.yaml").icon).toBe(FileCode);
    expect(getFileIcon("report.csv").icon).toBe(FileSpreadsheet);
    expect(getFileIcon("diagram.png").icon).toBe(FileImage);
  });

  it("ignores case and earlier dots in the name", () => {
    expect(getFileIcon("Diagram.PNG").icon).toBe(FileImage);
    expect(getFileIcon("v1.2.notes.md").icon).toBe(FileText);
  });

  it("falls back to the plain file icon", () => {
    expect(getFileIcon(null).icon).toBe(File);
    expect(getFileIcon("").icon).toBe(File);
    expect(getFileIcon("LICENSE").icon).toBe(File);
    expect(getFileIcon("archive.tar.gz").icon).toBe(File);
  });

  it("covers every extension an upload can have", () => {
    for (const typeName of ["file", "image"] as const) {
      for (const extension of getAllowedExtensions(typeName)) {
        expect(getFileIcon(`upload.${extension}`).icon).not.toBe(File);
      }
    }
  });
});
