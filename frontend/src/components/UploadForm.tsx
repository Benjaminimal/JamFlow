import type { JSX } from "react";

import type { ValidationErrorDetails } from "@/errors";

type UploadFormProps = {
  title: string;
  onTitleChange: (v: string) => void;
  recordedDate: string;
  onRecordedDateChange: (v: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => Promise<void>;
  formErrors: ValidationErrorDetails;
  disabled: boolean;
};

export default function UploadForm({
  title,
  onTitleChange,
  recordedDate,
  onRecordedDateChange,
  onFileChange,
  onSubmit,
  formErrors,
  disabled,
}: UploadFormProps): JSX.Element {
  const titleErrors = formErrors.title ?? [];
  const recordedDateErrors = formErrors.recordedDate ?? [];
  const fileErrors = formErrors.file ?? [];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Title"
        />
        {titleErrors.map((message, idx) => (
          <p key={idx}>{message}</p>
        ))}
      </div>
      <div>
        <input
          type="date"
          value={recordedDate}
          onChange={(e) => onRecordedDateChange(e.target.value)}
          placeholder="Recorded Date"
        />
        {recordedDateErrors.map((message, idx) => (
          <p key={idx}>{message}</p>
        ))}
      </div>
      <div>
        <input
          type="file"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        {fileErrors.map((message, idx) => (
          <p key={idx}>{message}</p>
        ))}
      </div>
      <button type="submit" disabled={disabled}>
        Upload
      </button>
    </form>
  );
}
