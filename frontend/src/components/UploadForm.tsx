import type { JSX } from "react";

type UploadFormProps = {
  title: string;
  onTitleChange: (v: string) => void;
  recordedDate: string;
  onRecordedDateChange: (v: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  disabled: boolean;
};

export default function UploadForm({
  title,
  onTitleChange,
  recordedDate,
  onRecordedDateChange,
  onFileChange,
  onSubmit,
  disabled,
}: UploadFormProps): JSX.Element {
  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Title"
      />
      <input
        type="date"
        value={recordedDate}
        onChange={(e) => onRecordedDateChange(e.target.value)}
        placeholder="Recorded Date"
      />
      <input
        type="file"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />
      <button type="submit" disabled={disabled}>
        Upload
      </button>
    </form>
  );
}
