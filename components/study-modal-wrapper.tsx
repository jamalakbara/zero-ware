"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NewStudyModal from "@/components/new-study-modal";
import { NewStudyModalProvider, useNewStudyModal } from "@/contexts/new-study-modal-context";

interface StudyModalWrapperProps {
  onStudyCreated?: () => void;
  children: React.ReactNode;
}

function StudyModalContent({ onStudyCreated }: { onStudyCreated?: () => void }) {
  const { isOpen, closeModal, setOnStudyCreated } = useNewStudyModal();

  useEffect(() => {
    setOnStudyCreated(onStudyCreated);
  }, [onStudyCreated, setOnStudyCreated]);

  return (
    <NewStudyModal
      open={isOpen}
      onOpenChange={closeModal}
      onStudyCreated={onStudyCreated}
    />
  );
}

export function StudyModalWrapper({ onStudyCreated, children }: StudyModalWrapperProps) {
  return (
    <NewStudyModalProvider>
      {children}
      <StudyModalContent onStudyCreated={onStudyCreated} />
    </NewStudyModalProvider>
  );
}
