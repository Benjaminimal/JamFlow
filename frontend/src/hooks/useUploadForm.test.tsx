import { act, renderHook, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";

import { ValidationError } from "@/errors";
import { useUploadForm } from "@/hooks/useUploadForm";
import type { SubmitResult, TrackCreateForm } from "@/types";

vi.mock("@/api/tracks", () => ({
  uploadTrack: vi.fn(() => Promise.resolve({ success: true })),
}));

import { uploadTrack } from "@/api/tracks";
import { createTestFile, createTestTrackForm } from "@/test-utils/testData";

describe("useUploadForm", () => {
  const uploadTrackMock = uploadTrack as Mock;

  beforeEach(() => {
    uploadTrackMock.mockReset();
  });

  const setup = () => renderHook(() => useUploadForm());

  const submitForm = async (
    result: ReturnType<typeof setup>["result"],
    formData: Partial<TrackCreateForm> = {},
  ) => {
    act(() => {
      const { title, file, recordedDate } = {
        ...createTestTrackForm(),
        ...formData,
      };
      result.current.setTitle(title);
      result.current.setFile(file);
      result.current.setRecordedDate(recordedDate);
    });

    return await act(async () => {
      result.current.validate();
      return await result.current.submit();
    });
  };

  const triggerClientValidation = async (
    result: ReturnType<typeof setup>["result"],
  ) => {
    await act(async () => {
      result.current.validate();
    });
  };

  describe("initial state", () => {
    it("should initialize all form fields, validationErrors, and isSubmitting correctly", () => {
      const { result } = setup();
      const { title, recordedDate, file, validationErrors, isSubmitting } =
        result.current;

      expect(title).toBe("");
      expect(recordedDate).toBe(null);
      expect(file).toBe(null);
      expect(validationErrors).toEqual({});
      expect(isSubmitting).toBe(false);
    });
  });

  describe("state setters", () => {
    it("setTitle updates title state and clears title errors", async () => {
      const { result } = setup();
      const { setTitle } = result.current;

      await triggerClientValidation(result);
      expect(result.current.validationErrors.title).toBeDefined();

      const title = "Title Set";

      act(() => {
        setTitle(title);
      });

      expect(result.current.title).toBe(title);
      expect(result.current.validationErrors.title).toBeUndefined();
    });

    it("setRecordedDate updates recordedDate state", () => {
      const { result } = setup();
      const { setRecordedDate } = result.current;

      act(() => {
        setRecordedDate("2025-08-09");
      });

      expect(result.current.recordedDate).toBe("2025-08-09");
    });

    it("setFile updates file state and clears file errors", async () => {
      const { result } = setup();
      const { setFile } = result.current;

      await triggerClientValidation(result);
      expect(result.current.validationErrors.file).toBeDefined();

      act(() => {
        setFile(createTestFile());
      });

      expect(result.current.validationErrors.file).toBeUndefined();
    });

    it("setting one field does not clear unrelated errors", async () => {
      const { result } = setup();
      const { setRecordedDate } = result.current;

      await triggerClientValidation(result);
      expect(result.current.validationErrors.title).toBeDefined();

      act(() => {
        setRecordedDate("Dummy date");
      });

      expect(result.current.validationErrors.title).toBeDefined();
    });
  });

  describe("validate", () => {
    it("should set validation errors if required fields missing and not call uploadTrack", async () => {
      const { result } = setup();
      const { validate } = result.current;

      await act(async () => {
        validate();
      });

      expect(result.current.validationErrors.title).toBeDefined();
      expect(result.current.validationErrors.recordedDate).toBeUndefined();
      expect(result.current.validationErrors.file).toBeDefined();
      expect(uploadTrackMock).not.toHaveBeenCalled();
    });
  });

  describe("handleSubmit success", () => {
    it("should return success and no error on successful submission", async () => {
      const { result } = setup();

      const { success, error } = await submitForm(result);

      expect(success).toBe(true);
      expect(error).toBeUndefined();
    });

    it("should call uploadTrack with correct data", async () => {
      const { result } = setup();

      const formData = createTestTrackForm();

      await submitForm(result, formData);

      expect(uploadTrackMock).toHaveBeenCalledExactlyOnceWith(formData);
    });

    it("should clear validationErrors on success", async () => {
      const { result } = setup();

      await triggerClientValidation(result);

      await submitForm(result);

      expect(result.current.validationErrors).toEqual({});
    });

    it("should toggle isSubmitting correctly", async () => {
      const { result } = setup();

      expect(result.current.isSubmitting).toBe(false);

      let resolveUpload: () => void;
      const uploadPromise = new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });
      uploadTrackMock.mockReturnValue(uploadPromise);

      const formData = createTestTrackForm();

      act(() => {
        result.current.setTitle(formData.title);
        result.current.setFile(formData.file);
        result.current.setRecordedDate(formData.recordedDate);
      });

      act(() => {
        result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      resolveUpload!();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it("should reset form fields after successful submission", async () => {
      const { result } = setup();

      await submitForm(result);

      expect(result.current.title).toBe("");
      expect(result.current.recordedDate).toBe(null);
      expect(result.current.file).toBe(null);
    });
  });

  describe("recordedDate optional behavior", () => {
    it("should allow recordedDate to be omitted (null) and submit successfully", async () => {
      const { result } = setup();

      const formData = createTestTrackForm({ recordedDate: null });

      await submitForm(result, formData);

      expect(uploadTrackMock).toHaveBeenCalledExactlyOnceWith({
        title: formData.title,
        file: formData.file,
        recordedDate: null,
      });

      expect(result.current.validationErrors.recordedDate).toBeUndefined();
    });

    it("should treat empty string recordedDate as null before submit", async () => {
      const { result } = setup();

      const formData = createTestTrackForm({ recordedDate: "" });

      await submitForm(result, formData);

      expect(uploadTrackMock).toHaveBeenCalledExactlyOnceWith({
        title: formData.title,
        file: formData.file,
        recordedDate: null,
      });

      expect(result.current.validationErrors.recordedDate).toBeUndefined();
    });
  });

  describe("handleSubmit failure", () => {
    it("should set validationErrors if uploadTrack throws ValidationError", async () => {
      const { result } = setup();

      const errorDetails = {
        nonField: ["Bad form"],
        title: ["Bad title"],
        recordedDate: ["Bad recordedDate"],
        file: ["Bad file"],
      };
      uploadTrackMock.mockRejectedValueOnce(
        new ValidationError("Invalid data", errorDetails),
      );

      await submitForm(result);

      expect(result.current.validationErrors).toEqual(errorDetails);
    });

    it("should return success false and no error on ValidationError", async () => {
      const { result } = setup();

      uploadTrackMock.mockRejectedValueOnce(
        new ValidationError("Invalid data", {}),
      );

      const { success, error } = await submitForm(result);

      expect(success).toBe(false);
      expect(error).toBeUndefined();
    });

    it("should return an error on server errors", async () => {
      const { result } = setup();

      const serverError = new Error("Internal server error");
      uploadTrackMock.mockRejectedValueOnce(serverError);

      const { success, error } = await submitForm(result);

      expect(success).toBe(false);
      expect(error).toBe(error);
    });

    it("should toggle isSubmitting correctly even on errors", async () => {
      const { result } = setup();

      expect(result.current.isSubmitting).toBe(false);

      uploadTrackMock.mockRejectedValueOnce(
        new ValidationError("Invalid data", {}),
      );

      const formData = createTestTrackForm();

      act(() => {
        result.current.setTitle(formData.title);
        result.current.setFile(formData.file);
        result.current.setRecordedDate(formData.recordedDate);
      });

      act(() => {
        result.current.submit();
      });

      await waitFor(() => {
        if (!result.current.isSubmitting) {
          throw new Error("isSubmitting not true yet");
        }
      });

      await waitFor(() => {
        if (result.current.isSubmitting) {
          throw new Error("isSubmitting still true");
        }
      });
    });
  });

  describe("edge cases", () => {
    it("should prevent double submission when already submitting", async () => {
      const { result } = setup();

      const formData = createTestTrackForm();

      act(() => {
        result.current.setTitle(formData.title);
        result.current.setFile(formData.file);
        result.current.setRecordedDate(formData.recordedDate);
      });

      let resolveUpload: () => void;
      const uploadPromise = new Promise<SubmitResult>((resolve) => {
        resolveUpload = () => resolve({ success: true });
      });
      uploadTrackMock.mockReturnValue(uploadPromise);

      let firstSubmissionPromise: Promise<SubmitResult>;
      await act(async () => {
        firstSubmissionPromise = result.current.submit();
      });

      await act(async () => {
        await result.current.submit();
      });

      resolveUpload!();
      await act(async () => {
        await firstSubmissionPromise!;
      });

      expect(uploadTrackMock).toHaveBeenCalledExactlyOnceWith(formData);
    });

    it("should clear only specific field errors when setting a field", async () => {
      const { result } = setup();

      await triggerClientValidation(result);

      expect(result.current.validationErrors.title).toBeDefined();
      expect(result.current.validationErrors.file).toBeDefined();

      act(() => {
        result.current.setTitle("Keep File Error");
      });

      expect(result.current.validationErrors.title).toBeUndefined();
      expect(result.current.validationErrors.file).toBeDefined();
    });
  });
});
