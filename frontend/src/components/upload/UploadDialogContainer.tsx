import type { JSX } from "react";

import { UploadDialogForm } from "@/components/upload";
import { useUploadForm } from "@/hooks/useUploadForm";

export function UploadDialogContainer(): JSX.Element {
  const {
    title,
    setTitle,
    recordedDate,
    setRecordedDate,
    setFile,
    formErrors,
    isSubmitting,
    handleSubmit,
  } = useUploadForm();

  return (
    <UploadDialogForm
      title={title}
      onTitleChange={setTitle}
      recordedDate={recordedDate}
      onRecordedDateChange={setRecordedDate}
      onFileChange={setFile}
      formErrors={formErrors}
      onSubmit={handleSubmit}
      disabled={isSubmitting}
    />
  );
}
