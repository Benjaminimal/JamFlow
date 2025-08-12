import { act, renderHook, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";

import { NotificationContext } from "@/contexts/NotificationContext";
import { ValidationError } from "@/errors";
import { useUploadForm } from "@/hooks/useUploadForm";
import type { TrackCreateForm } from "@/types";

vi.mock("@/api/tracks", () => ({
  uploadTrack: vi.fn(() => Promise.resolve({ success: true })),
}));

import { uploadTrack } from "@/api/tracks";

describe("useUploadForm", () => {
  let addNotificationMock: Mock;

  beforeEach(() => {
    addNotificationMock = vi.fn();
    (uploadTrack as Mock).mockReset();
  });

  function setup() {
    return renderHook(() => useUploadForm(), {
      wrapper: ({ children }) => (
        <NotificationContext.Provider
          value={{ notifications: [], addNotification: addNotificationMock }}
        >
          {children}
        </NotificationContext.Provider>
      ),
    });
  }

  const formData: TrackCreateForm = {
    title: "New title",
    file: new File(["dummy content"], "test.txt", {
      type: "text/plain",
    }),
    recordedDate: "2025-08-09",
  };

  const submitForm = async (
    result: ReturnType<typeof setup>["result"],
    {
      title = formData.title,
      file = formData.file,
      recordedDate = formData.recordedDate,
    } = {},
  ) => {
    act(() => {
      result.current.setTitle(title);
      result.current.setFile(file);
      result.current.setRecordedDate(recordedDate);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });
  };

  const triggerErrors = async (result: ReturnType<typeof setup>["result"]) => {
    await act(async () => {
      await result.current.handleSubmit();
    });
  };

  describe("initial state", () => {
    it("should initialize all form fields, formErrors, and isSubmitting correctly", () => {
      const { result } = setup();
      const { title, recordedDate, file, formErrors, isSubmitting } =
        result.current;

      expect(title).toBe("");
      expect(recordedDate).toBe(null);
      expect(file).toBe(null);
      expect(formErrors).toEqual({});
      expect(isSubmitting).toBe(false);
    });
  });

  describe("state setters", () => {
    it("setTitle updates title state and clears title errors", async () => {
      const { result } = setup();
      const { setTitle } = result.current;

      await triggerErrors(result);
      expect(result.current.formErrors.title).toBeDefined();

      act(() => {
        setTitle(formData.title);
      });

      expect(result.current.title).toBe(formData.title);
      expect(result.current.formErrors.title).toBeUndefined();
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

      await triggerErrors(result);
      expect(result.current.formErrors.file).toBeDefined();

      act(() => {
        setFile(formData.file);
      });

      expect(result.current.formErrors.file).toBeUndefined();
    });

    it("setting one field does not clear unrelated errors", async () => {
      const { result } = setup();
      const { setRecordedDate } = result.current;

      await triggerErrors(result);
      expect(result.current.formErrors.title).toBeDefined();

      act(() => {
        setRecordedDate("Dummy date");
      });

      expect(result.current.formErrors.title).toBeDefined();
    });
  });

  describe("handleSubmit validation", () => {
    it("should set validation errors if required fields missing and not call uploadTrack", async () => {
      const { result } = setup();
      const { handleSubmit } = result.current;

      await act(async () => {
        await handleSubmit();
      });

      expect(result.current.formErrors.title).toBeDefined();
      expect(result.current.formErrors.recordedDate).toBeUndefined();
      expect(result.current.formErrors.file).toBeDefined();
      expect(uploadTrack).not.toHaveBeenCalled();
    });
  });

  describe("handleSubmit success", () => {
    it("should call uploadTrack with correct data", async () => {
      const { result } = setup();

      await submitForm(result, formData);

      expect(uploadTrack).toHaveBeenCalledExactlyOnceWith(formData);
    });

    it("should clear formErrors on success", async () => {
      const { result } = setup();

      await triggerErrors(result);

      await submitForm(result);

      expect(result.current.formErrors).toEqual({});
    });

    it("should toggle isSubmitting correctly", async () => {
      const { result } = setup();

      expect(result.current.isSubmitting).toBe(false);

      let resolveUpload: () => void;
      const uploadPromise = new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });
      (uploadTrack as Mock).mockReturnValue(uploadPromise);

      act(() => {
        result.current.setTitle(formData.title);
        result.current.setFile(formData.file);
        result.current.setRecordedDate(formData.recordedDate);
      });

      act(() => {
        result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      resolveUpload!();

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it("should call addNotification with success message", async () => {
      const { result } = setup();

      await submitForm(result);

      expect(addNotificationMock).toHaveBeenCalledExactlyOnceWith(
        "Upload successful",
      );
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

      await submitForm(result, { recordedDate: null });

      expect(uploadTrack).toHaveBeenCalledExactlyOnceWith({
        title: formData.title,
        file: formData.file,
        recordedDate: null,
      });

      expect(result.current.formErrors.recordedDate).toBeUndefined();
    });

    it("should treat empty string recordedDate as null before submit", async () => {
      const { result } = setup();

      await submitForm(result, { recordedDate: "" });

      expect(uploadTrack).toHaveBeenCalledExactlyOnceWith({
        title: formData.title,
        file: formData.file,
        recordedDate: null,
      });

      expect(result.current.formErrors.recordedDate).toBeUndefined();
    });
  });

  describe("handleSubmit failure", () => {
    it("should set formErrors if uploadTrack throws ValidationError", async () => {
      const { result } = setup();

      const errorDetails = {
        nonField: ["Bad form"],
        title: ["Bad title"],
        recordedDate: ["Bad recordedDate"],
        file: ["Bad file"],
      };
      (uploadTrack as Mock).mockRejectedValueOnce(
        new ValidationError("Invalid data", errorDetails),
      );

      await submitForm(result);

      expect(result.current.formErrors).toEqual(errorDetails);
    });

    it("should call addNotification with failure message on other errors", async () => {
      const { result } = setup();

      (uploadTrack as Mock).mockRejectedValueOnce(
        new Error("Invalid data", {}),
      );

      await submitForm(result);

      expect(addNotificationMock).toHaveBeenCalledExactlyOnceWith(
        "Sorry, something went wrong.",
      );
    });

    it("should toggle isSubmitting correctly even on errors", async () => {
      const { result } = setup();

      expect(result.current.isSubmitting).toBe(false);

      (uploadTrack as Mock).mockRejectedValueOnce(
        new ValidationError("Invalid data", {}),
      );

      act(() => {
        result.current.setTitle(formData.title);
        result.current.setFile(formData.file);
        result.current.setRecordedDate(formData.recordedDate);
      });

      act(() => {
        result.current.handleSubmit();
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

      act(() => {
        result.current.setTitle(formData.title);
        result.current.setFile(formData.file);
        result.current.setRecordedDate(formData.recordedDate);
      });

      let firstSubmissionPromise: Promise<{ success: boolean }>;
      await act(async () => {
        firstSubmissionPromise = result.current.handleSubmit();
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      await act(async () => {
        await firstSubmissionPromise!;
      });

      expect(uploadTrack).toHaveBeenCalledExactlyOnceWith(formData);
    });

    it("should clear only specific field errors when setting a field", async () => {
      const { result } = setup();

      await triggerErrors(result);

      expect(result.current.formErrors.title).toBeDefined();
      expect(result.current.formErrors.file).toBeDefined();

      act(() => {
        result.current.setTitle(formData.title);
      });

      expect(result.current.formErrors.title).toBeUndefined();
      expect(result.current.formErrors.file).toBeDefined();
    });
  });
});
