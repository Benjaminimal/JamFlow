import { useContext, useState } from "react";

import { uploadTrack } from "@/api/tracks";
import { NotificationContext } from "@/contexts/NotifcationContext";
import { ValidationError, type ValidationErrorDetails } from "@/errors";

type UseUploadFormResult = {
  title: string;
  recordedDate: string | null;
  uploadFile: File | null;
  formErrors: ValidationErrorDetails;
  setTitle: (v: string) => void;
  setRecordedDate: (v: string | null) => void;
  setUploadFile: (v: File | null) => void;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
};

export function useUploadForm(): UseUploadFormResult {
  const [uploadFile, _setUploadFile] = useState<File | null>(null);
  const [title, _setTitle] = useState("");
  const [recordedDate, _setRecordedDate] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState<ValidationErrorDetails>({});

  const { addNotification } = useContext(NotificationContext);

  const setUploadFile = setField("file", _setUploadFile, setFormErrors);
  const setTitle = setField("title", _setTitle, setFormErrors);
  const setRecordedDate = setField(
    "recordedDate",
    _setRecordedDate,
    setFormErrors,
  );

  const resetForm = () => {
    // FIXME: file input won't reset on form submission
    _setUploadFile(null);
    _setTitle("");
    _setRecordedDate(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    const validationErrors = getValidationErrors(title, uploadFile);
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
        uploadFile: uploadFile!,
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
    uploadFile,
    formErrors,
    setTitle,
    setRecordedDate,
    setUploadFile,
    isSubmitting,
    handleSubmit,
  };
}

function getValidationErrors(
  title: string,
  uploadFile: File | null,
): ValidationErrorDetails | null {
  const validationErrors: ValidationErrorDetails = {};
  if (!uploadFile) {
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
