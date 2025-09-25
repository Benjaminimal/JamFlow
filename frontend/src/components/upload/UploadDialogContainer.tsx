import { type JSX, useRef, useState } from "react";
import { toast } from "sonner";

import { getUserFriendlyErrorMessage } from "@/api/errorHandler";
import { UploadDialogForm } from "@/components/upload";
import { useUploadForm } from "@/hooks/useUploadForm";

export function UploadDialogContainer(): JSX.Element {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    title,
    setTitle,
    recordedDate,
    setRecordedDate,
    setFile,
    formErrors,
    isSubmitting,
    validate,
    reset,
    submit,
  } = useUploadForm();

  const onReset = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    reset();
  };

  const onSubmit = async (): Promise<void> => {
    if (!validate()) return;

    const loadingToastId = toast.loading("Uploading track...");
    const { success, error } = await submit();
    if (success) {
      toast.success("Track uploaded successfully");
      setOpen(false);
    } else if (error) {
      toast.error(getUserFriendlyErrorMessage(error));
    }
    toast.dismiss(loadingToastId);
  };

  return (
    <UploadDialogForm
      open={open}
      onOpenChange={setOpen}
      title={title}
      onTitleChange={setTitle}
      recordedDate={recordedDate}
      onRecordedDateChange={setRecordedDate}
      onFileChange={setFile}
      fileInputRef={fileInputRef}
      formErrors={formErrors}
      onReset={onReset}
      onSubmit={onSubmit}
      disabled={isSubmitting}
    />
  );
}
