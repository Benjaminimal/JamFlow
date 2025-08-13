import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import UploadForm from "@/components/UploadForm";
import { createTestFile } from "@/test-utils/testData";

describe("UploadForm", () => {
  describe("rendering", () => {
    it("shows the title input with the provided value", () => {
      const title = "New Song";

      renderUploadForm({ title });

      expect(screen.getByLabelText("Title")).toBeVisible();
      expect(screen.getByLabelText("Title")).toHaveValue(title);
    });

    it("shows validation errors when provided", () => {
      const titleMessage = "Bad title";
      const topMessage = "Some error";
      const bottomMessage = "Other mistake";

      renderUploadForm({
        formErrors: {
          title: [titleMessage],
          nonField: [topMessage, bottomMessage],
        },
      });

      expect(screen.getByText(titleMessage)).toBeInTheDocument();
      expect(screen.getByText(topMessage)).toBeInTheDocument();
      expect(screen.getByText(bottomMessage)).toBeInTheDocument();
    });

    it("disables the submit button when disabled=true", () => {
      renderUploadForm({ disabled: true });

      expect(screen.getByRole("button", { name: /upload/i })).toBeDisabled();
    });

    it("updates the title input value when prop changes", () => {
      const initialTitle = "Initial Title";
      const { rerender } = renderUploadForm({ title: initialTitle });

      expect(screen.getByLabelText("Title")).toHaveValue(initialTitle);

      const updatedTitle = "Updated Title";
      rerender({ title: updatedTitle });

      expect(screen.getByLabelText("Title")).toHaveValue(updatedTitle);
    });
  });

  describe("user interaction", () => {
    it("calls onTitleChange when typing in the title field", () => {
      const onTitleChange = vi.fn();
      renderUploadForm({ onTitleChange });
      const input = screen.getByLabelText("Title");

      const title = "My Song";
      fireEvent.change(input, { target: { value: title } });

      expect(onTitleChange).toHaveBeenCalledExactlyOnceWith(title);
    });

    it("calls onRecordedDateChange when selecting a date", () => {
      const onRecordedDateChange = vi.fn();
      renderUploadForm({ onRecordedDateChange });
      const input = screen.getByLabelText("Recorded on");

      const date = "2025-08-10";
      fireEvent.change(input, { target: { value: date } });

      expect(onRecordedDateChange).toHaveBeenCalledExactlyOnceWith(date);
    });

    it("calls onFileChange when selecting a file", () => {
      const onFileChange = vi.fn();
      renderUploadForm({ onFileChange });
      const input = screen.getByLabelText("File");

      const file = createTestFile();
      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileChange).toHaveBeenCalledExactlyOnceWith(file);
    });

    it("calls onSubmit when submitting the form", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true });
      renderUploadForm({ onSubmit });

      fireEvent.submit(screen.getByTestId("upload-form"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledOnce();
      });
    });
  });

  describe("edge cases", () => {
    it("renders no errors if formErrors is empty", () => {
      renderUploadForm({ formErrors: {} });

      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("renders multiple error messages per field if provided", () => {
      renderUploadForm({
        formErrors: {
          nonField: ["Non-Field Error 1", "Non-Field Error 2"],
          title: ["Title Error 1", "Title Error 2"],
          recordedDate: ["Date Error 1", "Date Error 2"],
          file: ["File Error 1", "File Error 2"],
        },
      });

      const alerts = screen.queryAllByRole("alert");

      const allErrorTexts = alerts.flatMap((alert) =>
        Array.from(alert.querySelectorAll("p")).map((p) => p.textContent),
      );

      expect(allErrorTexts).toEqual([
        "Non-Field Error 1",
        "Non-Field Error 2",
        "Title Error 1",
        "Title Error 2",
        "Date Error 1",
        "Date Error 2",
        "File Error 1",
        "File Error 2",
      ]);
    });
  });
});

type UploadFormPropsOverrides = Partial<
  React.ComponentProps<typeof UploadForm>
>;

function renderUploadForm(overrides: UploadFormPropsOverrides = {}) {
  const defaultProps = {
    title: "",
    onTitleChange: vi.fn(),
    recordedDate: "",
    onRecordedDateChange: vi.fn(),
    onFileChange: vi.fn(),
    formErrors: {},
    onSubmit: vi.fn(),
    disabled: false,
  };
  const result = render(<UploadForm {...defaultProps} {...overrides} />);

  return {
    ...result,
    rerender: (newOverrides: UploadFormPropsOverrides) => {
      return result.rerender(
        <UploadForm {...defaultProps} {...overrides} {...newOverrides} />,
      );
    },
  };
}
