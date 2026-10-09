import { notFound } from "next/navigation";

import { PAGE_SECTION } from "@/lib/constants/second-brain";
import { getCurrentUser } from "@/services/auth.service";
import { getPage } from "@/services/pages.service";
import { PageEditor, type EditorBlock } from "./page-editor";
import { PageHeaderActions } from "./page-header-actions";

export default async function CustomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const result = await getPage(user!.id, id);
  if (!result) notFound();

  const { page, blocks } = result;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold text-foreground">
            {page.icon && <span>{page.icon}</span>}
            {page.title}
          </h1>
          <p className="text-sm text-muted-foreground">Sezione: {PAGE_SECTION[page.section]}</p>
        </div>
        <PageHeaderActions page={{ id: page.id, title: page.title, icon: page.icon, section: page.section }} />
      </div>

      <PageEditor
        pageId={page.id}
        initialBlocks={blocks.map((b) => ({ id: b.id, type: b.type, content: b.content })) as EditorBlock[]}
      />
    </div>
  );
}
