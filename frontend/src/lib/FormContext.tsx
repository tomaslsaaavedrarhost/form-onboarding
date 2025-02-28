import React, { createContext, useContext, ReactNode } from 'react';
import { useFormProgress, FormData } from '../hooks/useFormProgress';

interface FormContextType {
  formData: FormData;
  loading: boolean;
  error: string | null;
  unsavedChanges: boolean;
  selectedFormId: string | null;
  updateField: (fieldName: keyof FormData, value: any) => void;
  updateFormData: (newData: Partial<FormData>) => void;
  saveFormData: () => Promise<boolean>;
  switchForm: (formId: string) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<string>;
  saveField: (fieldName: keyof FormData, value: any) => Promise<void>;
}

const FormContext = createContext<FormContextType | null>(null);

function useForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm debe ser usado dentro de un FormProvider');
  }
  return context;
}

function FormProvider({ children }: { children: ReactNode }) {
  const formProgress = useFormProgress();

  return (
    <FormContext.Provider value={formProgress}>
      {children}
    </FormContext.Provider>
  );
}

export { FormProvider, useForm }; 