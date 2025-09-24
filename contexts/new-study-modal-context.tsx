"use client";

import React, { createContext, useContext, useState } from "react";

interface NewStudyModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  onStudyCreated?: () => void;
  setOnStudyCreated: (callback?: () => void) => void;
}

const NewStudyModalContext = createContext<NewStudyModalContextType | undefined>(undefined);

export function NewStudyModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onStudyCreated, setOnStudyCreated] = useState<(() => void) | undefined>();

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <NewStudyModalContext.Provider value={{ 
      isOpen, 
      openModal, 
      closeModal, 
      onStudyCreated, 
      setOnStudyCreated 
    }}>
      {children}
    </NewStudyModalContext.Provider>
  );
}

export function useNewStudyModal() {
  const context = useContext(NewStudyModalContext);
  if (context === undefined) {
    throw new Error("useNewStudyModal must be used within a NewStudyModalProvider");
  }
  return context;
}
