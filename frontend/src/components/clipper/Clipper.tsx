import { Save, X } from "lucide-react";
import { type JSX } from "react";
import { toast } from "sonner";

import { ClipperControls } from "@/components/clipper";
import { ProgressBarCompact } from "@/components/playback";
import { IconButton } from "@/components/primitives";
import { FormField } from "@/components/ui";
import { usePlaybackContext } from "@/contexts/playback";
import { type UseClipperResult } from "@/hooks/useClipper";
import { getErrorMessage } from "@/lib/errorUtils";
import { Input } from "@/ui-lib";

type ClipperProps = {
  clipper: UseClipperResult;
};

export function Clipper({ clipper }: ClipperProps): JSX.Element {
  const {
    state: { playable },
  } = usePlaybackContext();

  const {
    state: { title, validationErrors },
    actions: { setTitle, validate, submitClip },
    derived: { isSubmitting },
  } = clipper;

  const onSubmit = async (): Promise<void> => {
    if (!validate()) return;

    const loadingToastId = toast.loading("Clipping track...");
    const { success, error } = await submitClip();
    if (success) {
      toast.success("Clip saved!");
    } else if (error) {
      toast.error(getErrorMessage(error));
    }
    toast.dismiss(loadingToastId);
  };

  return (
    <div data-testid="clipper">
      <FormField
        labelProps={{ className: "text-md" }}
        id="title"
        label="Clip Title"
        errors={validationErrors.title}
      >
        <div className="flex flex-row gap-2">
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby={
              validationErrors.title ? "title-errors" : undefined
            }
          />
        </div>
      </FormField>
      <IconButton
        className="absolute top-0 right-1"
        icon={X}
        onClick={clipper.actions.cancelClipping}
      />
      <div className="my-4">
        <ClipperControls clipper={clipper} />
      </div>
      <div className="mb-2 flex flex-row items-center space-x-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {playable?.title || ""}
          </div>
          <ProgressBarCompact />
        </div>
        <SaveButton onClick={onSubmit} disabled={isSubmitting} />
      </div>
    </div>
  );
}

type SaveButtonProps = {
  onClick: () => Promise<void>;
  disabled: boolean;
};

function SaveButton({ onClick, disabled }: SaveButtonProps): JSX.Element {
  return (
    <IconButton
      icon={Save}
      onClick={onClick}
      disabled={disabled}
      size="icon-lg"
    />
  );
}
