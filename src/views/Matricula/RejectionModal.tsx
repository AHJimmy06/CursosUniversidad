import React, { useState } from 'react';
import { Button, Modal, Textarea, Label } from 'flowbite-react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isProcessing: boolean;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, onClose, onSubmit, isProcessing }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <Modal.Header>Motivo del Rechazo</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rejection-reason" value="Por favor, especifica por qué se rechaza el pago:" />
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: El comprobante es ilegible, el monto no coincide, etc."
              required
              rows={4}
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          color="failure" 
          onClick={handleSubmit} 
          isProcessing={isProcessing}
          disabled={!reason.trim() || isProcessing}
        >
          Confirmar Rechazo
        </Button>
        <Button color="gray" onClick={onClose} disabled={isProcessing}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RejectionModal;
