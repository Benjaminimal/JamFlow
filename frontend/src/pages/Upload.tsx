import type { JSX } from "react";

import { UploadForm } from "@/components/upload";
import { useUploadForm } from "@/hooks/useUploadForm";

// TODO: remove me and port test to UploadDialogContainer
export function Upload(): JSX.Element {
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
    <UploadForm
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
