import { maxUploadFileSize } from '@logto/schemas';
import classNames from 'classnames';
import { useCallback, useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { uploadAvatar } from '@/apis/experience/avatar';
import UserAvatar from '@/assets/icons/default-user-avatar.svg?react';
import AvatarCropModal from '@/components/AvatarCropModal';
import useAvatarCropUpload from '@/hooks/use-avatar-crop-upload';
import RotatingRingIcon from '@/shared/components/Button/RotatingRingIcon';
import { avatarFileAccept, formatFileSizeLimit } from '@/utils/avatar-upload';

type Props = {
  readonly className?: string;
  readonly name: string;
  readonly label?: string;
  readonly description?: string;
  readonly isRequired?: boolean;
  readonly value?: string;
  readonly errorMessage?: string;
  readonly onBlur?: () => void;
  readonly onChange: (value: string) => void | Promise<void>;
  readonly onUploadingChange?: (isUploading: boolean) => void;
};

const AvatarUploadField = ({
  className,
  name,
  label,
  description,
  isRequired,
  value = '',
  errorMessage,
  onBlur,
  onChange,
  onUploadingChange,
}: Props) => {
  const { t } = useTranslation();
  const { t: tAvatar } = useTranslation(undefined, { keyPrefix: 'profile.avatar_upload' });
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const onUploadingChangeRef = useRef(onUploadingChange);

  const {
    cropImageSource,
    isUploading,
    uploadError,
    fileInputKey,
    clearUploadError,
    handleFileChange,
    handleCropCancel,
    handleCropConfirm,
  } = useAvatarCropUpload({ upload: uploadAvatar, onChange, onBlur });

  const labelWithOptionalSuffix =
    label && (isRequired ? label : t('input.label_with_optional', { label }));

  useEffect(() => {
    // eslint-disable-next-line @silverhand/fp/no-mutation -- keep latest parent callback in a ref
    onUploadingChangeRef.current = onUploadingChange;
  }, [onUploadingChange]);

  useEffect(() => {
    onUploadingChangeRef.current?.(isUploading);
  }, [isUploading]);

  useEffect(() => {
    return () => {
      onUploadingChangeRef.current?.(false);
    };
  }, []);

  const openFilePicker = useCallback(() => {
    if (isUploading) {
      return;
    }

    inputRef.current?.click();
  }, [isUploading]);

  const handleRemove = useCallback(async () => {
    clearUploadError();
    await onChange('');
    onBlur?.();
  }, [clearUploadError, onBlur, onChange]);

  const displayError = cropImageSource ? errorMessage : (uploadError ?? errorMessage);
  const showRemove = Boolean(value) && !isRequired && !isUploading;
  const showHint = !displayError && !isUploading;

  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-20 h-20 flex items-center justify-center">
          {isUploading ? (
            <div className="w-6 h-6 text-primary">
              <RotatingRingIcon />
            </div>
          ) : value ? (
            <img
              className="w-20 h-20 rounded-[8px] object-cover object-center"
              src={value}
              alt={label ?? name}
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserAvatar className="w-20 h-20 rounded-[8px]" />
          )}
        </div>
        <div className="flex flex-1 flex-col items-start gap-2 min-w-0 min-h-20">
          {labelWithOptionalSuffix && (
            <label className="text-xs text-muted" htmlFor={inputId}>
              {labelWithOptionalSuffix}
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="cursor-pointer text-sm font-medium text-ink bg-surface border border-line-strong rounded-[11px] py-1.5 px-4 min-h-8 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isUploading}
              onClick={openFilePicker}
            >
              {isUploading ? tAvatar('uploading') : tAvatar('upload')}
            </button>
            {showRemove && (
              <button
                type="button"
                className="cursor-pointer text-sm font-medium text-danger bg-none border-none p-0"
                onClick={() => {
                  void handleRemove();
                }}
              >
                {tAvatar('remove')}
              </button>
            )}
          </div>
          {displayError ? (
            <span className="text-xs text-danger mt-auto" role="alert">
              {displayError}
            </span>
          ) : (
            showHint && (
              <span className="text-xs text-muted mt-auto">
                {tAvatar('hint', { limit: formatFileSizeLimit(maxUploadFileSize) })}
              </span>
            )
          )}
          {description && <span className="text-xs text-muted">{description}</span>}
        </div>
        <input
          key={fileInputKey}
          ref={inputRef}
          id={inputId}
          className="hidden"
          type="file"
          name={name}
          accept={avatarFileAccept}
          onChange={handleFileChange}
        />
      </div>
      <AvatarCropModal
        imageSource={cropImageSource}
        isUploading={isUploading}
        uploadError={uploadError}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};

export default AvatarUploadField;
