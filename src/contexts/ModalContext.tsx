import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { Button, Modal } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface ModalContent {
  title: string;
  body: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface ModalContextType {
  showModal: (content: ModalContent) => Promise<boolean>;
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
  
  const promiseCallbacks = useRef<{ resolve: (value: boolean) => void } | null>(null);

  const showModal = (newContent: ModalContent): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setContent({ showCancel: true, ...newContent });
      setIsOpen(true);
      promiseCallbacks.current = { resolve };
    });
  };

  const hideModal = () => {
    setIsOpen(false);
    setContent(null);
    promiseCallbacks.current = null;
  };

  const handleResolve = (value: boolean) => {
    promiseCallbacks.current?.resolve(value);
    hideModal();
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal: () => handleResolve(false) }}>
      {children}
      {content && (
        <Modal show={isOpen} size="md" popup onClose={() => handleResolve(false)}>
          <Modal.Header />
          <Modal.Body>
            <div className="text-center">
              <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                {content.title}
              </h3>
              {typeof content.body === 'string' ? <p>{content.body}</p> : content.body}
              <div className="flex justify-center gap-4 mt-6">
                <Button color="failure" onClick={() => handleResolve(true)}>
                  {content.confirmText || 'Sí, estoy seguro'}
                </Button>
                {content.showCancel && (
                    <Button color="gray" onClick={() => handleResolve(false)}>
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
