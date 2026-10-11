"use client";

import { useMemo } from "react";
import { SavedPageEditor, type SavedPageEditorProps } from "@/components/studio/saved-page-editor";
import { saveVisualScreen, reviewVisualScreen, publishVisualScreen, restoreVisualScreen, previewVisualScreen, chooseVisualScreenSample } from "../actions";

type Props = Omit<SavedPageEditorProps, "callbacks"> & { selectedBusiness?: string };

/** Serializable presentation choices come from the server route. Every callback
 * independently refreshes authority; bound identifiers are never access grants. */
export function BusinessScreenEditor({ selectedBusiness, ...props }: Props) {
  const definitionId = props.draft.id;
  const initialPayload = props.draft.payload;
  const callbacks = useMemo<SavedPageEditorProps["callbacks"]>(() => ({
    save: input => saveVisualScreen(selectedBusiness, { definitionId, ...input }),
    review: input => reviewVisualScreen(selectedBusiness, { definitionId, ...input }),
    publish: input => publishVisualScreen(selectedBusiness, { definitionId, ...input }),
    restore: input => restoreVisualScreen(selectedBusiness, { definitionId, ...input }),
    preview: input => previewVisualScreen(selectedBusiness, { payload: input.payload, formFactor: input.formFactor,
      request: input.recordId ? { kind: "record", recordId: input.recordId } : { kind: "list" } }),
    chooseSample: () => chooseVisualScreenSample(selectedBusiness, initialPayload),
  }), [selectedBusiness, definitionId, initialPayload]);
  return <SavedPageEditor {...props} callbacks={callbacks} />;
}
