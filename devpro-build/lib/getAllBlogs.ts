import glob from "fast-glob";
import { readFile } from "fs/promises";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import readingTime from "reading-time";
import { serialize } from "next-mdx-remote/serialize";

async function importBlog(blogFileNames: string) {
  const isIndex = /\/index\.mdx$/.test(blogFileNames);
  const relativeDir = isIndex
    ? path.dirname(blogFileNames)
    : blogFileNames.replace(/\.mdx$/, "");
  const absoluteDir = path.join(process.cwd(), "content/blogs", relativeDir);
  const metadataPath = path.join(absoluteDir, "metadata.json");
  let meta: any = {};
  try {
    const raw = await readFile(metadataPath, "utf8");
    meta = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to load metadata.json for blog '${relativeDir}': ${
        (err as Error).message
      }`
    );
  }

  return {
    slug: blogFileNames.replace(/(\/index)?\.mdx$/, ""),
    ...meta,
  };
}

export async function getAllBlogs() {
  let blogFileNames = await glob(["*.mdx", "*/index.mdx"], {
    cwd: path.join(process.cwd(), "content/blogs"),
  });

  let blogs = await Promise.all(blogFileNames.map(importBlog));

  return blogs.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
}

const root = process.cwd();

export async function getFiles(type: any) {
  return fs.readdirSync(path.join(root, "data", type));
}

export async function getFileBySlug(type: any, slug: any) {
  if (type !== "blogs") {
    throw new Error(`Unsupported type: ${type}`);
  }

  const absoluteDir = path.join(root, "content", "blogs", slug);
  const mdxPath = path.join(absoluteDir, "index.mdx");
  const metadataPath = path.join(absoluteDir, "metadata.json");

  if (!fs.existsSync(mdxPath)) {
    throw new Error(`MDX not found for slug '${slug}' at ${mdxPath}`);
  }

  const source = fs.readFileSync(mdxPath, "utf8");
  const { content } = matter(source);
  const mdxSource = await serialize(content);

  let meta: any = {};
  if (fs.existsSync(metadataPath)) {
    try {
      const raw = await readFile(metadataPath, "utf8");
      meta = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `Invalid metadata.json for slug '${slug}': ${(err as Error).message}`
      );
    }
  }

  return {
    mdxSource,
    frontMatter: {
      ...meta,
      slug,
      wordCount: content.split(/\s+/g).length,
      readingTime: readingTime(content),
    },
  };
}

export async function getAllFilesFrontMatter(type: any) {
  console.log(
    'fs.readdirSync(path.join(root, "data", type));',
    fs.readdirSync(path.join(root, "data", type))
  );
  const files = fs.readdirSync(path.join(root, "data", type));

  return files.reduce((allPosts: any, postSlug: any) => {
    const source = fs.readFileSync(
      path.join(root, "data", type, postSlug),
      "utf8"
    );
    const { data } = matter(source);

    return [
      {
        ...data,
        slug: postSlug.replace(".mdx", ""),
      },
      ...allPosts,
    ];
  }, []);
}
