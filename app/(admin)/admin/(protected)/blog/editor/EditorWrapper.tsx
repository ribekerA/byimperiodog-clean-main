"use client";

import ModernEditorWrapper from "@/components/blog/ModernEditorWrapper";
import type { Post } from "@/lib/db/types";

interface EditorWrapperProps {
  post: Post | null;
}

export default function EditorWrapper({ post }: EditorWrapperProps) {
  return <ModernEditorWrapper post={post} />;
}
