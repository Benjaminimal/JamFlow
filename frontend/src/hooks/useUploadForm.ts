import { useContext, useState } from "react";

import { uploadTrack } from "@/api/tracks";
import { NotificationContext } from "@/contexts/NotifcationContext";
import { ValidationError, type ValidationErrorDetails } from "@/errors";

type UseUploadFormResult = {
  title: string;
  recordedDate: string | null;
  file: File | null;
  formErrors: ValidationErrorDetails;
  setTitle: (v: string) => void;
  setRecordedDate: (v: string | null) => void;
  setFile: (v: File | null) => void;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
};

export function useUploadForm(): UseUploadFormResult {
  const [file, _setFile] = useState<File | null>(null);
  const [title, _setTitle] = useState("");
  const [recordedDate, _setRecordedDate] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState<ValidationErrorDetails>({});

  const { addNotification } = useContext(NotificationContext);

  const setFile = setField("file", _setFile, setFormErrors);
  const setTitle = setField("title", _setTitle, setFormErrors);
  const setRecordedDate = setField(
    "recordedDate",
    _setRecordedDate,
    setFormErrors,
  );

  const resetForm = () => {
    // FIXME: file input won't reset on form submission
    _setFile(null);
    _setTitle("");
    _setRecordedDate(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    const validationErrors = getValidationErrors(title, file);
    if (validationErrors) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors({});

    try {
      setIsSubmitting(true);
      await uploadTrack({
        title,
        recordedDate: recordedDate || null,
        file: file!,
      });
      addNotification("Upload successful");
      resetForm();
    } catch (err) {
      if (err instanceof ValidationError) {
        setFormErrors(err.details);
      }
      // TODO: add more info based on error type
      addNotification("Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    recordedDate,
    file,
    formErrors,
    setTitle,
    setRecordedDate,
    setFile,
    isSubmitting,
    handleSubmit,
  };
}

function getValidationErrors(
  title: string,
  file: File | null,
): ValidationErrorDetails | null {
  const validationErrors: ValidationErrorDetails = {};
  if (!file) {
    validationErrors.file = ["No file selected for upload"];
  }

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
