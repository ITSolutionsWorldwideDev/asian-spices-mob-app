import { useCallback } from "react";

export function useFormValidator(requiredFields: string[], formData: any) {

  const validateForm = useCallback(() => {
    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        console.log(`Field ${field} is required but missing.`);
        return false;
      }
    }
    return true;
  }, [requiredFields, formData]);
  return { validateForm };
}
