import { Label } from "@radix-ui/react-label";
import type { ComponentProps, JSX } from "react";

import { ErrorDisplay } from "@/components/ui";

type FormFieldProps = {
  id: string;
  label: string;
  children: JSX.Element;
  errors?: string[];
  labelProps?: ComponentProps<typeof Label>;
};

export function FormField({
  id,
  label,
  children,
  errors,
  labelProps,
}: FormFieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} {...labelProps}>
        {label}
      </Label>
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
