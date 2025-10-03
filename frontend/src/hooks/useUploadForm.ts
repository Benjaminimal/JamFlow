import { useState } from "react";

import { uploadTrack } from "@/api/tracks";
import { ValidationError, type ValidationErrorDetails } from "@/errors";
import type { SubmitResult } from "@/types";

export type UseUploadFormResult = {
  title: string;
  setTitle: (v: string) => void;
  recordedDate: string | null;
  setRecordedDate: (v: string | null) => void;
  file: File | null;
  setFile: (v: File | null) => void;
  validationErrors: ValidationErrorDetails;
  validate: () => boolean;
  reset: () => void;
  submit: () => Promise<SubmitResult>;
  isSubmitting: boolean;
};

export function useUploadForm(): UseUploadFormResult {
  const [file, _setFile] = useState<File | null>(null);
  const [title, _setTitle] = useState("");
  const [recordedDate, _setRecordedDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] =
    useState<ValidationErrorDetails>({});

  const setFile = setField("file", _setFile, setValidationErrors);
  const setTitle = setField("title", _setTitle, setValidationErrors);
  const setRecordedDate = setField(
    "recordedDate",
    _setRecordedDate,
    setValidationErrors,
  );

  const reset = (): void => {
    _setFile(null);
    _setTitle("");
    _setRecordedDate(null);
    setValidationErrors({});
  };

  const validate = (): boolean => {
    if (isSubmitting) return true;

    const _validationErrors = getValidationErrors(title, file);
    if (_validationErrors) {
      setValidationErrors(_validationErrors);
      return false;
    }

    setValidationErrors({});
    return true;
  };

  const submit = async (): Promise<SubmitResult> => {
    if (isSubmitting) return { success: false };

    setIsSubmitting(true);

    try {
      await uploadTrack({
        title,
        recordedDate: recordedDate || null,
        file: file!,
      });
      reset();
      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        setValidationErrors(error.details);
        return { success: false };
      }
      return { success: false, error: error };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    recordedDate,
    setRecordedDate,
    file,
    setFile,
    validationErrors,
    validate,
    reset,
    submit,
    isSubmitting,
  };
}

function getValidationErrors(
  title: string,
  file: File | null,
): ValidationErrorDetails | null {
  const validationErrors: ValidationErrorDetails = {};
  if (!file) {
    validationErrors.file = ["File is required"];
  }

  // TODO: validate length
  if (!title.trim()) {
    validationErrors.title = ["Title is required"];
  }
  return Object.keys(validationErrors).length ? validationErrors : null;
}

function setField<T>(
  field: keyof ValidationErrorDetails,
  setter: (v: T) => void,
  setFormErrors: React.Dispatch<React.SetStateAction<ValidationErrorDetails>>,
): (v: T) => void {
  return (value: T): void => {
    setFormErrors(({ [field]: _, nonField: __, ...rest }) => rest);
    setter(value);
  };
}
