import Button, { type ButtonType } from '@experience/shared/components/Button';
import DynamicT from '@experience/shared/components/DynamicT';
import type { TFuncKey } from 'i18next';
import type { ReactNode } from 'react';
import ReactModal from 'react-modal';

type Props = {
  readonly isOpen: boolean;
  readonly title: TFuncKey;
  readonly children: ReactNode;
  readonly confirmText?: TFuncKey;
  readonly confirmButtonType?: ButtonType;
  readonly cancelText?: TFuncKey;
  readonly isLoading?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
};

const ConfirmModal = ({
  isOpen,
  title,
  children,
  confirmText = 'action.continue',
  confirmButtonType = 'primary',
  cancelText = 'action.cancel',
  isLoading,
  onConfirm,
  onCancel,
}: Props) => {
  return (
    <ReactModal
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
      isOpen={isOpen}
      className="bg-elevated rounded-[16px] p-6 max-w-[400px] w-[calc(100%-32px)] shadow-[var(--sh-float)]"
      overlayClassName="fixed inset-0 bg-[var(--color-bg-mask)] flex items-center justify-center z-[200]"
      onRequestClose={onCancel}
    >
      <div className="text-lg font-semibold text-ink mb-3">
        <DynamicT forKey={title} />
      </div>
      <div className="text-sm text-muted mb-6">{children}</div>
      <div className="flex justify-end gap-3">
        <Button title={cancelText} type="secondary" onClick={onCancel} />
        <Button
          title={confirmText}
          type={confirmButtonType}
          isLoading={isLoading}
          onClick={onConfirm}
        />
      </div>
    </ReactModal>
  );
};

export default ConfirmModal;
