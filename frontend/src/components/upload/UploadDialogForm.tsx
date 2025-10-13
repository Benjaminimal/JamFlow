import { Plus } from "lucide-react";
import { type ComponentProps, type JSX, type RefObject } from "react";

import { IconButton } from "@/components/primitives";
import { DatePicker } from "@/components/ui/DatePicker";
import type { ValidationErrorDetails } from "@/errors";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@/ui-lib";

type UploadDialogFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (v: string) => void;
  recordedDate: string | null;
  onRecordedDateChange: (v: string | null) => void;
  onFileChange: (file: File | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  validationErrors: ValidationErrorDetails;
  onReset: () => void;
  onSubmit: () => Promise<void>;
  disabled: boolean;
};

// TODO: make the DiaglogTrigger button look nicer
export function UploadDialogForm({
  open,
  onOpenChange,
  title,
  onTitleChange,
  recordedDate,
  onRecordedDateChange,
  onFileChange,
  fileInputRef,
  validationErrors,
  onReset,
  onSubmit,
  disabled,
}: UploadDialogFormProps): JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          onReset();
        }
      }}
    >
      <DialogTrigger asChild>
        <IconButton icon={Plus} aria-label="Upload" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form
          data-testid="upload-form"
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Upload Track</DialogTitle>
            <DialogDescription>
              Upload an audio file for playback and clipping.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex flex-col gap-4">
            {validationErrors.nonField &&
              validationErrors.nonField.length > 0 && (
                <div role="alert" id="form-errors">
                  {validationErrors.nonField.map((message, idx) => (
                    <ErrorDisplay key={idx} message={message} />
                  ))}
                </div>
              )}

            <FormField id="title" label="Title" errors={validationErrors.title}>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                aria-describedby={
                  validationErrors.title ? "title-errors" : undefined
                }
              />
            </FormField>
            <FormField
              id="recordedDate"
              label="Recorded on"
              errors={validationErrors.recordedDate}
            >
              <DatePicker
                value={recordedDate}
                onChange={onRecordedDateChange}
                id="recordedDate"
                aria-describedby={
                  validationErrors.recordedDate
                    ? "recordedDate-errors"
                    : undefined
                }
              />
            </FormField>
            <FormField id="file" label="Track" errors={validationErrors.file}>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                aria-describedby={
                  validationErrors.file ? "file-errors" : undefined
                }
              />
            </FormField>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={disabled} variant="default">
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
