import { type FormEvent, useState } from "react";

import { uploadTrack } from "@/api/tracks";

type UseUploadFormResult = {
  title: string;
  recordedDate: string;
  uploadFile: File | null;
  setTitle: (v: string) => void;
  setRecordedDate: (v: string) => void;
  setUploadFile: (v: File | null) => void;
  isSubmitting: boolean;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function useUploadForm(): UseUploadFormResult {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [recordedDate, setRecordedDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    console.log({
      title,
      recordedDate,
      uploadFile,
    });

    // TODO: extract validation
    // TODO: add a notification mechanism
    if (!uploadFile) {
      console.error("No file selected for upload.");
      return;
    }

    if (!title.trim()) {
      console.error("Title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const track = await uploadTrack({ title, recordedDate, uploadFile });
      // TODO: add success state
      console.log("Upload successful", track);
      // TODO: file input won't reset on form submission
      setUploadFile(null);
      setTitle("");
      setRecordedDate("");
    } catch (err) {
      // TODO: proper error handling
      console.error("Upload failed", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    title,
    recordedDate,
    uploadFile,
    setTitle,
    setRecordedDate,
    setUploadFile,
    isSubmitting,
    handleSubmit,
  };
}
