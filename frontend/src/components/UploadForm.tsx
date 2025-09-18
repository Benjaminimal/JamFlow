import { type JSX, useRef } from "react";

import type { ValidationErrorDetails } from "@/errors";
import { Button } from "@/ui-lib";
import { Input } from "@/ui-lib/input";
import { Label } from "@/ui-lib/label";

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

// TODO: rework errors
// TODO: add a date picker
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
      <div className="my-4 flex flex-col gap-4">
        {renderErrors(formErrors.nonField)}
        <div className="flex flex-col gap-1">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          {renderErrors(formErrors.title)}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="recordedDate">Recorded on</Label>
          <Input
            id="recordedDate"
            type="date"
            value={recordedDate || ""}
            onChange={(e) => onRecordedDateChange(e.target.value)}
            placeholder="Recorded Date"
          />
          {renderErrors(formErrors.recordedDate)}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="file">File</Label>
          <Input
            id="file"
            type="file"
            ref={fileInputRef}
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          />
          {renderErrors(formErrors.file)}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={disabled} variant="default">
            Upload
          </Button>
        </div>
      </div>
    </form>
  );
}

function renderErrors(errors: string[] | undefined): JSX.Element | null {
  if (!errors?.length) {
    return null;
  }
  return (
    // TODO: add aria-describedby to form fields
    <div role="alert">
      {errors.map((message, idx) => (
        <p key={idx} className="text-destructive text-sm">
          {message}
        </p>
      ))}
    </div>
  );
}
