import type { Metadata } from "next";
import { getPageMetadata, PAGE_METADATA } from "@/lib/page-metadata";

export function createPageMetadata(pathname: keyof typeof PAGE_METADATA): Metadata {
  return getPageMetadata(pathname);
}

export function PageMetadataLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
