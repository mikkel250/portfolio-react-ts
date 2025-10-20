"use client";
import { MDXRemote } from "next-mdx-remote";
import MDXComponents from "@/components/MDXComponents";

export function RenderMDX({ mdxSource }: { mdxSource: any }) {
  return <MDXRemote components={MDXComponents} {...mdxSource} />;
}
