import React, { createContext, useContext, ReactNode } from 'react';
import { useFormProgress, FormData } from '../hooks/useFormProgress';

interface FormContextType {
  formData: FormData;
  sharedForms: FormData[];
  loading: boolean;
  error: string | null;
  saveField: (fieldName: keyof FormData, value: any, file?: File) => Promise<void>;
  saveFormData: (data: Partial<FormData>) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<string>;
  shareForm: (recipientEmail: string) => Promise<void>;
  removeSharing: (recipientEmail: string) => Promise<void>;
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