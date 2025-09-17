import { type JSX, useRef } from "react";

import type { ValidationErrorDetails } from "@/errors";

type UploadFormProps = {
  title: string;
  onTitleChange: (v: string) => void;
  recordedDate: string | null;
  onRecordedDateChange: (v: string | null) => void;
  onFileChange: (file: File | null) => void;
  formErrors: ValidationErrorDetails;
  onSubmit: () => Promise<{ success: boolean }>;
  disabled: boolean;
};

export function UploadForm({
  title,
  onTitleChange,
  recordedDate,
  onRecordedDateChange,
  onFileChange,
  formErrors,
  onSubmit,
  disabled,
}: UploadFormProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      data-testid="upload-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const { success } = await onSubmit();
        if (success && fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }}
    >
      {renderErrors(formErrors.nonField)}
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        {renderErrors(formErrors.title)}
      </div>
      <div>
        <label htmlFor="recordedDate">Recorded on</label>
        <input
          id="recordedDate"
          type="date"
          value={recordedDate || ""}
          onChange={(e) => onRecordedDateChange(e.target.value)}
          placeholder="Recorded Date"
        />
        {renderErrors(formErrors.recordedDate)}
      </div>
      <div>
        <label htmlFor="file">File</label>
        <input
          id="file"
          type="file"
          ref={fileInputRef}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        {renderErrors(formErrors.file)}
      </div>
      <button type="submit" disabled={disabled}>
        Upload
      </button>
    </form>
  );
}

function renderErrors(errors: string[] | undefined): JSX.Element | null {
  if (!errors?.length) {
    return null;
  }
  return (
    <div role="alert">
      {errors.map((message, idx) => (
        <p key={idx}>{message}</p>
      ))}
    </div>
  );
}
