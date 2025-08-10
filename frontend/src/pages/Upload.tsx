import type { JSX } from "react";

import UploadForm from "@/components/UploadForm";
import { useUploadForm } from "@/hooks/useUploadForm";

export default function Upload(): JSX.Element {
  const {
    title,
    recordedDate,
    setTitle,
    setRecordedDate,
    setFile,
    isSubmitting,
    handleSubmit,
    formErrors,
  } = useUploadForm();

  return (
    <UploadForm
      title={title}
      recordedDate={recordedDate}
      onTitleChange={setTitle}
      onRecordedDateChange={setRecordedDate}
      onFileChange={setFile}
      disabled={isSubmitting}
      formErrors={formErrors}
      onSubmit={handleSubmit}
    ></UploadForm>
  );
}
