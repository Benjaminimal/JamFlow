import { type ComponentProps, type JSX, useRef } from "react";

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
        {formErrors.nonField && formErrors.nonField.length > 0 && (
          <div role="alert" id="form-errors">
            {formErrors.nonField.map((message, idx) => (
              <ErrorDisplay key={idx} message={message} />
            ))}
          </div>
        )}

        <FormField id="title" label="Title" errors={formErrors.title}>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            aria-describedby={formErrors.title ? "title-errors" : undefined}
          />
        </FormField>
        <FormField
          id="recordedDate"
          label="Recorded on"
          errors={formErrors.recordedDate}
        >
          <Input
            id="recordedDate"
            type="date"
            value={recordedDate || ""}
            onChange={(e) => onRecordedDateChange(e.target.value)}
            placeholder="Recorded Date"
            aria-describedby={
              formErrors.recordedDate ? "recordedDate-errors" : undefined
            }
          />
        </FormField>
        <FormField id="file" label="Track" errors={formErrors.file}>
          <Input
            id="file"
            type="file"
            ref={fileInputRef}
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            aria-describedby={formErrors.file ? "file-errors" : undefined}
          />
        </FormField>
        <div className="flex justify-end">
          <Button type="submit" disabled={disabled} variant="default">
            Upload
          </Button>
        </div>
      </div>
    </form>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  children: JSX.Element;
  errors?: string[];
};

function FormField({
  id,
  label,
  children,
  errors,
}: FormFieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {errors && errors.length > 0 && (
        <div id={`${id}-errors`}>
          {errors.map((message, idx) => (
            <ErrorDisplay key={idx} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}

type ErrorDisplayProps = Omit<ComponentProps<"p">, "className"> & {
  message: string;
};

function ErrorDisplay({ message, ...props }: ErrorDisplayProps): JSX.Element {
  return (
    <p className="text-destructive mt-1 text-sm" {...props}>
      {message}
    </p>
  );
}
