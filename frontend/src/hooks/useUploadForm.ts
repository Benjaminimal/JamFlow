import { useContext, useState } from "react";

import { getUserFriendlyErrorMessage } from "@/api/errorHandler";
import { uploadTrack } from "@/api/tracks";
import { NotificationContext } from "@/contexts/NotificationContext";
import { ValidationError, type ValidationErrorDetails } from "@/errors";

type UseUploadFormResult = {
  title: string;
  setTitle: (v: string) => void;
  recordedDate: string | null;
  setRecordedDate: (v: string | null) => void;
  file: File | null;
  setFile: (v: File | null) => void;
  formErrors: ValidationErrorDetails;
  handleSubmit: () => Promise<{ success: boolean }>;
  isSubmitting: boolean;
};

export function useUploadForm(): UseUploadFormResult {
  const [file, _setFile] = useState<File | null>(null);
  const [title, _setTitle] = useState("");
  const [recordedDate, _setRecordedDate] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState<ValidationErrorDetails>({});

  // TODO: return values and let the page handle using the notification context
  const { addNotification } = useContext(NotificationContext);

  const setFile = setField("file", _setFile, setFormErrors);
  const setTitle = setField("title", _setTitle, setFormErrors);
  const setRecordedDate = setField(
    "recordedDate",
    _setRecordedDate,
    setFormErrors,
  );

  const resetForm = () => {
    _setFile(null);
    _setTitle("");
    _setRecordedDate(null);
  };

  const handleSubmit = async (): Promise<{ success: boolean }> => {
    if (isSubmitting) {
      return { success: false };
    }

    const validationErrors = getValidationErrors(title, file);
    if (validationErrors) {
      setFormErrors(validationErrors);
      return { success: false };
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      await uploadTrack({
        title,
        recordedDate: recordedDate || null,
        file: file!,
      });
      addNotification("Upload successful");
      resetForm();
      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        setFormErrors(error.details);
      } else {
        const message = getUserFriendlyErrorMessage(error);
        addNotification(message);
      }
      return { success: false };
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
    formErrors,
    handleSubmit,
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
