"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createPost } from "@/lib/cms/actions/posts";
import { NETWORK_ERROR } from "./Field";
import { buttonPrimary } from "./ui";

/** Creates an empty draft and opens it in the editor. */
export function NewPostButton({ label = "New post" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const create = () =>
    startTransition(async () => {
      setError(null);
      try {
        const result = await createPost();
        if (result.ok) router.push(`/admin/blog/${result.data.id}`);
        else setError(result.error);
      } catch {
        setError(NETWORK_ERROR);
      }
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className={buttonPrimary} onClick={create} disabled={pending}>
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <Plus aria-hidden="true" className="size-4" />
        )}
        {pending ? "Creating…" : label}
      </button>
      <p role="alert" className="text-sm text-red-700 empty:hidden">
        {error}
      </p>
    </div>
  );
}
