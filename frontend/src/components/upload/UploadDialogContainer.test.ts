// TODO: these are outdated tests of a component that no longer exists
// One could port this to UploadDialogContainer

// eslint-disable-next-line vitest/no-commented-out-tests
/*
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderRoute } from "@/test-utils/render";
import { createTestFile } from "@/test-utils/testData";

vi.mock("@/api/tracks", () => ({
  uploadTrack: vi.fn(() => Promise.resolve({ success: true })),
}));

import { uploadTrack } from "@/api/tracks";

describe("Upload page integration tests", () => {
  beforeEach(() => {
    renderRoute("/upload");
  });

  describe("form rendering", () => {
    it("renders all form elements correctly", () => {
      expect(screen.getByTestId("upload-form")).toBeVisible();

      expect(screen.getByLabelText("Title")).toHaveValue("");
      expect(screen.getByLabelText("Recorded on")).toHaveValue("");
      const fileInput = screen.getByLabelText("File") as HTMLInputElement;
      expect(fileInput).toBeVisible();
      expect(fileInput).toHaveProperty("files");
      expect(fileInput.files?.length).toBe(0);

      expect(
        screen.getByRole("button", { name: /upload/i }),
      ).not.toBeDisabled();
    });
  });

  describe("form interaction", () => {
    it("updates correctly when user interacts", () => {
      const titleInput = screen.getByLabelText("Title");
      const dateInput = screen.getByLabelText("Recorded on");
      const fileInput = screen.getByLabelText("File") as HTMLInputElement;

      fireEvent.change(titleInput, { target: { value: "Test Song" } });
      fireEvent.change(dateInput, { target: { value: "2025-08-10" } });
      fireEvent.change(fileInput, {
        target: { files: [createTestFile()] },
      });

      expect(titleInput).toHaveValue("Test Song");
      expect(dateInput).toHaveValue("2025-08-10");
      expect(fileInput.files?.[0]?.name).toBe("New Song.mp3");
    });
  });

  describe("successful upload flow", () => {
    it("completes full upload workflow with notifications", async () => {
      submitValidForm();

      expect(screen.getByRole("button", { name: /upload/i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(
          "Upload successful",
        );
      });

      expect(screen.getByLabelText("Title")).toHaveValue("");
      expect(screen.getByLabelText("Recorded on")).toHaveValue("");
    });
  });

  describe("validation and error handling", () => {
    it("prevents submission and shows errors for invalid form", async () => {
      fireEvent.submit(screen.getByTestId("upload-form"));

      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/file is required/i)).toBeInTheDocument();
    });

    it("handles API errors gracefully", async () => {
      // Mock API failure
      vi.mocked(uploadTrack).mockRejectedValueOnce(new Error("Server error"));

      submitValidForm();

      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(
          "Sorry, something went wrong.",
        );
      });
    });
  });
});

function submitValidForm() {
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "New Song" },
  });
  fireEvent.change(screen.getByLabelText("Recorded on"), {
    target: { value: "2025-08-10" },
  });
  fireEvent.change(screen.getByLabelText("File"), {
    target: {
      files: [createTestFile()],
    },
  });

  fireEvent.submit(screen.getByTestId("upload-form"));
}
*/
