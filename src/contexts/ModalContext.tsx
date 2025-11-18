import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Button, Modal } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface ModalContent {
  title: string;
  body: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

interface ModalContextType {
  showModal: (content: ModalContent) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ModalContent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showModal = (newContent: ModalContent) => {
    setContent({
        showCancel: true, // Default to show cancel button for confirmations
        ...newContent
    });
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setContent(null);
    setIsProcessing(false);
  };

  const handleConfirm = async () => {
    if (content?.onConfirm) {
      setIsProcessing(true);
      try {
        await content.onConfirm();
      } finally {
        hideModal();
      }
    } else {
      hideModal();
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {content && (
        <Modal show={isOpen} size="md" popup onClose={hideModal}>
          <Modal.Header />
          <Modal.Body>
            <div className="text-center">
              <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                {content.title}
              </h3>
              {typeof content.body === 'string' ? <p>{content.body}</p> : content.body}
              <div className="flex justify-center gap-4 mt-6">
                <Button color="failure" onClick={handleConfirm} isProcessing={isProcessing}>
                  {content.confirmText || 'Sí, estoy seguro'}
                </Button>
                {content.showCancel && (
                    <Button color="gray" onClick={hideModal} disabled={isProcessing}>
                        {content.cancelText || 'No, cancelar'}
                    </Button>
                )}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </ModalContext.Provider>
  );
};
